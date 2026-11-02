/**
 * Busca de perguntas na tela de revisão (SPEC_FASE_L.md, cenários B2 a B5 e B8):
 * sem diferenciar maiúsculas, minúsculas nem acentos; cada termo vale como trecho; todos os termos
 * precisam aparecer, em qualquer ordem, no texto completo da pergunta ou no código do item.
 */

/** Texto sem acentos e em minúsculas, para comparar. */
export function normalizar(texto) {
  return String(texto ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Termos da busca, já normalizados. Espaços repetidos ou nas pontas são ignorados; só espaços dá lista vazia. */
export function termosDaBusca(busca) {
  return normalizar(busca).split(/\s+/).filter((termo) => termo !== "");
}

/** O item corresponde quando todos os termos aparecem na pergunta ou no código. Sem termos, tudo corresponde. */
export function correspondeABusca({ pergunta, codigo }, termos) {
  if (termos.length === 0) return true;
  const texto = normalizar(pergunta) + "\n" + normalizar(codigo);
  return termos.every((termo) => texto.includes(termo));
}
