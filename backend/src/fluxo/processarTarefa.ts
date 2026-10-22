import type { ConfiguracaoDaIa } from "../config/config.ts";
import type { NomesDeCabecalho } from "../config/cabecalhos.ts";
import { identificarPerguntas, lerPlanilha, validarArquivoDePlanilha, type ModeloDeResposta, type Pergunta } from "../documentos/planilha.ts";
import { gerarPlanilhaPreenchida } from "../documentos/planilhaPreenchida.ts";
import { gerarRespostas } from "../geracao/gerarRespostas.ts";
import { criarIdentificadorComIA } from "../geracao/identificarComIA.ts";
import type { ClienteDaIa } from "../ia/cliente.ts";
import { VERSOES_DAS_INSTRUCOES } from "../ia/instrucoes.ts";
import type { Banco } from "../persistencia/banco.ts";
import { montarItem, type ChecagemDoItem, type ItemDaRevisao } from "../rastreabilidade/montarItem.ts";
import { buscarFontes } from "../recuperacao/buscarFontes.ts";

/**
 * Processamento de uma tarefa (fluxo fixo, sem agente): valida e lê a planilha, identifica as
 * perguntas, monta o contexto da base, gera em lotes, checa as fontes e produz os itens e a
 * planilha preenchida. Qualquer falha interrompe tudo: o chamador marca a tarefa como `falha`
 * e nada parcial é apresentado (cenário 17).
 */

export interface ComportamentoDaTarefa {
  modelo: string;
  versaoDasInstrucoes: string;
  tamanhoDoLote: number;
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
  planilhaPreenchida: Uint8Array;
}

export interface OpcoesDaTarefa {
  banco: Banco;
  cliente: ClienteDaIa;
  ia: ConfiguracaoDaIa;
  nomesDeCabecalho: NomesDeCabecalho;
  /** Data do backend (AAAA-MM-DD), usada na idade das fontes. */
  hoje: string;
  nomeDoArquivo: string;
  planilha: Uint8Array;
  aoProgredir?: (processadas: number, total: number) => void | Promise<void>;
}

export async function processarTarefa(opcoes: OpcoesDaTarefa): Promise<ResultadoDaTarefa> {
  validarArquivoDePlanilha(opcoes.nomeDoArquivo, opcoes.planilha);
  const identificacao = await identificarPerguntas(await lerPlanilha(opcoes.planilha), {
    nomes: opcoes.nomesDeCabecalho,
    identificadorComIA: criarIdentificadorComIA(opcoes.cliente, opcoes.ia.modeloDeIdentificacao),
  });
  const perguntas = identificacao.perguntas.map((pergunta, posicao) => ({ numero: posicao + 1, texto: pergunta.texto }));
  await opcoes.aoProgredir?.(0, perguntas.length);

  const fontes = await buscarFontes({ banco: opcoes.banco, cliente: opcoes.cliente, modelo: opcoes.ia.modelo });
  const comportamento: ComportamentoDaTarefa = {
    modelo: opcoes.ia.modelo,
    versaoDasInstrucoes: VERSOES_DAS_INSTRUCOES.geracao,
    tamanhoDoLote: opcoes.ia.tamanhoDoLote,
  };

  let checados;
  if (fontes.tipo === "vazia") {
    // Cenário 10: sem documento ativo, nenhuma chamada de geração.
    checados = perguntas.map((pergunta) => montarItem({ pergunta, resposta: null, contexto: null, hoje: opcoes.hoje }));
    await opcoes.aoProgredir?.(perguntas.length, perguntas.length);
  } else {
    const geracao = await gerarRespostas({
      cliente: opcoes.cliente,
      contexto: fontes.contexto,
      perguntas,
      ia: opcoes.ia,
      aoConcluirLote: opcoes.aoProgredir,
    });
    checados = perguntas.map((pergunta, posicao) =>
      montarItem({ pergunta, resposta: geracao.respostas[posicao] ?? null, contexto: fontes.contexto, hoje: opcoes.hoje }),
    );
  }

  const itens = checados.map(({ item }) => item);
  return {
    perguntas: identificacao.perguntas,
    origemDasPerguntas: identificacao.origem,
    modeloDeResposta: identificacao.modelo,
    itens,
    checagens: checados.map(({ checagem }) => checagem),
    documentos: fontes.tipo === "vazia" ? [] : fontes.contexto.documentos.map((documento) => documento.nome),
    comportamento,
    planilhaPreenchida: await gerarPlanilhaPreenchida(opcoes.planilha, identificacao.perguntas, itens),
  };
}
