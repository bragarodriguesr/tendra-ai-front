import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ErroDeCadastro, gravarPerfil, idDaContaNoSupabase } from "../../src/autenticacao/perfis.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";

/** Etapa D4 (PD2) · cadastro de perfis para contas do Supabase Auth. */
let banco: Banco;
const ID = "11111111-1111-4111-8111-111111111111";

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
});

afterAll(async () => {
  await banco.close();
});

const contasFalsas = (async (url: string, init: RequestInit) => {
  const cabecalhos = init.headers as Record<string, string>;
  if (cabecalhos.apikey !== "sb_secret_falsa") return new Response("{}", { status: 401 });
  const pagina = new URL(url).searchParams.get("page");
  return Response.json({ users: pagina === "1" ? [{ id: ID, email: "Marcelo.Aprovador@tendra.test" }] : [] });
}) as typeof fetch;

describe("D4 · cadastrar perfil", () => {
  it("acha a conta pelo e-mail, sem diferenciar maiúsculas, e grava o perfil ativo; rodar de novo atualiza", async () => {
    const id = await idDaContaNoSupabase({ supabaseUrl: "https://p.supabase.co", chaveDeServico: "sb_secret_falsa", email: "marcelo.aprovador@tendra.test", fetch: contasFalsas });
    expect(id).toBe(ID);
    await gravarPerfil(banco, { organizacaoId: ORGANIZACAO_INICIAL, id, email: "marcelo.aprovador@tendra.test", nome: " Marcelo Vieira ", papel: "Revisor" });
    await banco.query("UPDATE perfis SET ativo = false");
    await gravarPerfil(banco, { organizacaoId: ORGANIZACAO_INICIAL, id, email: "marcelo.aprovador@tendra.test", nome: "Marcelo Vieira", papel: "Aprovador" });
    const { rows } = await banco.query("SELECT nome, papel, ativo FROM perfis");
    expect(rows).toEqual([{ nome: "Marcelo Vieira", papel: "Aprovador", ativo: true }]);
  });

  it("recusa conta inexistente, chave errada e papel inválido", async () => {
    await expect(idDaContaNoSupabase({ supabaseUrl: "https://p.supabase.co", chaveDeServico: "sb_secret_falsa", email: "ninguem@tendra.test", fetch: contasFalsas })).rejects.toThrow(/Nenhuma conta/);
    await expect(idDaContaNoSupabase({ supabaseUrl: "https://p.supabase.co", chaveDeServico: "errada", email: "x@tendra.test", fetch: contasFalsas })).rejects.toThrow("(401)");
    await expect(gravarPerfil(banco, { organizacaoId: ORGANIZACAO_INICIAL, id: ID, email: "x@tendra.test", nome: "X", papel: "Administrador" })).rejects.toBeInstanceOf(ErroDeCadastro);
  });
});
