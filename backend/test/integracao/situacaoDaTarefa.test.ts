import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { gravarPerfil } from "../../src/autenticacao/perfis.ts";
import type { VerificadorDeSenha } from "../../src/autenticacao/verificadorSupabase.ts";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarPessoas } from "../../src/config/pessoas.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { criarTarefaComPlanilha, executarTarefa } from "../../src/fluxo/executarTarefa.ts";
import { criarServidor } from "../../src/http/servidor.ts";
import { carregarPrecos } from "../../src/observabilidade/metricas.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { criarOrganizacao, ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { listarItens, obterTarefa } from "../../src/persistencia/tarefas.ts";
import { ApiSimulada } from "../apoio/apiSimulada.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import { respondeImparesCitando } from "../apoio/respostasSimuladas.ts";

/**
 * Fase O (SPEC_FASE_O.md): situação da tarefa. Finalizar a pronta (O7), arquivar (O10), só leitura
 * da encerrada (O11), reativar (O12), exclusão (O13) e isolamento entre organizações (O17).
 */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const RFP = path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-sonnet-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };
const PERFIS = {
  aprovador: { id: "b1111111-1111-4111-8111-111111111111", email: "aprovador@tendra.test", nome: "Ana Aprovadora", papel: "Aprovador", areas: ["C-Level"] },
  revisor: { id: "b2222222-2222-4222-8222-222222222222", email: "revisor@tendra.test", nome: "Rui Revisor", papel: "Revisor", areas: [] },
  outra: { id: "b3333333-3333-4333-8333-333333333333", email: "outra@tendra.test", nome: "Olga Outra", papel: "Aprovador", areas: ["C-Level"] },
};
const SENHA = "senha-de-teste";

let banco: Banco;
let pastaDados: string;
let servidor: FastifyInstance;
let ambiente: Parameters<typeof executarTarefa>[0];
const cookies: Record<keyof typeof PERFIS, string> = { aprovador: "", revisor: "", outra: "" };

const verificador: VerificadorDeSenha = {
  async conferir(email, senha) {
    const perfil = Object.values(PERFIS).find((candidato) => candidato.email === email);
    return perfil !== undefined && senha === SENHA ? perfil.id : null;
  },
};

const pedir = (quem: keyof typeof PERFIS, method: "GET" | "POST" | "PUT" | "DELETE", url: string, payload?: object) =>
  servidor.inject({ method, url, headers: { cookie: cookies[quem] }, ...(payload === undefined ? {} : { payload }) });

async function novaTarefa(): Promise<string> {
  const tarefa = await criarTarefaComPlanilha(ambiente, { organizacaoId: ORGANIZACAO_INICIAL, arquivo: "RFP-01.xlsx", planilha: new Uint8Array(await readFile(RFP)), dados: { nome: "RFP de teste" } });
  await executarTarefa(ambiente, tarefa);
  return tarefa.id;
}

/** Deixa a tarefa pronta: todos os itens aprovados e sem alerta pendente. */
const aprovarTudo = (id: string) =>
  banco.query("UPDATE itens SET st = 'aprovada', alerts = '[]', aprovado_por = 'Ana Aprovadora', aprovado_em = now() WHERE tarefa_id = $1", [id]);

const situacao = async (id: string) => {
  const tarefa = await obterTarefa(banco, ORGANIZACAO_INICIAL, id);
  return tarefa === null ? null : { situacao: tarefa.situacao, por: tarefa.situacaoPor, em: tarefa.situacaoEm !== null };
};

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-situacao-"));
  await carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
  const outraOrganizacao = (await criarOrganizacao(banco, "Organização de teste O")).id;
  await gravarPerfil(banco, { ...PERFIS.aprovador, organizacaoId: ORGANIZACAO_INICIAL });
  await gravarPerfil(banco, { ...PERFIS.revisor, organizacaoId: ORGANIZACAO_INICIAL });
  await gravarPerfil(banco, { ...PERFIS.outra, organizacaoId: outraOrganizacao });
  const api = new ApiSimulada();
  api.respostas = [respondeImparesCitando];
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
  servidor = criarServidor({ banco, tarefas: { ...ambiente, pessoas: await carregarPessoas() }, autenticacao: { verificador, horasSemUso: 8, cookieSeguro: true } });
  await servidor.ready();
  for (const quem of Object.keys(PERFIS) as (keyof typeof PERFIS)[]) {
    const resposta = await servidor.inject({ method: "POST", url: "/api/auth/login", payload: { email: PERFIS[quem].email, senha: SENHA } });
    expect(resposta.statusCode).toBe(200);
    cookies[quem] = String(resposta.headers["set-cookie"]).split(";")[0] ?? "";
  }
}, 60_000);

afterAll(async () => {
  await servidor.close();
  await banco.close();
  await rm(pastaDados, { recursive: true, force: true });
});

describe("Cenário O16 · tarefa nova em andamento", () => {
  it("a lista de tarefas traz a situação, em andamento e sem autoria", async () => {
    const id = await novaTarefa();
    const resposta = await pedir("revisor", "GET", "/api/tarefas");
    expect(resposta.json().tarefas.find((t: { id: string }) => t.id === id)).toMatchObject({ situacao: "em_andamento", situacaoPor: null, situacaoEm: null });
  });
});

describe("Cenário O7 · finalizar", () => {
  it("recusa a tarefa que não está pronta, com 409, sem mudar nada", async () => {
    const id = await novaTarefa();
    const resposta = await pedir("revisor", "POST", `/api/tarefas/${id}/finalizar`, {});
    expect(resposta.statusCode).toBe(409);
    expect(resposta.json().erro).toContain("Só a tarefa pronta é finalizada");
    expect(await situacao(id)).toEqual({ situacao: "em_andamento", por: null, em: false });
  });

  it("o Revisor finaliza a tarefa pronta, com quem e quando; finalizar de novo é recusado", async () => {
    const id = await novaTarefa();
    await aprovarTudo(id);
    const resposta = await pedir("revisor", "POST", `/api/tarefas/${id}/finalizar`, {});
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json().tarefa).toMatchObject({ situacao: "finalizada", situacaoPor: "Rui Revisor" });
    expect(await situacao(id)).toEqual({ situacao: "finalizada", por: "Rui Revisor", em: true });

    const deNovo = await pedir("aprovador", "POST", `/api/tarefas/${id}/finalizar`, {});
    expect(deNovo.statusCode).toBe(409);
    expect(deNovo.json().erro).toBe("A tarefa já está finalizada.");
  });

  it("finalizada: só leitura, não reativa, não arquiva e não é excluída; a planilha continua baixando", async () => {
    const id = await novaTarefa();
    await aprovarTudo(id);
    expect((await pedir("aprovador", "POST", `/api/tarefas/${id}/finalizar`, {})).statusCode).toBe(200);

    const aprovacao = await pedir("aprovador", "POST", `/api/tarefas/${id}/itens/1/restaurar`, {});
    expect(aprovacao.statusCode).toBe(409);
    expect(aprovacao.json().erro).toBe("A tarefa está finalizada e é só para leitura.");
    expect((await pedir("aprovador", "POST", `/api/tarefas/${id}/reativar`, {})).json().erro).toBe("Tarefa finalizada não é reativada.");
    expect((await pedir("aprovador", "POST", `/api/tarefas/${id}/arquivar`, {})).statusCode).toBe(409);
    const exclusao = await pedir("aprovador", "DELETE", `/api/tarefas/${id}`);
    expect(exclusao.statusCode).toBe(409);
    expect(exclusao.json().erro).toBe("Tarefa finalizada não pode ser excluída.");
    expect((await pedir("revisor", "GET", `/api/tarefas/${id}/planilha`)).statusCode).toBe(200);
    expect(await situacao(id)).toMatchObject({ situacao: "finalizada" });
  });
});

describe("Cenários O10 a O13 · arquivar, só leitura, reativar e excluir", () => {
  it("o Revisor não arquiva nem reativa (403)", async () => {
    const id = await novaTarefa();
    expect((await pedir("revisor", "POST", `/api/tarefas/${id}/arquivar`, {})).statusCode).toBe(403);
    await banco.query("UPDATE tarefas SET situacao = 'arquivada', situacao_por = 'Ana Aprovadora', situacao_em = now() WHERE id = $1", [id]);
    expect((await pedir("revisor", "POST", `/api/tarefas/${id}/reativar`, {})).statusCode).toBe(403);
  });

  it("não arquiva durante o processamento", async () => {
    const id = await novaTarefa();
    await banco.query("UPDATE tarefas SET estado = 'processando' WHERE id = $1", [id]);
    const resposta = await pedir("aprovador", "POST", `/api/tarefas/${id}/arquivar`, {});
    expect(resposta.statusCode).toBe(409);
    expect(resposta.json().erro).toContain("em processamento");
    await banco.query("UPDATE tarefas SET estado = 'pronta' WHERE id = $1", [id]);
  });

  it("arquiva, recusa todas as mudanças de item com 409, e reativa com tudo como estava", async () => {
    const id = await novaTarefa();
    expect((await pedir("aprovador", "POST", `/api/tarefas/${id}/itens/1/aprovar`, {})).statusCode).toBe(200);
    const antes = await listarItens(banco, id);

    const arquivo = await pedir("aprovador", "POST", `/api/tarefas/${id}/arquivar`, {});
    expect(arquivo.statusCode).toBe(200);
    expect(arquivo.json().tarefa).toMatchObject({ situacao: "arquivada", situacaoPor: "Ana Aprovadora" });

    const soLeitura = "A tarefa está arquivada e é só para leitura.";
    const tentativas = [
      pedir("revisor", "PUT", `/api/tarefas/${id}/itens/2/texto`, { texto: "Outro texto." }),
      pedir("revisor", "POST", `/api/tarefas/${id}/itens/2/restaurar`, {}),
      pedir("revisor", "POST", `/api/tarefas/${id}/itens/2/revisar`, {}),
      pedir("aprovador", "POST", `/api/tarefas/${id}/itens/2/aprovar`, {}),
      pedir("aprovador", "PUT", `/api/tarefas/${id}/itens/2/area`, { area: "Comercial" }),
      pedir("revisor", "PUT", `/api/tarefas/${id}/itens/2/avaliacao`, { valor: "positiva" }),
      pedir("revisor", "POST", `/api/tarefas/${id}/itens/2/fonte`, { fonte: 1 }),
      pedir("revisor", "POST", `/api/tarefas/${id}/itens/2/alertas/lowconf/reconhecer`, {}),
      pedir("revisor", "POST", `/api/tarefas/${id}/itens/2/revisar-texto`, { texto: "Um texto qualquer com palavras suficientes para revisar com a IA." }),
    ];
    for (const resposta of await Promise.all(tentativas)) {
      expect(resposta.statusCode).toBe(409);
      expect(resposta.json().erro).toBe(soLeitura);
    }
    // Leitura continua: itens, eventos e planilha.
    expect((await pedir("revisor", "GET", `/api/tarefas/${id}/itens`)).statusCode).toBe(200);
    expect((await pedir("aprovador", "GET", `/api/tarefas/${id}/planilha`)).statusCode).toBe(200);
    expect(await listarItens(banco, id)).toEqual(antes);

    const reativada = await pedir("aprovador", "POST", `/api/tarefas/${id}/reativar`, {});
    expect(reativada.statusCode).toBe(200);
    expect(reativada.json().tarefa).toMatchObject({ situacao: "em_andamento", situacaoPor: null, situacaoEm: null });
    expect(await listarItens(banco, id)).toEqual(antes);
    expect((await pedir("aprovador", "POST", `/api/tarefas/${id}/reativar`, {})).json().erro).toBe("A tarefa já está em andamento.");
    expect((await pedir("revisor", "POST", `/api/tarefas/${id}/itens/3/revisar`, {})).statusCode).toBe(200);
  });

  it("a arquivada pode ser excluída", async () => {
    const id = await novaTarefa();
    expect((await pedir("aprovador", "POST", `/api/tarefas/${id}/arquivar`, {})).statusCode).toBe(200);
    expect((await pedir("aprovador", "DELETE", `/api/tarefas/${id}`)).statusCode).toBe(200);
    expect(await obterTarefa(banco, ORGANIZACAO_INICIAL, id)).toBeNull();
  });
});

describe("Cenário O17 · isolamento entre organizações", () => {
  it("finalizar, arquivar e reativar a tarefa de outra organização dá 404, sem mudar nada", async () => {
    const id = await novaTarefa();
    await aprovarTudo(id);
    for (const acao of ["finalizar", "arquivar", "reativar"]) {
      expect((await pedir("outra", "POST", `/api/tarefas/${id}/${acao}`, {})).statusCode).toBe(404);
    }
    expect(await situacao(id)).toEqual({ situacao: "em_andamento", por: null, em: false });
  });
});
