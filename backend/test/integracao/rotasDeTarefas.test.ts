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
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
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
  banco = await abrirBancoDeTeste();
  await carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
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
        // A 1ª chamada é a classificação por área (fase N); a 3ª, o 2º lote da geração.
        if (++chamadas === 3) await segura;
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

  it("recusa CNPJ fora do formato e campos desconhecidos", async () => {
    const erro = { erro: "CNPJ inválido: informe os 14 caracteres (12 letras ou números e 2 dígitos verificadores)." };
    expect((await enviar(RFP_01, { cnpj: "123" })).resposta.json()).toEqual(erro);
    // Letra nos dígitos verificadores e caractere a mais.
    expect((await enviar(RFP_01, { cnpj: "12.ABC.345/01DE-3A" })).resposta.json()).toEqual(erro);
    expect((await enviar(RFP_01, { cnpj: "12.ABC.345/01DE-351" })).resposta.json()).toEqual(erro);
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

describe("Cenários 62 a 64 · responsável, empresa e contatos", () => {
  const contato = (nome: string, email = "", cargo = "", telefone = "") => ({ nome, cargo, telefone, email });

  beforeEach(async () => {
    await banco.exec("TRUNCATE empresas CASCADE");
  });

  it("lista os usuários da plataforma para o campo Responsável, sem e-mail", async () => {
    expect((await obter("/api/usuarios")).json()).toEqual({ usuarios: [{ nome: "Kadu Mendes", papel: "Revisor" }, { nome: "Marcelo Vieira", papel: "Aprovador" }] });
  });

  it("grava empresa e contatos numa estrutura própria e devolve os dados da tarefa", async () => {
    const { id, terminou } = await enviar(RFP_01, {
      nome: "RFP Alfa",
      empresa: "Rede Varejo Alfa",
      cnpj: "11.222.333/0001-81",
      responsavel: "Marcelo Vieira",
      contatos: [contato("Ana Souza", "ana@alfa.com.br", "Compras", "(11) 99999-0000"), contato("", "", "", ""), contato("Bruno Lima")],
    });
    await terminou();
    expect((await obter(`/api/tarefas/${id}/empresa`)).json()).toEqual({
      empresa: { nome: "Rede Varejo Alfa", cnpj: "11222333000181" },
      contatos: [contato("Ana Souza", "ana@alfa.com.br", "Compras", "(11) 99999-0000"), contato("Bruno Lima")],
    });
    const { rows } = await banco.query<{ empresas: number; contatos: number }>("SELECT (SELECT count(*)::int FROM empresas) AS empresas, (SELECT count(*)::int FROM contatos) AS contatos");
    expect(rows[0]).toEqual({ empresas: 1, contatos: 2 });
  });

  it("reaproveita a empresa (pelo CNPJ ou, sem CNPJ, pelo nome) e o contato com o mesmo e-mail, com os dados mais recentes", async () => {
    const a = await enviar(RFP_01, { empresa: "Rede Varejo Alfa", cnpj: "11222333000181", contatos: [contato("Ana", "ANA@alfa.com.br")] });
    const b = await enviar(RFP_01, { empresa: "Rede Varejo Alfa S.A.", cnpj: "11.222.333/0001-81", contatos: [contato("Ana Souza", "ana@alfa.com.br", "Diretora")] });
    const c = await enviar(RFP_01, { empresa: "Banco Horizonte" });
    const d = await enviar(RFP_01, { empresa: "banco horizonte " });
    await Promise.all([a, b, c, d].map((x) => x.terminou()));

    expect((await obter(`/api/tarefas/${a.id}/empresa`)).json()).toEqual({
      empresa: { nome: "Rede Varejo Alfa S.A.", cnpj: "11222333000181" },
      contatos: [contato("Ana Souza", "ana@alfa.com.br", "Diretora")],
    });
    const { rows } = await banco.query<{ nome: string; tarefas: number; contatos: number }>(
      "SELECT e.nome, (SELECT count(*)::int FROM tarefas t WHERE t.empresa_id = e.id) AS tarefas, (SELECT count(*)::int FROM contatos c WHERE c.empresa_id = e.id) AS contatos FROM empresas e ORDER BY lower(e.nome)",
    );
    expect(rows).toEqual([
      { nome: "banco horizonte", tarefas: 2, contatos: 0 },
      { nome: "Rede Varejo Alfa S.A.", tarefas: 2, contatos: 1 },
    ]);
  });

  it("aceita o CNPJ alfanumérico: grava sem máscara e em maiúsculas e reconhece a mesma empresa", async () => {
    const a = await enviar(RFP_01, { empresa: "Vereda Logística", cnpj: "12.ABC.345/01DE-35" });
    const b = await enviar(RFP_01, { empresa: "Vereda Logística S.A.", cnpj: "12abc34501de35" });
    expect(a.resposta.statusCode).toBe(202);
    expect(b.resposta.statusCode).toBe(202);
    await Promise.all([a, b].map((x) => x.terminou()));
    expect((await obter(`/api/tarefas/${a.id}/empresa`)).json().empresa).toEqual({ nome: "Vereda Logística S.A.", cnpj: "12ABC34501DE35" });
    const { rows } = await banco.query<{ tarefas: number }>("SELECT (SELECT count(*)::int FROM tarefas t WHERE t.empresa_id = e.id) AS tarefas FROM empresas e WHERE cnpj = '12ABC34501DE35'");
    expect(rows).toEqual([{ tarefas: 2 }]);
  });

  it("tarefa sem empresa não grava empresa; excluir a tarefa mantém empresa e contatos para consulta", async () => {
    const sem = await enviar(RFP_01, {});
    const com = await enviar(RFP_01, { empresa: "Rede Varejo Alfa", contatos: [contato("Ana", "ana@alfa.com.br")] });
    await Promise.all([sem.terminou(), com.terminou()]);
    expect((await obter(`/api/tarefas/${sem.id}/empresa`)).json()).toEqual({ empresa: null, contatos: [] });

    expect((await servidor.inject({ method: "DELETE", url: `/api/tarefas/${com.id}` })).statusCode).toBe(200);
    const { rows } = await banco.query<{ empresas: number; contatos: number; ligacoes: number }>(
      "SELECT (SELECT count(*)::int FROM empresas) AS empresas, (SELECT count(*)::int FROM contatos) AS contatos, (SELECT count(*)::int FROM tarefa_contatos) AS ligacoes",
    );
    expect(rows[0]).toEqual({ empresas: 1, contatos: 1, ligacoes: 0 });
    expect((await obter("/api/tarefas/00000000-0000-4000-8000-000000000000/empresa")).statusCode).toBe(404);
  });
});

describe("Cenário 65 · Revisar com IA (resposta manual)", () => {
  const ORIGINAL =
    "a empresa oferece suporte em portugues de segunda a sexta das 8h as 18h e tem plantao 24 horas para incidentes criticos, com atendimento por telefone e email e acompanhamento do chamado ate a solucao final pela equipe";
  const REVISADO =
    "A empresa oferece suporte em português de segunda a sexta, das 8h às 18h, e mantém plantão 24 horas para incidentes críticos, com atendimento por telefone e e-mail e acompanhamento do chamado até a solução final pela equipe.";
  const revisao = (textoRevisado: string) => (parametros: ParametrosDaGeracao) => {
    expect(parametros.output_config?.format).toBeDefined();
    return { ...semUso(textoRevisado), model: parametros.model } as MensagemDaIa;
  };
  const semUso = (textoRevisado: string) =>
    ({ id: "msg", type: "message", role: "assistant", content: [{ type: "text", text: textoRevisado, citations: null }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 300, output_tokens: 80, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } });
  const revisar = (id: string, numero: number, texto: string) => servidor.inject({ method: "POST", url: `/api/tarefas/${id}/itens/${numero}/revisar-texto`, payload: { texto } });

  async function tarefaPronta() {
    const { id, terminou } = await enviar(RFP_01);
    await terminou();
    const { itens } = (await obter(`/api/tarefas/${id}/itens`)).json() as { itens: { numero: number; orig: string }[] };
    return { id, semRascunho: itens.find((i) => i.orig === "")!.numero, comSugestao: itens.find((i) => i.orig !== "")!.numero };
  }

  it("revisa a redação com o Haiku 5.5, sem gravar no item, e registra a requisição sem o texto", async () => {
    const { id, semRascunho } = await tarefaPronta();
    const simulada = api as ApiSimulada;
    const antes = simulada.geracoes.length;
    simulada.respostas = [revisao(JSON.stringify({ texto: REVISADO }))];

    const resposta = await revisar(id, semRascunho, ORIGINAL);
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ texto: REVISADO });

    const pedido = simulada.geracoes.at(-1)!;
    expect(simulada.geracoes.length).toBe(antes + 1);
    expect(pedido.model).toBe("claude-haiku-5-5");
    expect(pedido.output_config?.effort).toBe("low");
    expect(JSON.stringify(pedido.system)).toContain("Não acrescente nenhum fato");
    expect(JSON.stringify(pedido.messages)).toContain(`<texto>\\n${ORIGINAL}\\n</texto>`);

    const { requisicoes } = (await obter(`/api/tarefas/${id}/registro`)).json() as { requisicoes: { etapa: string; perguntas: number[]; resultado: string }[] };
    const ultima = requisicoes.at(-1)!;
    expect(ultima).toMatchObject({ etapa: "revisao-texto", perguntas: [semRascunho], resultado: "sucesso", modelo: "claude-haiku-5-5" });
    expect(JSON.stringify(ultima)).not.toContain("suporte");
    const { itens } = (await obter(`/api/tarefas/${id}/itens`)).json() as { itens: { numero: number; paras: unknown[]; st: string }[] };
    expect(itens.find((i) => i.numero === semRascunho)).toMatchObject({ paras: [], st: "sem-rascunho" });
  });

  it("recusa texto com menos de 30 palavras e item com sugestão da IA, sem chamar a IA", async () => {
    const { id, semRascunho, comSugestao } = await tarefaPronta();
    const simulada = api as ApiSimulada;
    const antes = simulada.geracoes.length;
    const curto = await revisar(id, semRascunho, "Texto curto demais para revisar.");
    expect(curto.statusCode).toBe(400);
    expect(curto.json().erro).toBe("Escreva ao menos 30 palavras para revisar com IA.");
    expect((await revisar(id, comSugestao, ORIGINAL)).statusCode).toBe(409);
    expect((await revisar(id, 999, ORIGINAL)).statusCode).toBe(404);
    expect(simulada.geracoes.length).toBe(antes);
  });

  it("recusa a revisão que traz números novos ou aumenta demais o texto; resposta fora do formato é falha da IA", async () => {
    const { id, semRascunho } = await tarefaPronta();
    const simulada = api as ApiSimulada;
    simulada.respostas = [revisao(JSON.stringify({ texto: REVISADO.replace("24 horas", "24 horas, com SLA de 2 horas") }))];
    const numeroNovo = await revisar(id, semRascunho, ORIGINAL);
    expect(numeroNovo.statusCode).toBe(422);
    expect(numeroNovo.json().erro).toBe("A revisão trouxe números que não estão no texto. O texto foi mantido.");

    simulada.respostas = [revisao(JSON.stringify({ texto: `${REVISADO} ${REVISADO.replace(/\d/g, "")}` }))];
    expect((await revisar(id, semRascunho, ORIGINAL)).statusCode).toBe(422);

    simulada.respostas = [revisao("Aqui está o texto revisado.")];
    const invalida = await revisar(id, semRascunho, ORIGINAL);
    expect(invalida.statusCode).toBe(502);
    expect(invalida.json().erro).toBe("Revisão com IA indisponível: A resposta da IA veio num formato inesperado.");
  });
});
