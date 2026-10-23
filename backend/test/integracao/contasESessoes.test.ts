import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Banco } from "../../src/persistencia/banco.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";

/** Etapa D2 · tabelas de contas, sessões e tentativas de login (migração 004). */
let banco: Banco;
const ID = "11111111-1111-4111-8111-111111111111";

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
});

afterAll(async () => {
  await banco.close();
});

const inserirPerfil = (email: string, papel: string, id = ID) =>
  banco.query("INSERT INTO perfis (id, email, nome, papel) VALUES ($1, $2, $3, $4)", [id, email, "Marcelo Vieira", papel]);

describe("D2 · contas e sessões", () => {
  it("aceita só os papéis Revisor e Aprovador e e-mail em minúsculas", async () => {
    await expect(inserirPerfil("marcelo@tendra.test", "Administrador")).rejects.toThrow();
    await expect(inserirPerfil("Marcelo@Tendra.test", "Aprovador")).rejects.toThrow();
    await inserirPerfil("marcelo@tendra.test", "Aprovador");
    const { rows } = await banco.query<{ ativo: boolean }>("SELECT ativo FROM perfis WHERE id = $1", [ID]);
    expect(rows).toEqual([{ ativo: true }]);
  });

  it("apagar o perfil apaga as sessões dele", async () => {
    await banco.query("INSERT INTO sessoes (id_hash, perfil_id) VALUES ($1, $2)", ["hash-da-sessao", ID]);
    await banco.query("DELETE FROM perfis WHERE id = $1", [ID]);
    const { rows } = await banco.query("SELECT * FROM sessoes");
    expect(rows).toEqual([]);
  });

  it("registra tentativas de login com e-mail, IP e resultado", async () => {
    await banco.query("INSERT INTO tentativas_login (email, ip, sucesso) VALUES ($1, $2, $3)", ["x@tendra.test", "203.0.113.7", false]);
    const { rows } = await banco.query<{ total: number }>("SELECT count(*) AS total FROM tentativas_login WHERE ip = $1 AND NOT sucesso", ["203.0.113.7"]);
    expect(rows).toEqual([{ total: 1 }]);
  });

  it("liga Row Level Security em todas as tabelas, para a API pública do Supabase não ler nada", async () => {
    const { rows } = await banco.query<{ tabela: string; rls: boolean }>(
      "SELECT relname AS tabela, relrowsecurity AS rls FROM pg_class WHERE relkind = 'r' AND relnamespace = to_regnamespace(current_schema())::oid ORDER BY relname",
    );
    expect(rows.length).toBe(12);
    expect(rows.filter((linha) => !linha.rls)).toEqual([]);
  });
});
