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
}

/** Perfil ativo com esse id, ou null (conta sem perfil ou desativada, cenário D2). */
export async function perfilAtivo(banco: Banco, id: string): Promise<PerfilAtivo | null> {
  const { rows } = await banco.query<PerfilAtivo>("SELECT id, email, nome, papel FROM perfis WHERE id = $1 AND ativo", [id]);
  return rows[0] ?? null;
}

/** Cria a sessão do perfil e devolve o identificador que vai no cookie. */
export async function criarSessao(banco: Banco, perfilId: string): Promise<string> {
  const identificador = randomBytes(32).toString("base64url");
  await banco.query("INSERT INTO sessoes (id_hash, perfil_id) VALUES ($1, $2)", [hashDoIdentificador(identificador), perfilId]);
  return identificador;
}

/**
 * Pessoa da sessão, renovando o último uso. Sessão inexistente, expirada ou de perfil desativado
 * devolve null; a expirada e a de perfil desativado são apagadas.
 */
export async function pessoaDaSessao(banco: Banco, identificador: string, horasSemUso: number): Promise<Pessoa | null> {
  const idHash = hashDoIdentificador(identificador);
  const { rows } = await banco.query<Pessoa & { valida: boolean }>(
    `SELECT p.id, p.nome, p.papel, (p.ativo AND s.ultimo_uso > now() - make_interval(hours => $2)) AS valida
       FROM sessoes s JOIN perfis p ON p.id = s.perfil_id WHERE s.id_hash = $1`,
    [idHash, horasSemUso],
  );
  const linha = rows[0];
  if (linha === undefined) return null;
  if (!linha.valida) {
    await apagarSessao(banco, identificador);
    return null;
  }
  await banco.query("UPDATE sessoes SET ultimo_uso = now() WHERE id_hash = $1", [idHash]);
  return { id: linha.id, nome: linha.nome, papel: linha.papel };
}

export async function apagarSessao(banco: Banco, identificador: string): Promise<void> {
  await banco.query("DELETE FROM sessoes WHERE id_hash = $1", [hashDoIdentificador(identificador)]);
}
