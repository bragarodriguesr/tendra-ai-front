import path from "node:path";
import { describe, expect, it } from "vitest";
import { carregarConfiguracao, carregarConfiguracaoSemChave, ErroDeConfiguracao } from "../../src/config/config.ts";

const CHAVE_FALSA = "chave-falsa-de-teste-123";
const PASTA_BASE = path.resolve("/tmp/tendra/backend");

describe("Cenário 27 · configuração do backend", () => {
  it("recusa iniciar sem ANTHROPIC_API_KEY e informa o nome da variável", () => {
    expect(() => carregarConfiguracao({}, PASTA_BASE)).toThrow(ErroDeConfiguracao);
    expect(() => carregarConfiguracao({}, PASTA_BASE)).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("trata a chave vazia ou só com espaços como ausente", () => {
    expect(() => carregarConfiguracao({ ANTHROPIC_API_KEY: "   " }, PASTA_BASE)).toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });

  it("aceita a chave e aplica os valores padrão", () => {
    const configuracao = carregarConfiguracao({ ANTHROPIC_API_KEY: CHAVE_FALSA }, PASTA_BASE);
    expect(configuracao.chaveApi).toBe(CHAVE_FALSA);
    expect(configuracao.nivelDeLog).toBe("info");
    expect(configuracao.pastaDados).toBe(path.resolve(PASTA_BASE, "../dados"));
  });

  it("resolve a pasta de dados informada a partir da pasta do backend", () => {
    const configuracao = carregarConfiguracao(
      { ANTHROPIC_API_KEY: CHAVE_FALSA, TENDRA_PASTA_DADOS: "dados-teste" },
      PASTA_BASE,
    );
    expect(configuracao.pastaDados).toBe(path.resolve(PASTA_BASE, "dados-teste"));
  });

  it("recusa nível de log inválido e lista todos os problemas juntos", () => {
    let mensagem = "";
    try {
      carregarConfiguracao({ TENDRA_NIVEL_LOG: "verboso" }, PASTA_BASE);
    } catch (erro) {
      mensagem = (erro as Error).message;
    }
    expect(mensagem).toMatch(/ANTHROPIC_API_KEY/);
    expect(mensagem).toMatch(/TENDRA_NIVEL_LOG/);
  });

  it("nunca inclui o valor da chave na mensagem de erro", () => {
    let mensagem = "";
    try {
      carregarConfiguracao({ ANTHROPIC_API_KEY: CHAVE_FALSA, TENDRA_NIVEL_LOG: "verboso" }, PASTA_BASE);
    } catch (erro) {
      mensagem = (erro as Error).message;
    }
    expect(mensagem).toMatch(/TENDRA_NIVEL_LOG/);
    expect(mensagem).not.toContain(CHAVE_FALSA);
  });
});

describe("Configuração dos comandos que não chamam a IA", () => {
  it("não exige ANTHROPIC_API_KEY e aplica os mesmos padrões", () => {
    const configuracao = carregarConfiguracaoSemChave({}, PASTA_BASE);
    expect(configuracao).toEqual({ pastaDados: path.resolve(PASTA_BASE, "../dados"), nivelDeLog: "info", porta: 3000 });
    expect(configuracao).not.toHaveProperty("chaveApi");
  });

  it("continua recusando nível de log inválido", () => {
    expect(() => carregarConfiguracaoSemChave({ TENDRA_NIVEL_LOG: "verboso" }, PASTA_BASE)).toThrow(/TENDRA_NIVEL_LOG/);
  });

  it("lê a porta do servidor de TENDRA_PORTA", () => {
    expect(carregarConfiguracaoSemChave({ TENDRA_PORTA: "4010" }, PASTA_BASE).porta).toBe(4010);
  });

  it.each(["0", "70000", "abc", "30.5"])("recusa TENDRA_PORTA inválida (%s)", (porta) => {
    expect(() => carregarConfiguracaoSemChave({ TENDRA_PORTA: porta }, PASTA_BASE)).toThrow(/TENDRA_PORTA/);
  });
});
