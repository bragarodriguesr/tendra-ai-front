import type { ClienteDaIa } from "../ia/cliente.ts";
import { ErroDaIa } from "../ia/cliente.ts";
import { lerInstrucoes } from "../ia/instrucoes.ts";
import { AREA_GERAL, areaDoItem, AREAS_DOS_ITENS } from "../regras/areas.ts";
import { formatarPerguntas, type PerguntaParaGerar } from "./gerarRespostas.ts";

/**
 * Classificação das perguntas por área (fase N, PN5, cenários N2 a N4): uma chamada a um modelo
 * pequeno por lote, só com o texto das perguntas, depois da identificação e antes da geração. A
 * saída é estruturada ({numero, area}) e limitada à lista de áreas. Nunca falha a tarefa (PN6):
 * lote com erro da IA, pergunta sem classificação ou área fora da lista ficam em "Geral" e entram
 * na contagem de `falhas`.
 */

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
        required: ["numero", "area"],
        properties: { numero: { type: "integer" }, area: { type: "string", enum: [...AREAS_DOS_ITENS] } },
      },
    },
  },
} as const;

const TAMANHO_DO_LOTE = 100;
const MAXIMO_DE_TOKENS = 8_000;

export interface ResultadoDaClassificacao {
  /** Área de cada pergunta, na ordem recebida. */
  areas: string[];
  /** Perguntas que ficaram em "Geral" por falha da classificação (não por escolha da IA). */
  falhas: number;
}

export async function classificarAreas(opcoes: { cliente: ClienteDaIa; modelo: string; perguntas: PerguntaParaGerar[] }): Promise<ResultadoDaClassificacao> {
  const instrucoes = await lerInstrucoes("classificacao");
  const areaDe = new Map<number, string>();
  let falhas = 0;
  for (let inicio = 0; inicio < opcoes.perguntas.length; inicio += TAMANHO_DO_LOTE) {
    const lote = opcoes.perguntas.slice(inicio, inicio + TAMANHO_DO_LOTE);
    let classificadas: Map<number, string>;
    try {
      const mensagem = await opcoes.cliente.gerar({
        etapa: "classificacao",
        documentos: [],
        perguntas: lote.map((pergunta) => pergunta.numero),
        parametros: {
          model: opcoes.modelo,
          max_tokens: MAXIMO_DE_TOKENS,
          output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA } },
          system: [{ type: "text", text: instrucoes.texto }],
          messages: [{ role: "user", content: [{ type: "text", text: formatarPerguntas(lote) }] }],
        },
      });
      classificadas = lerClassificacao(mensagem.content.flatMap((bloco) => (bloco.type === "text" ? [bloco.text] : [])).join(""));
    } catch (erro) {
      if (!(erro instanceof ErroDaIa)) throw erro;
      classificadas = new Map();
    }
    for (const pergunta of lote) {
      const area = classificadas.get(pergunta.numero);
      if (area === undefined) falhas++;
      areaDe.set(pergunta.numero, area ?? AREA_GERAL);
    }
  }
  return { areas: opcoes.perguntas.map((pergunta) => areaDe.get(pergunta.numero) ?? AREA_GERAL), falhas };
}

/** Número → área válida. Resposta ilegível vira mapa vazio; área fora da lista é ignorada. */
function lerClassificacao(texto: string): Map<number, string> {
  const resultado = new Map<number, string>();
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    return resultado;
  }
  const itens = (dados as { itens?: unknown }).itens;
  if (!Array.isArray(itens)) return resultado;
  for (const item of itens) {
    if (typeof item !== "object" || item === null || !Number.isInteger(item.numero) || typeof item.area !== "string") continue;
    const area = areaDoItem(item.area);
    if (area !== null && !resultado.has(item.numero)) resultado.set(item.numero, area);
  }
  return resultado;
}
