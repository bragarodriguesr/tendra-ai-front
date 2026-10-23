import { describe, expect, it } from "vitest";
import { carregarConfiguracaoDoServidor, ErroDeConfiguracao } from "../../src/config/config.ts";

/** Cenário D11 · configuração obrigatória do modo compartilhado (etapa D2). */
const PASTA_BASE = "/tmp";
const CHAVE_DE_SERVICO = "chave-de-servico-falsa-que-nunca-aparece";
const COMPLETO = {
  TENDRA_MODO: "compartilhado",
  ANTHROPIC_API_KEY: "chave-da-api-falsa",
  DATABASE_URL: "postgres://usuario:senha-falsa@host:5432/postgres",
  SUPABASE_URL: "https://projeto.supabase.co/",
  SUPABASE_SERVICE_ROLE_KEY: CHAVE_DE_SERVICO,
  TENDRA_ORIGEM_DO_FRONT: "https://tendra.vercel.app",
};

function mensagemDoErro(ambiente: NodeJS.ProcessEnv): string {
  try {
    carregarConfiguracaoDoServidor(ambiente, PASTA_BASE);
  } catch (erro) {
    if (erro instanceof ErroDeConfiguracao) return erro.message;
    throw erro;
  }
  throw new Error("a configuração deveria ter sido recusada");
}

describe("Cenário D11 · modo compartilhado", () => {
  it("sem TENDRA_MODO, o servidor fica no modo local", () => {
    expect(carregarConfiguracaoDoServidor({ TENDRA_API_SIMULADA: "1" }, PASTA_BASE).modo).toEqual({ tipo: "local" });
  });

  it("não inicia sem as variáveis obrigatórias e lista o nome de cada uma", () => {
    const mensagem = mensagemDoErro({ TENDRA_MODO: "compartilhado" });
    for (const nome of ["ANTHROPIC_API_KEY", "DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "TENDRA_ORIGEM_DO_FRONT"]) {
      expect(mensagem).toContain(nome);
    }
  });

  it("lê o modo completo, sem barra no fim dos endereços", () => {
    const configuracao = carregarConfiguracaoDoServidor(COMPLETO, PASTA_BASE);
    expect(configuracao.modo).toEqual({
      tipo: "compartilhado",
      supabaseUrl: "https://projeto.supabase.co",
      chaveDeServico: CHAVE_DE_SERVICO,
      origemDoFront: "https://tendra.vercel.app",
    });
    expect(configuracao.api).toEqual({ tipo: "real", chaveApi: "chave-da-api-falsa" });
    expect(configuracao.bancoUrl).toBe(COMPLETO.DATABASE_URL);
  });

  it.each([
    ["SUPABASE_URL sem HTTPS", { SUPABASE_URL: "http://projeto.supabase.co" }, /SUPABASE_URL inválida/],
    ["origem do front com caminho", { TENDRA_ORIGEM_DO_FRONT: "https://tendra.vercel.app/app" }, /TENDRA_ORIGEM_DO_FRONT inválida/],
    ["API simulada", { TENDRA_API_SIMULADA: "1" }, /TENDRA_API_SIMULADA não é aceita/],
    ["modo desconhecido", { TENDRA_MODO: "publico" }, /TENDRA_MODO inválida/],
  ])("recusa %s", (_caso, alteracao, motivo) => {
    expect(mensagemDoErro({ ...COMPLETO, ...alteracao })).toMatch(motivo);
  });

  it("nunca mostra os valores das variáveis na mensagem", () => {
    const mensagem = mensagemDoErro({ ...COMPLETO, ANTHROPIC_API_KEY: "", SUPABASE_URL: "http://x" });
    for (const valor of [CHAVE_DE_SERVICO, "senha-falsa", "http://x"]) expect(mensagem).not.toContain(valor);
  });
});
