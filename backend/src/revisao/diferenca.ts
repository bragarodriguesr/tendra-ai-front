/**
 * Porcentagem de texto alterado (P9, decidido na B5): diferença por palavras entre a sugestão
 * original e o texto final. Com A e B em palavras e L o tamanho da maior subsequência comum,
 * alteradas = (|A| − L) + (|B| − L) e a porcentagem é alteradas / (|A| + |B|) × 100.
 * Textos iguais dão 0; textos sem nenhuma palavra em comum dão 100.
 */
export function porcentagemAlterada(original: string, final: string): number {
  const a = palavras(original);
  const b = palavras(final);
  if (a.length + b.length === 0) return 0;
  const comum = maiorSubsequenciaComum(a, b);
  return Math.round((((a.length - comum) + (b.length - comum)) / (a.length + b.length)) * 1000) / 10;
}

const palavras = (texto: string) => texto.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

function maiorSubsequenciaComum(a: string[], b: string[]): number {
  let anterior = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const atual = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      atual[j] = a[i - 1] === b[j - 1] ? (anterior[j - 1] ?? 0) + 1 : Math.max(anterior[j] ?? 0, atual[j - 1] ?? 0);
    }
    anterior = atual;
  }
  return anterior[b.length] ?? 0;
}
