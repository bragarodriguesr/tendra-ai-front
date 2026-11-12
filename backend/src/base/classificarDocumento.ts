import type { ClienteDaIa } from "../ia/cliente.ts";
import { ErroDaIa } from "../ia/cliente.ts";
import { lerInstrucoes } from "../ia/instrucoes.ts";
import { AREA_GERAL, areaDoItem, AREAS_DOS_ITENS } from "../regras/areas.ts";
import type { Bloco } from "./blocos.ts";
import { estimarTokens } from "./carga.ts";

/**
 * Classificação de um documento da base por área (fase U, PU1 a PU4, cenários U1 a U4): uma chamada
 * a um modelo pequeno com o título, o tipo, os títulos das seções e o início do texto, até 4 mil
 * tokens estimados (PU3). Saída estruturada, limitada às áreas das perguntas e a "Geral". Nunca
 * lança por causa da IA: erro, resposta ilegível ou nenhuma área válida dão `falhou`, e quem chama
 * deixa o documento em "Geral" (PU4).
 */

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["areas"],
  properties: { areas: { type: "array", items: { type: "string", enum: [...AREAS_DOS_ITENS] } } },
} as const;

/** Tamanho máximo do texto enviado (PU3). */
export const MAXIMO_DE_TOKENS_DO_TEXTO = 4_000;
const MAXIMO_DE_TOKENS_DA_SAIDA = 1_000;

export interface DocumentoParaClassificacao {
  nome: string;
  titulo: string;
  tipo: "documento" | "rfp-passada";
  blocos: Pick<Bloco, "caminhoDeSecoes" | "texto">[];
}

export type ResultadoDaClassificacaoDoDocumento = { falhou: false; areas: string[] } | { falhou: true };

/** Entrada da IA: os títulos das seções, sem repetição, e os blocos do início até o limite de tokens. */
export function entradaDaClassificacao(documento: DocumentoParaClassificacao): string {
  const secoes: string[] = [];
  for (const bloco of documento.blocos) {
    const secao = bloco.caminhoDeSecoes.join(" > ");
    if (secao !== "" && !secoes.includes(secao)) secoes.push(secao);
  }
  const textos: string[] = [];
  let tokens = 0;
  for (const bloco of documento.blocos) {
    const custo = estimarTokens(bloco.texto) + 1;
    if (tokens + custo > MAXIMO_DE_TOKENS_DO_TEXTO) {
      if (textos.length === 0) textos.push(bloco.texto.slice(0, MAXIMO_DE_TOKENS_DO_TEXTO * 4));
      break;
    }
    textos.push(bloco.texto);
    tokens += custo;
  }
  return [
    "<documento>",
    `Título: ${documento.titulo}`,
    `Tipo: ${documento.tipo === "rfp-passada" ? "RFP passada" : "documento"}`,
    "Seções:",
    ...secoes.map((secao) => `- ${secao}`),
    "Início do texto:",
    textos.join("\n\n"),
    "</documento>",
  ].join("\n");
}

/** Áreas válidas, sem repetição, na ordem da lista; "Geral" só quando sozinha (cenário U2). Vazia quando nada vale. */
export function normalizarAreas(recebidas: readonly unknown[]): string[] {
  const validas = new Set<string>();
  for (const recebida of recebidas) {
    if (typeof recebida !== "string") continue;
    const area = areaDoItem(recebida);
    if (area !== null) validas.add(area);
  }
  const especificas = AREAS_DOS_ITENS.filter((area) => area !== AREA_GERAL && validas.has(area));
  if (especificas.length > 0) return especificas;
  return validas.has(AREA_GERAL) ? [AREA_GERAL] : [];
}

export async function classificarDocumento(opcoes: { cliente: ClienteDaIa; modelo: string; documento: DocumentoParaClassificacao }): Promise<ResultadoDaClassificacaoDoDocumento> {
  const instrucoes = await lerInstrucoes("classificacaoDocumento");
  let texto: string;
  try {
    const mensagem = await opcoes.cliente.gerar({
      etapa: "classificacao-documento",
      documentos: [opcoes.documento.nome],
      perguntas: [],
      parametros: {
        model: opcoes.modelo,
        max_tokens: MAXIMO_DE_TOKENS_DA_SAIDA,
        output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA } },
        system: [{ type: "text", text: instrucoes.texto }],
        messages: [{ role: "user", content: [{ type: "text", text: entradaDaClassificacao(opcoes.documento) }] }],
      },
    });
    texto = mensagem.content.flatMap((bloco) => (bloco.type === "text" ? [bloco.text] : [])).join("");
  } catch (erro) {
    if (!(erro instanceof ErroDaIa)) throw erro;
    return { falhou: true };
  }
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    return { falhou: true };
  }
  const recebidas = (dados as { areas?: unknown } | null)?.areas;
  const areas = Array.isArray(recebidas) ? normalizarAreas(recebidas) : [];
  return areas.length === 0 ? { falhou: true } : { falhou: false, areas };
}
