import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { criarArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { criarTarefaComPlanilha, executarTarefa, type AmbienteDaTarefa } from "../../src/fluxo/executarTarefa.ts";
import { carregarPrecos } from "../../src/observabilidade/metricas.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import { abrirBanco, type Banco } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { listarItens, listarRequisicoes, marcarInterrompidas, MOTIVO_DE_INTERRUPCAO, obterTarefa } from "../../src/persistencia/tarefas.ts";
import { ApiSimulada } from "../apoio/apiSimulada.ts";
import { respondeImparesCitando } from "../apoio/respostasSimuladas.ts";

/** Tarefas e itens persistidos (etapa B1) e tarefa interrompida (B4). API simulada até a A1. */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const RFP = path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-haiku-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };
const CNPJ = "98.765.432/0001-10";

let banco: Banco;
let pastaDados: string;
let api: ApiSimulada;

async function ambiente(): Promise<AmbienteDaTarefa> {
  return {
    banco,
    armazenamento: criarArmazenamento(pastaDados),
    api,
    ia: IA,
    nomesDeCabecalho: await carregarCabecalhos(),
    termosCriticos: await carregarTermosCriticos(),
    precos: await carregarPrecos(),
    hoje: () => "2026-10-21",
  };
}

async function novaTarefa(arquivo = RFP) {
  const contexto = await ambiente();
  const tarefa = await criarTarefaComPlanilha(contexto, { organizacaoId: ORGANIZACAO_INICIAL, 
    arquivo: path.basename(arquivo),
    planilha: new Uint8Array(await readFile(arquivo)),
    dados: { nome: "RFP Alfa", empresa: "Rede Varejo Alfa", cnpj: CNPJ, contatos: [{ nome: "Ana Souza", email: "ana@alfa.example" }] },
  });
  return { contexto, tarefa };
}

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  await carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
}, 60_000);

afterAll(async () => {
  await banco.close();
});

beforeEach(async () => {
  await banco.exec("TRUNCATE tarefas CASCADE");
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-tarefas-"));
  api = new ApiSimulada();
});

afterEach(async () => {
  await rm(pastaDados, { recursive: true, force: true });
});

describe("B1 · tarefa processada e gravada", () => {
  it("grava itens, progresso, planilha preenchida, comportamento, métricas e registro", async () => {
    api.respostas = [respondeImparesCitando];
    const { contexto, tarefa } = await novaTarefa();
    expect(tarefa).toMatchObject({ estado: "processando", arquivo: "RFP-01-Rede-Varejo-Alfa.xlsx", processadas: 0 });
    expect(tarefa.caminhoDaPlanilha).toMatch(new RegExp(`^${ORGANIZACAO_INICIAL}/rfps/[0-9a-f-]{36}\\.xlsx$`));

    await executarTarefa(contexto, tarefa);

    const pronta = await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefa.id);
    expect(pronta).toMatchObject({ estado: "pronta", total: 46, processadas: 46, motivo: null });
    expect(pronta?.comportamento).toMatchObject({ modelo: "claude-opus-5-5", versaoDasInstrucoes: "geracao-v3", tamanhoDoLote: 10 });
    expect(pronta?.metricas).toMatchObject({ itens: 46, itensPorEstado: { sugerida: 23, "sem-rascunho": 23 } });

    const itens = await listarItens(banco, tarefa.id);
    expect(itens).toHaveLength(46);
    expect(itens[0]).toMatchObject({ id: "r1", numero: 1, aba: "Questionário", st: "sugerida", paras: [{ t: "Resposta 1.", s: [1] }] });
    expect(itens[1]).toMatchObject({ id: "r2", st: "sem-rascunho", alerts: [{ t: "nocontext" }] });
    expect(itens.every((item) => item.by === undefined && item.at === undefined)).toBe(true);

    const preenchida = new ExcelJS.Workbook();
    await preenchida.xlsx.load((await contexto.armazenamento.ler(ORGANIZACAO_INICIAL, pronta?.caminhoDaPlanilhaPreenchida ?? "")) as unknown as ExcelJS.Buffer);
    expect(preenchida.worksheets.length).toBeGreaterThan(0);

    const registro = await listarRequisicoes(banco, tarefa.id);
    expect(registro.map((entrada) => entrada.etapa)).toEqual(["contagem", "classificacao", "geracao", "geracao", "geracao", "geracao", "geracao"]);
  });

  it("Cenário 6 · nome, empresa, CNPJ e contatos ficam no banco e nunca vão à IA", async () => {
    api.respostas = [respondeImparesCitando];
    const { contexto, tarefa } = await novaTarefa();
    await executarTarefa(contexto, tarefa);

    expect((await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefa.id))?.dados.cnpj).toBe(CNPJ);
    const enviado = JSON.stringify([api.geracoes, api.contagens, await listarRequisicoes(banco, tarefa.id)]);
    for (const dado of [CNPJ, "98765432000110", "Ana Souza", "ana@alfa.example", "Rede Varejo Alfa"]) expect(enviado).not.toContain(dado);
  });

  it("Cenários 16 e 17 · falha da IA no meio: estado falha com motivo, progresso parado e nenhum item", async () => {
    api.respostas = [respondeImparesCitando, new Anthropic.AuthenticationError(401, undefined, "invalid", new Headers())];
    const { contexto, tarefa } = await novaTarefa();

    await executarTarefa(contexto, tarefa);

    expect(await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefa.id)).toMatchObject({ estado: "falha", motivo: "Chave da API recusada.", total: 46, processadas: 10, caminhoDaPlanilhaPreenchida: null });
    expect(await listarItens(banco, tarefa.id)).toEqual([]);
    expect((await listarRequisicoes(banco, tarefa.id)).map((entrada) => entrada.resultado)).toEqual(["sucesso", "sucesso", "sucesso", "erro"]);
  });

  it("Cenário 5 · planilha sem perguntas termina em falha com a mensagem do SPEC", async () => {
    const { contexto, tarefa } = await novaTarefa(path.join(RAIZ, "rfps/variantes/RFP-sem-perguntas.xlsx"));
    await executarTarefa(contexto, tarefa);
    expect(await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefa.id)).toMatchObject({ estado: "falha", motivo: "Nenhuma pergunta encontrada na planilha" });
  });

  it("erro inesperado do backend vira falha genérica, sem detalhes internos", async () => {
    api.respostas = [new TypeError("bug interno com detalhes")];
    const { contexto, tarefa } = await novaTarefa();
    const inesperados: unknown[] = [];
    await executarTarefa({ ...contexto, aoFalharInesperadamente: (erro) => inesperados.push(erro) }, tarefa);
    expect(await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefa.id)).toMatchObject({ estado: "falha", motivo: "Erro interno no processamento. Tente novamente." });
    expect(inesperados).toHaveLength(1);
  });
});

describe("Cenário 32 · tarefa interrompida por reinício", () => {
  it("ao iniciar, tarefa em processamento passa a falha com o motivo do SPEC; prontas não mudam", async () => {
    api.respostas = [respondeImparesCitando];
    const { contexto, tarefa: pronta } = await novaTarefa();
    await executarTarefa(contexto, pronta);
    const { tarefa: interrompida } = await novaTarefa();

    expect(await marcarInterrompidas(banco)).toBe(1);

    expect(await obterTarefa(banco, ORGANIZACAO_INICIAL, interrompida.id)).toMatchObject({ estado: "falha", motivo: MOTIVO_DE_INTERRUPCAO });
    expect((await obterTarefa(banco, ORGANIZACAO_INICIAL, pronta.id))?.estado).toBe("pronta");
    expect(await marcarInterrompidas(banco)).toBe(0);
  });
});

describe("Cenário 47 · persistência após reiniciar", () => {
  it("tarefa e itens continuam iguais depois de fechar e reabrir o banco em disco", async () => {
    const pasta = await mkdtemp(path.join(tmpdir(), "tendra-banco-"));
    try {
      let emDisco = await abrirBanco(path.join(pasta, "banco"));
      await carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta: path.join(RAIZ, "pulse-beneficios/base"), banco: emDisco, hoje: "2026-10-21", enviadoPor: null });
      api.respostas = [respondeImparesCitando];
      const contexto = { ...(await ambiente()), banco: emDisco };
      const tarefa = await criarTarefaComPlanilha(contexto, { organizacaoId: ORGANIZACAO_INICIAL, arquivo: "RFP-01-Rede-Varejo-Alfa.xlsx", planilha: new Uint8Array(await readFile(RFP)), dados: {} });
      await executarTarefa(contexto, tarefa);
      const antes = { tarefa: await obterTarefa(emDisco, ORGANIZACAO_INICIAL, tarefa.id), itens: await listarItens(emDisco, tarefa.id) };
      await emDisco.close();

      emDisco = await abrirBanco(path.join(pasta, "banco"));
      expect(await marcarInterrompidas(emDisco)).toBe(0);
      expect({ tarefa: await obterTarefa(emDisco, ORGANIZACAO_INICIAL, tarefa.id), itens: await listarItens(emDisco, tarefa.id) }).toEqual(antes);
      await emDisco.close();
    } finally {
      await rm(pasta, { recursive: true, force: true });
    }
  }, 120_000);
});
