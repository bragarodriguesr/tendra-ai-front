import { correspondeABusca } from "./buscaDePerguntas.js";

/**
 * Fase O (docs/mvp-resposta-rfp/spec/SPEC_FASE_O.md): ordem e busca da Exportação.
 * Blocos (O4): prontas em andamento, depois as demais em andamento, depois finalizadas e arquivadas.
 */
export const blocoDaExportacao = (t) => (t.isClosed ? 2 : t.isReady ? 0 : 1);

/** Ordena pelos blocos, mantendo dentro de cada um a ordem recebida (a de envio, mais recente primeiro). */
export function ordenarParaExportacao(tarefas) {
  return tarefas.map((t, n) => ({ t, n })).sort((a, b) => blocoDaExportacao(a.t) - blocoDaExportacao(b.t) || a.n - b.n).map(({ t }) => t);
}

/** Busca da Exportação (O5): todas as palavras no nome da empresa ou no título, com as regras da fase L. */
export const correspondeAExportacao = (cartao, termos) =>
  termos.length === 0 || correspondeABusca({ pergunta: `${cartao.company} ${cartao.title}`, codigo: "" }, termos);
