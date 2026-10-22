import ExcelJS from "exceljs";
import { refDoItem, type ExecucaoAvaliada } from "./avaliar.ts";
import type { GabaritoDaRfp } from "./gabarito.ts";

/**
 * Lista de conferência da fidelidade (P3): uma linha por resposta sugerida, com a pergunta, a
 * resposta e os trechos citados. Uma pessoa marca "sim" quando o texto diz o mesmo que os trechos
 * e "não" quando acrescenta, contradiz ou distorce. A avaliação lê a lista preenchida.
 */

const CABECALHO = ["Ref", "Pergunta", "Resposta sugerida", "Trechos citados", "Diz o mesmo que os trechos? (sim/não)", "Observações"];
const COLUNA_DA_RESPOSTA = 5;

export async function gerarListaDeFidelidade(execucao: ExecucaoAvaliada, gabarito: GabaritoDaRfp): Promise<Uint8Array> {
  const pasta = new ExcelJS.Workbook();
  const aba = pasta.addWorksheet("Fidelidade");
  aba.addRow(CABECALHO).font = { bold: true };
  for (const item of execucao.itens) {
    if (item.st !== "sugerida") continue;
    const trechos = item.srcs.map((fonte, posicao) => `[${posicao + 1}] ${fonte.doc} · ${fonte.loc}\n${fonte.ex}`).join("\n\n");
    aba.addRow([refDoItem(item, execucao, gabarito) ?? item.id, item.q, item.orig, trechos, "", ""]);
  }
  [10, 40, 60, 80, 22, 30].forEach((largura, posicao) => {
    const coluna = aba.getColumn(posicao + 1);
    coluna.width = largura;
    coluna.alignment = { wrapText: true, vertical: "top" };
  });
  for (let linha = 2; linha <= aba.rowCount; linha++) {
    aba.getCell(linha, COLUNA_DA_RESPOSTA).dataValidation = { type: "list", allowBlank: true, formulae: ['"sim,não"'] };
  }
  return new Uint8Array(await pasta.xlsx.writeBuffer());
}

/** Ref → true (sim), false (não) ou null (em branco ou outro valor). */
export async function lerListaDeFidelidade(conteudo: Uint8Array): Promise<Map<string, boolean | null>> {
  const pasta = new ExcelJS.Workbook();
  await pasta.xlsx.load(Buffer.from(conteudo) as unknown as ExcelJS.Buffer);
  const aba = pasta.worksheets[0];
  const respostas = new Map<string, boolean | null>();
  aba?.eachRow((linha, numero) => {
    if (numero === 1) return;
    const ref = String(linha.getCell(1).text).trim();
    const resposta = String(linha.getCell(COLUNA_DA_RESPOSTA).text).trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    if (ref !== "") respostas.set(ref, resposta === "sim" ? true : resposta === "nao" ? false : null);
  });
  return respostas;
}
