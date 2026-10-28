import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { carregarCabecalhos } from "../config/cabecalhos.ts";
import { carregarConfiguracao, ErroDeConfiguracao } from "../config/config.ts";
import { carregarTermosCriticos } from "../config/termosCriticos.ts";
import { ErroDePlanilha } from "../documentos/planilha.ts";
import { processarTarefa } from "../fluxo/processarTarefa.ts";
import { ClienteDaIa, criarApiDoClaude, ErroDaIa, type EntradaDoRegistro } from "../ia/cliente.ts";
import { calcularMetricas, carregarPrecos } from "../observabilidade/metricas.ts";
import { abrirBancoConfigurado, ErroDeBancoEmUso } from "../persistencia/banco.ts";
import { ErroDeOrganizacao, ORGANIZACAO_INICIAL, organizacaoAtiva } from "../persistencia/organizacoes.ts";
import { ErroDeTeto } from "../recuperacao/buscarFontes.ts";

/**
 * Comando `npm run responder -- <planilha.xlsx> [--organizacao <id>]` (cenário 25): processa a
 * planilha com a base ativa da organização (padrão: a inicial, cenário 78), sem servidor nem front. Grava em dados/resultados/<id>/ os itens no formato de data.js
 * (itens.json), a planilha preenchida, os dados da tarefa (cenário 38), as métricas (cenário 37)
 * e o registro de requisições (cenário 29). Em falha, grava só a tarefa com o motivo e o registro:
 * nenhum resultado parcial (cenário 17). O resultado pode ser avaliado com `npm run avaliar`.
 * Chama a API real: exige ANTHROPIC_API_KEY e tem custo.
 */
const USO = "Uso: npm run responder -- <planilha.xlsx> [--organizacao <id>]";

async function executar(): Promise<number> {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { organizacao: { type: "string" } } });
  const arquivo = positionals[0];
  if (arquivo === undefined || positionals.length > 1) {
    console.error(USO);
    return 1;
  }
  if (!(await stat(arquivo).catch(() => undefined))?.isFile()) {
    console.error(`Arquivo não encontrado: ${arquivo}`);
    return 1;
  }

  const configuracao = carregarConfiguracao();
  const precos = await carregarPrecos();
  const registro: EntradaDoRegistro[] = [];
  const cliente = new ClienteDaIa(criarApiDoClaude(configuracao.chaveApi), (entrada) => registro.push(entrada));
  const id = `${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}-${randomUUID().slice(0, 8)}`;
  const pasta = path.join(configuracao.pastaDados, "resultados", id);
  const inicio = new Date();
  const tarefa = { id, arquivo: path.basename(arquivo), iniciadaEm: inicio.toISOString() };

  const banco = await abrirBancoConfigurado(configuracao);
  try {
    const organizacao = await organizacaoAtiva(banco, values.organizacao?.trim() || ORGANIZACAO_INICIAL);
    const resultado = await processarTarefa({
      banco,
      organizacaoId: organizacao.id,
      cliente,
      ia: configuracao.ia,
      nomesDeCabecalho: await carregarCabecalhos(),
      termosCriticos: await carregarTermosCriticos(),
      hoje: inicio.toISOString().slice(0, 10),
      nomeDoArquivo: path.basename(arquivo),
      planilha: new Uint8Array(await readFile(arquivo)),
      aoProgredir: (processadas, total) => {
        if (total > 0) console.log(`Processadas ${processadas} de ${total}`);
      },
    });

    await mkdir(pasta, { recursive: true });
    await writeFile(path.join(pasta, "itens.json"), JSON.stringify(resultado.itens, null, 2));
    await writeFile(path.join(pasta, "planilha-preenchida.xlsx"), resultado.planilhaPreenchida);
    await writeFile(
      path.join(pasta, "tarefa.json"),
      JSON.stringify(
        {
          ...tarefa,
          estado: "pronta",
          concluidaEm: new Date().toISOString(),
          perguntas: resultado.perguntas.length,
          origemDasPerguntas: resultado.origemDasPerguntas,
          comportamento: resultado.comportamento,
          documentos: resultado.documentos,
          // Posição de cada item na planilha (item rN ↔ posicoes[N-1]), para a avaliação.
          posicoes: resultado.perguntas.map(({ aba, linha }) => ({ aba, linha })),
        },
        null,
        2,
      ),
    );
    const metricas = calcularMetricas({ registro, itens: resultado.itens, checagens: resultado.checagens, etapas: resultado.etapas, precos });
    await writeFile(path.join(pasta, "metricas.json"), JSON.stringify(metricas, null, 2));
    await gravarRegistro(pasta, registro);

    const contar = (st: string) => resultado.itens.filter((item) => item.st === st).length;
    console.log(`\nPronta: ${resultado.itens.length} itens, ${contar("sugerida")} sugeridos e ${contar("sem-rascunho")} sem rascunho.`);
    console.log(
      `Custo estimado: ${metricas.custoEstimadoUsd === null ? `sem preço para ${metricas.modelosSemPreco.join(", ")}` : `US$ ${metricas.custoEstimadoUsd.toFixed(4)}`}; ${Math.round(metricas.duracaoTotalMs / 1000)} s.`,
    );
    console.log(`Resultados em ${pasta}`);
    return 0;
  } catch (erro) {
    if (!(erro instanceof ErroDaIa || erro instanceof ErroDeTeto || erro instanceof ErroDePlanilha)) throw erro;
    await mkdir(pasta, { recursive: true });
    await writeFile(path.join(pasta, "tarefa.json"), JSON.stringify({ ...tarefa, estado: "falha", motivo: erro.message }, null, 2));
    await gravarRegistro(pasta, registro);
    console.error(`Falha: ${erro.message}`);
    console.error(`Registro em ${pasta}`);
    return 1;
  } finally {
    await banco.close();
  }
}

async function gravarRegistro(pasta: string, registro: EntradaDoRegistro[]): Promise<void> {
  await writeFile(path.join(pasta, "registro.jsonl"), registro.map((entrada) => JSON.stringify(entrada)).join("\n") + (registro.length ? "\n" : ""));
}

try {
  process.exitCode = await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao || erro instanceof ErroDeBancoEmUso || erro instanceof ErroDeOrganizacao)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
