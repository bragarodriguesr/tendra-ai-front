import path from "node:path";
import type { RelatorioDeAvaliacao, SituacaoDoCriterio } from "./avaliar.ts";

/** Relatório de avaliação legível, com a tabela dos critérios e as divergências (cenário 26). */

export const SITUACAO: Record<SituacaoDoCriterio, string> = {
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  pendente: "Pendente",
  nao_se_aplica: "Não se aplica",
};

export function relatorioEmMarkdown(relatorio: RelatorioDeAvaliacao, custos: (number | null)[]): string {
  const { comportamento } = relatorio;
  const linhas = [
    `# Avaliação: ${path.posix.basename(relatorio.rfp)}`,
    "",
    `- **Resultado:** ${relatorio.aprovado ? "aprovado em todos os critérios" : "não aprovado (veja os critérios reprovados ou pendentes)"}`,
    `- **Momento da base:** ${relatorio.momento === "base" ? "base inicial" : "depois da atualização"}`,
    `- **Execuções:** ${relatorio.execucoes.join(", ")}`,
    `- **Modelo:** ${comportamento.modelo} (esforço ${comportamento.esforco}), instruções ${comportamento.versaoDasInstrucoes}, lote de ${comportamento.tamanhoDoLote}`,
    `- **Identificação e conflito:** ${comportamento.modeloDeIdentificacao} e ${comportamento.modeloDeConflito}`,
    `- **Custo estimado:** ${custos.map((custo) => (custo === null ? "sem métrica" : `US$ ${custo.toFixed(4)}`)).join(", ")}`,
    "",
    "| Critério | O que mede | Limite | Valor | Situação |",
    "|---|---|---|---|---|",
    ...relatorio.criterios.map((criterio) => `| ${criterio.criterio} | ${criterio.mede} | ${criterio.limite} | ${criterio.valor} | ${SITUACAO[criterio.situacao]} |`),
  ];
  for (const criterio of relatorio.criterios.filter((candidato) => candidato.divergencias.length > 0)) {
    linhas.push("", `## Divergências: ${criterio.criterio}`, "", ...criterio.divergencias.map((divergencia) => `- ${divergencia}`));
  }
  return linhas.join("\n") + "\n";
}
