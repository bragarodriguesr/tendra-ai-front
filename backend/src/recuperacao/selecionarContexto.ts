import type { ConfiguracaoDaSelecao } from "../config/config.ts";
import { AREA_GERAL, AREAS_DAS_PERGUNTAS } from "../regras/areas.ts";
import type { ContextoDaBase, DocumentoDoContexto } from "./buscarFontes.ts";

/**
 * Seleção do contexto por área (fase U, PU7, PU9, PU11 e PU12, cenários U9, U10, U12 e U13). Regra
 * determinística, sem IA: as perguntas de uma área recebem os documentos com essa área mais os
 * "Geral" (inclusive os ainda não classificados). Pergunta "Geral", área sem nenhum documento,
 * seleção desligada ou base abaixo do limiar: a base inteira.
 */

/** De onde veio o contexto do item (PU10), como fica gravado em `itens.contexto`. */
export type ContextoDoItem = "area" | "base" | "base_segunda_tentativa";

export interface GrupoDeGeracao {
  /** Área do grupo, ou null no grupo da base inteira. */
  area: string | null;
  contexto: Pick<ContextoDaBase, "documentos">;
  /** Números das perguntas do grupo, na ordem da planilha. */
  perguntas: number[];
}

export type MotivoDaSelecao = "ligada" | "desligada" | "base_pequena";

export interface Selecao {
  motivo: MotivoDaSelecao;
  /** Grupos na ordem de geração: as áreas na ordem da lista e, por último, a base inteira. */
  grupos: GrupoDeGeracao[];
}

/** Documento "Geral": vale para todas as perguntas, inclusive enquanto pendente (PU5). */
const ehGeral = (documento: Pick<DocumentoDoContexto, "areas">) => documento.areas.length === 0 || documento.areas.includes(AREA_GERAL);

export function selecionarContexto(entrada: {
  contexto: ContextoDaBase;
  /** Número e área de cada pergunta a gerar, na ordem da planilha. */
  perguntas: { numero: number; area: string }[];
  configuracao: ConfiguracaoDaSelecao;
}): Selecao {
  const { contexto, perguntas, configuracao } = entrada;
  const todas = perguntas.map((pergunta) => pergunta.numero);
  if (!configuracao.porArea) return { motivo: "desligada", grupos: todas.length > 0 ? [{ area: null, contexto, perguntas: todas }] : [] };
  // "Passa de" 50 mil tokens (PU11): no limiar exato, a base inteira.
  if (contexto.tokens <= configuracao.minimoDeTokens) {
    return { motivo: "base_pequena", grupos: todas.length > 0 ? [{ area: null, contexto, perguntas: todas }] : [] };
  }

  const grupos: GrupoDeGeracao[] = [];
  const naBase: number[] = [];
  for (const area of AREAS_DAS_PERGUNTAS) {
    const daArea = perguntas.filter((pergunta) => pergunta.area === area).map((pergunta) => pergunta.numero);
    if (daArea.length === 0) continue;
    if (!contexto.documentos.some((documento) => documento.areas.includes(area))) {
      naBase.push(...daArea);
      continue;
    }
    const documentos = contexto.documentos.filter((documento) => documento.areas.includes(area) || ehGeral(documento));
    grupos.push({ area, contexto: { documentos }, perguntas: daArea });
  }
  const areasDosGrupos = new Set<string>(AREAS_DAS_PERGUNTAS);
  naBase.push(...perguntas.filter((pergunta) => !areasDosGrupos.has(pergunta.area)).map((pergunta) => pergunta.numero));
  if (naBase.length > 0) grupos.push({ area: null, contexto, perguntas: naBase.sort((a, b) => a - b) });
  return { motivo: "ligada", grupos };
}
