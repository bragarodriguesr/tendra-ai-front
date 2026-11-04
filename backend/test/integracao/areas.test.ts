import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { ErroDeCadastro, gravarPerfil } from "../../src/autenticacao/perfis.ts";
import type { VerificadorDeSenha } from "../../src/autenticacao/verificadorSupabase.ts";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarPessoas } from "../../src/config/pessoas.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { criarTarefaComPlanilha, executarTarefa } from "../../src/fluxo/executarTarefa.ts";
import { criarServidor } from "../../src/http/servidor.ts";
import type { MensagemDaIa, ParametrosDaGeracao } from "../../src/ia/cliente.ts";
import { carregarPrecos } from "../../src/observabilidade/metricas.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { listarItens, listarRequisicoes, obterTarefa } from "../../src/persistencia/tarefas.ts";
import { listarEventos } from "../../src/revisao/revisao.ts";
import { ApiSimulada, mensagem, texto } from "../apoio/apiSimulada.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import { respondeImparesCitando } from "../apoio/respostasSimuladas.ts";

/**
 * Fase N (SPEC_FASE_N.md): classificação das perguntas por área no processamento (N2, N3),
 * aprovação restrita pela área (N5 a N7), troca de área (N10) e áreas do Aprovador (N1).
 */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const RFP = path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-sonnet-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };
const PERFIS = {
  juridico: { id: "a1111111-1111-4111-8111-111111111111", email: "juridico@tendra.test", nome: "Joana Jurídico", papel: "Aprovador", areas: ["Jurídico"] },
  clevel: { id: "a2222222-2222-4222-8222-222222222222", email: "clevel@tendra.test", nome: "Carlos Diretor", papel: "Aprovador", areas: ["C-Level"] },
  semArea: { id: "a3333333-3333-4333-8333-333333333333", email: "semarea@tendra.test", nome: "Sérgio Sem Área", papel: "Aprovador", areas: [] },
  revisor: { id: "a4444444-4444-4444-8444-444444444444", email: "revisor@tendra.test", nome: "Rita Revisora", papel: "Revisor", areas: [] },
};
const SENHA = "senha-de-teste";

/** Áreas atribuídas pela classificação simulada: as demais perguntas ficam em "Geral". */
const AREAS: Record<number, string> = { 1: "Jurídico", 3: "Tecnologia", 7: "Segurança e privacidade" };

function classificarPorNumero(parametros: ParametrosDaGeracao): MensagemDaIa {
  const conteudo = parametros.messages[0]?.content;
  const ultimo = Array.isArray(conteudo) ? conteudo.at(-1) : undefined;
  const pedido = ultimo?.type === "text" ? ultimo.text : "";
  const itens = [...pedido.matchAll(/^\[P(\d+)\]/gm)].map(([, numero]) => ({ numero: Number(numero), area: AREAS[Number(numero)] ?? "Geral" }));
  return mensagem([texto(JSON.stringify({ itens }))]);
}

let banco: Banco;
let pastaDados: string;
let servidor: FastifyInstance;
let tarefaId: string;
let api: ApiSimulada;
let ambiente: Parameters<typeof executarTarefa>[0];

const verificador: VerificadorDeSenha = {
  async conferir(email, senha) {
    const perfil = Object.values(PERFIS).find((candidato) => candidato.email === email);
    return perfil !== undefined && senha === SENHA ? perfil.id : null;
  },
};

async function cookieDe(perfil: (typeof PERFIS)[keyof typeof PERFIS]): Promise<string> {
  const resposta = await servidor.inject({ method: "POST", url: "/api/auth/login", payload: { email: perfil.email, senha: SENHA } });
  expect(resposta.statusCode).toBe(200);
  return String(resposta.headers["set-cookie"]).split(";")[0] ?? "";
}

const pedir = (cookie: string, method: "GET" | "POST" | "PUT", url: string, payload?: object) =>
  servidor.inject({ method, url, headers: { cookie }, ...(payload === undefined ? {} : { payload }) });

async function novaTarefa(): Promise<string> {
  const tarefa = await criarTarefaComPlanilha(ambiente, { organizacaoId: ORGANIZACAO_INICIAL, arquivo: "RFP-01.xlsx", planilha: new Uint8Array(await readFile(RFP)), dados: {} });
  await executarTarefa(ambiente, tarefa);
  return tarefa.id;
}

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-areas-"));
  await carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
  for (const perfil of Object.values(PERFIS)) await gravarPerfil(banco, { ...perfil, organizacaoId: ORGANIZACAO_INICIAL });
  api = new ApiSimulada();
  api.respostas = [respondeImparesCitando];
  api.classificacao = classificarPorNumero;
  ambiente = {
    banco,
    armazenamento: criarArmazenamento(pastaDados),
    api,
    ia: IA,
    nomesDeCabecalho: await carregarCabecalhos(),
    termosCriticos: await carregarTermosCriticos(),
    precos: await carregarPrecos(),
    hoje: () => "2026-10-21",
  };
  tarefaId = await novaTarefa();
  servidor = criarServidor({ banco, tarefas: { ...ambiente, pessoas: await carregarPessoas() }, autenticacao: { verificador, horasSemUso: 8, cookieSeguro: true } });
  await servidor.ready();
}, 60_000);

afterAll(async () => {
  await servidor.close();
  await banco.close();
  await rm(pastaDados, { recursive: true, force: true });
});

describe("Cenário N1 · áreas do Aprovador", () => {
  it("login e /api/auth/me trazem as áreas; o Revisor não tem área", async () => {
    const login = await servidor.inject({ method: "POST", url: "/api/auth/login", payload: { email: PERFIS.juridico.email, senha: SENHA } });
    expect(login.json().pessoa).toEqual({ nome: "Joana Jurídico", papel: "Aprovador", areas: ["Jurídico"] });
    const cookie = await cookieDe(PERFIS.revisor);
    expect((await pedir(cookie, "GET", "/api/auth/me")).json().pessoa).toEqual({ nome: "Rita Revisora", papel: "Revisor", areas: [] });
  });

  it("recusa área num Revisor, área fora da lista e C-Level combinado; sem áreas, mantém as do perfil", async () => {
    const base = { id: "a5555555-5555-4555-8555-555555555555", email: "novo@tendra.test", nome: "Nova Pessoa", organizacaoId: ORGANIZACAO_INICIAL };
    await expect(gravarPerfil(banco, { ...base, papel: "Revisor", areas: ["Jurídico"] })).rejects.toThrow(new ErroDeCadastro("Só o Aprovador tem área."));
    await expect(gravarPerfil(banco, { ...base, papel: "Aprovador", areas: ["Marketing"] })).rejects.toThrow(/Área inválida "Marketing"\. Use Produto, Tecnologia, Segurança e privacidade, Comercial, Jurídico, C-Level\./);
    await expect(gravarPerfil(banco, { ...base, papel: "Aprovador", areas: ["C-Level", "Jurídico"] })).rejects.toThrow(/C-Level já vale por todas/);

    await gravarPerfil(banco, { ...base, papel: "Aprovador", areas: ["jurídico", " Comercial ", "Jurídico"] });
    const areas = async () => (await banco.query<{ areas: string[] }>("SELECT areas FROM perfis WHERE id = $1", [base.id])).rows[0]?.areas;
    expect(await areas()).toEqual(["Jurídico", "Comercial"]);
    await gravarPerfil(banco, { ...base, nome: "Nova Pessoa 2", papel: "Aprovador" });
    expect(await areas()).toEqual(["Jurídico", "Comercial"]);
    // Virar Revisor tira as áreas: o banco não aceita Revisor com área.
    await gravarPerfil(banco, { ...base, papel: "Revisor" });
    expect(await areas()).toEqual([]);
    await expect(banco.query("UPDATE perfis SET areas = '{Jurídico}' WHERE id = $1", [base.id])).rejects.toThrow();
  });
});

describe("Cenários N2 e N3 · classificação no processamento", () => {
  it("cada pergunta recebe a área da classificação, numa etapa própria, só com o texto das perguntas", async () => {
    const itens = await listarItens(banco, tarefaId);
    expect(itens.filter((item) => item.area !== "Geral").map(({ numero, area }) => ({ numero, area }))).toEqual([
      { numero: 1, area: "Jurídico" },
      { numero: 3, area: "Tecnologia" },
      { numero: 7, area: "Segurança e privacidade" },
    ]);
    const [pedido] = api.classificacoes;
    expect(pedido).toMatchObject({ model: "claude-haiku-5-5" });
    expect(JSON.stringify(pedido?.messages)).not.toContain('"document"');
    const tarefa = await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefaId);
    expect(tarefa?.metricas).toMatchObject({ perguntasEmGeralPorFalha: 0, requisicoes: { porEtapa: { classificacao: 1 } } });
    expect(tarefa?.metricas?.duracaoPorEtapa.classificacao).toBeTypeOf("number");
    expect(tarefa?.comportamento).toMatchObject({ modeloDeClassificacao: "claude-haiku-5-5", instrucoes: { classificacao: "classificacao-v1" } });
  });

  it("falha da IA ou resposta fora do formato: as perguntas ficam em Geral, a tarefa fica pronta e conta as falhas", async () => {
    api.classificacao = new Anthropic.APIConnectionError({ message: "fetch failed" });
    const comErro = await novaTarefa();
    api.classificacao = mensagem([texto(JSON.stringify({ itens: [{ numero: 1, area: "Marketing" }, { numero: 3, area: "Tecnologia" }] }))]);
    const foraDaLista = await novaTarefa();
    api.classificacao = classificarPorNumero;

    expect(await obterTarefa(banco, ORGANIZACAO_INICIAL, comErro)).toMatchObject({ estado: "pronta", metricas: { perguntasEmGeralPorFalha: 46 } });
    expect(new Set((await listarItens(banco, comErro)).map((item) => item.area))).toEqual(new Set(["Geral"]));
    expect((await listarRequisicoes(banco, comErro)).find((entrada) => entrada.etapa === "classificacao")).toMatchObject({ resultado: "erro" });

    expect(await obterTarefa(banco, ORGANIZACAO_INICIAL, foraDaLista)).toMatchObject({ estado: "pronta", metricas: { perguntasEmGeralPorFalha: 45 } });
    expect((await listarItens(banco, foraDaLista)).filter((item) => item.area !== "Geral").map(({ numero, area }) => ({ numero, area }))).toEqual([{ numero: 3, area: "Tecnologia" }]);
  });
});

describe("Cenários N5 a N7 · aprovação pela área", () => {
  it("o Aprovador do Jurídico aprova a pergunta jurídica e é recusado na de Tecnologia, que continua podendo revisar", async () => {
    const cookie = await cookieDe(PERFIS.juridico);
    expect((await pedir(cookie, "POST", `/api/tarefas/${tarefaId}/itens/1/aprovar`, {})).json().item).toMatchObject({ st: "aprovada", by: "Joana Jurídico" });

    const recusa = await pedir(cookie, "POST", `/api/tarefas/${tarefaId}/itens/3/aprovar`, {});
    expect({ status: recusa.statusCode, corpo: recusa.json() }).toEqual({ status: 403, corpo: { erro: "Só a área Tecnologia ou C-Level aprova esta resposta." } });
    expect((await listarItens(banco, tarefaId)).find((item) => item.numero === 3)).toMatchObject({ st: "sugerida" });
    expect((await pedir(cookie, "POST", `/api/tarefas/${tarefaId}/itens/3/revisar`, {})).json().item).toMatchObject({ st: "revisada" });
  });

  it('C-Level aprova qualquer área; "Geral" é aprovada por qualquer Aprovador, mesmo sem área', async () => {
    const clevel = await cookieDe(PERFIS.clevel);
    expect((await pedir(clevel, "POST", `/api/tarefas/${tarefaId}/itens/3/aprovar`, {})).statusCode).toBe(200);
    const semArea = await cookieDe(PERFIS.semArea);
    expect((await pedir(semArea, "POST", `/api/tarefas/${tarefaId}/itens/5/aprovar`, {})).statusCode).toBe(200);
    expect((await pedir(semArea, "POST", `/api/tarefas/${tarefaId}/itens/7/aprovar`, {})).statusCode).toBe(403);
  });
});

describe("Cenário N10 · troca da área de um item", () => {
  it("quem pode aprovar troca a área e o histórico registra; depois deixa de poder aprovar", async () => {
    const cookie = await cookieDe(PERFIS.clevel);
    const troca = await pedir(cookie, "PUT", `/api/tarefas/${tarefaId}/itens/7/area`, { area: "Jurídico" });
    expect(troca.json().item).toMatchObject({ numero: 7, area: "Jurídico" });
    expect((await listarEventos(banco, tarefaId)).filter((evento) => evento.acao === "area")).toEqual([
      expect.objectContaining({ item: "r7", acao: "area", pessoa: "Carlos Diretor", papel: "Aprovador", detalhe: "Segurança e privacidade → Jurídico" }),
    ]);
    const juridico = await cookieDe(PERFIS.juridico);
    expect((await pedir(juridico, "PUT", `/api/tarefas/${tarefaId}/itens/7/area`, { area: "Comercial" })).json().item).toMatchObject({ area: "Comercial" });
    expect((await pedir(juridico, "POST", `/api/tarefas/${tarefaId}/itens/7/aprovar`, {})).statusCode).toBe(403);
  });

  it("recusa quem não aprova a área atual, o Revisor, o item aprovado e a área fora da lista", async () => {
    const juridico = await cookieDe(PERFIS.juridico);
    const deOutraArea = await pedir(juridico, "PUT", `/api/tarefas/${tarefaId}/itens/7/area`, { area: "Jurídico" });
    expect({ status: deOutraArea.statusCode, corpo: deOutraArea.json() }).toEqual({ status: 403, corpo: { erro: "Só quem aprova a área Comercial troca a área deste item." } });
    const revisor = await cookieDe(PERFIS.revisor);
    expect((await pedir(revisor, "PUT", `/api/tarefas/${tarefaId}/itens/9/area`, { area: "Jurídico" })).statusCode).toBe(403);
    const clevel = await cookieDe(PERFIS.clevel);
    expect((await pedir(clevel, "PUT", `/api/tarefas/${tarefaId}/itens/1/area`, { area: "Comercial" })).statusCode).toBe(409);
    expect((await pedir(clevel, "PUT", `/api/tarefas/${tarefaId}/itens/9/area`, { area: "Marketing" })).statusCode).toBe(400);
    expect((await listarItens(banco, tarefaId)).find((item) => item.numero === 9)).toMatchObject({ area: "Geral" });
  });
});
