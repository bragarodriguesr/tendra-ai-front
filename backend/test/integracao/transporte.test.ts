import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { VerificadorDeSenha } from "../../src/autenticacao/verificadorSupabase.ts";
import { criarServidor } from "../../src/http/servidor.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";

/** Cenário D10 · HTTPS, cookie e origem no modo compartilhado (etapa D6), e o IP vindo do proxy (D7). */
const FRONT = "https://tendra.vercel.app";
const PERFIL = { id: "11111111-1111-4111-8111-111111111111", email: "marcelo.aprovador@tendra.test" };
const verificador: VerificadorDeSenha = { conferir: async (email, senha) => (email === PERFIL.email && senha === "certa" ? PERFIL.id : null) };

let banco: Banco;
let servidor: FastifyInstance;

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  await banco.query("INSERT INTO perfis (id, email, nome, papel, organizacao_id) VALUES ($1, $2, $3, $4, $5)", [PERFIL.id, PERFIL.email, "Marcelo Vieira", "Aprovador", ORGANIZACAO_INICIAL]);
  servidor = criarServidor({ banco, autenticacao: { verificador, horasSemUso: 8, cookieSeguro: true }, transporte: { origemDoFront: FRONT } });
  await servidor.ready();
});

afterAll(async () => {
  await servidor.close();
  await banco.close();
});

beforeEach(async () => {
  await banco.exec("DELETE FROM tentativas_login");
  await banco.exec("DELETE FROM sessoes");
});

const HTTPS = { "x-forwarded-proto": "https" };
const entrar = (cabecalhos: Record<string, string>, senha = "certa") =>
  servidor.inject({ method: "POST", url: "/api/auth/login", headers: cabecalhos, payload: { email: PERFIL.email, senha } });

describe("Cenário D10 · conexão segura, cookie e origem", () => {
  it("recusa pedido sem HTTPS antes de olhar a sessão ou o login, sem criar nada", async () => {
    for (const resposta of [
      await servidor.inject({ method: "GET", url: "/api/base/documentos" }),
      await servidor.inject({ method: "GET", url: "/api/base/documentos", headers: { "x-forwarded-proto": "http" } }),
      await entrar({ "x-forwarded-proto": "http", origin: FRONT }),
    ]) {
      expect(resposta.statusCode).toBe(403);
      expect(resposta.json()).toEqual({ erro: "Conexão sem HTTPS recusada." });
    }
    expect((await banco.query("SELECT * FROM sessoes")).rows).toEqual([]);
    expect((await banco.query("SELECT * FROM tentativas_login")).rows).toEqual([]);
  });

  it("a verificação de saúde do Render responde sem HTTPS e sem sessão", async () => {
    expect((await servidor.inject({ method: "GET", url: "/api/saude" })).json()).toEqual({ ok: true });
  });

  it("recusa alteração vinda de outra origem; aceita a do front e pedido sem Origin", async () => {
    const outra = await entrar({ ...HTTPS, origin: "https://site-malicioso.example" });
    expect(outra.statusCode).toBe(403);
    expect(outra.json()).toEqual({ erro: "Origem não autorizada." });
    expect((await entrar({ ...HTTPS, origin: FRONT })).statusCode).toBe(200);
    expect((await entrar(HTTPS)).statusCode).toBe(200);
  });

  it("o cookie de sessão sai com HttpOnly, Secure e SameSite, sem domínio", async () => {
    const cookie = String((await entrar({ ...HTTPS, origin: FRONT })).headers["set-cookie"]);
    expect(cookie).toMatch(/; HttpOnly/);
    expect(cookie).toMatch(/; Secure/);
    expect(cookie).toMatch(/; SameSite=Lax/);
    expect(cookie).not.toMatch(/Domain=/i);
  });
});

describe("Cenário D7 · o IP é o da pessoa, lido do X-Forwarded-For do proxy", () => {
  it("3 falhas de um IP bloqueiam esse IP, não o do proxy nem o de outra pessoa", async () => {
    for (const email of ["a@tendra.test", "b@tendra.test", "c@tendra.test"]) {
      await servidor.inject({ method: "POST", url: "/api/auth/login", headers: { ...HTTPS, "x-forwarded-for": "198.51.100.7" }, payload: { email, senha: "x" } });
    }
    const { rows } = await banco.query<{ ip: string }>("SELECT DISTINCT ip FROM tentativas_login");
    expect(rows).toEqual([{ ip: "198.51.100.7" }]);
    expect((await entrar({ ...HTTPS, "x-forwarded-for": "198.51.100.7" })).statusCode).toBe(429);
    expect((await entrar({ ...HTTPS, "x-forwarded-for": "198.51.100.8" })).statusCode).toBe(200);
  });
});
