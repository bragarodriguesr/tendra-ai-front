import type { Banco } from "./banco.ts";

/**
 * Organizações (fase K, cenários 66 a 79): a empresa usuária, cliente da Tendra.ai. Todo dado de uso
 * pertence a uma organização, e a organização de um pedido vem só da sessão (cenário 69).
 */

/**
 * Organização inicial, criada pela migração 008 (PK3): recebeu os dados de antes da fase K e é a do
 * modo local, sem login, e a padrão dos comandos de terminal (cenário 78).
 */
export const ORGANIZACAO_INICIAL = "6f1c2a9e-4d3b-4f8a-9c7e-2b5d8e1a0f34";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class ErroDeOrganizacao extends Error {
  override name = "ErroDeOrganizacao";
}

export interface Organizacao {
  id: string;
  nome: string;
  ativa: boolean;
}

/** Cria a organização (cenário 66). O id é um UUID gerado pelo banco. */
export async function criarOrganizacao(banco: Banco, nomeInformado: string): Promise<Organizacao> {
  const nome = nomeInformado.trim();
  if (nome === "") throw new ErroDeOrganizacao("Informe o nome da organização.");
  const existente = await banco.query("SELECT 1 FROM organizacoes WHERE lower(trim(nome)) = lower($1)", [nome]);
  if (existente.rows.length > 0) throw new ErroDeOrganizacao(`Já existe uma organização com o nome "${nome}".`);
  const { rows } = await banco.query<Organizacao>("INSERT INTO organizacoes (nome) VALUES ($1) RETURNING id, nome, ativa", [nome]);
  const organizacao = rows[0];
  if (organizacao === undefined) throw new Error("Falha ao criar a organização.");
  return organizacao;
}

/** Organização pelo id, ou null (id inexistente ou fora do formato UUID). */
export async function obterOrganizacao(banco: Banco, id: string): Promise<Organizacao | null> {
  if (!UUID.test(id)) return null;
  const { rows } = await banco.query<Organizacao>("SELECT id, nome, ativa FROM organizacoes WHERE id = $1", [id]);
  return rows[0] ?? null;
}

/** Organização ativa pelo id, ou o erro com a mensagem para o comando de terminal. */
export async function organizacaoAtiva(banco: Banco, id: string): Promise<Organizacao> {
  const organizacao = await obterOrganizacao(banco, id);
  if (organizacao === null) throw new ErroDeOrganizacao(`Organização ${id} não encontrada.`);
  if (!organizacao.ativa) throw new ErroDeOrganizacao(`A organização ${organizacao.nome} está desativada.`);
  return organizacao;
}
