/**
 * Data no formato da tela (dd/mm/aaaa), sem depender do idioma do navegador: o campo nativo de data
 * mostrava mm/dd/yyyy num navegador em inglês (revisão de design de 05/11/2026).
 */

/** Só os dígitos, com as barras de dd/mm/aaaa enquanto a pessoa digita. */
export function mascararData(valor) {
  const d = String(valor || "").replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join("/");
}

/** dd/mm/aaaa → AAAA-MM-DD, ou "" se a data estiver incompleta ou não existir no calendário. */
export function dataBrParaIso(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto || "");
  if (!m) return "";
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const existe = data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
  return existe ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

/** AAAA-MM-DD → dd/mm/aaaa (o valor do calendário nativo para o campo da tela). */
export function isoParaDataBr(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}
