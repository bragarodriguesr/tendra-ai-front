import ExcelJS from "exceljs";
import type { ItemDaRevisao } from "../rastreabilidade/montarItem.ts";
import type { Pergunta } from "./planilha.ts";

/**
 * Planilha preenchida (cenário 24): cópia da planilha original com duas colunas novas na aba de
 * cada pergunta, logo depois da última coluna usada. A resposta é marcada como não revisada no
 * próprio título da coluna. As demais células não são alteradas.
 * Para RFPs com modelo de resposta (cenário 55) vale o mesmo formato até a decisão P12.
 */

export const TITULO_DA_RESPOSTA = "Resposta sugerida (não revisada)";
export const TITULO_DA_FONTE = "Fonte";
export const SEM_FONTE = "Sem fonte na base";

export async function gerarPlanilhaPreenchida(original: Uint8Array, perguntas: Pergunta[], itens: ItemDaRevisao[]): Promise<Uint8Array> {
  if (perguntas.length !== itens.length) throw new Error("Cada pergunta precisa de um item.");
  const linhas = perguntas.flatMap((pergunta, posicao) => {
    const item = itens[posicao];
    if (item === undefined) return [];
    return [{
      aba: pergunta.aba,
      linha: pergunta.linha,
      valores: item.st === "sem-rascunho"
        ? ["", SEM_FONTE]
        : [item.paras.map((paragrafo) => paragrafo.t).join("\n\n"), item.srcs.map((src) => `${src.doc} · ${src.loc}`).join("\n")],
    }];
  });
  return preencherColunas(original, [TITULO_DA_RESPOSTA, TITULO_DA_FONTE], [60, 45], linhas);
}

/**
 * Escreve, em cada aba, colunas novas logo depois da última coluna usada: os títulos na linha acima
 * da primeira pergunta da aba e os valores na linha de cada pergunta. As demais células não mudam.
 */
export async function preencherColunas(
  original: Uint8Array,
  titulos: string[],
  larguras: number[],
  linhas: { aba: string; linha: number; valores: string[] }[],
): Promise<Uint8Array> {
  const pasta = new ExcelJS.Workbook();
  // O exceljs declara um tipo Buffer próprio; o Buffer do Node é aceito em tempo de execução.
  await pasta.xlsx.load(Buffer.from(original) as unknown as ExcelJS.Buffer);

  const porAba = new Map<string, typeof linhas>();
  for (const linha of linhas) porAba.set(linha.aba, [...(porAba.get(linha.aba) ?? []), linha]);

  for (const [nomeDaAba, daAba] of porAba) {
    const aba = pasta.getWorksheet(nomeDaAba);
    if (aba === undefined) throw new Error(`Aba não encontrada: ${nomeDaAba}`);
    const primeiraColuna = aba.columnCount + 1;

    // Títulos na linha acima da primeira pergunta da aba (a do cabeçalho, quando há regra).
    const primeira = Math.min(...daAba.map(({ linha }) => linha));
    titulos.forEach((titulo, k) => {
      if (primeira > 1) aba.getCell(primeira - 1, primeiraColuna + k).value = titulo;
      aba.getColumn(primeiraColuna + k).width = larguras[k] ?? 30;
    });

    for (const { linha, valores } of daAba) {
      valores.forEach((valor, k) => {
        const celula = aba.getCell(linha, primeiraColuna + k);
        celula.value = valor;
        celula.alignment = { wrapText: true, vertical: "top" };
      });
    }
  }

  return new Uint8Array(await pasta.xlsx.writeBuffer());
}
