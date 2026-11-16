import type { ClienteDaIa } from "../ia/cliente.ts";
import { ErroDaIa } from "../ia/cliente.ts";
import { lerInstrucoes } from "../ia/instrucoes.ts";
import { AREA_GERAL, areaDoItem, AREAS_DOS_ITENS } from "../regras/areas.ts";
import type { Bloco } from "./blocos.ts";
import { estimarTokens } from "./carga.ts";

/**
 * Classificação de um documento da base por área (fase U, PU1 a PU4, cenários U1 a U4): uma chamada
 * a um modelo pequeno com o título, o tipo, os títulos das seções e o início do texto, até 4 mil
 * tokens estimados (PU3). Desde a v2 (12/11/2026), a saída é uma área principal e até duas
 * secundárias, cada uma presa a uma seção do documento; secundária sem seção do documento é
 * descartada. Nunca lança por causa da IA: erro, resposta ilegível ou principal inválida dão
 * `falhou`, e quem chama deixa o documento em "Geral" (PU4).
 */

const AREAS_ESPECIFICAS = AREAS_DOS_ITENS.filter((area) => area !== AREA_GERAL);

/**
 * Saída da v2: uma área principal obrigatória e até duas secundárias, cada uma com o título da
 * seção que a justifica. O limite de duas e a conferência da seção ficam no código.
 */
const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["principal", "secundarias"],
  properties: {
    principal: { type: "string", enum: [...AREAS_DOS_ITENS] },
    secundarias: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["area", "secao"],
        properties: { area: { type: "string", enum: [...AREAS_ESPECIFICAS] }, secao: { type: "string" } },
      },
    },
  },
} as const;

/** Áreas secundárias aceitas, além da principal. */
export const MAXIMO_DE_SECUNDARIAS = 2;

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
  const areas = areasDaResposta(dados, secoesDoDocumento(opcoes.documento));
  return areas.length === 0 ? { falhou: true } : { falhou: false, areas };
}

/** Títulos das seções do documento, de todos os níveis, sem repetição. */
/**
 * Títulos das seções que podem justificar uma área secundária, sem repetição. O título do topo (o
 * "# Título" do documento) fica de fora quando há seções abaixo dele: citar o documento inteiro não
 * prende a área a uma seção.
 */
export function secoesDoDocumento(documento: Pick<DocumentoParaClassificacao, "blocos">): string[] {
  const abaixoDoTopo = documento.blocos.flatMap((bloco) => bloco.caminhoDeSecoes.slice(1));
  return [...new Set(abaixoDoTopo.length > 0 ? abaixoDoTopo : documento.blocos.flatMap((bloco) => bloco.caminhoDeSecoes))];
}

const normalizarTitulo = (texto: string) =>
  texto.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR").replace(/^[\s\d.)-]+/, "").replace(/\s+/g, " ").trim();

/**
 * Áreas da resposta v2, na ordem da lista: a principal e as secundárias presas a uma seção que
 * existe no documento, sem repetição e no máximo duas. A seção pode vir como a entrada a lista
 * ("Título > 2. Seção"), só com o título ou sem a numeração: vale o último trecho do caminho.
 * Principal "Geral" vale sozinha. Principal inválida: lista vazia (falha).
 */
export function areasDaResposta(dados: unknown, secoes: readonly string[]): string[] {
  if (typeof dados !== "object" || dados === null) return [];
  const { principal, secundarias } = dados as { principal?: unknown; secundarias?: unknown };
  const areaPrincipal = typeof principal === "string" ? areaDoItem(principal) : null;
  if (areaPrincipal === null) return [];
  if (areaPrincipal === AREA_GERAL) return [AREA_GERAL];
  const titulos = new Set(secoes.map(normalizarTitulo).filter((titulo) => titulo !== ""));
  const escolhidas = new Set<string>([areaPrincipal]);
  let aceitas = 0;
  for (const secundaria of Array.isArray(secundarias) ? secundarias : []) {
    if (aceitas >= MAXIMO_DE_SECUNDARIAS) break;
    if (typeof secundaria !== "object" || secundaria === null) continue;
    const { area, secao } = secundaria as { area?: unknown; secao?: unknown };
    const valida = typeof area === "string" ? areaDoItem(area) : null;
    if (valida === null || valida === AREA_GERAL || escolhidas.has(valida)) continue;
    if (typeof secao !== "string" || !titulos.has(normalizarTitulo(secao.split(">").at(-1) ?? ""))) continue;
    escolhidas.add(valida);
    aceitas++;
  }
  return AREAS_DOS_ITENS.filter((candidata) => escolhidas.has(candidata));
}
