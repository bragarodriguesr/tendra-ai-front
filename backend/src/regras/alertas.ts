import type { ItemDaRevisao, TipoDeAlerta } from "../rastreabilidade/montarItem.ts";

/**
 * Alertas determinísticos (etapa A7): fonte desatualizada a partir de `atualizado_em` (cenário 20)
 * e termo crítico na pergunta a partir da lista de configuração (cenário 21). Lógica de código,
 * sem IA (constitution II).
 */

/** Prazo de aging em vigor: fonte com mais de 120 dias desde `atualizado_em` gera o alerta `old`. */
export const PRAZO_DE_AGING_EM_DIAS = 120;

/** Ordem de exibição dos alertas no item. */
const ORDEM: TipoDeAlerta[] = ["critical", "conflict", "nocontext", "lowconf", "old"];

/** Minúsculas, sem acentos, só letras e números separados por um espaço. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Formas aceitas do termo: a palavra inteira, o plural com "s" e o plural de "-ção" ("indenizações"). */
function formas(termo: string): string[] {
  const normalizado = normalizarTexto(termo);
  return [...new Set([normalizado, `${normalizado}s`, normalizado.replace(/cao$/, "coes")])];
}

/**
 * Procura os termos como palavras inteiras, sem diferenciar maiúsculas, minúsculas nem acentos.
 * "seguro" não marca "segurança"; "multas" marca "multa".
 */
export function termosCriticosNaPergunta(pergunta: string, termos: string[]): string[] {
  const texto = ` ${normalizarTexto(pergunta)} `;
  return termos.filter((termo) => formas(termo).some((forma) => forma !== "" && texto.includes(` ${forma} `)));
}

export function ordenarAlertas(alertas: ItemDaRevisao["alerts"]): ItemDaRevisao["alerts"] {
  const unicos = [...new Set(alertas.map((alerta) => alerta.t))];
  return unicos.sort((a, b) => ORDEM.indexOf(a) - ORDEM.indexOf(b)).map((t) => ({ t }));
}

/**
 * Acrescenta `old` quando alguma fonte do item passa do prazo de aging e `critical` quando a
 * pergunta tem um termo crítico, inclusive em itens sem rascunho.
 */
export function aplicarAlertasDeterministicos(item: ItemDaRevisao, termos: string[]): ItemDaRevisao {
  const alertas = [...item.alerts];
  if (item.srcs.some((fonte) => fonte.age > PRAZO_DE_AGING_EM_DIAS)) alertas.push({ t: "old" });
  if (termosCriticosNaPergunta(item.q, termos).length > 0) alertas.push({ t: "critical" });
  return { ...item, alerts: ordenarAlertas(alertas) };
}
