import type { ConfiguracaoDaIa } from "../config/config.ts";
import type { NomesDeCabecalho } from "../config/cabecalhos.ts";
import { identificarPerguntas, lerPlanilha, validarArquivoDePlanilha, type ModeloDeResposta, type Pergunta } from "../documentos/planilha.ts";
import { gerarPlanilhaPreenchida } from "../documentos/planilhaPreenchida.ts";
import { marcarConflitos } from "../geracao/conflitos.ts";
import { gerarRespostas } from "../geracao/gerarRespostas.ts";
import { criarIdentificadorComIA } from "../geracao/identificarComIA.ts";
import type { ClienteDaIa } from "../ia/cliente.ts";
import { VERSOES_DAS_INSTRUCOES } from "../ia/instrucoes.ts";
import type { DuracaoDaEtapa, EtapaDaTarefa } from "../observabilidade/metricas.ts";
import type { Banco } from "../persistencia/banco.ts";
import { montarItem, type ChecagemDoItem, type ItemChecado, type ItemDaRevisao } from "../rastreabilidade/montarItem.ts";
import { buscarFontes } from "../recuperacao/buscarFontes.ts";
import { aplicarAlertasDeterministicos } from "../regras/alertas.ts";

/**
 * Processamento de uma tarefa (fluxo fixo, sem agente): valida e lê a planilha, identifica as
 * perguntas, monta o contexto da base, gera em lotes, checa as fontes, aponta conflitos, aplica
 * os alertas determinísticos e produz os itens e a planilha preenchida. Qualquer falha interrompe
 * tudo: o chamador marca a tarefa como `falha` e nada parcial é apresentado (cenário 17).
 */

/** O que gerou as respostas, registrado em cada tarefa (cenário 38). */
export interface ComportamentoDaTarefa {
  modelo: string;
  versaoDasInstrucoes: string;
  tamanhoDoLote: number;
  esforco: ConfiguracaoDaIa["esforco"];
  modeloDeIdentificacao: string;
  modeloDeConflito: string;
  instrucoes: typeof VERSOES_DAS_INSTRUCOES;
}

export interface ResultadoDaTarefa {
  perguntas: Pergunta[];
  origemDasPerguntas: "regra" | "ia";
  modeloDeResposta: ModeloDeResposta | null;
  itens: ItemDaRevisao[];
  checagens: ChecagemDoItem[];
  /** Nomes dos documentos usados como contexto; vazio quando a base não tinha documento ativo. */
  documentos: string[];
  comportamento: ComportamentoDaTarefa;
  /** Duração de cada etapa, para as métricas (cenário 37). */
  etapas: DuracaoDaEtapa[];
  planilhaPreenchida: Uint8Array;
}

export interface OpcoesDaTarefa {
  banco: Banco;
  cliente: ClienteDaIa;
  ia: ConfiguracaoDaIa;
  nomesDeCabecalho: NomesDeCabecalho;
  /** Lista de termos críticos da configuração (cenário 21). */
  termosCriticos: string[];
  /** Data do backend (AAAA-MM-DD), usada na idade das fontes. */
  hoje: string;
  nomeDoArquivo: string;
  planilha: Uint8Array;
  aoProgredir?: (processadas: number, total: number) => void | Promise<void>;
  /** Relógio em milissegundos; nos testes, um relógio controlado. */
  agora?: () => number;
}

export async function processarTarefa(opcoes: OpcoesDaTarefa): Promise<ResultadoDaTarefa> {
  const agora = opcoes.agora ?? (() => performance.now());
  const etapas: DuracaoDaEtapa[] = [];
  const medir = async <T>(etapa: EtapaDaTarefa, passo: () => Promise<T> | T): Promise<T> => {
    const inicio = agora();
    try {
      return await passo();
    } finally {
      etapas.push({ etapa, duracaoMs: Math.round(agora() - inicio) });
    }
  };

  const planilha = await medir("planilha", () => {
    validarArquivoDePlanilha(opcoes.nomeDoArquivo, opcoes.planilha);
    return lerPlanilha(opcoes.planilha);
  });
  const identificacao = await medir("identificacao", () =>
    identificarPerguntas(planilha, {
      nomes: opcoes.nomesDeCabecalho,
      identificadorComIA: criarIdentificadorComIA(opcoes.cliente, opcoes.ia.modeloDeIdentificacao),
    }),
  );
  const perguntas = identificacao.perguntas.map((pergunta, posicao) => ({ numero: posicao + 1, texto: pergunta.texto }));
  await opcoes.aoProgredir?.(0, perguntas.length);

  const fontes = await medir("contexto", () => buscarFontes({ banco: opcoes.banco, cliente: opcoes.cliente, modelo: opcoes.ia.modelo }));

  let checados: ItemChecado[];
  if (fontes.tipo === "vazia") {
    // Cenário 10: sem documento ativo, nenhuma chamada de geração.
    checados = await medir("checagem", () => perguntas.map((pergunta) => montarItem({ pergunta, resposta: null, contexto: null, hoje: opcoes.hoje })));
    await opcoes.aoProgredir?.(perguntas.length, perguntas.length);
  } else {
    const geracao = await medir("geracao", () =>
      gerarRespostas({ cliente: opcoes.cliente, contexto: fontes.contexto, perguntas, ia: opcoes.ia, aoConcluirLote: opcoes.aoProgredir }),
    );
    checados = await medir("checagem", () =>
      perguntas.map((pergunta, posicao) =>
        montarItem({ pergunta, resposta: geracao.respostas[posicao] ?? null, contexto: fontes.contexto, hoje: opcoes.hoje }),
      ),
    );
  }

  let itens = checados.map(({ item }) => item);
  if (fontes.tipo === "base") {
    const comFontes = itens;
    itens = await medir("conflito", () => marcarConflitos({ cliente: opcoes.cliente, modelo: opcoes.ia.modeloDeConflito, itens: comFontes }));
  }
  const comConflitos = itens;
  itens = await medir("alertas", () => comConflitos.map((item) => aplicarAlertasDeterministicos(item, opcoes.termosCriticos)));
  const finais = itens;
  const planilhaPreenchida = await medir("planilhaPreenchida", () => gerarPlanilhaPreenchida(opcoes.planilha, identificacao.perguntas, finais));

  return {
    perguntas: identificacao.perguntas,
    origemDasPerguntas: identificacao.origem,
    modeloDeResposta: identificacao.modelo,
    itens: finais,
    checagens: checados.map(({ checagem }) => checagem),
    documentos: fontes.tipo === "vazia" ? [] : fontes.contexto.documentos.map((documento) => documento.nome),
    comportamento: {
      modelo: opcoes.ia.modelo,
      versaoDasInstrucoes: VERSOES_DAS_INSTRUCOES.geracao,
      tamanhoDoLote: opcoes.ia.tamanhoDoLote,
      esforco: opcoes.ia.esforco,
      modeloDeIdentificacao: opcoes.ia.modeloDeIdentificacao,
      modeloDeConflito: opcoes.ia.modeloDeConflito,
      instrucoes: VERSOES_DAS_INSTRUCOES,
    },
    etapas,
    planilhaPreenchida,
  };
}
