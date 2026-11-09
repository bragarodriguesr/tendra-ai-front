import type { Banco, Consultas } from "../persistencia/banco.ts";
import { AREAS_DO_APROVADOR, ErroDeArea, validarAreasDoPerfil } from "../regras/areas.ts";
import { PAPEIS } from "./perfis.ts";

/**
 * Painel de Usuários (fase Q, docs/mvp-resposta-rfp/spec/SPEC_FASE_Q.md): o Aprovador lista, adiciona e
 * altera as pessoas da própria organização. Toda regra fica aqui; o front só antecipa as recusas.
 * A organização vem sempre da sessão, nunca do pedido (fase K).
 */

export const MENSAGEM_SO_APROVADOR = "Só o Aprovador gerencia usuários.";
export const MENSAGEM_NOME_VAZIO = "Informe o nome da pessoa.";
export const MENSAGEM_EMAIL_INVALIDO = "Informe um e-mail válido.";
export const MENSAGEM_JA_NA_LISTA = "Esta pessoa já está na lista.";
export const MENSAGEM_OUTRA_ORGANIZACAO = "Este e-mail não pode ser usado nesta organização.";
export const MENSAGEM_SEM_CONTA = "Não há conta com este e-mail. Crie a conta no painel do Supabase (Authentication → Add user) e tente de novo.";
export const MENSAGEM_PROVEDOR_FORA = "Não foi possível consultar as contas no Supabase. Tente de novo em instantes.";
export const MENSAGEM_PROPRIO_ACESSO = "Peça a outro Aprovador para mudar o seu acesso.";
export const MENSAGEM_SEM_APROVADOR = "A organização precisa de ao menos um Aprovador ativo.";
export const MENSAGEM_PESSOA_NAO_ENCONTRADA = "Pessoa não encontrada.";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAMANHO_MAXIMO_DO_NOME = 120;

/** Recusa com o código HTTP da rota (400, 403, 404, 409 ou 503). */
export class ErroDaGestao extends Error {
  override name = "ErroDaGestao";
  readonly statusCode: number;

  constructor(statusCode: number, mensagem: string) {
    super(mensagem);
    this.statusCode = statusCode;
  }
}

export interface UsuarioDaGestao {
  id: string;
  nome: string;
  email: string;
  papel: string;
  areas: string[];
  ativo: boolean;
  /** A pessoa da sessão (Q8): reconhecida pelo id do perfil, nunca pelo nome. */
  propria: boolean;
}

interface LinhaDoPerfil {
  id: string;
  nome: string;
  email: string;
  papel: string;
  areas: string[];
  ativo: boolean;
}

const paraTela = (linha: LinhaDoPerfil, idDaSessao: string): UsuarioDaGestao => ({
  id: linha.id, nome: linha.nome, email: linha.email, papel: linha.papel, areas: linha.areas, ativo: linha.ativo, propria: linha.id === idDaSessao,
});

/** Áreas que o Aprovador pode ter, na ordem da lista suspensa (DF7). */
export const areasDoAprovador = (): string[] => [...AREAS_DO_APROVADOR];

/** Pessoas da organização, em ordem alfabética do nome (Q2). */
export async function listarUsuariosDaGestao(banco: Consultas, organizacaoId: string, idDaSessao: string): Promise<UsuarioDaGestao[]> {
  const { rows } = await banco.query<LinhaDoPerfil>(
    "SELECT id, nome, email, papel, areas, ativo FROM perfis WHERE organizacao_id = $1 ORDER BY lower(nome), id",
    [organizacaoId],
  );
  return rows.map((linha) => paraTela(linha, idDaSessao));
}

/**
 * Adiciona a pessoa cuja conta já existe no Supabase Auth (Q3), como Revisor, sem área, ativa.
 * Pessoa já nesta organização não muda; de outra organização é recusada sem dizer qual (Q4, PK5).
 */
export async function adicionarUsuario(
  banco: Banco,
  opcoes: { organizacaoId: string; idDaSessao: string; nome: string; email: string; procurarConta: (email: string) => Promise<string | null> },
): Promise<UsuarioDaGestao> {
  const nome = opcoes.nome.trim();
  const email = opcoes.email.trim().toLowerCase();
  if (nome === "" || nome.length > TAMANHO_MAXIMO_DO_NOME) throw new ErroDaGestao(400, MENSAGEM_NOME_VAZIO);
  if (!EMAIL.test(email)) throw new ErroDaGestao(400, MENSAGEM_EMAIL_INVALIDO);
  await recusarSeJaExiste(banco, opcoes.organizacaoId, { email });

  let id: string | null;
  try {
    id = await opcoes.procurarConta(email);
  } catch {
    throw new ErroDaGestao(503, MENSAGEM_PROVEDOR_FORA);
  }
  if (id === null) throw new ErroDaGestao(404, MENSAGEM_SEM_CONTA);
  // A conta pode já ter perfil com outro e-mail (trocado no Supabase): confere pelo id também.
  await recusarSeJaExiste(banco, opcoes.organizacaoId, { id });

  const { rows } = await banco.query<LinhaDoPerfil>(
    `INSERT INTO perfis (id, email, nome, papel, organizacao_id, areas) VALUES ($1, $2, $3, 'Revisor', $4, '{}')
     RETURNING id, nome, email, papel, areas, ativo`,
    [id, email, nome, opcoes.organizacaoId],
  );
  const linha = rows[0];
  if (linha === undefined) throw new Error("Perfil não gravado.");
  return paraTela(linha, opcoes.idDaSessao);
}

async function recusarSeJaExiste(banco: Consultas, organizacaoId: string, chave: { email: string } | { id: string }): Promise<void> {
  const [coluna, valor] = "email" in chave ? ["lower(email)", chave.email] : ["id", chave.id];
  const { rows } = await banco.query<{ organizacao_id: string }>(`SELECT organizacao_id FROM perfis WHERE ${coluna} = $1`, [valor]);
  if (rows.length === 0) return;
  throw new ErroDaGestao(409, rows.some((linha) => linha.organizacao_id === organizacaoId) ? MENSAGEM_JA_NA_LISTA : MENSAGEM_OUTRA_ORGANIZACAO);
}

export interface Mudanca {
  papel?: string;
  areas?: string[];
  ativo?: boolean;
}

/**
 * Muda papel, áreas ou acesso de uma pessoa da organização (Q5 a Q8). Numa transação, com os perfis da
 * organização bloqueados: duas mudanças ao mesmo tempo não deixam a organização sem Aprovador ativo.
 * Passar para Revisor zera as áreas (PN3); desativar apaga as sessões da pessoa (Q7 e Q9).
 */
export async function alterarUsuario(
  banco: Banco,
  opcoes: { organizacaoId: string; idDaSessao: string; id: string; mudanca: Mudanca },
): Promise<UsuarioDaGestao> {
  const { mudanca } = opcoes;
  if (mudanca.papel !== undefined && !PAPEIS.some((papel) => papel === mudanca.papel)) throw new ErroDaGestao(400, `Papel inválido. Use ${PAPEIS.join(" ou ")}.`);
  return banco.transaction(async (transacao) => {
    const { rows: perfis } = await transacao.query<LinhaDoPerfil>(
      "SELECT id, nome, email, papel, areas, ativo FROM perfis WHERE organizacao_id = $1 ORDER BY id FOR UPDATE",
      [opcoes.organizacaoId],
    );
    const atual = perfis.find((perfil) => perfil.id === opcoes.id);
    if (atual === undefined) throw new ErroDaGestao(404, MENSAGEM_PESSOA_NAO_ENCONTRADA);

    const papel = mudanca.papel ?? atual.papel;
    const ativo = mudanca.ativo ?? atual.ativo;
    if (opcoes.id === opcoes.idDaSessao && (papel !== atual.papel || ativo !== atual.ativo)) throw new ErroDaGestao(403, MENSAGEM_PROPRIO_ACESSO);

    let areas: string[];
    try {
      // Revisor nunca tem área: ao passar para Revisor, as áreas saem junto, numa só gravação.
      areas = papel === "Revisor" && mudanca.areas === undefined ? [] : validarAreasDoPerfil(papel, mudanca.areas ?? atual.areas);
    } catch (erro) {
      if (erro instanceof ErroDeArea) throw new ErroDaGestao(400, erro.message);
      throw erro;
    }

    const aprovadoresDepois = perfis.filter((perfil) => (perfil.id === atual.id ? ativo && papel === "Aprovador" : perfil.ativo && perfil.papel === "Aprovador")).length;
    const aprovadoresAntes = perfis.filter((perfil) => perfil.ativo && perfil.papel === "Aprovador").length;
    if (aprovadoresAntes > 0 && aprovadoresDepois === 0) throw new ErroDaGestao(409, MENSAGEM_SEM_APROVADOR);

    const { rows } = await transacao.query<LinhaDoPerfil>(
      "UPDATE perfis SET papel = $1, areas = $2, ativo = $3 WHERE id = $4 AND organizacao_id = $5 RETURNING id, nome, email, papel, areas, ativo",
      [papel, areas, ativo, atual.id, opcoes.organizacaoId],
    );
    if (!ativo) await transacao.query("DELETE FROM sessoes WHERE perfil_id = $1", [atual.id]);
    const linha = rows[0];
    if (linha === undefined) throw new Error("Perfil não alterado.");
    return paraTela(linha, opcoes.idDaSessao);
  });
}
