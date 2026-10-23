import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { criarArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { ErroDoProvedorDeLogin, type VerificadorDeSenha } from "../../src/autenticacao/verificadorSupabase.ts";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarPessoas } from "../../src/config/pessoas.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { criarTarefaComPlanilha, executarTarefa } from "../../src/fluxo/executarTarefa.ts";
import { MENSAGEM_DE_LOGIN_RECUSADO } from "../../src/http/rotasDeAutenticacao.ts";
import { criarServidor } from "../../src/http/servidor.ts";
import { carregarPrecos } from "../../src/observabilidade/metricas.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { listarEventos } from "../../src/revisao/revisao.ts";
import { ApiSimulada } from "../apoio/apiSimulada.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import { respondeImparesCitando } from "../apoio/respostasSimuladas.ts";

/** Login, sessão e pessoa da sessão (etapa D4, cenários D1 a D6), com o Supabase Auth simulado. */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-sonnet-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };
const APROVADOR = { id: "11111111-1111-4111-8111-111111111111", email: "marcelo.aprovador@tendra.test", nome: "Marcelo Vieira", papel: "Aprovador" };
const REVISOR = { id: "22222222-2222-4222-8222-222222222222", email: "kadu.revisor@tendra.test", nome: "Kadu Mendes", papel: "Revisor" };
const SENHAS: Record<string, { senha: string; id: string }> = {
  [APROVADOR.email]: { senha: "senha-do-aprovador", id: APROVADOR.id },
  [REVISOR.email]: { senha: "senha-do-revisor", id: REVISOR.id },
  "sem.perfil@tendra.test": { senha: "senha-sem-perfil", id: "33333333-3333-4333-8333-333333333333" },
};

let banco: Banco;
let pastaDados: string;
let servidor: FastifyInstance;
let tarefaId: string;
let provedorFora = false;
const conferidos: string[] = [];

const verificador: VerificadorDeSenha = {
  async conferir(email, senha) {
    if (provedorFora) throw new ErroDoProvedorDeLogin("O serviço de login respondeu 500.");
    conferidos.push(email);
    const conta = SENHAS[email];
    return conta !== undefined && conta.senha === senha ? conta.id : null;
  },
};

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-autenticacao-"));
  await carregarBase({ pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
  for (const perfil of [APROVADOR, REVISOR]) {
    await banco.query("INSERT INTO perfis (id, email, nome, papel) VALUES ($1, $2, $3, $4)", [perfil.id, perfil.email, perfil.nome, perfil.papel]);
  }
  const api = new ApiSimulada();
  api.respostas = [respondeImparesCitando];
  const tarefas = {
    banco,
    armazenamento: criarArmazenamento(pastaDados),
    api,
    ia: IA,
    nomesDeCabecalho: await carregarCabecalhos(),
    termosCriticos: await carregarTermosCriticos(),
    precos: await carregarPrecos(),
    pessoas: await carregarPessoas(),
    hoje: () => "2026-10-21",
  };
  const tarefa = await criarTarefaComPlanilha(tarefas, { arquivo: "RFP-01.xlsx", planilha: new Uint8Array(await readFile(path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx"))), dados: {} });
  await executarTarefa(tarefas, tarefa);
  tarefaId = tarefa.id;
  servidor = criarServidor({ banco, tarefas, autenticacao: { verificador, horasSemUso: 8, cookieSeguro: true } });
  await servidor.ready();
}, 60_000);

afterAll(async () => {
  await servidor.close();
  await banco.close();
  await rm(pastaDados, { recursive: true, force: true });
});

beforeEach(async () => {
  provedorFora = false;
  await banco.exec("DELETE FROM sessoes");
  await banco.exec("UPDATE perfis SET ativo = true");
});

const entrar = (email: string, senha: string) => servidor.inject({ method: "POST", url: "/api/auth/login", payload: { email, senha } });

async function cookieDe(email: string, senha: string): Promise<string> {
  const resposta = await entrar(email, senha);
  expect(resposta.statusCode).toBe(200);
  const cabecalho = String(resposta.headers["set-cookie"]);
  return cabecalho.split(";")[0] ?? "";
}

const pedir = (url: string, cookie?: string, metodo: "GET" | "POST" | "PUT" = "GET", payload?: object) =>
  servidor.inject({ method: metodo, url, ...(cookie === undefined ? {} : { headers: { cookie } }), ...(payload === undefined ? {} : { payload }) });

describe("Cenário D1 · login com credenciais válidas", () => {
  it("cria a sessão, grava o cookie seguro e devolve nome e papel; o e-mail é normalizado", async () => {
    const resposta = await entrar("  Marcelo.Aprovador@Tendra.test ", "senha-do-aprovador");
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ pessoa: { nome: "Marcelo Vieira", papel: "Aprovador" } });
    const cookie = String(resposta.headers["set-cookie"]);
    expect(cookie).toMatch(/^tendra_sessao=[A-Za-z0-9_-]{43}; Path=\/; HttpOnly; SameSite=Lax; Secure$/);
    const { rows } = await banco.query<{ id_hash: string }>("SELECT id_hash FROM sessoes");
    expect(rows).toHaveLength(1);
    expect(cookie).not.toContain(rows[0]?.id_hash ?? "?");
    expect((await pedir("/api/base/documentos", cookie.split(";")[0])).statusCode).toBe(200);
  });
});

describe("Cenário D2 · credenciais inválidas", () => {
  it.each([
    ["e-mail inexistente", "ninguem@tendra.test", "qualquer"],
    ["senha errada", APROVADOR.email, "senha-errada"],
    ["conta sem perfil", "sem.perfil@tendra.test", "senha-sem-perfil"],
    ["senha vazia", APROVADOR.email, ""],
  ])("%s: 401 com a mesma mensagem e nenhuma sessão", async (_caso, email, senha) => {
    const resposta = await entrar(email, senha);
    expect(resposta.statusCode).toBe(401);
    expect(resposta.json()).toEqual({ erro: MENSAGEM_DE_LOGIN_RECUSADO });
    expect(resposta.headers["set-cookie"]).toBeUndefined();
    expect((await banco.query("SELECT * FROM sessoes")).rows).toEqual([]);
  });

  it("conta desativada: mesma mensagem, e as sessões abertas deixam de valer", async () => {
    const cookie = await cookieDe(REVISOR.email, "senha-do-revisor");
    await banco.query("UPDATE perfis SET ativo = false WHERE id = $1", [REVISOR.id]);
    expect((await entrar(REVISOR.email, "senha-do-revisor")).json()).toEqual({ erro: MENSAGEM_DE_LOGIN_RECUSADO });
    expect((await pedir("/api/auth/me", cookie)).statusCode).toBe(401);
  });

  it("serviço de login fora do ar: 503, sem sessão", async () => {
    provedorFora = true;
    const resposta = await entrar(APROVADOR.email, "senha-do-aprovador");
    expect(resposta.statusCode).toBe(503);
    expect((await banco.query("SELECT * FROM sessoes")).rows).toEqual([]);
  });
});

describe("Cenário D3 · acesso sem sessão", () => {
  it.each([
    ["GET", "/api/base/documentos"],
    ["GET", "/api/tarefas"],
    ["GET", "/api/pessoas"],
    ["GET", "/api/auth/me"],
    ["GET", "/api/tarefas/00000000-0000-4000-8000-000000000000/itens"],
    ["POST", "/api/tarefas/00000000-0000-4000-8000-000000000000/itens/1/aprovar"],
  ] as const)("%s %s: 401 sem dados, com ou sem um cookie inventado", async (metodo, url) => {
    for (const cookie of [undefined, "tendra_sessao=" + "a".repeat(43), "tendra_sessao=curto"]) {
      const resposta = await pedir(url, cookie, metodo, metodo === "POST" ? {} : undefined);
      expect(resposta.statusCode).toBe(401);
      expect(resposta.json()).toEqual({ erro: "Sessão inválida ou expirada. Entre novamente." });
    }
  });

  it("só o login e a saúde respondem sem sessão", async () => {
    expect((await pedir("/api/saude")).json()).toEqual({ ok: true });
  });
});

describe("Cenário D4 · autor definido pela sessão", () => {
  it("ignora a pessoa enviada no corpo e registra a ação com o nome e o papel da sessão", async () => {
    const cookie = await cookieDe(REVISOR.email, "senha-do-revisor");
    const resposta = await pedir(`/api/tarefas/${tarefaId}/itens/1/avaliacao`, cookie, "PUT", { pessoa: "marcelo", valor: "positiva" });
    expect(resposta.statusCode).toBe(200);
    const [evento] = await listarEventos(banco, tarefaId);
    expect(evento).toMatchObject({ acao: "avaliacao", pessoa: "Kadu Mendes", papel: "Revisor" });
  });

  it("/api/auth/me e /api/pessoas devolvem só a pessoa da sessão", async () => {
    const cookie = await cookieDe(APROVADOR.email, "senha-do-aprovador");
    expect((await pedir("/api/auth/me", cookie)).json()).toEqual({ pessoa: { nome: "Marcelo Vieira", papel: "Aprovador" } });
    expect((await pedir("/api/pessoas", cookie)).json()).toEqual({ pessoas: [{ id: APROVADOR.id, nome: "Marcelo Vieira", papel: "Aprovador" }] });
  });

  it("o envio de documentos grava quem enviou pela sessão, não pelo corpo", async () => {
    const cookie = await cookieDe(APROVADOR.email, "senha-do-aprovador");
    const md = "---\ntitulo: Documento de teste\ntipo: documento\natualizado_em: 2026-10-01\n---\n\n# Seção\n\nTexto.\n";
    const resposta = await pedir("/api/base/documentos", cookie, "POST", {
      enviadoPor: "Outra Pessoa",
      arquivos: [{ nome: "teste-sessao.md", conteudoBase64: Buffer.from(md).toString("base64") }],
    });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json().documentos.find((d: { nome: string }) => d.nome === "teste-sessao.md")).toMatchObject({ enviadoPor: "Marcelo Vieira" });
  });
});

describe("Cenários D5 e D6 · sair e expirar", () => {
  it("sair apaga a sessão e limpa o cookie; o mesmo cookie passa a receber 401", async () => {
    const cookie = await cookieDe(APROVADOR.email, "senha-do-aprovador");
    const saida = await pedir("/api/auth/logout", cookie, "POST");
    expect(saida.statusCode).toBe(200);
    expect(String(saida.headers["set-cookie"])).toContain("tendra_sessao=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0");
    expect((await banco.query("SELECT * FROM sessoes")).rows).toEqual([]);
    expect((await pedir("/api/tarefas", cookie)).statusCode).toBe(401);
  });

  it("sessão sem uso por mais de 8 horas expira e é apagada; o uso renova o prazo", async () => {
    const cookie = await cookieDe(APROVADOR.email, "senha-do-aprovador");
    await banco.exec("UPDATE sessoes SET ultimo_uso = now() - interval '7 hours 59 minutes'");
    expect((await pedir("/api/auth/me", cookie)).statusCode).toBe(200);
    const { rows } = await banco.query<{ recente: boolean }>("SELECT ultimo_uso > now() - interval '1 minute' AS recente FROM sessoes");
    expect(rows).toEqual([{ recente: true }]);

    await banco.exec("UPDATE sessoes SET ultimo_uso = now() - interval '8 hours 1 minute'");
    expect((await pedir("/api/auth/me", cookie)).statusCode).toBe(401);
    expect((await banco.query("SELECT * FROM sessoes")).rows).toEqual([]);
  });
});
