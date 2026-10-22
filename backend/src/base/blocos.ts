/**
 * Divisão do corpo de um `.md` da base em blocos citáveis (FORMATO_BASE_MD.md, seção 3).
 * Cada parágrafo, lista, tabela ou bloco de código vira um bloco, com a seção e as linhas
 * em que está. As linhas contam desde a primeira linha do arquivo, cabeçalho incluído.
 */

export const SECAO_DO_INICIO = "(início)";

export interface Bloco {
  ordem: number;
  /** Título mais próximo acima do bloco, ou "(início)" antes do primeiro título. */
  secao: string;
  /** Títulos do mais externo ao mais interno. Vazio antes do primeiro título. */
  caminhoDeSecoes: string[];
  linhaInicial: number;
  linhaFinal: number;
  /** Texto exato das linhas do bloco, unidas por quebra de linha. */
  texto: string;
}

const TITULO = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const CERCA_DE_CODIGO = /^ {0,3}(`{3,}|~{3,})/;
const SEPARADOR = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;

/**
 * Divide as linhas do arquivo em blocos, a partir de `inicioDoCorpo` (índice a partir de 0).
 * Títulos não viram blocos: definem a seção dos blocos seguintes.
 */
export function dividirEmBlocos(linhas: string[], inicioDoCorpo: number): Bloco[] {
  const blocos: Bloco[] = [];
  const titulos: string[] = [];
  let atual: { inicio: number; linhas: string[] } | null = null;
  let cerca: string | null = null;

  const fechar = () => {
    if (atual === null) return;
    const caminhoDeSecoes = titulos.filter((titulo) => titulo !== "");
    blocos.push({
      ordem: blocos.length + 1,
      secao: caminhoDeSecoes.at(-1) ?? SECAO_DO_INICIO,
      caminhoDeSecoes,
      linhaInicial: atual.inicio,
      linhaFinal: atual.inicio + atual.linhas.length - 1,
      texto: atual.linhas.join("\n"),
    });
    atual = null;
  };

  for (let indice = inicioDoCorpo; indice < linhas.length; indice++) {
    const linha = linhas[indice] ?? "";
    const numero = indice + 1;

    if (cerca !== null) {
      atual?.linhas.push(linha);
      if (linha.trimStart().startsWith(cerca)) {
        cerca = null;
        fechar();
      }
      continue;
    }

    const abertura = CERCA_DE_CODIGO.exec(linha);
    if (abertura !== null) {
      fechar();
      cerca = abertura[1]?.slice(0, 3) ?? "```";
      atual = { inicio: numero, linhas: [linha] };
      continue;
    }

    const titulo = TITULO.exec(linha);
    if (titulo !== null) {
      fechar();
      const nivel = titulo[1]?.length ?? 1;
      titulos.length = nivel - 1;
      for (let posicao = 0; posicao < nivel - 1; posicao++) titulos[posicao] ??= "";
      titulos[nivel - 1] = (titulo[2] ?? "").trim();
      continue;
    }

    if (linha.trim() === "" || SEPARADOR.test(linha)) {
      fechar();
      continue;
    }

    if (atual === null) atual = { inicio: numero, linhas: [] };
    atual.linhas.push(linha);
  }
  fechar();
  return blocos;
}
