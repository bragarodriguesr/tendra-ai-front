import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { criarArmazenamento } from "../../src/armazenamento/armazenamento.ts";
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
import { lerRespostasGeradas, listarItens, listarRequisicoes, marcarInterrompidas, obterTarefa } from "../../src/persistencia/tarefas.ts";
import { ApiSimulada } from "../apoio/apiSimulada.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import { numerosDoPedido, respondeImparesCitando } from "../apoio/respostasSimuladas.ts";

/** Etapa D8 · retomada depois de um reinício (cenário D15), com a API simulada. */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const RFP = path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-sonnet-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };

/** API que para de responder na chamada indicada, como um processo que caiu no meio do lote. */
class ApiQueCai extends ApiSimulada {
  readonly chamadaQueTrava: number;

  constructor(chamadaQueTrava: number) {
    super();
    this.chamadaQueTrava = chamadaQueTrava;
    this.respostas = [respondeImparesCitando];
  }

  override async gerar(parametros: ParametrosDaGeracao): Promise<MensagemDaIa> {
    if (this.geracoes.length + 1 === this.chamadaQueTrava) {
      this.geracoes.push(parametros);
      return new Promise<MensagemDaIa>(() => undefined);
    }
    return super.gerar(parametros);
  }
}

let banco: Banco;
let pastaDados: string;

async function ambiente(api: ApiSimulada) {
  return {
    banco,
    armazenamento: criarArmazenamento(pastaDados),
    api,
    ia: IA,
    nomesDeCabecalho: await carregarCabecalhos(),
    termosCriticos: await carregarTermosCriticos(),
    precos: await carregarPrecos(),
    pessoas: await carregarPessoas(),
    hoje: () => "2026-10-21",
  };
}

async function novaTarefa(api: ApiSimulada) {
  return criarTarefaComPlanilha(await ambiente(api), { organizacaoId: ORGANIZACAO_INICIAL, arquivo: "RFP-01.xlsx", planilha: new Uint8Array(await readFile(RFP)), dados: {} });
}

/** Começa a tarefa e espera ela travar no 3º lote, com 2 lotes (20 perguntas) gravados. */
async function tarefaInterrompida() {
  const api = new ApiQueCai(3);
  const tarefa = await novaTarefa(api);
  void executarTarefa(await ambiente(api), tarefa);
  await vi.waitUntil(async () => api.geracoes.length === 3 && (await lerRespostasGeradas(banco, tarefa.id)).length === 20, { timeout: 20_000 });
  return { tarefa, api };
}

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-retomada-"));
  await carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
}, 60_000);

afterAll(async () => {
  await banco.close();
  await rm(pastaDados, { recursive: true, force: true });
});

describe("Cenário D15 · retomada após reinício", () => {
  it("retoma do lote que faltava, sem gerar de novo os lotes gravados nem duplicar itens", async () => {
    const { tarefa } = await tarefaInterrompida();
    const antes = await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefa.id);
    expect(antes).toMatchObject({ estado: "processando", processadas: 20, total: 46 });
    const requisicoesAntes = await listarRequisicoes(banco, tarefa.id);
    expect(requisicoesAntes.map((entrada) => entrada.etapa)).toEqual(["contagem", "classificacao", "geracao", "geracao"]);

    // Reinício: outro servidor sobre o mesmo banco, com a retomada ligada.
    const api = new ApiSimulada();
    api.respostas = [respondeImparesCitando];
    let terminou: () => void = () => undefined;
    const fim = new Promise<void>((resolver) => (terminou = resolver));
    const servidor = criarServidor({ banco, tarefas: { ...(await ambiente(api)), retomarInterrompidas: true, aoTerminarTarefa: () => terminou() } });
    await servidor.ready();
    await fim;
    await servidor.close();

    const depois = await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefa.id);
    expect(depois).toMatchObject({ estado: "pronta", processadas: 46, total: 46 });
    const lotesGerados = api.geracoes.map(numerosDoPedido).filter((numeros) => numeros.length > 0);
    expect(lotesGerados[0]?.[0]).toBe(21);
    expect(lotesGerados.flat().filter((numero) => numero <= 20)).toEqual([]);

    const itens = await listarItens(banco, tarefa.id);
    expect(itens.map((item) => item.numero)).toEqual(Array.from({ length: 46 }, (_, posicao) => posicao + 1));
    expect(await lerRespostasGeradas(banco, tarefa.id)).toEqual([]);

    const requisicoes = await listarRequisicoes(banco, tarefa.id);
    expect(requisicoes.slice(0, 4)).toEqual(requisicoesAntes);
    expect(depois?.metricas).toMatchObject({ requisicoes: { total: requisicoes.length } });

    // Os itens são os mesmos de uma execução sem interrupção.
    const semInterrupcao = new ApiSimulada();
    semInterrupcao.respostas = [respondeImparesCitando];
    const inteira = await novaTarefa(semInterrupcao);
    await executarTarefa(await ambiente(semInterrupcao), inteira);
    const semId = (lista: Awaited<ReturnType<typeof listarItens>>) => lista.map(({ numero, q, paras, srcs, alerts, st }) => ({ numero, q, paras, srcs, alerts, st }));
    expect(semId(itens)).toEqual(semId(await listarItens(banco, inteira.id)));
  }, 60_000);

  it("no modo local (cenário 32), a tarefa interrompida vira falha e as respostas gravadas são descartadas", async () => {
    const { tarefa } = await tarefaInterrompida();
    expect(await marcarInterrompidas(banco)).toBe(1);
    expect(await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefa.id)).toMatchObject({ estado: "falha" });
    expect(await lerRespostasGeradas(banco, tarefa.id)).toEqual([]);
  }, 60_000);
});
