/**
 * Filtro pela barra e pela legenda de estados nos detalhes da tarefa (SPEC_FASE_M.md, cenários M3, M4 e M7).
 */

/** Texto do número do cartão para cada estado de revisão que tem cor na barra. */
export const TEXTO_DO_NUMERO = {
  "sem-rascunho": "itens sem rascunho",
  sugerida: "itens sugeridos",
  "em-revisao": "itens em revisão",
  revisada: "itens revisados",
  aprovada: "itens aprovados"
};

/** Clicar no estado já filtrado volta para "todos"; em outro estado, troca direto. */
export function filtroAoClicar(atual, clicado) {
  return atual === clicado ? "todos" : clicado;
}

/**
 * Número e texto do cartão. Com um estado da barra filtrado, a contagem desse estado; com "todos" ou
 * "alerta" (que não é um estado de revisão), os aprovados. `contagens` é a contagem de cada estado
 * sobre todos os itens da tarefa, sem a busca.
 */
export function numeroDoCartao(filtro, contagens) {
  const estado = filtro in TEXTO_DO_NUMERO ? filtro : "aprovada";
  return { n: contagens[estado] ?? 0, texto: TEXTO_DO_NUMERO[estado] };
}
