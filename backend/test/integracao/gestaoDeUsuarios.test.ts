import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  MENSAGEM_EMAIL_INVALIDO, MENSAGEM_JA_NA_LISTA, MENSAGEM_NOME_VAZIO, MENSAGEM_OUTRA_ORGANIZACAO, MENSAGEM_PESSOA_NAO_ENCONTRADA, MENSAGEM_PROPRIO_ACESSO,
  MENSAGEM_PROVEDOR_FORA, MENSAGEM_SEM_APROVADOR, MENSAGEM_SEM_CONTA, MENSAGEM_SO_APROVADOR, alterarUsuario,
} from "../../src/autenticacao/gestaoDeUsuarios.ts";
import { gravarPerfil } from "../../src/autenticacao/perfis.ts";
import type { VerificadorDeSenha } from "../../src/autenticacao/verificadorSupabase.ts";
import { criarServidor } from "../../src/http/servidor.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { criarOrganizacao, ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";

/**
 * Painel de Usuários (fase Q, SPEC_FASE_Q.md): regras e rotas de /api/gestao/usuarios, com o Supabase
 * Auth simulado (contas e falha do provedor). A é a organização inicial; B, um segundo cliente.
 */
const conta = (id: string, email: string, nome: string, papel: string, senha: string) => ({ id, email, nome, papel, senha });
const MARCELO = conta("11111111-1111-4111-8111-111111111111", "marcelo@tendra.test", "Marcelo Vieira", "Aprovador", "s-marcelo");
const CARLA = conta("22222222-2222-4222-8222-222222222222", "carla@tendra.test", "Carla Diretora", "Aprovador", "s-carla");
const KADU = conta("33333333-3333-4333-8333-333333333333", "kadu@tendra.test", "Kadu Mendes", "Revisor", "s-kadu");
const PAULA = conta("44444444-4444-4444-8444-444444444444", "paula@tendra.test", "Paula Rocha", "Revisor", "s-paula");
const BRUNA = conta("55555555-5555-4555-8555-555555555555", "bruna@tendra.test", "Bruna Costa", "Aprovador", "s-bruna");
const NOVA = conta("66666666-6666-4666-8666-666666666666", "nova@tendra.test", "Ana Souza", "Revisor", "s-nova");
const HOMONIMO = conta("77777777-7777-4777-8777-777777777777", "outro.marcelo@tendra.test", "Marcelo Vieira", "Aprovador", "s-homonimo");
const CONTAS = [MARCELO, CARLA, KADU, PAULA, BRUNA, NOVA, HOMONIMO];

let banco: Banco;
let servidor: FastifyInstance;
let organizacaoB: string;
let provedorFora = false;

const verificador: VerificadorDeSenha = {
  async conferir(email, senha) {
    const encontrada = CONTAS.find((c) => c.email === email);
    return encontrada !== undefined && encontrada.senha === senha ? encontrada.id : null;
  },
};
// Contas que existem no Supabase Auth: todas as acima.
async function procurarConta(email: string): Promise<string | null> {
  if (provedorFora) throw new Error("Supabase Auth fora do ar.");
  return CONTAS.find((c) => c.email === email)?.id ?? null;
}

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  organizacaoB = (await criarOrganizacao(banco, "Organização B")).id;
  for (const perfil of [MARCELO, CARLA, KADU, PAULA, HOMONIMO]) await gravarPerfil(banco, { ...perfil, organizacaoId: ORGANIZACAO_INICIAL });
  await gravarPerfil(banco, { ...CARLA, areas: ["C-Level"], organizacaoId: ORGANIZACAO_INICIAL });
  await banco.query("UPDATE perfis SET ativo = false WHERE id = $1", [PAULA.id]);
  await gravarPerfil(banco, { ...BRUNA, organizacaoId: organizacaoB });
  servidor = criarServidor({ banco, autenticacao: { verificador, horasSemUso: 8, cookieSeguro: false, procurarConta } });
  await servidor.ready();
}, 60_000);

afterAll(async () => {
  await servidor.close();
  await banco.close();
});

async function entrar(c: { email: string; senha: string }): Promise<string> {
  const resposta = await servidor.inject({ method: "POST", url: "/api/auth/login", payload: { email: c.email, senha: c.senha } });
  expect(resposta.statusCode).toBe(200);
  return String(resposta.headers["set-cookie"]).split(";")[0] ?? "";
}
const pedir = (cookie: string, method: "GET" | "POST" | "PATCH", url: string, payload?: object) =>
  servidor.inject({ method, url, headers: { cookie }, ...(payload === undefined ? {} : { payload }) });
const perfil = async (id: string) => (await banco.query<{ papel: string; areas: string[]; ativo: boolean }>("SELECT papel, areas, ativo FROM perfis WHERE id = $1", [id])).rows[0];

describe("Cenários Q1 e Q2 · acesso e lista", () => {
  it("o Aprovador lista as pessoas da própria organização, com e-mail, a própria linha pelo id e as áreas válidas", async () => {
    const resposta = await pedir(await entrar(MARCELO), "GET", "/api/gestao/usuarios");
    expect(resposta.statusCode).toBe(200);
    const { usuarios, areasDoAprovador } = resposta.json();
    expect(usuarios.map((u: { email: string }) => u.email)).toEqual([CARLA.email, KADU.email, MARCELO.email, HOMONIMO.email, PAULA.email]);
    expect(usuarios.find((u: { email: string }) => u.email === CARLA.email)).toEqual({ id: CARLA.id, nome: "Carla Diretora", email: CARLA.email, papel: "Aprovador", areas: ["C-Level"], ativo: true, propria: false });
    // Dois "Marcelo Vieira": só o da sessão é a própria linha (DF3).
    expect(usuarios.filter((u: { propria: boolean }) => u.propria).map((u: { id: string }) => u.id)).toEqual([MARCELO.id]);
    expect(usuarios.find((u: { email: string }) => u.email === PAULA.email).ativo).toBe(false);
    expect(areasDoAprovador).toEqual(["Produto", "Tecnologia", "Segurança e privacidade", "Comercial", "Jurídico", "C-Level"]);
  });

  it("o Revisor recebe 403; sem sessão, 401", async () => {
    const revisor = await pedir(await entrar(KADU), "GET", "/api/gestao/usuarios");
    expect({ status: revisor.statusCode, erro: revisor.json().erro }).toEqual({ status: 403, erro: MENSAGEM_SO_APROVADOR });
    expect((await servidor.inject({ method: "GET", url: "/api/gestao/usuarios" })).statusCode).toBe(401);
  });
  // GET /api/usuarios (sem e-mail, cenários 62 e 74) é conferido em organizacoes.test.ts, com as tarefas ligadas.
});

describe("Cenários Q3, Q4 e Q13 · adicionar usuário", () => {
  it("recusa nome vazio, e-mail inválido, pessoa já na lista e de outra organização, sem gravar", async () => {
    const cookie = await entrar(MARCELO);
    const casos: [object, number, string][] = [
      [{ nome: "  ", email: NOVA.email }, 400, MENSAGEM_NOME_VAZIO],
      [{ nome: "Ana", email: "ana@tendra" }, 400, MENSAGEM_EMAIL_INVALIDO],
      [{ nome: "Kadu", email: "KADU@tendra.test" }, 409, MENSAGEM_JA_NA_LISTA],
      [{ nome: "Bruna", email: BRUNA.email }, 409, MENSAGEM_OUTRA_ORGANIZACAO],
      [{ nome: "Sem conta", email: "sem.conta@tendra.test" }, 404, MENSAGEM_SEM_CONTA],
    ];
    for (const [corpo, status, erro] of casos) {
      const resposta = await pedir(cookie, "POST", "/api/gestao/usuarios", corpo);
      expect({ status: resposta.statusCode, erro: resposta.json().erro }).toEqual({ status, erro });
    }
    // Pessoa já na lista não muda (Q4): Kadu continua Revisor e ativo.
    expect(await perfil(KADU.id)).toEqual({ papel: "Revisor", areas: [], ativo: true });
    expect(await perfil(NOVA.id)).toBeUndefined();
  });

  it("com o Supabase Auth fora do ar, responde 503 e não grava nada (Q13)", async () => {
    provedorFora = true;
    try {
      const resposta = await pedir(await entrar(MARCELO), "POST", "/api/gestao/usuarios", { nome: "Ana Souza", email: NOVA.email });
      expect({ status: resposta.statusCode, erro: resposta.json().erro }).toEqual({ status: 503, erro: MENSAGEM_PROVEDOR_FORA });
    } finally {
      provedorFora = false;
    }
    expect(await perfil(NOVA.id)).toBeUndefined();
  });

  it("adiciona como Revisor, área Geral, ativo, e a pessoa já consegue entrar", async () => {
    const resposta = await pedir(await entrar(MARCELO), "POST", "/api/gestao/usuarios", { nome: " Ana Souza ", email: "Nova@Tendra.test" });
    expect(resposta.statusCode).toBe(201);
    expect(resposta.json().usuario).toEqual({ id: NOVA.id, nome: "Ana Souza", email: NOVA.email, papel: "Revisor", areas: [], ativo: true, propria: false });
    const login = await servidor.inject({ method: "POST", url: "/api/auth/login", payload: { email: NOVA.email, senha: NOVA.senha } });
    expect(login.json().organizacao).toEqual({ nome: expect.any(String) });
  });
});

describe("Cenários Q5, Q6 e Q8 · papel e áreas", () => {
  it("Revisor vira Aprovador e recebe áreas; C-Level combinado e área no Revisor são recusados", async () => {
    const cookie = await entrar(MARCELO);
    expect((await pedir(cookie, "PATCH", `/api/gestao/usuarios/${KADU.id}`, { papel: "Aprovador" })).json().usuario).toMatchObject({ papel: "Aprovador", areas: [] });
    expect((await pedir(cookie, "PATCH", `/api/gestao/usuarios/${KADU.id}`, { areas: ["Jurídico", "Comercial"] })).json().usuario.areas).toEqual(["Jurídico", "Comercial"]);
    const combinado = await pedir(cookie, "PATCH", `/api/gestao/usuarios/${KADU.id}`, { areas: ["C-Level", "Jurídico"] });
    expect(combinado.statusCode).toBe(400);
    const invalida = await pedir(cookie, "PATCH", `/api/gestao/usuarios/${KADU.id}`, { areas: ["Marketing"] });
    expect(invalida.statusCode).toBe(400);
    const noRevisor = await pedir(cookie, "PATCH", `/api/gestao/usuarios/${KADU.id}`, { papel: "Revisor", areas: ["Jurídico"] });
    expect({ status: noRevisor.statusCode, erro: noRevisor.json().erro }).toEqual({ status: 400, erro: "Só o Aprovador tem área." });
    expect(await perfil(KADU.id)).toEqual({ papel: "Aprovador", areas: ["Jurídico", "Comercial"], ativo: true });
  });

  it("Aprovador para Revisor zera as áreas na mesma gravação", async () => {
    const resposta = await pedir(await entrar(MARCELO), "PATCH", `/api/gestao/usuarios/${KADU.id}`, { papel: "Revisor" });
    expect(resposta.json().usuario).toMatchObject({ papel: "Revisor", areas: [] });
    expect(await perfil(KADU.id)).toEqual({ papel: "Revisor", areas: [], ativo: true });
  });

  it("a própria pessoa não muda o próprio papel nem o próprio acesso, mas muda as próprias áreas", async () => {
    const cookie = await entrar(MARCELO);
    for (const corpo of [{ papel: "Revisor" }, { ativo: false }]) {
      const resposta = await pedir(cookie, "PATCH", `/api/gestao/usuarios/${MARCELO.id}`, corpo);
      expect({ status: resposta.statusCode, erro: resposta.json().erro }).toEqual({ status: 403, erro: MENSAGEM_PROPRIO_ACESSO });
    }
    expect((await pedir(cookie, "PATCH", `/api/gestao/usuarios/${MARCELO.id}`, { areas: ["Produto"] })).json().usuario.areas).toEqual(["Produto"]);
  });

  it("a organização nunca fica sem Aprovador ativo", async () => {
    const organizacaoC = (await criarOrganizacao(banco, "Organização C")).id;
    const unico = "88888888-8888-4888-8888-888888888888";
    await gravarPerfil(banco, { id: unico, email: "unico@tendra.test", nome: "Único", papel: "Aprovador", organizacaoId: organizacaoC });
    // Chamada direta à regra, como se outra pessoa pedisse: o último Aprovador não sai.
    await expect(alterarUsuario(banco, { organizacaoId: organizacaoC, idDaSessao: "outra", id: unico, mudanca: { ativo: false } })).rejects.toThrow(MENSAGEM_SEM_APROVADOR);
    await expect(alterarUsuario(banco, { organizacaoId: organizacaoC, idDaSessao: "outra", id: unico, mudanca: { papel: "Revisor" } })).rejects.toThrow(MENSAGEM_SEM_APROVADOR);
    expect(await perfil(unico)).toEqual({ papel: "Aprovador", areas: [], ativo: true });
  });

  it("dois Aprovadores rebaixando um ao outro ao mesmo tempo: um dos pedidos é recusado", async () => {
    const organizacaoD = (await criarOrganizacao(banco, "Organização D")).id;
    const x = conta("99999999-9999-4999-8999-999999999991", "x@tendra.test", "X", "Aprovador", "s-x");
    const y = conta("99999999-9999-4999-8999-999999999992", "y@tendra.test", "Y", "Aprovador", "s-y");
    CONTAS.push(x, y);
    for (const c of [x, y]) await gravarPerfil(banco, { ...c, organizacaoId: organizacaoD });
    const [cookieX, cookieY] = [await entrar(x), await entrar(y)];
    const respostas = await Promise.all([
      pedir(cookieX, "PATCH", `/api/gestao/usuarios/${y.id}`, { papel: "Revisor" }),
      pedir(cookieY, "PATCH", `/api/gestao/usuarios/${x.id}`, { papel: "Revisor" }),
    ]);
    expect(respostas.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    const { rows } = await banco.query<{ n: number }>("SELECT count(*)::int AS n FROM perfis WHERE organizacao_id = $1 AND ativo AND papel = 'Aprovador'", [organizacaoD]);
    expect(rows[0]?.n).toBe(1);
  });
});

describe("Cenários Q7 e Q9 · acesso e efeito nas sessões", () => {
  it("a mudança de papel vale no próximo pedido da pessoa, sem novo login", async () => {
    const cookieDaNova = await entrar(NOVA);
    expect((await pedir(cookieDaNova, "GET", "/api/gestao/usuarios")).statusCode).toBe(403);
    await pedir(await entrar(MARCELO), "PATCH", `/api/gestao/usuarios/${NOVA.id}`, { papel: "Aprovador" });
    expect((await pedir(cookieDaNova, "GET", "/api/gestao/usuarios")).statusCode).toBe(200);
  });

  it("desativar apaga as sessões: o próximo pedido recebe 401 e o login é recusado; reativar devolve o acesso", async () => {
    const cookieDaNova = await entrar(NOVA);
    const cookie = await entrar(MARCELO);
    expect((await pedir(cookie, "PATCH", `/api/gestao/usuarios/${NOVA.id}`, { ativo: false })).json().usuario).toMatchObject({ ativo: false, papel: "Aprovador" });
    const { rows } = await banco.query("SELECT 1 FROM sessoes WHERE perfil_id = $1", [NOVA.id]);
    expect(rows).toEqual([]);
    expect((await pedir(cookieDaNova, "GET", "/api/tarefas")).statusCode).toBe(401);
    expect((await servidor.inject({ method: "POST", url: "/api/auth/login", payload: { email: NOVA.email, senha: NOVA.senha } })).statusCode).toBe(401);
    expect((await pedir(cookie, "PATCH", `/api/gestao/usuarios/${NOVA.id}`, { ativo: true })).json().usuario).toMatchObject({ ativo: true, papel: "Aprovador" });
    await entrar(NOVA);
  });
});

describe("Cenário Q10 · isolamento entre organizações", () => {
  it("o Aprovador de B não vê nem altera pessoas de A", async () => {
    const cookie = await entrar(BRUNA);
    expect((await pedir(cookie, "GET", "/api/gestao/usuarios")).json().usuarios.map((u: { email: string }) => u.email)).toEqual([BRUNA.email]);
    const alterar = await pedir(cookie, "PATCH", `/api/gestao/usuarios/${KADU.id}`, { papel: "Aprovador" });
    expect({ status: alterar.statusCode, erro: alterar.json().erro }).toEqual({ status: 404, erro: MENSAGEM_PESSOA_NAO_ENCONTRADA });
    expect(await perfil(KADU.id)).toEqual({ papel: "Revisor", areas: [], ativo: true });
  });

  it("identificador inexistente responde 404; fora do formato, 400", async () => {
    const cookie = await entrar(MARCELO);
    expect((await pedir(cookie, "PATCH", "/api/gestao/usuarios/00000000-0000-4000-8000-000000000000", { ativo: false })).statusCode).toBe(404);
    expect((await pedir(cookie, "PATCH", "/api/gestao/usuarios/abc", { ativo: false })).statusCode).toBe(400);
    expect((await pedir(cookie, "PATCH", `/api/gestao/usuarios/${KADU.id}`, {})).statusCode).toBe(400);
  });
});
