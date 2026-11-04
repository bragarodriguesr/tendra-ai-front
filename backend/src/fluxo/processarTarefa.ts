import { MODELO_DE_CLASSIFICACAO_PADRAO, type ConfiguracaoDaIa } from "../config/config.ts";
import type { NomesDeCabecalho } from "../config/cabecalhos.ts";
import { identificarPerguntas, lerPlanilha, validarArquivoDePlanilha, type ModeloDeResposta, type Pergunta } from "../documentos/planilha.ts";
import { gerarPlanilhaPreenchida } from "../documentos/planilhaPreenchida.ts";
import { classificarAreas } from "../geracao/classificarAreas.ts";
import { AREA_GERAL } from "../regras/areas.ts";
import { marcarConflitos } from "../geracao/conflitos.ts";
import { gerarRespostas } from "../geracao/gerarRespostas.ts";
import { criarIdentificadorComIA } from "../geracao/identificarComIA.ts";
import type { ClienteDaIa } from "../ia/cliente.ts";
import { VERSOES_DAS_INSTRUCOES } from "../ia/instrucoes.ts";
import type { DuracaoDaEtapa, EtapaDaTarefa } from "../observabilidade/metricas.ts";
import type { Banco } from "../persistencia/banco.ts";
import type { RespostaGravada } from "../persistencia/tarefas.ts";
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
  /** Modelo da classificação por área (fase N). Ausente nas tarefas de antes da fase. */
  modeloDeClassificacao?: string;
  /** Instruções do processamento. A revisão de texto (cenário 65) é pedida depois, na tela, e não entra aqui. */
  instrucoes: Omit<typeof VERSOES_DAS_INSTRUCOES, "revisaoDeTexto" | "classificacao"> & { classificacao?: string };
}

export interface ResultadoDaTarefa {
  perguntas: Pergunta[];
  origemDasPerguntas: "regra" | "ia";
  modeloDeResposta: ModeloDeResposta | null;
  itens: ItemDaRevisao[];
  /** Área de cada item, na mesma ordem (fase N, cenário N2). */
  areas: string[];
  /** Perguntas em "Geral" por falha da classificação (cenário N3). */
  perguntasEmGeralPorFalha: number;
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
  /** Organização da tarefa: só a base dela vai à IA (cenário 71). */
  organizacaoId: string;
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
  /** Respostas gravadas antes de um reinício; só valem para a pergunta com o mesmo número e texto (etapa D8). */
  respostasGravadas?: RespostaGravada[];
  /** Chamado com as respostas de cada lote gerado, para gravá-las (etapa D8). */
  aoGerarLote?: (respostas: RespostaGravada[]) => void | Promise<void>;
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


  const fontes = await medir("contexto", () => buscarFontes({ banco: opcoes.banco, organizacaoId: opcoes.organizacaoId, cliente: opcoes.cliente, modelo: opcoes.ia.modelo, hoje: opcoes.hoje }));

  // Fase N (PN5): a área de cada pergunta, antes da geração; nunca falha a tarefa (PN6). Com a base
  // vazia, nada vai à IA (cenários 10 e 71): todas ficam em "Geral".
  const modeloDeClassificacao = opcoes.ia.modeloDeClassificacao ?? MODELO_DE_CLASSIFICACAO_PADRAO;
  const classificacao =
    fontes.tipo === "vazia"
      ? { areas: perguntas.map(() => AREA_GERAL), falhas: 0 }
      : await medir("classificacao", () => classificarAreas({ cliente: opcoes.cliente, modelo: modeloDeClassificacao, perguntas }));

  let checados: ItemChecado[];
  if (fontes.tipo === "vazia") {
    // Cenário 10: sem documento ativo, nenhuma chamada de geração.
    checados = await medir("checagem", () => perguntas.map((pergunta) => montarItem({ pergunta, resposta: null, contexto: null, hoje: opcoes.hoje })));
    await opcoes.aoProgredir?.(perguntas.length, perguntas.length);
  } else {
    const textoDe = new Map(perguntas.map((pergunta) => [pergunta.numero, pergunta.texto]));
    const jaGeradas = new Map(
      (opcoes.respostasGravadas ?? []).filter((gravada) => textoDe.get(gravada.numero) === gravada.texto).map((gravada) => [gravada.numero, gravada.resposta]),
    );
    const aoGerarLote = opcoes.aoGerarLote;
    const geracao = await medir("geracao", () =>
      gerarRespostas({
        cliente: opcoes.cliente,
        contexto: fontes.contexto,
        perguntas,
        ia: opcoes.ia,
        aoConcluirLote: opcoes.aoProgredir,
        jaGeradas,
        ...(aoGerarLote === undefined
          ? {}
          : { aoGerarLote: (respostas) => aoGerarLote(respostas.map((resposta) => ({ numero: resposta.numero, texto: textoDe.get(resposta.numero) ?? "", resposta }))) }),
      }),
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
    areas: classificacao.areas,
    perguntasEmGeralPorFalha: classificacao.falhas,
    checagens: checados.map(({ checagem }) => checagem),
    documentos: fontes.tipo === "vazia" ? [] : fontes.contexto.documentos.map((documento) => documento.nome),
    comportamento: {
      modelo: opcoes.ia.modelo,
      versaoDasInstrucoes: VERSOES_DAS_INSTRUCOES.geracao,
      tamanhoDoLote: opcoes.ia.tamanhoDoLote,
      esforco: opcoes.ia.esforco,
      modeloDeIdentificacao: opcoes.ia.modeloDeIdentificacao,
      modeloDeConflito: opcoes.ia.modeloDeConflito,
      modeloDeClassificacao,
      instrucoes: {
        geracao: VERSOES_DAS_INSTRUCOES.geracao,
        identificacao: VERSOES_DAS_INSTRUCOES.identificacao,
        conflito: VERSOES_DAS_INSTRUCOES.conflito,
        classificacao: VERSOES_DAS_INSTRUCOES.classificacao,
      },
    },
    etapas,
    planilhaPreenchida,
  };
}
