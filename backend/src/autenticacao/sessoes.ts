import { createHash, randomBytes } from "node:crypto";
import type { Pessoa } from "../config/pessoas.ts";
import type { Banco } from "../persistencia/banco.ts";

/**
 * Sessões do backend (etapa D4). O identificador vai só no cookie; o banco guarda o hash dele.
 * Sair apaga a linha (cenário D5); sem uso por mais que o limite, a sessão expira (cenário D6).
 */

const hashDoIdentificador = (identificador: string) => createHash("sha256").update(identificador).digest("hex");

export interface PerfilAtivo extends Pessoa {
  email: string;
  organizacao: OrganizacaoDaSessao;
}

/** Organização da sessão (cenário 68): só o id e o nome, lidos do banco a cada pedido. */
export interface OrganizacaoDaSessao {
  id: string;
  nome: string;
}

export interface Sessao {
  pessoa: Pessoa;
  organizacao: OrganizacaoDaSessao;
}

/**
 * Perfil ativo com esse id, de uma organização ativa, ou null (conta sem perfil, desativada ou de
 * organização desativada: cenários D2 e 68).
 */
export async function perfilAtivo(banco: Banco, id: string): Promise<PerfilAtivo | null> {
  const { rows } = await banco.query<Omit<PerfilAtivo, "organizacao"> & { organizacao_id: string; organizacao_nome: string }>(
    `SELECT p.id, p.email, p.nome, p.papel, o.id AS organizacao_id, o.nome AS organizacao_nome
       FROM perfis p JOIN organizacoes o ON o.id = p.organizacao_id WHERE p.id = $1 AND p.ativo AND o.ativa`,
    [id],
  );
  const linha = rows[0];
  if (linha === undefined) return null;
  return { id: linha.id, email: linha.email, nome: linha.nome, papel: linha.papel, organizacao: { id: linha.organizacao_id, nome: linha.organizacao_nome } };
}

/** Cria a sessão do perfil e devolve o identificador que vai no cookie. */
export async function criarSessao(banco: Banco, perfilId: string): Promise<string> {
  const identificador = randomBytes(32).toString("base64url");
  await banco.query("INSERT INTO sessoes (id_hash, perfil_id) VALUES ($1, $2)", [hashDoIdentificador(identificador), perfilId]);
  return identificador;
}

/**
 * Pessoa e organização da sessão, renovando o último uso. Sessão inexistente, expirada, de perfil
 * desativado ou de organização desativada devolve null e, se existe, é apagada (cenários D6 e 68).
 * A organização vem do perfil no banco, nunca do pedido (cenário 69).
 */
export async function sessaoValida(banco: Banco, identificador: string, horasSemUso: number): Promise<Sessao | null> {
  const idHash = hashDoIdentificador(identificador);
  const { rows } = await banco.query<Pessoa & { valida: boolean; organizacao_id: string; organizacao_nome: string }>(
    `SELECT p.id, p.nome, p.papel, o.id AS organizacao_id, o.nome AS organizacao_nome,
            (p.ativo AND o.ativa AND s.ultimo_uso > now() - make_interval(hours => $2)) AS valida
       FROM sessoes s JOIN perfis p ON p.id = s.perfil_id JOIN organizacoes o ON o.id = p.organizacao_id
      WHERE s.id_hash = $1`,
    [idHash, horasSemUso],
  );
  const linha = rows[0];
  if (linha === undefined) return null;
  if (!linha.valida) {
    await apagarSessao(banco, identificador);
    return null;
  }
  await banco.query("UPDATE sessoes SET ultimo_uso = now() WHERE id_hash = $1", [idHash]);
  return { pessoa: { id: linha.id, nome: linha.nome, papel: linha.papel }, organizacao: { id: linha.organizacao_id, nome: linha.organizacao_nome } };
}

export async function apagarSessao(banco: Banco, identificador: string): Promise<void> {
  await banco.query("DELETE FROM sessoes WHERE id_hash = $1", [hashDoIdentificador(identificador)]);
}
