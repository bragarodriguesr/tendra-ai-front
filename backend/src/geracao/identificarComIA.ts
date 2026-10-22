import type { ClienteDaIa } from "../ia/cliente.ts";
import { ErroDaIa } from "../ia/cliente.ts";
import { lerInstrucoes } from "../ia/instrucoes.ts";
import type { IdentificadorDePerguntasComIA, PerguntaSugeridaPelaIA, PlanilhaLida } from "../documentos/planilha.ts";

/**
 * Identificação de perguntas com um modelo pequeno, só quando a regra da coluna "Pergunta" falha
 * (cenário 3). A saída é estruturada ({aba, linha, texto}) e passa depois pela conferência literal
 * de `identificarPerguntasComIA`, que descarta textos que não estão na planilha (cenário 5).
 */

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["perguntas"],
  properties: {
    perguntas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["aba", "linha", "texto"],
        properties: { aba: { type: "string" }, linha: { type: "integer" }, texto: { type: "string" } },
      },
    },
  },
} as const;

const MAXIMO_DE_TOKENS = 32_000;

export function criarIdentificadorComIA(cliente: ClienteDaIa, modelo: string): IdentificadorDePerguntasComIA {
  return async (planilha) => {
    const instrucoes = await lerInstrucoes("identificacao");
    const mensagem = await cliente.gerar({
      etapa: "identificacao",
      documentos: [],
      perguntas: [],
      parametros: {
        model: modelo,
        max_tokens: MAXIMO_DE_TOKENS,
        output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA } },
        system: [{ type: "text", text: instrucoes.texto }],
        messages: [{ role: "user", content: [{ type: "text", text: planilhaComoTexto(planilha) }] }],
      },
    });
    const texto = mensagem.content.flatMap((bloco) => (bloco.type === "text" ? [bloco.text] : [])).join("");
    return lerSugestoes(texto);
  };
}

/** Cada linha com o nome da aba e o número, para o modelo devolver a posição exata. */
export function planilhaComoTexto(planilha: PlanilhaLida): string {
  const partes = ["<planilha>"];
  for (const aba of planilha.abas) {
    partes.push(`<aba nome="${aba.nome.replace(/"/g, "'")}">`);
    for (const linha of aba.linhas) partes.push(`Linha ${linha.numero}: ${linha.celulas.map((celula) => celula.texto).join(" | ")}`);
    partes.push("</aba>");
  }
  partes.push("</planilha>");
  return partes.join("\n");
}

function lerSugestoes(texto: string): PerguntaSugeridaPelaIA[] {
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new ErroDaIa("resposta_invalida");
  }
  const perguntas = (dados as { perguntas?: unknown }).perguntas;
  if (!Array.isArray(perguntas)) throw new ErroDaIa("resposta_invalida");
  return perguntas.filter(
    (item): item is PerguntaSugeridaPelaIA =>
      typeof item === "object" &&
      item !== null &&
      typeof item.aba === "string" &&
      Number.isInteger(item.linha) &&
      typeof item.texto === "string",
  );
}
