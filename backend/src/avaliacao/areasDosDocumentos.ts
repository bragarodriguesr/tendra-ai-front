import { AREAS_DOS_ITENS } from "../regras/areas.ts";

/**
 * Avaliação da classificação dos documentos por área (fase U, cenário U7). Um documento concorda
 * quando as áreas atribuídas são exatamente as rotuladas: incluem todas, sem nenhuma a mais.
 * A etapa é aprovada com concordância ≥ 85% (meta desejável: 92%).
 */
export const LIMITE_DA_CLASSIFICACAO_DE_DOCUMENTOS = 0.85;

export interface DocumentoRotulado {
  documento: string;
  esperadas: string[];
  atribuidas: string[] | null;
}

export interface RelatorioDaClassificacaoDeDocumentos {
  total: number;
  concordantes: number;
  concordancia: number;
  aprovado: boolean;
  /** Por área rotulada: em quantos documentos com essa área a IA também a deu, e em quantos a deu a mais. */
  porArea: { area: string; rotulados: number; acertos: number; aMais: number }[];
  /** Documentos sem resposta válida da IA (ficaram "Geral" por falha). */
  falhas: number;
  divergentes: DocumentoRotulado[];
}

const mesmoConjunto = (a: string[], b: string[]) => a.length === b.length && a.every((area) => b.includes(area));

export function avaliarClassificacaoDeDocumentos(documentos: DocumentoRotulado[]): RelatorioDaClassificacaoDeDocumentos {
  const concordantes = documentos.filter((documento) => documento.atribuidas !== null && mesmoConjunto(documento.esperadas, documento.atribuidas));
  const porArea = AREAS_DOS_ITENS.map((area) => ({
    area,
    rotulados: documentos.filter((documento) => documento.esperadas.includes(area)).length,
    acertos: documentos.filter((documento) => documento.esperadas.includes(area) && (documento.atribuidas ?? []).includes(area)).length,
    aMais: documentos.filter((documento) => !documento.esperadas.includes(area) && (documento.atribuidas ?? []).includes(area)).length,
  })).filter((linha) => linha.rotulados + linha.aMais > 0);
  const concordancia = documentos.length === 0 ? 0 : concordantes.length / documentos.length;
  return {
    total: documentos.length,
    concordantes: concordantes.length,
    concordancia,
    aprovado: documentos.length > 0 && concordancia >= LIMITE_DA_CLASSIFICACAO_DE_DOCUMENTOS,
    porArea,
    falhas: documentos.filter((documento) => documento.atribuidas === null).length,
    divergentes: documentos.filter((documento) => !concordantes.includes(documento)),
  };
}

const porcento = (valor: number) => `${(valor * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export function relatorioDaClassificacaoEmMarkdown(relatorio: RelatorioDaClassificacaoDeDocumentos, modelo: string): string {
  return [
    "# Avaliação da classificação dos documentos por área (cenário U7)",
    "",
    `- Modelo: ${modelo}`,
    `- Concordância: **${porcento(relatorio.concordancia)}** (${relatorio.concordantes} de ${relatorio.total}); limite de ${porcento(LIMITE_DA_CLASSIFICACAO_DE_DOCUMENTOS)}: **${relatorio.aprovado ? "aprovada" : "reprovada"}**`,
    `- Falhas da IA (documento em "Geral" por falha): ${relatorio.falhas}`,
    "",
    "## Por área",
    "",
    "| Área | Rotulados | A IA também deu | A IA deu a mais |",
    "|---|---|---|---|",
    ...relatorio.porArea.map((linha) => `| ${linha.area} | ${linha.rotulados} | ${linha.acertos} | ${linha.aMais} |`),
    "",
    "## Documentos divergentes",
    "",
    ...(relatorio.divergentes.length === 0
      ? ["Nenhum."]
      : ["| Documento | Esperadas | Atribuídas |", "|---|---|---|", ...relatorio.divergentes.map((d) => `| ${d.documento} | ${d.esperadas.join(", ")} | ${d.atribuidas === null ? "(falha)" : d.atribuidas.join(", ")} |`)]),
    "",
  ].join("\n");
}
