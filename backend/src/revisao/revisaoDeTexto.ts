import { ErroDaIa, type ClienteDaIa } from "../ia/cliente.ts";
import { lerInstrucoes } from "../ia/instrucoes.ts";

/**
 * "Revisar com IA" (cenário 65): revisão só da redação de uma resposta manual (gramática, norma
 * escrita, coerência e clareza), com um modelo próprio e pequeno. Nada é gravado aqui: o texto
 * revisado volta para o editor, e a pessoa decide se fica. A IA revisa; o código confere que ela
 * não trouxe números novos nem aumentou o texto além da conta.
 */

/** Palavras mínimas para revisar, iguais às do botão na tela. */
export const MINIMO_DE_PALAVRAS = 30;
export const MAXIMO_DE_CARACTERES = 8_000;
const MAXIMO_DE_TOKENS = 16_000;
/** Folga de tamanho: a revisão pode reescrever frases, não acrescentar conteúdo. */
const CRESCIMENTO_MAXIMO = 1.5;

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["texto"],
  properties: { texto: { type: "string" } },
} as const;

export const contarPalavras = (texto: string) => (texto.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) ?? []).length;
const numeros = (texto: string) => new Set(texto.match(/\d+/g) ?? []);

/** Revisão recusada pela conferência do código: o texto original fica como está. */
export class ErroDaRevisaoDeTexto extends Error {
  override name = "ErroDaRevisaoDeTexto";
}

/** Parágrafos separados por uma linha em branco, sem espaços sobrando, como o editor da tela. */
const arrumarParagrafos = (texto: string) =>
  texto
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter((paragrafo) => paragrafo !== "")
    .join("\n\n");

export async function revisarTexto(opcoes: { cliente: ClienteDaIa; modelo: string; texto: string; numero: number }): Promise<string> {
  const original = opcoes.texto.trim();
  const instrucoes = await lerInstrucoes("revisaoDeTexto");
  const mensagem = await opcoes.cliente.gerar({
    etapa: "revisao-texto",
    documentos: [],
    perguntas: [opcoes.numero],
    parametros: {
      model: opcoes.modelo,
      max_tokens: MAXIMO_DE_TOKENS,
      output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA } },
      system: [{ type: "text", text: instrucoes.texto }],
      messages: [{ role: "user", content: [{ type: "text", text: `<texto>\n${original}\n</texto>` }] }],
    },
  });

  const json = mensagem.content.flatMap((bloco) => (bloco.type === "text" ? [bloco.text] : [])).join("");
  let revisado: string;
  try {
    const dados: unknown = JSON.parse(json);
    if (typeof dados !== "object" || dados === null || typeof (dados as { texto?: unknown }).texto !== "string") throw new Error();
    revisado = arrumarParagrafos((dados as { texto: string }).texto);
  } catch {
    throw new ErroDaIa("resposta_invalida");
  }
  if (revisado === "") throw new ErroDaIa("resposta_invalida");

  const daOriginal = numeros(original);
  if ([...numeros(revisado)].some((numero) => !daOriginal.has(numero))) {
    throw new ErroDaRevisaoDeTexto("A revisão trouxe números que não estão no texto. O texto foi mantido.");
  }
  if (contarPalavras(revisado) > Math.ceil(contarPalavras(original) * CRESCIMENTO_MAXIMO)) {
    throw new ErroDaRevisaoDeTexto("A revisão aumentou demais o texto. O texto foi mantido.");
  }
  return revisado;
}
