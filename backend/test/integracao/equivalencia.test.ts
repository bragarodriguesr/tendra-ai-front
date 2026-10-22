import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { connect } from "node:net";
import { networkInterfaces, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { criarArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarPessoas } from "../../src/config/pessoas.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { processarTarefa } from "../../src/fluxo/processarTarefa.ts";
import { criarServidor } from "../../src/http/servidor.ts";
import { ClienteDaIa } from "../../src/ia/cliente.ts";
import { carregarPrecos } from "../../src/observabilidade/metricas.ts";
import { abrirBanco, type Banco } from "../../src/persistencia/banco.ts";
import { definirAtivo, listarDocumentos } from "../../src/persistencia/documentos.ts";
import { ApiSimulada } from "../apoio/apiSimulada.ts";
import { respondeImparesCitando } from "../apoio/respostasSimuladas.ts";

/**
 * B6 · o comando `responder` e o backend produzem os mesmos itens (cenário 25); B3 · documento
 * desativado não é citado em nova tarefa (cenário 40); cenário 30 · o servidor só atende a própria
 * máquina. API do Claude simulada até a A1.
 */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const PASTA_BACKEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RFP = path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-haiku-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };

let banco: Banco;
let pastaDados: string;
let api: ApiSimulada;
let servidor: FastifyInstance;
let terminou: Promise<void>;
let avisarFim: () => void;

beforeAll(async () => {
  banco = await abrirBanco();
  await carregarBase({ pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
}, 60_000);

afterAll(async () => {
  await banco.close();
});

beforeEach(async () => {
  await banco.exec("TRUNCATE tarefas CASCADE; UPDATE documentos SET ativo = true");
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-equivalencia-"));
  api = new ApiSimulada();
  api.respostas = [respondeImparesCitando];
  terminou = new Promise((pronto) => (avisarFim = pronto));
  servidor = criarServidor({
    banco,
    tarefas: {
      banco,
      armazenamento: criarArmazenamento(pastaDados),
      api,
      ia: IA,
      nomesDeCabecalho: await carregarCabecalhos(),
      termosCriticos: await carregarTermosCriticos(),
      precos: await carregarPrecos(),
      pessoas: await carregarPessoas(),
      hoje: () => "2026-10-21",
      aoTerminarTarefa: () => avisarFim(),
    },
  });
  await servidor.ready();
});

afterEach(async () => {
  await servidor.close();
  await rm(pastaDados, { recursive: true, force: true });
});

async function pelaRota() {
  const conteudoBase64 = (await readFile(RFP)).toString("base64");
  const criada = await servidor.inject({ method: "POST", url: "/api/tarefas", payload: { arquivo: { nome: "RFP-01-Rede-Varejo-Alfa.xlsx", conteudoBase64 } } });
  const id = criada.json().tarefa.id as string;
  await terminou;
  return { id, itens: (await servidor.inject({ method: "GET", url: `/api/tarefas/${id}/itens` })).json().itens as Record<string, unknown>[] };
}

async function peloComando() {
  return processarTarefa({
    banco,
    cliente: new ClienteDaIa(api, () => {}),
    ia: IA,
    nomesDeCabecalho: await carregarCabecalhos(),
    termosCriticos: await carregarTermosCriticos(),
    hoje: "2026-10-21",
    nomeDoArquivo: "RFP-01-Rede-Varejo-Alfa.xlsx",
    planilha: new Uint8Array(await readFile(RFP)),
  });
}

describe("B6 · cenário 25: comando e backend são equivalentes", () => {
  it("a mesma planilha e a mesma base dão os mesmos itens pelo comando e pela rota", async () => {
    const comando = await peloComando();
    const { itens } = await pelaRota();

    const semPosicao = itens.map(({ numero: _numero, aba: _aba, linha: _linha, ...item }) => item);
    expect(semPosicao).toEqual(comando.itens);
    expect(itens.map(({ aba, linha }) => ({ aba, linha }))).toEqual(comando.perguntas.map(({ aba, linha }) => ({ aba, linha })));
  });
});

describe("B3 · cenário 40: documento desativado não é citado em nova tarefa", () => {
  it("desativado pela rota, o documento não vai à IA e nenhuma fonte aponta para ele; reativado, volta", async () => {
    const [primeiro] = await listarDocumentos(banco);
    if (primeiro === undefined) throw new Error("base vazia");
    expect((await servidor.inject({ method: "PATCH", url: `/api/base/documentos/${primeiro.id}`, payload: { ativo: false } })).statusCode).toBe(200);

    const { id, itens } = await pelaRota();

    const enviado = JSON.stringify([...api.contagens, ...api.geracoes]);
    expect(enviado).not.toContain(`Arquivo: ${primeiro.nome}`);
    expect(itens.flatMap((item) => (item.srcs as { doc: string }[]).map((fonte) => fonte.doc))).not.toContain(primeiro.nome);
    const registro = (await servidor.inject({ method: "GET", url: `/api/tarefas/${id}/registro` })).json().requisicoes;
    expect(registro.every((entrada: { documentos: string[] }) => !entrada.documentos.includes(primeiro.nome))).toBe(true);

    await definirAtivo(banco, primeiro.id, true);
    const reativado = await peloComando();
    expect(reativado.documentos).toContain(primeiro.nome);
  });
});

describe("Cenário 30 · o servidor só atende a própria máquina", () => {
  let processo: ChildProcess | undefined;
  let pasta: string | undefined;
  afterEach(async () => {
    processo?.kill("SIGTERM");
    await new Promise((pronto) => setTimeout(pronto, 300));
    if (pasta) await rm(pasta, { recursive: true, force: true });
  });

  const conecta = (host: string, porta: number) =>
    new Promise<boolean>((resolver) => {
      const socket = connect({ host, port: porta, timeout: 2_000 });
      socket.once("connect", () => (socket.destroy(), resolver(true)));
      socket.once("error", () => resolver(false));
      socket.once("timeout", () => (socket.destroy(), resolver(false)));
    });

  it("ouve em 127.0.0.1 e recusa conexão pelo endereço da rede", async () => {
    pasta = await mkdtemp(path.join(tmpdir(), "tendra-servidor-"));
    const porta = 3900 + Math.floor(Math.random() * 90);
    processo = spawn(process.execPath, [path.join(PASTA_BACKEND, "src/cli/servidor.ts")], {
      cwd: PASTA_BACKEND,
      env: { PATH: process.env.PATH ?? "", TENDRA_API_SIMULADA: "1", TENDRA_PASTA_DADOS: pasta, TENDRA_PORTA: String(porta), TENDRA_NIVEL_LOG: "error" },
    });
    const saida: string[] = [];
    await new Promise<void>((pronto, falhou) => {
      const limite = setTimeout(() => falhou(new Error(`servidor não subiu: ${saida.join("")}`)), 60_000);
      processo?.stdout?.on("data", (dados: Buffer) => {
        saida.push(dados.toString());
        if (saida.join("").includes("Servidor em")) (clearTimeout(limite), pronto());
      });
      processo?.stderr?.on("data", (dados: Buffer) => saida.push(dados.toString()));
    });
    expect(saida.join("")).toContain("(API do Claude SIMULADA)");

    expect(await conecta("127.0.0.1", porta)).toBe(true);
    const daRede = Object.values(networkInterfaces())
      .flat()
      .find((endereco) => endereco?.family === "IPv4" && !endereco.internal)?.address;
    if (daRede !== undefined) expect(await conecta(daRede, porta)).toBe(false);
  }, 90_000);
});
