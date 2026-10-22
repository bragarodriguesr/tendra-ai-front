import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { criarArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarPessoas } from "../../src/config/pessoas.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { criarServidor } from "../../src/http/servidor.ts";
import type { ApiDoClaude, MensagemDaIa, ParametrosDaGeracao } from "../../src/ia/cliente.ts";
import { carregarPrecos } from "../../src/observabilidade/metricas.ts";
import { abrirBanco, type Banco } from "../../src/persistencia/banco.ts";
import { ApiSimulada } from "../apoio/apiSimulada.ts";
import { respondeImparesCitando } from "../apoio/respostasSimuladas.ts";

/** Rotas de tarefas (etapa B2) com a API do Claude simulada até a A1. */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-haiku-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };

let banco: Banco;
let pastaDados: string;
let api: ApiDoClaude;
let servidor: FastifyInstance;
let terminadas: Map<string, () => void>;
let aguardando: Map<string, Promise<void>>;

beforeAll(async () => {
  banco = await abrirBanco();
  await carregarBase({ pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
}, 60_000);

afterAll(async () => {
  await banco.close();
});

beforeEach(async () => {
  await banco.exec("TRUNCATE tarefas CASCADE");
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-rotas-"));
  const simulada = new ApiSimulada();
  simulada.respostas = [respondeImparesCitando];
  api = simulada;
  terminadas = new Map();
  aguardando = new Map();
  servidor = criarServidor({
    banco,
    hoje: () => "2026-10-21",
    tarefas: {
      banco,
      armazenamento: criarArmazenamento(pastaDados),
      api: { gerar: (parametros) => api.gerar(parametros), contarTokens: (parametros) => api.contarTokens(parametros) },
      ia: IA,
      nomesDeCabecalho: await carregarCabecalhos(),
      termosCriticos: await carregarTermosCriticos(),
      precos: await carregarPrecos(),
      pessoas: await carregarPessoas(),
      hoje: () => "2026-10-21",
      aoTerminarTarefa: (id) => terminadas.get(id)?.(),
    },
  });
  await servidor.ready();
});

afterEach(async () => {
  await servidor.close();
  await rm(pastaDados, { recursive: true, force: true });
});

async function enviar(arquivo: string, dados: object = {}, nome = path.basename(arquivo)) {
  const conteudoBase64 = (await readFile(arquivo)).toString("base64");
  const resposta = await servidor.inject({ method: "POST", url: "/api/tarefas", payload: { arquivo: { nome, conteudoBase64 }, dados } });
  const id = resposta.statusCode === 202 ? (resposta.json().tarefa.id as string) : "";
  if (id) aguardando.set(id, new Promise<void>((pronto) => terminadas.set(id, pronto)));
  return { resposta, id, terminou: () => aguardando.get(id) ?? Promise.resolve() };
}

const obter = (url: string) => servidor.inject({ method: "GET", url });
const RFP_01 = path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx");

describe("POST /api/tarefas e consulta da tarefa", () => {
  it("cria a tarefa em processamento, processa em segundo plano e entrega itens, planilha, registro e métricas", async () => {
    const { resposta, id, terminou } = await enviar(RFP_01, { nome: "RFP Alfa", empresa: "Rede Varejo Alfa", cnpj: "98.765.432/0001-10" });
    expect(resposta.statusCode).toBe(202);
    expect(resposta.json().tarefa).toMatchObject({ estado: "processando", arquivo: "RFP-01-Rede-Varejo-Alfa.xlsx", dados: { empresa: "Rede Varejo Alfa" } });
    expect(resposta.json().tarefa).not.toHaveProperty("caminhoDaPlanilha");
    await terminou();

    expect((await obter(`/api/tarefas/${id}`)).json().tarefa).toMatchObject({ estado: "pronta", total: 46, processadas: 46, motivo: null, comportamento: { modelo: "claude-opus-5-5" } });
    expect((await obter("/api/tarefas")).json().tarefas.map((tarefa: { id: string }) => tarefa.id)).toEqual([id]);

    const itens = (await obter(`/api/tarefas/${id}/itens`)).json().itens;
    expect(itens).toHaveLength(46);
    expect(itens[0]).toMatchObject({ id: "r1", st: "sugerida", paras: [{ t: "Resposta 1.", s: [1] }], orig: "Resposta 1." });
    expect(itens.some((item: { st: string }) => item.st === "aprovada")).toBe(false);

    const planilha = await obter(`/api/tarefas/${id}/planilha`);
    expect(planilha.statusCode).toBe(200);
    expect(planilha.headers["content-type"]).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(planilha.headers["content-disposition"]).toContain("RFP-01-Rede-Varejo-Alfa-preenchida.xlsx");
    const pasta = new ExcelJS.Workbook();
    await pasta.xlsx.load(planilha.rawPayload as unknown as ExcelJS.Buffer);
    expect(pasta.worksheets.length).toBeGreaterThan(0);

    expect((await obter(`/api/tarefas/${id}/registro`)).json().requisicoes.map((entrada: { etapa: string }) => entrada.etapa)).toContain("geracao");
    expect((await obter(`/api/tarefas/${id}/metricas`)).json().metricas).toMatchObject({ itens: 46 });
  });

  it("Cenários 16 e 23 · durante o processamento informa o progresso e não entrega itens nem planilha", async () => {
    let liberar: () => void = () => {};
    const segura = new Promise<void>((pronto) => (liberar = pronto));
    let chamadas = 0;
    api = {
      gerar: async (parametros: ParametrosDaGeracao): Promise<MensagemDaIa> => {
        if (++chamadas === 2) await segura;
        return respondeImparesCitando(parametros);
      },
      contarTokens: async () => 1000,
    };
    const { id, terminou } = await enviar(RFP_01);
    await new Promise((pronto) => setTimeout(pronto, 200));

    const andamento = (await obter(`/api/tarefas/${id}`)).json().tarefa;
    expect(andamento).toMatchObject({ estado: "processando", total: 46, processadas: 10 });
    expect((await obter(`/api/tarefas/${id}/itens`))).toMatchObject({ statusCode: 409 });
    expect((await obter(`/api/tarefas/${id}/itens`)).json()).toEqual({ erro: "A tarefa ainda está em processamento." });
    expect((await obter(`/api/tarefas/${id}/planilha`)).statusCode).toBe(409);

    liberar();
    await terminou();
    expect((await obter(`/api/tarefas/${id}`)).json().tarefa).toMatchObject({ estado: "pronta", processadas: 46 });
  });

  it("Cenário 17 · falha da IA: estado falha com o motivo; itens e planilha recusados", async () => {
    api = { gerar: async () => Promise.reject(new Anthropic.AuthenticationError(401, undefined, "invalid", new Headers())), contarTokens: async () => 1000 };
    const { id, terminou } = await enviar(RFP_01);
    await terminou();

    expect((await obter(`/api/tarefas/${id}`)).json().tarefa).toMatchObject({ estado: "falha", motivo: "Chave da API recusada." });
    const itens = await obter(`/api/tarefas/${id}/itens`);
    expect(itens.statusCode).toBe(409);
    expect(itens.json()).toEqual({ erro: "A tarefa falhou: Chave da API recusada." });
    expect((await obter(`/api/tarefas/${id}/planilha`)).statusCode).toBe(409);
  });
});

describe("Cenários 4 e 31 · validação da planilha no envio", () => {
  it.each([
    ["outro formato", path.join(RAIZ, "rfps/variantes/nao-e-planilha.csv"), "Envie a RFP em formato .xlsx"],
    ["planilha corrompida", path.join(RAIZ, "rfps/variantes/corrompida.xlsx"), "Arquivo .xlsx inválido"],
  ])("%s é recusado na hora, sem criar tarefa", async (_caso, arquivo, mensagem) => {
    const { resposta } = await enviar(arquivo);
    expect(resposta.statusCode).toBe(400);
    expect(resposta.json()).toEqual({ erro: mensagem });
    expect((await obter("/api/tarefas")).json().tarefas).toEqual([]);
  });

  it("planilha acima de 10 MB é recusada", async () => {
    const grande = Buffer.alloc(10 * 1024 * 1024 + 1, 1);
    grande.set([0x50, 0x4b, 0x03, 0x04]);
    const resposta = await servidor.inject({ method: "POST", url: "/api/tarefas", payload: { arquivo: { nome: "grande.xlsx", conteudoBase64: grande.toString("base64") } } });
    expect(resposta.statusCode).toBe(400);
    expect(resposta.json()).toEqual({ erro: "A planilha passa do limite de 10 MB" });
  });

  it("recusa CNPJ sem 14 dígitos e campos desconhecidos", async () => {
    expect((await enviar(RFP_01, { cnpj: "123" })).resposta.json()).toEqual({ erro: "CNPJ inválido: informe os 14 dígitos." });
    expect((await enviar(RFP_01, { senha: "x" })).resposta.statusCode).toBe(400);
  });

  it("o nome original nunca vira caminho de arquivo", async () => {
    const { resposta, id, terminou } = await enviar(RFP_01, {}, "../../etc/rfp.xlsx");
    expect(resposta.json().tarefa.arquivo).toBe("rfp.xlsx");
    await terminou();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("Identificador da tarefa", () => {
  it("id inválido é recusado e id desconhecido não é encontrado", async () => {
    expect((await obter("/api/tarefas/abc")).statusCode).toBe(400);
    const desconhecido = await obter("/api/tarefas/00000000-0000-4000-8000-000000000000");
    expect(desconhecido.statusCode).toBe(404);
    expect(desconhecido.json()).toEqual({ erro: "Tarefa não encontrada." });
  });
});
