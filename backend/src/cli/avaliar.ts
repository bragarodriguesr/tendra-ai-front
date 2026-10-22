import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { avaliar, type ExecucaoAvaliada } from "../avaliacao/avaliar.ts";
import { gerarListaDeFidelidade, lerListaDeFidelidade } from "../avaliacao/fidelidade.ts";
import { carregarGabarito, lerBaseAutorizada, rfpDoGabarito, type Momento } from "../avaliacao/gabarito.ts";
import { relatorioEmMarkdown, SITUACAO } from "../avaliacao/relatorio.ts";
import { ErroDeConfiguracao } from "../config/config.ts";
import type { MetricasDaTarefa } from "../observabilidade/metricas.ts";

/**
 * Comando `npm run avaliar -- <resultado> [<resultado>...] [--momento base|atualizacao]
 * [--fidelidade <lista.xlsx>] [--gabarito <arquivo.json>]` (cenários 26 e 36).
 * Avalia o resultado de `npm run responder` contra o gabarito sintético. Com mais de um resultado
 * da mesma RFP, a consistência dos guardrails é medida em todos; os demais critérios, no primeiro.
 * Grava avaliacao.md e avaliacao.json no primeiro resultado e, se ainda não existir, a lista de
 * conferência da fidelidade (fidelidade.xlsx). Não chama a IA.
 * Termina com código 1 quando algum critério falha ou ainda está pendente.
 */
const USO = "Uso: npm run avaliar -- <resultado> [<resultado>...] [--momento base|atualizacao] [--fidelidade <lista.xlsx>] [--gabarito <arquivo.json>]";
const GABARITO_PADRAO = path.resolve("../base-sintetica/rfps/gabarito-rfps-pulse.json");

async function lerExecucao(pasta: string): Promise<ExecucaoAvaliada & { metricas: MetricasDaTarefa | null }> {
  const tarefa = JSON.parse(await readFile(path.join(pasta, "tarefa.json"), "utf8")) as {
    estado: string;
    arquivo: string;
    comportamento: ExecucaoAvaliada["comportamento"];
    posicoes: ExecucaoAvaliada["posicoes"];
  };
  if (tarefa.estado !== "pronta") throw new ErroDeConfiguracao(`${pasta}: a tarefa não está pronta (${tarefa.estado}); não há resultado para avaliar.`);
  const metricas = await readFile(path.join(pasta, "metricas.json"), "utf8").then(JSON.parse, () => null) as MetricasDaTarefa | null;
  return {
    nome: path.basename(pasta),
    arquivo: tarefa.arquivo,
    comportamento: tarefa.comportamento,
    posicoes: tarefa.posicoes,
    itens: JSON.parse(await readFile(path.join(pasta, "itens.json"), "utf8")),
    metricas,
  };
}

async function executar(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { momento: { type: "string" }, fidelidade: { type: "string" }, gabarito: { type: "string" } },
  });
  const momento = (values.momento ?? "base") as Momento;
  if (positionals.length === 0 || (momento !== "base" && momento !== "atualizacao")) {
    console.error(USO);
    return 1;
  }

  const execucoes = await Promise.all(positionals.map(lerExecucao));
  const [principal] = execucoes;
  if (principal === undefined) return 1;
  if (execucoes.some((execucao) => execucao.arquivo !== principal.arquivo)) {
    console.error("Os resultados avaliados juntos precisam ser da mesma RFP.");
    return 1;
  }
  const gabarito = await carregarGabarito(values.gabarito ?? GABARITO_PADRAO, momento);
  const rfp = rfpDoGabarito(gabarito, principal.arquivo);
  if (rfp === undefined) {
    console.error(`A RFP ${principal.arquivo} não está no gabarito.`);
    return 1;
  }

  const pasta = positionals[0] ?? ".";
  const lista = path.join(pasta, "fidelidade.xlsx");
  if (!(await access(lista).then(() => true, () => false))) await writeFile(lista, await gerarListaDeFidelidade(principal, rfp));
  const fidelidade = values.fidelidade === undefined ? null : await lerListaDeFidelidade(new Uint8Array(await readFile(values.fidelidade)));

  const relatorio = avaliar({ execucoes, gabarito: rfp, momento, base: await lerBaseAutorizada(gabarito, momento), fidelidade });
  const custos = execucoes.map((execucao) => execucao.metricas?.custoEstimadoUsd ?? null);
  await writeFile(path.join(pasta, "avaliacao.json"), JSON.stringify({ ...relatorio, custosEstimadosUsd: custos }, null, 2));
  await writeFile(path.join(pasta, "avaliacao.md"), relatorioEmMarkdown(relatorio, custos));

  for (const criterio of relatorio.criterios) console.log(`${SITUACAO[criterio.situacao].padEnd(13)} ${criterio.criterio}: ${criterio.valor} (limite ${criterio.limite})`);
  const abertos = relatorio.criterios.filter((criterio) => criterio.situacao === "reprovado" || criterio.situacao === "pendente");
  console.log(`\nRelatório em ${path.join(pasta, "avaliacao.md")}`);
  if (abertos.length > 0) {
    console.log(`Não aprovado: ${abertos.map((criterio) => `${criterio.criterio} (${SITUACAO[criterio.situacao].toLowerCase()})`).join(", ")}.`);
    if (fidelidade === null) console.log(`Para a fidelidade, preencha ${lista} e rode de novo com --fidelidade ${lista}.`);
    return 1;
  }
  console.log("Aprovado em todos os critérios.");
  return 0;
}

try {
  process.exitCode = await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
