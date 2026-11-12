import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { avaliar } from "../avaliacao/avaliar.ts";
import { lerListaDeFidelidade } from "../avaliacao/fidelidade.ts";
import { carregarGabarito, lerBaseAutorizada, rfpDoGabarito } from "../avaliacao/gabarito.ts";
import { comparacaoEmMarkdown, compararSelecao, type ExecucaoDaSelecao } from "../avaliacao/selecao.ts";
import { ErroDeConfiguracao } from "../config/config.ts";

/**
 * Comando `npm run avaliar-selecao -- <resultado-ligada> <resultado-desligada> --gabarito <arquivo.json>
 * [--fidelidade <lista.xlsx>]` (fase U, cenário U16). Compara dois resultados de `npm run responder`
 * da mesma RFP, um com `TENDRA_SELECAO_POR_AREA` ligada e outro desligada. Grava selecao.md e
 * selecao.json na pasta do resultado com a seleção ligada. Não chama a IA. Termina com código 1
 * quando alguma meta falha.
 */
const USO = "Uso: npm run avaliar-selecao -- <resultado-ligada> <resultado-desligada> --gabarito <arquivo.json> [--fidelidade <lista.xlsx>]";

async function lerExecucao(pasta: string): Promise<ExecucaoDaSelecao> {
  const tarefa = JSON.parse(await readFile(path.join(pasta, "tarefa.json"), "utf8"));
  if (tarefa.estado !== "pronta") throw new ErroDeConfiguracao(`${pasta}: a tarefa não está pronta (${tarefa.estado}).`);
  const registro = (await readFile(path.join(pasta, "registro.jsonl"), "utf8")).split("\n").filter((linha) => linha.trim() !== "").map((linha) => JSON.parse(linha));
  return {
    nome: path.basename(pasta),
    arquivo: tarefa.arquivo,
    comportamento: tarefa.comportamento,
    posicoes: tarefa.posicoes,
    contextos: tarefa.contextos,
    itens: JSON.parse(await readFile(path.join(pasta, "itens.json"), "utf8")),
    metricas: await readFile(path.join(pasta, "metricas.json"), "utf8").then(JSON.parse, () => null),
    registro,
  };
}

async function executar(): Promise<number> {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { gabarito: { type: "string" }, fidelidade: { type: "string" } } });
  const [pastaLigada, pastaDesligada] = positionals;
  if (pastaLigada === undefined || pastaDesligada === undefined || positionals.length > 2 || values.gabarito === undefined) {
    console.error(USO);
    return 1;
  }
  const [ligada, desligada] = await Promise.all([lerExecucao(pastaLigada), lerExecucao(pastaDesligada)]);
  if (ligada.arquivo !== desligada.arquivo) {
    console.error("Os dois resultados precisam ser da mesma RFP.");
    return 1;
  }
  const gabarito = await carregarGabarito(values.gabarito, "base");
  const rfp = rfpDoGabarito(gabarito, ligada.arquivo);
  if (rfp === undefined) {
    console.error(`A RFP ${ligada.arquivo} não está no gabarito.`);
    return 1;
  }
  const base = await lerBaseAutorizada(gabarito, "base");
  const fidelidade = values.fidelidade === undefined ? null : await lerListaDeFidelidade(new Uint8Array(await readFile(values.fidelidade)));
  const relatorios = {
    ligada: avaliar({ execucoes: [ligada], gabarito: rfp, momento: "base", base, fidelidade }),
    desligada: avaliar({ execucoes: [desligada], gabarito: rfp, momento: "base", base, fidelidade }),
  };
  const comparacao = compararSelecao({ ligada, desligada, gabarito: rfp, relatorios });
  await writeFile(path.join(pastaLigada, "selecao.json"), JSON.stringify(comparacao, null, 2));
  const markdown = comparacaoEmMarkdown(comparacao, ligada.arquivo);
  await writeFile(path.join(pastaLigada, "selecao.md"), markdown);
  console.log(markdown);
  return comparacao.reprovacoes.length === 0 ? 0 : 1;
}

try {
  process.exitCode = await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
