import { randomUUID } from "node:crypto";
import type { Armazenamento } from "../armazenamento/armazenamento.ts";
import type { NomesDeCabecalho } from "../config/cabecalhos.ts";
import type { ConfiguracaoDaIa } from "../config/config.ts";
import { ErroDePlanilha } from "../documentos/planilha.ts";
import { ClienteDaIa, ErroDaIa, type ApiDoClaude, type EntradaDoRegistro } from "../ia/cliente.ts";
import { calcularMetricas, type TabelaDePrecos } from "../observabilidade/metricas.ts";
import type { Banco } from "../persistencia/banco.ts";
import {
  atualizarProgresso,
  concluirTarefa,
  criarTarefa,
  falharTarefa,
  registrarRequisicao,
  type DadosDaTarefa,
  type Tarefa,
} from "../persistencia/tarefas.ts";
import { ErroDeTeto } from "../recuperacao/buscarFontes.ts";
import { processarTarefa } from "./processarTarefa.ts";

/**
 * Tarefa persistida (etapa B1): grava a planilha com nome gerado, cria a tarefa como
 * `processando`, processa, grava o progresso a cada lote e, no fim, os itens e a planilha
 * preenchida (estado `pronta`) ou o motivo da falha (estado `falha`, sem itens).
 * É o mesmo `processarTarefa` usado pelo comando `responder` (cenário 25).
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

/** Cria a tarefa (a planilha já validada) e devolve-a em `processando`. O processamento é à parte. */
export async function criarTarefaComPlanilha(
  ambiente: Pick<AmbienteDaTarefa, "banco" | "armazenamento">,
  entrada: { arquivo: string; planilha: Uint8Array; dados: DadosDaTarefa },
): Promise<Tarefa> {
  const caminhoDaPlanilha = await ambiente.armazenamento.salvar("rfps", entrada.planilha, "xlsx");
  return criarTarefa(ambiente.banco, { id: randomUUID(), arquivo: entrada.arquivo, caminhoDaPlanilha, dados: entrada.dados });
}

/** Processa uma tarefa já criada. Nunca lança: o resultado fica gravado na própria tarefa. */
export async function executarTarefa(ambiente: AmbienteDaTarefa, tarefa: Tarefa): Promise<void> {
  const registro: EntradaDoRegistro[] = [];
  const cliente = new ClienteDaIa(ambiente.api, (entrada) => registro.push(entrada));
  let registroGravado = false;
  try {
    const planilha = new Uint8Array(await ambiente.armazenamento.ler(tarefa.caminhoDaPlanilha));
    const resultado = await processarTarefa({
      banco: ambiente.banco,
      cliente,
      ia: ambiente.ia,
      nomesDeCabecalho: ambiente.nomesDeCabecalho,
      termosCriticos: ambiente.termosCriticos,
      hoje: ambiente.hoje(),
      nomeDoArquivo: tarefa.arquivo,
      planilha,
      aoProgredir: (processadas, total) => atualizarProgresso(ambiente.banco, tarefa.id, processadas, total),
    });
    const caminhoDaPlanilhaPreenchida = await ambiente.armazenamento.salvar("resultados", resultado.planilhaPreenchida, "xlsx");
    await gravarRegistro(ambiente.banco, tarefa.id, registro);
    registroGravado = true;
    await concluirTarefa(ambiente.banco, tarefa.id, {
      itens: resultado.itens.map((item, posicao) => ({ ...item, aba: resultado.perguntas[posicao]?.aba ?? "", linha: resultado.perguntas[posicao]?.linha ?? 0 })),
      comportamento: resultado.comportamento,
      metricas: calcularMetricas({ registro, itens: resultado.itens, checagens: resultado.checagens, etapas: resultado.etapas, precos: ambiente.precos }),
      caminhoDaPlanilhaPreenchida,
    });
  } catch (erro) {
    const conhecido = erro instanceof ErroDaIa || erro instanceof ErroDeTeto || erro instanceof ErroDePlanilha;
    if (!conhecido) ambiente.aoFalharInesperadamente?.(erro);
    if (!registroGravado) await gravarRegistro(ambiente.banco, tarefa.id, registro);
    const metricas = calcularMetricas({ registro, itens: [], checagens: [], etapas: [], precos: ambiente.precos });
    await falharTarefa(ambiente.banco, tarefa.id, conhecido ? erro.message : MOTIVO_DE_ERRO_INTERNO, metricas);
  }
}

async function gravarRegistro(banco: Banco, id: string, registro: EntradaDoRegistro[]): Promise<void> {
  for (const entrada of registro) await registrarRequisicao(banco, id, entrada);
}
