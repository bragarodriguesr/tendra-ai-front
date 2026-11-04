/**
 * Áreas da fase N (docs/mvp-resposta-rfp/spec/SPEC_FASE_N.md), as mesmas de backend/src/regras/areas.ts.
 * Só o Aprovador tem área (PN3); C-Level vale por todas (PN2). Sem login (modo local) e nos itens de
 * exemplo, ninguém tem área e nada restringe.
 */
export const AREA_GERAL = "Geral";
export const C_LEVEL = "C-Level";
export const AREAS_DOS_ITENS = ["Produto", "Tecnologia", "Segurança e privacidade", "Comercial", "Jurídico", AREA_GERAL];

export const areaDoItem = (item) => item.area || AREA_GERAL;

/** Áreas do Aprovador da sessão; null para o Revisor e sem login. */
export function areasDaSessao(s) {
  return s.sessao && s.sessao.papel === "Aprovador" ? s.sessao.areas || [] : null;
}

/** Áreas que dão a ordem "Minha área primeiro" e o filtro "Minha área" (PN9): nem C-Level, nem sem área. */
export function areasPreferidas(s) {
  const areas = areasDaSessao(s);
  return areas && areas.length > 0 && !areas.includes(C_LEVEL) ? areas : null;
}

/** Mesma regra da rota de aprovar (cenários N5 a N7). */
export function podeAprovarArea(s, item) {
  const areas = areasDaSessao(s);
  if (areas === null) return true;
  const area = areaDoItem(item);
  return area === AREA_GERAL || areas.includes(C_LEVEL) || areas.includes(area);
}

export const motivoDeAreaRestrita = (item) => `Só a área ${areaDoItem(item)} ou C-Level aprova esta resposta.`;

/** "Minha área primeiro" (cenário N8): as da área antes, cada bloco na ordem da planilha. */
export function ordenarPorArea(itens, preferidas) {
  if (!preferidas) return itens;
  const minhas = itens.filter((i) => preferidas.includes(areaDoItem(i)));
  return minhas.length === 0 ? itens : [...minhas, ...itens.filter((i) => !preferidas.includes(areaDoItem(i)))];
}
