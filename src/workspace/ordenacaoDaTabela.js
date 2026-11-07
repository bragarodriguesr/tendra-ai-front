/**
 * Ordenação da tabela dos detalhes da tarefa (SPEC_FASE_P.md, cenários P4 e P5). Cada linha traz
 * `ordem: { numero, pergunta, area, estado }`; `ordenacao` é null (ordem padrão) ou { coluna, direcao }.
 */

export const COLUNAS = ["codigo", "pergunta", "area", "status"];

/** Outra coluna (ou nenhuma) → crescente; a mesma crescente → decrescente; a mesma decrescente → ordem padrão. */
export function proximaOrdenacao(atual, coluna) {
  if (!atual || atual.coluna !== coluna) return { coluna, direcao: "asc" };
  return atual.direcao === "asc" ? { coluna, direcao: "desc" } : null;
}

const texto = (a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" });

// Status pela chave do estado (aprovada, em-revisao, revisada, sem-rascunho, sugerida): a ordem alfabética do filtro (M13).
const COMPARAR = {
  codigo: (a, b) => a.numero - b.numero,
  pergunta: (a, b) => texto(a.pergunta, b.pergunta),
  area: (a, b) => texto(a.area, b.area),
  status: (a, b) => texto(a.estado, b.estado)
};

/** Linhas na ordenação escolhida; empates seguem o número do requisito, sempre crescente. Sem ordenação, a lista como veio. */
export function ordenarLinhas(linhas, ordenacao) {
  if (!ordenacao) return linhas;
  const sinal = ordenacao.direcao === "desc" ? -1 : 1;
  const comparar = COMPARAR[ordenacao.coluna];
  return [...linhas].sort((a, b) => sinal * comparar(a.ordem, b.ordem) || a.ordem.numero - b.ordem.numero);
}
