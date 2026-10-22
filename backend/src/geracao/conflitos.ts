import type { ClienteDaIa } from "../ia/cliente.ts";
import { ErroDaIa } from "../ia/cliente.ts";
import { lerInstrucoes } from "../ia/instrucoes.ts";
import type { ItemDaRevisao } from "../rastreabilidade/montarItem.ts";
import { ordenarAlertas } from "../regras/alertas.ts";

/**
 * Conflito entre fontes (etapa A8, cenário 22). A API não combina citações com saída estruturada,
 * por isso o conflito é apontado numa segunda chamada leve, que recebe só os trechos citados de
 * cada item. A IA aponta; o código decide: o alerta só vale para fontes que existem no item e que
 * vêm de pelo menos dois documentos diferentes.
 */

/** Itens por chamada de conflito. */
export const ITENS_POR_CHAMADA = 20;
const MAXIMO_DE_TOKENS = 16_000;

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["itens"],
  properties: {
    itens: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "conflito", "fontes"],
        properties: {
          id: { type: "string" },
          conflito: { type: "boolean" },
          fontes: { type: "array", items: { type: "integer" } },
        },
      },
    },
  },
} as const;

/** Só itens com rascunho e fontes de dois ou mais documentos podem ter conflito. */
export function podeTerConflito(item: ItemDaRevisao): boolean {
  return item.st === "sugerida" && new Set(item.srcs.map((fonte) => fonte.doc)).size >= 2;
}

const escapar = (texto: string) => texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function itensComoTexto(itens: ItemDaRevisao[]): string {
  const partes = ["<itens>"];
  for (const item of itens) {
    partes.push(`<item id="${escapar(item.id)}">`, `<pergunta>${escapar(item.q)}</pergunta>`);
    item.srcs.forEach((fonte, posicao) => partes.push(`<fonte indice="${posicao + 1}" documento="${escapar(fonte.doc)}">${escapar(fonte.ex)}</fonte>`));
    partes.push("</item>");
  }
  partes.push("</itens>");
  return partes.join("\n");
}

/**
 * Devolve os itens com o alerta `conflict` e as fontes conflitantes marcadas com `conflict: true`.
 * Itens sem fontes de documentos diferentes não vão à IA. Sem nenhum item elegível, nenhuma chamada.
 */
export async function marcarConflitos(opcoes: { cliente: ClienteDaIa; modelo: string; itens: ItemDaRevisao[] }): Promise<ItemDaRevisao[]> {
  const elegiveis = opcoes.itens.filter(podeTerConflito);
  if (elegiveis.length === 0) return opcoes.itens;

  const instrucoes = await lerInstrucoes("conflito");
  const apontados = new Map<string, number[]>();
  for (let inicio = 0; inicio < elegiveis.length; inicio += ITENS_POR_CHAMADA) {
    const lote = elegiveis.slice(inicio, inicio + ITENS_POR_CHAMADA);
    const mensagem = await opcoes.cliente.gerar({
      etapa: "conflito",
      documentos: [...new Set(lote.flatMap((item) => item.srcs.map((fonte) => fonte.doc)))],
      perguntas: lote.map((item) => Number(item.id.slice(1))),
      parametros: {
        model: opcoes.modelo,
        max_tokens: MAXIMO_DE_TOKENS,
        output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA } },
        system: [{ type: "text", text: instrucoes.texto }],
        messages: [{ role: "user", content: [{ type: "text", text: itensComoTexto(lote) }] }],
      },
    });
    const texto = mensagem.content.flatMap((bloco) => (bloco.type === "text" ? [bloco.text] : [])).join("");
    for (const { id, fontes } of lerApontamentos(texto)) apontados.set(id, fontes);
  }

  return opcoes.itens.map((item) => {
    const fontes = podeTerConflito(item) ? (apontados.get(item.id) ?? []) : [];
    const validas = [...new Set(fontes)].filter((indice) => Number.isInteger(indice) && indice >= 1 && indice <= item.srcs.length);
    if (new Set(validas.map((indice) => item.srcs[indice - 1]?.doc)).size < 2) return item;
    return {
      ...item,
      srcs: item.srcs.map((fonte, posicao) => (validas.includes(posicao + 1) ? { ...fonte, conflict: true } : fonte)),
      alerts: ordenarAlertas([...item.alerts, { t: "conflict" }]),
    };
  });
}

/** Itens com conflito apontado. Formato inesperado é falha da IA, como nas outras etapas. */
function lerApontamentos(texto: string): { id: string; fontes: number[] }[] {
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new ErroDaIa("resposta_invalida");
  }
  const itens = (dados as { itens?: unknown }).itens;
  if (!Array.isArray(itens)) throw new ErroDaIa("resposta_invalida");
  return itens.flatMap((item: unknown) => {
    if (typeof item !== "object" || item === null) return [];
    const { id, conflito, fontes } = item as { id?: unknown; conflito?: unknown; fontes?: unknown };
    if (typeof id !== "string" || conflito !== true || !Array.isArray(fontes)) return [];
    return [{ id, fontes: fontes.filter((fonte): fonte is number => typeof fonte === "number") }];
  });
}
