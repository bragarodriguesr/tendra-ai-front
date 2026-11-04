import { randomUUID } from "node:crypto";
import type { Armazenamento } from "../armazenamento/armazenamento.ts";
import type { NomesDeCabecalho } from "../config/cabecalhos.ts";
import type { ConfiguracaoDaIa } from "../config/config.ts";
import { ErroDePlanilha } from "../documentos/planilha.ts";
import { ClienteDaIa, ErroDaIa, type ApiDoClaude, type EntradaDoRegistro } from "../ia/cliente.ts";
import { calcularMetricas, type TabelaDePrecos } from "../observabilidade/metricas.ts";
import type { Banco } from "../persistencia/banco.ts";
import {
  apagarRespostasGeradas,
  atualizarProgresso,
  concluirTarefa,
  criarTarefa,
  falharTarefa,
  gravarRespostasGeradas,
  lerRespostasGeradas,
  listarRequisicoes,
  registrarRequisicao,
  type DadosDaTarefa,
  type Tarefa,
} from "../persistencia/tarefas.ts";
import { ErroDeTeto } from "../recuperacao/buscarFontes.ts";
import { processarTarefa } from "./processarTarefa.ts";
import { AREA_GERAL } from "../regras/areas.ts";

/**
 * Tarefa persistida (etapa B1): grava a planilha com nome gerado, cria a tarefa como
 * `processando`, processa, grava o progresso a cada lote e, no fim, os itens e a planilha
 * preenchida (estado `pronta`) ou o motivo da falha (estado `falha`, sem itens).
 * É o mesmo `processarTarefa` usado pelo comando `responder` (cenário 25).
 *
 * Retomada (etapa D8, cenário D15): cada requisição à IA vai para o registro na hora e as respostas
 * de cada lote são gravadas assim que o lote termina. Executar de novo uma tarefa interrompida
 * reaproveita os lotes gravados, e o registro e as métricas somam as requisições de antes.
 */

export interface AmbienteDaTarefa {
  banco: Banco;
  armazenamento: Armazenamento;
  api: ApiDoClaude;
  ia: ConfiguracaoDaIa;
  nomesDeCabecalho: NomesDeCabecalho;
  termosCriticos: string[];
  precos: TabelaDePrecos;
  /** Data do backend (AAAA-MM-DD). */
  hoje: () => string;
  /** Erros que não são de planilha, IA ou teto: falhas do próprio backend, para o log. */
  aoFalharInesperadamente?: (erro: unknown) => void;
}

export const MOTIVO_DE_ERRO_INTERNO = "Erro interno no processamento. Tente novamente.";

/**
 * Cria a tarefa na organização (a planilha já validada) e devolve-a em `processando`. O processamento
 * é à parte.
 */
export async function criarTarefaComPlanilha(
  ambiente: Pick<AmbienteDaTarefa, "banco" | "armazenamento">,
  entrada: { organizacaoId: string; arquivo: string; planilha: Uint8Array; dados: DadosDaTarefa },
): Promise<Tarefa> {
  const caminhoDaPlanilha = await ambiente.armazenamento.salvar(entrada.organizacaoId, "rfps", entrada.planilha, "xlsx");
  return criarTarefa(ambiente.banco, { id: randomUUID(), organizacaoId: entrada.organizacaoId, arquivo: entrada.arquivo, caminhoDaPlanilha, dados: entrada.dados });
}

/** Processa uma tarefa já criada. Nunca lança: o resultado fica gravado na própria tarefa. */
export async function executarTarefa(ambiente: AmbienteDaTarefa, tarefa: Tarefa): Promise<void> {
  const registro: EntradaDoRegistro[] = [];
  // O cliente avisa cada requisição de forma síncrona; a gravação segue em fila, na ordem.
  let gravacoes: Promise<void> = Promise.resolve();
  const cliente = new ClienteDaIa(ambiente.api, (entrada) => {
    registro.push(entrada);
    gravacoes = gravacoes.then(() => registrarRequisicao(ambiente.banco, tarefa.id, entrada));
  });
  try {
    // Na retomada, as requisições de antes do reinício entram nas métricas.
    registro.unshift(...(await listarRequisicoes(ambiente.banco, tarefa.id)));
    const planilha = new Uint8Array(await ambiente.armazenamento.ler(tarefa.organizacaoId, tarefa.caminhoDaPlanilha));
    const resultado = await processarTarefa({
      banco: ambiente.banco,
      organizacaoId: tarefa.organizacaoId,
      cliente,
      ia: ambiente.ia,
      nomesDeCabecalho: ambiente.nomesDeCabecalho,
      termosCriticos: ambiente.termosCriticos,
      hoje: ambiente.hoje(),
      nomeDoArquivo: tarefa.arquivo,
      planilha,
      aoProgredir: (processadas, total) => atualizarProgresso(ambiente.banco, tarefa.id, processadas, total),
      respostasGravadas: await lerRespostasGeradas(ambiente.banco, tarefa.id),
      aoGerarLote: async (respostas) => {
        await gravacoes;
        await gravarRespostasGeradas(ambiente.banco, tarefa.id, respostas);
      },
    });
    const caminhoDaPlanilhaPreenchida = await ambiente.armazenamento.salvar(tarefa.organizacaoId, "resultados", resultado.planilhaPreenchida, "xlsx");
    await gravacoes;
    await concluirTarefa(ambiente.banco, tarefa.id, {
      itens: resultado.itens.map((item, posicao) => ({
        ...item,
        aba: resultado.perguntas[posicao]?.aba ?? "",
        linha: resultado.perguntas[posicao]?.linha ?? 0,
        area: resultado.areas[posicao] ?? AREA_GERAL,
      })),
      comportamento: resultado.comportamento,
      metricas: {
        ...calcularMetricas({ registro, itens: resultado.itens, checagens: resultado.checagens, etapas: resultado.etapas, precos: ambiente.precos }),
        perguntasEmGeralPorFalha: resultado.perguntasEmGeralPorFalha,
      },
      caminhoDaPlanilhaPreenchida,
    });
  } catch (erro) {
    const conhecido = erro instanceof ErroDaIa || erro instanceof ErroDeTeto || erro instanceof ErroDePlanilha;
    if (!conhecido) ambiente.aoFalharInesperadamente?.(erro);
    await gravacoes.catch(() => undefined);
    const metricas = calcularMetricas({ registro, itens: [], checagens: [], etapas: [], precos: ambiente.precos });
    await falharTarefa(ambiente.banco, tarefa.id, conhecido ? erro.message : MOTIVO_DE_ERRO_INTERNO, metricas);
  }
  // Pronta ou em falha, a tarefa não será retomada: as respostas gravadas por lote não servem mais.
  await apagarRespostasGeradas(ambiente.banco, tarefa.id).catch(() => undefined);
}

