import type { EntradaDoRegistro } from "../ia/cliente.ts";
import type { ComportamentoDaTarefa } from "../fluxo/processarTarefa.ts";
import type { MetricasDaTarefa } from "../observabilidade/metricas.ts";
import type { ItemDaRevisao } from "../rastreabilidade/montarItem.ts";
import type { Banco, Consultas } from "./banco.ts";
import { gravarEmpresaDaTarefa } from "./empresas.ts";
import type { RespostaGerada } from "../geracao/separarRespostas.ts";

/**
 * Persistência das tarefas e dos itens (etapa B1). O progresso é gravado ao fim de cada lote
 * (cenário 16). Os itens só são gravados, todos juntos, quando a tarefa termina bem: uma tarefa
 * em falha nunca tem itens a apresentar (cenário 17).
 */

export type EstadoDaTarefa = "processando" | "pronta" | "falha";

/** Situação da tarefa (fase O, PO1): a decisão da empresa, separada do estado do processamento. */
export type SituacaoDaTarefa = "em_andamento" | "finalizada" | "arquivada";

export const MOTIVO_DE_INTERRUPCAO = "Processamento interrompido; envie a planilha novamente";

/** Campos da tela Nova RFP. Ficam só no banco: nunca vão à IA (cenário 6). */
export interface DadosDaTarefa {
  nome?: string;
  empresa?: string;
  cnpj?: string;
  tipo?: string;
  prazo?: string;
  responsavel?: string;
  contatos?: { nome?: string; cargo?: string; telefone?: string; email?: string }[];
}

export interface Tarefa {
  id: string;
  /** Organização dona da tarefa (cenário 72). */
  organizacaoId: string;
  estado: EstadoDaTarefa;
  motivo: string | null;
  arquivo: string;
  caminhoDaPlanilha: string;
  dados: DadosDaTarefa;
  total: number;
  processadas: number;
  comportamento: ComportamentoDaTarefa | null;
  metricas: MetricasDaTarefa | null;
  caminhoDaPlanilhaPreenchida: string | null;
  criadaEm: string;
  concluidaEm: string | null;
  situacao: SituacaoDaTarefa;
  /** Quem finalizou ou arquivou, e quando; null em andamento. */
  situacaoPor: string | null;
  situacaoEm: string | null;
}

export type EstadoDoItem = "sugerida" | "em-revisao" | "revisada" | "aprovada" | "sem-rascunho";

/**
 * Item com a posição na planilha e os campos de aprovação (`by`, `at`) e de revisão (`rby`, `rat`)
 * do formato de data.js.
 */
export interface ItemGravado extends Omit<ItemDaRevisao, "st"> {
  st: EstadoDoItem;
  numero: number;
  aba: string;
  linha: number;
  by?: string;
  at?: string;
  rby?: string;
  rat?: string;
  /** Área da pergunta (fase N, PN4): uma das áreas de regras/areas.ts, "Geral" sem área definida. */
  area: string;
}

interface LinhaDeTarefa {
  id: string;
  organizacao_id: string;
  estado: EstadoDaTarefa;
  motivo: string | null;
  arquivo: string;
  caminho_da_planilha: string;
  dados: DadosDaTarefa;
  total: number;
  processadas: number;
  comportamento: ComportamentoDaTarefa | null;
  metricas: MetricasDaTarefa | null;
  caminho_da_planilha_preenchida: string | null;
  criada_em: Date;
  concluida_em: Date | null;
  situacao: SituacaoDaTarefa;
  situacao_por: string | null;
  situacao_em: Date | null;
}

const paraTarefa = (linha: LinhaDeTarefa): Tarefa => ({
  id: linha.id,
  organizacaoId: linha.organizacao_id,
  estado: linha.estado,
  motivo: linha.motivo,
  arquivo: linha.arquivo,
  caminhoDaPlanilha: linha.caminho_da_planilha,
  dados: linha.dados,
  total: linha.total,
  processadas: linha.processadas,
  comportamento: linha.comportamento,
  metricas: linha.metricas,
  caminhoDaPlanilhaPreenchida: linha.caminho_da_planilha_preenchida,
  criadaEm: linha.criada_em.toISOString(),
  concluidaEm: linha.concluida_em?.toISOString() ?? null,
  situacao: linha.situacao,
  situacaoPor: linha.situacao_por,
  situacaoEm: linha.situacao_em?.toISOString() ?? null,
});

/**
 * Muda a situação da tarefa (fase O) numa transação, com a linha da tarefa travada: só se ela ainda
 * estiver na situação de origem, e depois da conferência `exigir` sobre os itens (por exemplo, todos
 * aprovados para finalizar). Assim, uma mudança de item ao mesmo tempo (que trava a mesma linha) não
 * passa por baixo da conferência. Devolve a tarefa atualizada, ou null se a situação já não era a de origem.
 */
export async function mudarSituacao(
  banco: Banco,
  entrada: { organizacaoId: string; id: string; de: SituacaoDaTarefa; para: SituacaoDaTarefa; pessoa: string | null; papel?: string | null; exigir?: (itens: ItemGravado[]) => void },
): Promise<Tarefa | null> {
  return banco.transaction(async (transacao) => {
    const atual = await transacao.query<{ situacao: SituacaoDaTarefa }>("SELECT situacao FROM tarefas WHERE id = $1 AND organizacao_id = $2 FOR UPDATE", [entrada.id, entrada.organizacaoId]);
    if (atual.rows[0]?.situacao !== entrada.de) return null;
    entrada.exigir?.(await listarItens(transacao, entrada.id));
    const emAndamento = entrada.para === "em_andamento";
    const { rows } = await transacao.query<LinhaDeTarefa>(
      `UPDATE tarefas SET situacao = $3, situacao_por = $4, situacao_em = CASE WHEN $5::boolean THEN NULL ELSE now() END
        WHERE id = $1 AND organizacao_id = $2 RETURNING *`,
      [entrada.id, entrada.organizacaoId, entrada.para, emAndamento ? null : entrada.pessoa, emAndamento],
    );
    const linha = rows[0];
    if (linha === undefined) return null;
    const tarefa = paraTarefa(linha);
    const acao = entrada.para === "finalizada" ? "finalizacao" : entrada.para === "arquivada" ? "arquivamento" : "reativacao";
    await registrarEventoDeTarefa(transacao, { tarefa, acao, pessoa: entrada.pessoa, papel: entrada.papel ?? null });
    return tarefa;
  });
}

/** Ação sobre a tarefa no Histórico (fase O, cenários O18 e O19). */
export type AcaoDaTarefa = "importacao" | "finalizacao" | "arquivamento" | "reativacao" | "exclusao";

export interface EventoDeTarefa {
  tarefaId: string;
  tarefa: string;
  empresa: string | null;
  acao: AcaoDaTarefa;
  pessoa: string;
  papel: string | null;
  em: string;
}

/** Grava a ação com o nome da tarefa e da empresa de agora, para o registro valer mesmo depois da exclusão. */
export async function registrarEventoDeTarefa(
  banco: Consultas,
  entrada: { tarefa: Tarefa; acao: AcaoDaTarefa; pessoa: string | null; papel: string | null },
): Promise<void> {
  const { tarefa } = entrada;
  await banco.query(
    "INSERT INTO eventos_de_tarefa (organizacao_id, tarefa_id, tarefa, empresa, acao, pessoa, papel) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [tarefa.organizacaoId, tarefa.id, tarefa.dados.nome?.trim() || tarefa.arquivo, tarefa.dados.empresa?.trim() || null, entrada.acao, entrada.pessoa ?? "Sem identificação", entrada.papel],
  );
}

/** Ações sobre as tarefas da organização, da mais recente para a mais antiga (no máximo 500). */
export async function listarEventosDeTarefa(banco: Banco, organizacaoId: string): Promise<EventoDeTarefa[]> {
  const { rows } = await banco.query<{ tarefa_id: string; tarefa: string; empresa: string | null; acao: AcaoDaTarefa; pessoa: string; papel: string | null; em: Date }>(
    "SELECT tarefa_id, tarefa, empresa, acao, pessoa, papel, em FROM eventos_de_tarefa WHERE organizacao_id = $1 ORDER BY em DESC, id DESC LIMIT 500",
    [organizacaoId],
  );
  return rows.map((linha) => ({ tarefaId: linha.tarefa_id, tarefa: linha.tarefa, empresa: linha.empresa, acao: linha.acao, pessoa: linha.pessoa, papel: linha.papel, em: linha.em.toISOString() }));
}

/**
 * Cria a tarefa na organização e, na mesma transação, grava a empresa e os contatos informados
 * (cenários 63 e 73).
 */
export async function criarTarefa(
  banco: Banco,
  tarefa: { id: string; organizacaoId: string; arquivo: string; caminhoDaPlanilha: string; dados: DadosDaTarefa },
): Promise<Tarefa> {
  return banco.transaction(async (transacao) => {
    const { rows } = await transacao.query<LinhaDeTarefa>(
      `INSERT INTO tarefas (id, organizacao_id, estado, arquivo, caminho_da_planilha, dados) VALUES ($1, $2, 'processando', $3, $4, $5) RETURNING *`,
      [tarefa.id, tarefa.organizacaoId, tarefa.arquivo, tarefa.caminhoDaPlanilha, JSON.stringify(tarefa.dados)],
    );
    const linha = rows[0];
    if (linha === undefined) throw new Error("Falha ao criar a tarefa.");
    await gravarEmpresaDaTarefa(transacao, { tarefaId: tarefa.id, organizacaoId: tarefa.organizacaoId }, tarefa.dados);
    return paraTarefa(linha);
  });
}

/** Tarefa da organização, ou null: a de outra organização é tratada como inexistente (cenário 72). */
export async function obterTarefa(banco: Banco, organizacaoId: string, id: string): Promise<Tarefa | null> {
  const { rows } = await banco.query<LinhaDeTarefa>("SELECT * FROM tarefas WHERE id = $1 AND organizacao_id = $2", [id, organizacaoId]);
  const linha = rows[0];
  return linha === undefined ? null : paraTarefa(linha);
}

/** Tarefas da organização, da mais nova para a mais antiga. */
export async function listarTarefas(banco: Banco, organizacaoId: string): Promise<Tarefa[]> {
  const { rows } = await banco.query<LinhaDeTarefa>("SELECT * FROM tarefas WHERE organizacao_id = $1 ORDER BY criada_em DESC, id", [organizacaoId]);
  return rows.map(paraTarefa);
}

/**
 * Apaga a tarefa da organização e, em cascata, itens, eventos, avaliações, requisições e respostas
 * gravadas (cenário 60). Devolve os caminhos dos arquivos dela, que o chamador apaga do armazenamento.
 */
export async function excluirTarefa(banco: Banco, organizacaoId: string, id: string): Promise<string[]> {
  const { rows } = await banco.query<{ caminho_da_planilha: string; caminho_da_planilha_preenchida: string | null }>(
    "DELETE FROM tarefas WHERE id = $1 AND organizacao_id = $2 RETURNING caminho_da_planilha, caminho_da_planilha_preenchida",
    [id, organizacaoId],
  );
  return rows.flatMap((linha) => [linha.caminho_da_planilha, ...(linha.caminho_da_planilha_preenchida === null ? [] : [linha.caminho_da_planilha_preenchida])]);
}

/** Progresso ao fim de cada lote. O número de processadas nunca diminui (cenário 16). */
export async function atualizarProgresso(banco: Banco, id: string, processadas: number, total: number): Promise<void> {
  await banco.query(
    `UPDATE tarefas SET total = $3::integer, processadas = GREATEST(processadas, LEAST($2::integer, $3::integer)) WHERE id = $1 AND estado = 'processando'`,
    [id, processadas, total],
  );
}

export async function registrarRequisicao(banco: Banco, id: string, entrada: EntradaDoRegistro): Promise<void> {
  await banco.query("INSERT INTO requisicoes (tarefa_id, dados) VALUES ($1, $2)", [id, JSON.stringify(entrada)]);
}

export async function listarRequisicoes(banco: Banco, id: string): Promise<EntradaDoRegistro[]> {
  const { rows } = await banco.query<{ dados: EntradaDoRegistro }>("SELECT dados FROM requisicoes WHERE tarefa_id = $1 ORDER BY id", [id]);
  return rows.map((linha) => linha.dados);
}

/** Resposta de uma pergunta já gerada, gravada ao fim do lote para a retomada (etapa D8). */
export interface RespostaGravada {
  numero: number;
  texto: string;
  resposta: RespostaGerada;
}

export async function gravarRespostasGeradas(banco: Banco, id: string, respostas: RespostaGravada[]): Promise<void> {
  await banco.transaction(async (transacao) => {
    for (const { numero, texto, resposta } of respostas) {
      await transacao.query(
        `INSERT INTO respostas_geradas (tarefa_id, numero, texto, resposta) VALUES ($1, $2, $3, $4)
         ON CONFLICT (tarefa_id, numero) DO UPDATE SET texto = EXCLUDED.texto, resposta = EXCLUDED.resposta`,
        [id, numero, texto, JSON.stringify(resposta)],
      );
    }
  });
}

export async function lerRespostasGeradas(banco: Banco, id: string): Promise<RespostaGravada[]> {
  const { rows } = await banco.query<RespostaGravada>("SELECT numero, texto, resposta FROM respostas_geradas WHERE tarefa_id = $1 ORDER BY numero", [id]);
  return rows;
}

export async function apagarRespostasGeradas(banco: Banco, id: string): Promise<void> {
  await banco.query("DELETE FROM respostas_geradas WHERE tarefa_id = $1", [id]);
}

/** Tarefas ainda em `processando`, da mais antiga para a mais nova (retomada, etapa D8). */
export async function listarTarefasEmProcessamento(banco: Banco): Promise<Tarefa[]> {
  const { rows } = await banco.query<LinhaDeTarefa>("SELECT * FROM tarefas WHERE estado = 'processando' ORDER BY criada_em, id");
  return rows.map(paraTarefa);
}

/** Conclui a tarefa e grava os itens numa só transação: ou tudo, ou nada. */
export async function concluirTarefa(
  banco: Banco,
  id: string,
  resultado: {
    itens: (ItemDaRevisao & { aba: string; linha: number; area: string })[];
    comportamento: ComportamentoDaTarefa;
    metricas: MetricasDaTarefa;
    caminhoDaPlanilhaPreenchida: string;
  },
): Promise<void> {
  await banco.transaction(async (transacao) => {
    for (const [posicao, item] of resultado.itens.entries()) {
      await transacao.query(
        `INSERT INTO itens (tarefa_id, numero, aba, linha, q, paras, paras_originais, srcs, alerts, st, orig, area) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11)`,
        [id, posicao + 1, item.aba, item.linha, item.q, JSON.stringify(item.paras), JSON.stringify(item.srcs), JSON.stringify(item.alerts), item.st, item.orig, item.area],
      );
    }
    await transacao.query(
      `UPDATE tarefas SET estado = 'pronta', processadas = total, comportamento = $2, metricas = $3,
         caminho_da_planilha_preenchida = $4, concluida_em = now(), areas_classificadas_em = now() WHERE id = $1`,
      [id, JSON.stringify(resultado.comportamento), JSON.stringify(resultado.metricas), resultado.caminhoDaPlanilhaPreenchida],
    );
  });
}

export async function falharTarefa(banco: Banco, id: string, motivo: string, metricas: MetricasDaTarefa | null = null): Promise<void> {
  await banco.query(
    `UPDATE tarefas SET estado = 'falha', motivo = $2, metricas = COALESCE($3, metricas), concluida_em = now() WHERE id = $1 AND estado = 'processando'`,
    [id, motivo, metricas === null ? null : JSON.stringify(metricas)],
  );
}

/**
 * Ao iniciar o backend, nenhuma tarefa está de fato em processamento: as que ficaram como
 * `processando` foram interrompidas por um reinício (cenário 32). Devolve quantas foram marcadas.
 */
export async function marcarInterrompidas(banco: Banco): Promise<number> {
  const resultado = await banco.query(
    `UPDATE tarefas SET estado = 'falha', motivo = $1, concluida_em = now() WHERE estado = 'processando'`,
    [MOTIVO_DE_INTERRUPCAO],
  );
  await banco.query("DELETE FROM respostas_geradas WHERE tarefa_id IN (SELECT id FROM tarefas WHERE estado <> 'processando')");
  return resultado.affectedRows ?? 0;
}

interface LinhaDeItem {
  numero: number;
  aba: string;
  linha: number;
  q: string;
  paras: ItemDaRevisao["paras"];
  srcs: ItemDaRevisao["srcs"];
  alerts: ItemDaRevisao["alerts"];
  st: string;
  orig: string;
  aprovado_por: string | null;
  aprovado_em: Date | null;
  revisado_por: string | null;
  revisado_em: Date | null;
  area: string;
}

export const paraItem = (linha: LinhaDeItem): ItemGravado => ({
  id: `r${linha.numero}`,
  numero: linha.numero,
  aba: linha.aba,
  linha: linha.linha,
  q: linha.q,
  paras: linha.paras,
  srcs: linha.srcs,
  alerts: linha.alerts,
  st: linha.st as EstadoDoItem,
  orig: linha.orig,
  area: linha.area,
  ...(linha.aprovado_por === null ? {} : { by: linha.aprovado_por }),
  ...(linha.aprovado_em === null ? {} : { at: linha.aprovado_em.toISOString() }),
  ...(linha.revisado_por === null ? {} : { rby: linha.revisado_por }),
  ...(linha.revisado_em === null ? {} : { rat: linha.revisado_em.toISOString() }),
});

/** Itens da tarefa, na ordem da planilha. Só existem para tarefas prontas. */
export async function listarItens(banco: Consultas, id: string): Promise<ItemGravado[]> {
  const { rows } = await banco.query<LinhaDeItem>("SELECT * FROM itens WHERE tarefa_id = $1 ORDER BY numero", [id]);
  return rows.map(paraItem);
}
