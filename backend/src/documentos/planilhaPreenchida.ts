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
  const pasta = new ExcelJS.Workbook();
  // O exceljs declara um tipo Buffer próprio; o Buffer do Node é aceito em tempo de execução.
  await pasta.xlsx.load(Buffer.from(original) as unknown as ExcelJS.Buffer);

  const porAba = new Map<string, { pergunta: Pergunta; item: ItemDaRevisao }[]>();
  perguntas.forEach((pergunta, posicao) => {
    const item = itens[posicao];
    if (item !== undefined) porAba.set(pergunta.aba, [...(porAba.get(pergunta.aba) ?? []), { pergunta, item }]);
  });

  for (const [nomeDaAba, linhas] of porAba) {
    const aba = pasta.getWorksheet(nomeDaAba);
    if (aba === undefined) throw new Error(`Aba não encontrada: ${nomeDaAba}`);
    const colunaDaResposta = aba.columnCount + 1;
    const colunaDaFonte = colunaDaResposta + 1;

    // Títulos na linha acima da primeira pergunta da aba (a do cabeçalho, quando há regra).
    const primeira = Math.min(...linhas.map(({ pergunta }) => pergunta.linha));
    if (primeira > 1) {
      aba.getCell(primeira - 1, colunaDaResposta).value = TITULO_DA_RESPOSTA;
      aba.getCell(primeira - 1, colunaDaFonte).value = TITULO_DA_FONTE;
    }
    aba.getColumn(colunaDaResposta).width = 60;
    aba.getColumn(colunaDaFonte).width = 45;

    for (const { pergunta, item } of linhas) {
      const resposta = aba.getCell(pergunta.linha, colunaDaResposta);
      const fonte = aba.getCell(pergunta.linha, colunaDaFonte);
      resposta.alignment = { wrapText: true, vertical: "top" };
      fonte.alignment = { wrapText: true, vertical: "top" };
      if (item.st === "sem-rascunho") {
        resposta.value = "";
        fonte.value = SEM_FONTE;
      } else {
        resposta.value = item.paras.map((paragrafo) => paragrafo.t).join("\n\n");
        fonte.value = item.srcs.map((src) => `${src.doc} · ${src.loc}`).join("\n");
      }
    }
  }

  return new Uint8Array(await pasta.xlsx.writeBuffer());
}
