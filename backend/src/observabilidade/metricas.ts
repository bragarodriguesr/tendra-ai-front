import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ErroDeConfiguracao } from "../config/config.ts";
import type { EntradaDoRegistro } from "../ia/cliente.ts";
import type { ChecagemDoItem, ItemDaRevisao, TipoDeAlerta } from "../rastreabilidade/montarItem.ts";

/**
 * Métricas de uma tarefa (etapa A9, cenário 37): duração por etapa, requisições, tokens, custo
 * estimado, descartes da checagem e contagem de itens por estado e por alerta. Só números e nomes
 * de etapa: nada de conteúdo de documentos nem texto de respostas.
 */

export const ETAPAS_DA_TAREFA = ["planilha", "identificacao", "classificacao", "contexto", "geracao", "checagem", "conflito", "alertas", "planilhaPreenchida"] as const;
export type EtapaDaTarefa = (typeof ETAPAS_DA_TAREFA)[number];

export interface DuracaoDaEtapa {
  etapa: EtapaDaTarefa;
  duracaoMs: number;
}

/** Preço em US$ por milhão de tokens. */
export interface PrecoDoModelo {
  entrada: number;
  saida: number;
  cacheLido: number;
  cacheGravado: number;
}

export type TabelaDePrecos = Record<string, PrecoDoModelo>;

const ARQUIVO_DE_PRECOS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../config/precos.json");

export async function carregarPrecos(arquivo = ARQUIVO_DE_PRECOS): Promise<TabelaDePrecos> {
  const conteudo = JSON.parse(await readFile(arquivo, "utf8")) as { modelos?: unknown };
  const modelos = conteudo.modelos;
  const valido = (preco: unknown) =>
    typeof preco === "object" &&
    preco !== null &&
    (["entrada", "saida", "cacheLido", "cacheGravado"] as const).every((campo) => {
      const valor = (preco as Record<string, unknown>)[campo];
      return typeof valor === "number" && valor >= 0;
    });
  if (typeof modelos !== "object" || modelos === null || !Object.values(modelos).every(valido)) {
    throw new ErroDeConfiguracao(`${path.basename(arquivo)}: cada modelo precisa de entrada, saida, cacheLido e cacheGravado em US$ por milhão.`);
  }
  return modelos as TabelaDePrecos;
}

export interface MetricasDaTarefa {
  duracaoTotalMs: number;
  duracaoPorEtapa: Partial<Record<EtapaDaTarefa, number>>;
  requisicoes: { total: number; comErro: number; porEtapa: Partial<Record<EntradaDoRegistro["etapa"], number>> };
  /** Tokens cobrados (a contagem de tokens não é cobrada e fica à parte). */
  tokens: { entrada: number; saida: number; lidosDoCache: number; gravadosNoCache: number };
  tokensDaBaseContados: number;
  /** Custo estimado em US$; null quando algum modelo usado não está na tabela de preços. */
  custoEstimadoUsd: number | null;
  modelosSemPreco: string[];
  itens: number;
  itensPorEstado: Partial<Record<ItemDaRevisao["st"], number>>;
  itensPorAlerta: Partial<Record<TipoDeAlerta, number>>;
  /** O que a checagem descartou ou não encontrou. */
  ignorados: { citacoesDescartadas: number; trechosSemFonte: number; perguntasSemMarcador: number };
  /** Perguntas que ficaram em "Geral" por falha da classificação (fase N, cenário N3). Ausente nas tarefas de antes da fase. */
  perguntasEmGeralPorFalha?: number;
}

export function calcularMetricas(entrada: {
  registro: EntradaDoRegistro[];
  itens: ItemDaRevisao[];
  checagens: ChecagemDoItem[];
  etapas: DuracaoDaEtapa[];
  precos: TabelaDePrecos;
}): MetricasDaTarefa {
  const somar = <T extends string>(chaves: T[]) =>
    chaves.reduce<Partial<Record<T, number>>>((contagem, chave) => ({ ...contagem, [chave]: (contagem[chave] ?? 0) + 1 }), {});

  const cobradas = entrada.registro.filter((requisicao) => requisicao.etapa !== "contagem");
  const tokens = { entrada: 0, saida: 0, lidosDoCache: 0, gravadosNoCache: 0 };
  let custo = 0;
  const semPreco = new Set<string>();
  for (const requisicao of cobradas) {
    if (requisicao.tokens === null) continue;
    tokens.entrada += requisicao.tokens.entrada;
    tokens.saida += requisicao.tokens.saida;
    tokens.lidosDoCache += requisicao.tokens.lidosDoCache;
    tokens.gravadosNoCache += requisicao.tokens.gravadosNoCache;
    const preco = entrada.precos[requisicao.modelo];
    if (preco === undefined) {
      semPreco.add(requisicao.modelo);
      continue;
    }
    custo +=
      (requisicao.tokens.entrada * preco.entrada +
        requisicao.tokens.saida * preco.saida +
        requisicao.tokens.lidosDoCache * preco.cacheLido +
        requisicao.tokens.gravadosNoCache * preco.cacheGravado) /
      1_000_000;
  }

  const duracaoPorEtapa: MetricasDaTarefa["duracaoPorEtapa"] = {};
  for (const { etapa, duracaoMs } of entrada.etapas) duracaoPorEtapa[etapa] = (duracaoPorEtapa[etapa] ?? 0) + duracaoMs;

  return {
    duracaoTotalMs: entrada.etapas.reduce((soma, { duracaoMs }) => soma + duracaoMs, 0),
    duracaoPorEtapa,
    requisicoes: {
      total: entrada.registro.length,
      comErro: entrada.registro.filter((requisicao) => requisicao.resultado === "erro").length,
      porEtapa: somar(entrada.registro.map((requisicao) => requisicao.etapa)),
    },
    tokens,
    tokensDaBaseContados: entrada.registro
      .filter((requisicao) => requisicao.etapa === "contagem")
      .reduce((soma, requisicao) => soma + (requisicao.tokens?.entrada ?? 0), 0),
    custoEstimadoUsd: semPreco.size > 0 ? null : Math.round(custo * 10_000) / 10_000,
    modelosSemPreco: [...semPreco].sort(),
    itens: entrada.itens.length,
    itensPorEstado: somar(entrada.itens.map((item) => item.st)),
    itensPorAlerta: somar(entrada.itens.flatMap((item) => item.alerts.map((alerta) => alerta.t))),
    ignorados: {
      citacoesDescartadas: entrada.checagens.reduce((soma, checagem) => soma + checagem.citacoesDescartadas, 0),
      trechosSemFonte: entrada.checagens.reduce((soma, checagem) => soma + checagem.trechosSemFonte, 0),
      perguntasSemMarcador: entrada.checagens.filter((checagem) => checagem.semMarcador).length,
    },
  };
}
