import type { Pessoa } from "../config/pessoas.ts";
import type { Banco } from "../persistencia/banco.ts";
import { paraItem, type ItemGravado } from "../persistencia/tarefas.ts";
import type { ParagrafoDoItem, TipoDeAlerta } from "../rastreabilidade/montarItem.ts";
import { porcentagemAlterada } from "./diferenca.ts";
import { areaDoItem, AREAS_DOS_ITENS, motivoDeAreaRestrita, podeAprovarArea } from "../regras/areas.ts";

/**
 * Revisão persistida (etapa B5, cenários 41 a 49, e cenários 57 a 59): editar, restaurar, aprovar,
 * avaliar, reconhecer alerta, escolher fonte e marcar como revisado, sempre com a pessoa que age e a
 * data e hora do backend. Cada ação grava um evento só de inclusão, sem o texto das respostas.
 * Nenhuma ação é do sistema: aprovar é sempre de uma pessoa.
 */

export class ErroDeRevisao extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, mensagem: string) {
    super(mensagem);
    this.statusCode = statusCode;
  }
}

export const MOTIVOS_DE_AVALIACAO_NEGATIVA = ["Fonte incorreta", "Texto impreciso", "Informação desatualizada", "Outro"] as const;
type Transacao = Parameters<Parameters<Banco["transaction"]>[0]>[0];

/** Pessoa da lista de configuração; sem ela, 400 e nada muda (cenário 41). */
export function reconhecerPessoa(pessoas: Pessoa[], id: string | undefined): Pessoa {
  const pessoa = pessoas.find((candidata) => candidata.id === id);
  if (pessoa === undefined) throw new ErroDeRevisao(400, "Pessoa não reconhecida");
  return pessoa;
}

const textoDosParagrafos = (paras: ParagrafoDoItem[]) => paras.map((paragrafo) => paragrafo.t).join("\n\n");
const normalizar = (texto: string) => texto.replace(/\s+/g, " ").trim();

async function itemDaTarefa(transacao: Transacao, tarefaId: string, numero: number): Promise<ItemGravado & { parasOriginais: ParagrafoDoItem[] }> {
  const tarefa = await transacao.query<{ estado: string }>("SELECT estado FROM tarefas WHERE id = $1", [tarefaId]);
  const estado = tarefa.rows[0]?.estado;
  if (estado === undefined) throw new ErroDeRevisao(404, "Tarefa não encontrada.");
  if (estado !== "pronta") throw new ErroDeRevisao(409, "A tarefa não está pronta para revisão.");
  const { rows } = await transacao.query<Parameters<typeof paraItem>[0] & { paras_originais: ParagrafoDoItem[] }>(
    "SELECT * FROM itens WHERE tarefa_id = $1 AND numero = $2",
    [tarefaId, numero],
  );
  const linha = rows[0];
  if (linha === undefined) throw new ErroDeRevisao(404, "Item não encontrado.");
  return { ...paraItem(linha), parasOriginais: linha.paras_originais };
}

async function registrarEvento(
  transacao: Transacao,
  evento: { tarefaId: string; numero: number; acao: string; pessoa: Pessoa; porcentagem?: number; avaliacao?: string; motivo?: string | null; detalhe?: string },
): Promise<void> {
  await transacao.query(
    `INSERT INTO eventos (tarefa_id, item_numero, acao, pessoa, papel, porcentagem_alterada, avaliacao, motivo, detalhe) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [evento.tarefaId, evento.numero, evento.acao, evento.pessoa.nome, evento.pessoa.papel, evento.porcentagem ?? null, evento.avaliacao ?? null, evento.motivo ?? null, evento.detalhe ?? null],
  );
}

/** Grava o texto; a marca de revisado só fica enquanto o item continua "revisada" ou é aprovado depois. */
async function gravarTexto(transacao: Transacao, tarefaId: string, numero: number, paras: ParagrafoDoItem[], st: ItemGravado["st"], manterAprovacao: boolean) {
  await transacao.query(
    `UPDATE itens SET paras = $3, st = $4::text,
       aprovado_por = CASE WHEN $5 THEN aprovado_por ELSE NULL END,
       aprovado_em = CASE WHEN $5 THEN aprovado_em ELSE NULL END,
       revisado_por = CASE WHEN $4::text IN ('revisada', 'aprovada') THEN revisado_por ELSE NULL END,
       revisado_em = CASE WHEN $4::text IN ('revisada', 'aprovada') THEN revisado_em ELSE NULL END
     WHERE tarefa_id = $1 AND numero = $2`,
    [tarefaId, numero, JSON.stringify(paras), st, manterAprovacao],
  );
}

async function itemAtual(transacao: Transacao, tarefaId: string, numero: number): Promise<ItemGravado> {
  const { parasOriginais: _ignorado, ...item } = await itemDaTarefa(transacao, tarefaId, numero);
  return item;
}

/**
 * Cenário 42: o texto editado vira os parágrafos (separados por linha em branco), cada um mantendo
 * as fontes do parágrafo na mesma posição; `orig` não muda e o item vai para "em-revisao". Se
 * estava aprovado, a aprovação deixa de valer e o evento "aprovacao_removida" é registrado.
 * Item sem sugestão (`orig` vazio) segue o cenário 61: resposta manual.
 */
export async function editarTexto(banco: Banco, entrada: { tarefaId: string; numero: number; pessoa: Pessoa; texto: string }): Promise<ItemGravado> {
  return banco.transaction(async (transacao) => {
    const item = await itemDaTarefa(transacao, entrada.tarefaId, entrada.numero);
    const partes = entrada.texto.split(/\n\s*\n/).map((parte) => parte.trim()).filter((parte) => parte !== "");
    if (item.orig === "") return escreverRespostaManual(transacao, item, { ...entrada, partes });
    if (partes.length === 0) throw new ErroDeRevisao(400, "O texto não pode ficar vazio.");
    const paras = partes.map((t, posicao) => ({ t, s: item.paras[posicao]?.s ?? item.paras.at(-1)?.s ?? [] }));

    if (item.st === "aprovada") await registrarEvento(transacao, { ...entrada, acao: "aprovacao_removida" });
    await gravarTexto(transacao, entrada.tarefaId, entrada.numero, paras, "em-revisao", false);
    await registrarEvento(transacao, { ...entrada, acao: "edicao", porcentagem: porcentagemAlterada(item.orig, textoDosParagrafos(paras)) });
    return itemAtual(transacao, entrada.tarefaId, entrada.numero);
  });
}

/**
 * Cenário 61: num item sem sugestão, a pessoa escreve a resposta. Os parágrafos ficam sem fonte, o
 * alerta "sem contexto" dá lugar ao de resposta manual, com quem escreveu, e o item vai para
 * "em-revisao". Apagar todo o texto devolve o item para "sem-rascunho", com o alerta "sem contexto".
 */
async function escreverRespostaManual(
  transacao: Transacao,
  item: ItemGravado,
  entrada: { tarefaId: string; numero: number; pessoa: Pessoa; partes: string[] },
): Promise<ItemGravado> {
  const semTexto = entrada.partes.length === 0;
  if (semTexto && item.st === "sem-rascunho") return itemAtual(transacao, entrada.tarefaId, entrada.numero);
  const outros = item.alerts.filter((alerta) => alerta.t !== "nocontext" && alerta.t !== "manual");
  const manual = item.alerts.find((alerta) => alerta.t === "manual") ?? { t: "manual" as const, by: entrada.pessoa.nome };
  const alerts = semTexto ? [{ t: "nocontext" as const }, ...outros] : [manual, ...outros];
  const paras = entrada.partes.map((t) => ({ t, s: [] }));
  if (item.st === "aprovada") await registrarEvento(transacao, { ...entrada, acao: "aprovacao_removida" });
  await gravarTexto(transacao, entrada.tarefaId, entrada.numero, paras, semTexto ? "sem-rascunho" : "em-revisao", false);
  await transacao.query("UPDATE itens SET alerts = $3 WHERE tarefa_id = $1 AND numero = $2", [entrada.tarefaId, entrada.numero, JSON.stringify(alerts)]);
  await registrarEvento(transacao, { ...entrada, acao: "edicao", detalhe: "manual" });
  return itemAtual(transacao, entrada.tarefaId, entrada.numero);
}

/**
 * Cenário 43: volta ao texto e às fontes originais de cada parágrafo. Se o texto muda num item
 * aprovado ou revisado, ele volta para "em-revisao" e a aprovação ou a marca de revisado sai.
 */
export async function restaurarSugestao(banco: Banco, entrada: { tarefaId: string; numero: number; pessoa: Pessoa }): Promise<ItemGravado> {
  return banco.transaction(async (transacao) => {
    const item = await itemDaTarefa(transacao, entrada.tarefaId, entrada.numero);
    if (item.st === "sem-rascunho" || item.orig === "") throw new ErroDeRevisao(400, "Item sem rascunho não tem sugestão para restaurar.");
    const mudou = normalizar(textoDosParagrafos(item.paras)) !== normalizar(item.orig);
    const removeAprovacao = item.st === "aprovada" && mudou;
    const voltaParaRevisao = (item.st === "aprovada" || item.st === "revisada") && mudou;
    if (removeAprovacao) await registrarEvento(transacao, { ...entrada, acao: "aprovacao_removida" });
    await gravarTexto(transacao, entrada.tarefaId, entrada.numero, item.parasOriginais, voltaParaRevisao ? "em-revisao" : item.st, !removeAprovacao);
    await registrarEvento(transacao, { ...entrada, acao: "restauracao", porcentagem: 0 });
    return itemAtual(transacao, entrada.tarefaId, entrada.numero);
  });
}

/** Cenários 44 e 45: aprovar exige rascunho; grava quem aprovou e a data e hora do backend. */
export async function aprovarItem(banco: Banco, entrada: { tarefaId: string; numero: number; pessoa: Pessoa }): Promise<ItemGravado> {
  return banco.transaction(async (transacao) => {
    const item = await itemDaTarefa(transacao, entrada.tarefaId, entrada.numero);
    if (item.st === "sem-rascunho" || item.paras.length === 0) throw new ErroDeRevisao(400, "Item sem rascunho não pode ser aprovado.");
    // Fase N (cenários N5 a N7): só a área da pergunta, C-Level ou, em "Geral", qualquer Aprovador.
    if (!podeAprovarArea(entrada.pessoa.areas, item.area)) throw new ErroDeRevisao(403, motivoDeAreaRestrita(item.area));
    await transacao.query(
      `UPDATE itens SET st = 'aprovada', aprovado_por = $3, aprovado_em = now() WHERE tarefa_id = $1 AND numero = $2`,
      [entrada.tarefaId, entrada.numero, entrada.pessoa.nome],
    );
    await registrarEvento(transacao, { ...entrada, acao: "aprovacao", porcentagem: porcentagemAlterada(item.orig, textoDosParagrafos(item.paras)) });
    return itemAtual(transacao, entrada.tarefaId, entrada.numero);
  });
}

/**
 * Cenário N10 (PN7): troca a área de um item ainda não aprovado. Só quem pode aprovar o item na área
 * atual troca; o evento "area" guarda "de → para". A mesma área devolve o item, sem evento.
 */
export async function trocarArea(banco: Banco, entrada: { tarefaId: string; numero: number; pessoa: Pessoa; area: string }): Promise<ItemGravado> {
  const area = areaDoItem(entrada.area);
  if (area === null) throw new ErroDeRevisao(400, `Área inválida. Use ${AREAS_DOS_ITENS.join(", ")}.`);
  return banco.transaction(async (transacao) => {
    const { parasOriginais: _ignorado, ...item } = await itemDaTarefa(transacao, entrada.tarefaId, entrada.numero);
    if (!podeAprovarArea(entrada.pessoa.areas, item.area)) throw new ErroDeRevisao(403, `Só quem aprova a área ${item.area} troca a área deste item.`);
    if (item.st === "aprovada") throw new ErroDeRevisao(409, "Item aprovado não troca de área.");
    if (item.area === area) return item;
    await transacao.query("UPDATE itens SET area = $3 WHERE tarefa_id = $1 AND numero = $2", [entrada.tarefaId, entrada.numero, area]);
    await registrarEvento(transacao, { ...entrada, acao: "area", detalhe: `${item.area} → ${area}` });
    return itemAtual(transacao, entrada.tarefaId, entrada.numero);
  });
}

/**
 * Cenário 57: grava quem reconheceu o alerta e quando, no próprio item. Reconhecer de novo um
 * alerta já reconhecido devolve o item como está, sem novo evento.
 */
export async function reconhecerAlerta(banco: Banco, entrada: { tarefaId: string; numero: number; pessoa: Pessoa; tipo: TipoDeAlerta }): Promise<ItemGravado> {
  return banco.transaction(async (transacao) => {
    const item = await itemDaTarefa(transacao, entrada.tarefaId, entrada.numero);
    const posicao = item.alerts.findIndex((alerta) => alerta.t === entrada.tipo);
    if (posicao === -1) throw new ErroDeRevisao(404, "O item não tem esse alerta.");
    if (item.alerts[posicao]?.ack !== undefined) return itemAtual(transacao, entrada.tarefaId, entrada.numero);
    const at = await agoraDoBanco(transacao);
    const alerts = item.alerts.map((alerta, k) => (k === posicao ? { ...alerta, ack: { by: entrada.pessoa.nome, at } } : alerta));
    await transacao.query("UPDATE itens SET alerts = $3 WHERE tarefa_id = $1 AND numero = $2", [entrada.tarefaId, entrada.numero, JSON.stringify(alerts)]);
    await registrarEvento(transacao, { ...entrada, acao: "alerta_reconhecido", detalhe: entrada.tipo });
    return itemAtual(transacao, entrada.tarefaId, entrada.numero);
  });
}

/**
 * Cenário 58: num conflito ainda não reconhecido, a fonte escolhida passa a sustentar todos os
 * parágrafos, fica marcada como escolhida e o alerta de conflito é reconhecido pela mesma pessoa.
 */
export async function escolherFonte(banco: Banco, entrada: { tarefaId: string; numero: number; pessoa: Pessoa; fonte: number }): Promise<ItemGravado> {
  return banco.transaction(async (transacao) => {
    const item = await itemDaTarefa(transacao, entrada.tarefaId, entrada.numero);
    if (!item.alerts.some((alerta) => alerta.t === "conflict" && alerta.ack === undefined)) throw new ErroDeRevisao(409, "O item não tem conflito pendente.");
    if (item.srcs[entrada.fonte - 1]?.conflict !== true) throw new ErroDeRevisao(400, "Escolha uma das fontes em conflito.");
    const at = await agoraDoBanco(transacao);
    const srcs = item.srcs.map((fonte, k) => ({ ...fonte, chosen: k + 1 === entrada.fonte }));
    const paras = item.paras.map((paragrafo) => ({ ...paragrafo, s: [entrada.fonte] }));
    const alerts = item.alerts.map((alerta) => (alerta.t === "conflict" && alerta.ack === undefined ? { ...alerta, ack: { by: entrada.pessoa.nome, at } } : alerta));
    await transacao.query("UPDATE itens SET srcs = $3, paras = $4, alerts = $5 WHERE tarefa_id = $1 AND numero = $2", [
      entrada.tarefaId,
      entrada.numero,
      JSON.stringify(srcs),
      JSON.stringify(paras),
      JSON.stringify(alerts),
    ]);
    await registrarEvento(transacao, { ...entrada, acao: "fonte_escolhida", detalhe: String(entrada.fonte) });
    return itemAtual(transacao, entrada.tarefaId, entrada.numero);
  });
}

/**
 * Cenário 59: item com rascunho, ainda não aprovado, vai para "revisada" com quem marcou e quando.
 * Marcar de novo um item já revisado devolve o item como está, sem novo evento.
 */
export async function marcarComoRevisado(banco: Banco, entrada: { tarefaId: string; numero: number; pessoa: Pessoa }): Promise<ItemGravado> {
  return banco.transaction(async (transacao) => {
    const item = await itemDaTarefa(transacao, entrada.tarefaId, entrada.numero);
    if (item.st === "sem-rascunho" || item.paras.length === 0) throw new ErroDeRevisao(400, "Item sem rascunho não pode ser marcado como revisado.");
    if (item.st === "aprovada") throw new ErroDeRevisao(409, "Item já aprovado.");
    if (item.st === "revisada") return itemAtual(transacao, entrada.tarefaId, entrada.numero);
    await transacao.query(
      `UPDATE itens SET st = 'revisada', revisado_por = $3, revisado_em = now() WHERE tarefa_id = $1 AND numero = $2`,
      [entrada.tarefaId, entrada.numero, entrada.pessoa.nome],
    );
    await registrarEvento(transacao, { ...entrada, acao: "revisao" });
    return itemAtual(transacao, entrada.tarefaId, entrada.numero);
  });
}

/** Data e hora do backend, a mesma do `now()` da transação, para o que fica gravado no JSON do item. */
async function agoraDoBanco(transacao: Transacao): Promise<string> {
  const { rows } = await transacao.query<{ agora: Date }>("SELECT now() AS agora");
  return (rows[0]?.agora ?? new Date()).toISOString();
}

export interface Avaliacao {
  pessoa: string;
  papel: string;
  valor: "positiva" | "negativa";
  motivo: string | null;
  em: string;
}

/** Cenário 46: negativa exige um dos motivos; uma nova avaliação da mesma pessoa substitui a anterior. */
export async function avaliarItem(
  banco: Banco,
  entrada: { tarefaId: string; numero: number; pessoa: Pessoa; valor: "positiva" | "negativa"; motivo?: string },
): Promise<Avaliacao> {
  const motivo = entrada.valor === "negativa" ? (entrada.motivo ?? "") : null;
  if (motivo !== null && !(MOTIVOS_DE_AVALIACAO_NEGATIVA as readonly string[]).includes(motivo)) {
    throw new ErroDeRevisao(400, `Avaliação negativa exige um motivo: ${MOTIVOS_DE_AVALIACAO_NEGATIVA.join(", ")}.`);
  }
  return banco.transaction(async (transacao) => {
    await itemDaTarefa(transacao, entrada.tarefaId, entrada.numero);
    const { rows } = await transacao.query<{ em: Date }>(
      `INSERT INTO avaliacoes (tarefa_id, item_numero, pessoa, papel, valor, motivo) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (tarefa_id, item_numero, pessoa) DO UPDATE SET papel = EXCLUDED.papel, valor = EXCLUDED.valor, motivo = EXCLUDED.motivo, em = now()
       RETURNING em`,
      [entrada.tarefaId, entrada.numero, entrada.pessoa.nome, entrada.pessoa.papel, entrada.valor, motivo],
    );
    await registrarEvento(transacao, { ...entrada, acao: "avaliacao", avaliacao: entrada.valor, motivo });
    return { pessoa: entrada.pessoa.nome, papel: entrada.pessoa.papel, valor: entrada.valor, motivo, em: (rows[0]?.em ?? new Date()).toISOString() };
  });
}

export interface EventoDeRevisao {
  item: string;
  acao: "edicao" | "restauracao" | "aprovacao" | "aprovacao_removida" | "avaliacao" | "alerta_reconhecido" | "fonte_escolhida" | "revisao" | "area";
  pessoa: string;
  papel: string;
  em: string;
  porcentagemAlterada: number | null;
  avaliacao: string | null;
  motivo: string | null;
  /** Tipo do alerta reconhecido, número da fonte escolhida ou, na troca de área, "de → para". */
  detalhe: string | null;
}

/** Cenário 49: os eventos da tarefa na ordem em que ocorreram, sem o texto das respostas. */
export async function listarEventos(banco: Banco, tarefaId: string): Promise<EventoDeRevisao[]> {
  const { rows } = await banco.query<{
    item_numero: number;
    acao: EventoDeRevisao["acao"];
    pessoa: string;
    papel: string;
    em: Date;
    porcentagem_alterada: string | null;
    avaliacao: string | null;
    motivo: string | null;
    detalhe: string | null;
  }>("SELECT * FROM eventos WHERE tarefa_id = $1 ORDER BY id", [tarefaId]);
  return rows.map((linha) => ({
    item: `r${linha.item_numero}`,
    acao: linha.acao,
    pessoa: linha.pessoa,
    papel: linha.papel,
    em: linha.em.toISOString(),
    porcentagemAlterada: linha.porcentagem_alterada === null ? null : Number(linha.porcentagem_alterada),
    avaliacao: linha.avaliacao,
    motivo: linha.motivo,
    detalhe: linha.detalhe,
  }));
}

export async function listarAvaliacoes(banco: Banco, tarefaId: string): Promise<(Avaliacao & { item: string })[]> {
  const { rows } = await banco.query<{ item_numero: number; pessoa: string; papel: string; valor: Avaliacao["valor"]; motivo: string | null; em: Date }>(
    "SELECT * FROM avaliacoes WHERE tarefa_id = $1 ORDER BY item_numero, pessoa",
    [tarefaId],
  );
  return rows.map((linha) => ({ item: `r${linha.item_numero}`, pessoa: linha.pessoa, papel: linha.papel, valor: linha.valor, motivo: linha.motivo, em: linha.em.toISOString() }));
}

/** Relatório de aceitação da tarefa (cenário 48), a métrica da hipótese central do MVP. */
export interface RelatorioDeAceitacao {
  itens: number;
  comRascunho: number;
  semRascunho: number;
  aprovados: number;
  /** Aprovados com o texto igual à sugestão original. */
  aprovadosSemEdicao: number;
  /** Média da porcentagem de texto alterado entre `orig` e o texto aprovado; null sem aprovados com rascunho. */
  porcentagemMediaAlterada: number | null;
  avaliacoes: { positivas: number; negativas: number; motivos: Record<string, number> };
}

export async function relatorioDeAceitacao(banco: Banco, tarefaId: string): Promise<RelatorioDeAceitacao> {
  const tarefa = await banco.query<{ estado: string }>("SELECT estado FROM tarefas WHERE id = $1", [tarefaId]);
  if (tarefa.rows[0] === undefined) throw new ErroDeRevisao(404, "Tarefa não encontrada.");
  const { rows } = await banco.query<Parameters<typeof paraItem>[0]>("SELECT * FROM itens WHERE tarefa_id = $1 ORDER BY numero", [tarefaId]);
  const itens = rows.map(paraItem);
  const comRascunho = itens.filter((item) => item.orig !== "");
  const aprovados = comRascunho.filter((item) => item.st === "aprovada");
  const alteracoes = aprovados.map((item) => porcentagemAlterada(item.orig, textoDosParagrafos(item.paras)));
  const avaliacoes = await listarAvaliacoes(banco, tarefaId);
  const motivos: Record<string, number> = {};
  for (const avaliacao of avaliacoes) if (avaliacao.motivo !== null) motivos[avaliacao.motivo] = (motivos[avaliacao.motivo] ?? 0) + 1;
  return {
    itens: itens.length,
    comRascunho: comRascunho.length,
    semRascunho: itens.length - comRascunho.length,
    aprovados: aprovados.length,
    aprovadosSemEdicao: aprovados.filter((item) => normalizar(textoDosParagrafos(item.paras)) === normalizar(item.orig)).length,
    porcentagemMediaAlterada: alteracoes.length === 0 ? null : Math.round((alteracoes.reduce((soma, valor) => soma + valor, 0) / alteracoes.length) * 10) / 10,
    avaliacoes: {
      positivas: avaliacoes.filter((avaliacao) => avaliacao.valor === "positiva").length,
      negativas: avaliacoes.filter((avaliacao) => avaliacao.valor === "negativa").length,
      motivos,
    },
  };
}
