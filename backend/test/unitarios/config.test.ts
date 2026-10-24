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

describe("Cenário 38 · configuração da IA", () => {
  it("usa os padrões: Sonnet 5.5 na geração (temporário), Haiku 5.5 na identificação, Sonnet 5.5 no conflito, esforço medium e lote de 10", () => {
    expect(carregarConfiguracao({ ANTHROPIC_API_KEY: CHAVE_FALSA }, PASTA_BASE).ia).toEqual({
      modelo: "claude-sonnet-5-5",
      modeloDeIdentificacao: "claude-haiku-5-5",
      modeloDeConflito: "claude-sonnet-5-5",
      esforco: "medium",
      tamanhoDoLote: 10,
    });
  });

  it("lê modelo, esforço e lote das variáveis de ambiente", () => {
    const { ia } = carregarConfiguracao(
      {
        ANTHROPIC_API_KEY: CHAVE_FALSA,
        TENDRA_MODELO: "claude-sonnet-5-5",
        TENDRA_MODELO_IDENTIFICACAO: "claude-haiku-5-5",
        TENDRA_MODELO_CONFLITO: "claude-sonnet-5-5",
        TENDRA_ESFORCO: "high",
        TENDRA_TAMANHO_LOTE: "5",
      },
      PASTA_BASE,
    );
    expect(ia).toEqual({
      modelo: "claude-sonnet-5-5",
      modeloDeIdentificacao: "claude-haiku-5-5",
      modeloDeConflito: "claude-sonnet-5-5",
      esforco: "high",
      tamanhoDoLote: 5,
    });
  });

  it("recusa esforço e tamanho de lote inválidos", () => {
    expect(() => carregarConfiguracao({ ANTHROPIC_API_KEY: CHAVE_FALSA, TENDRA_ESFORCO: "alto" }, PASTA_BASE)).toThrow(/TENDRA_ESFORCO/);
    expect(() => carregarConfiguracao({ ANTHROPIC_API_KEY: CHAVE_FALSA, TENDRA_TAMANHO_LOTE: "0" }, PASTA_BASE)).toThrow(/TENDRA_TAMANHO_LOTE/);
    expect(() => carregarConfiguracao({ ANTHROPIC_API_KEY: CHAVE_FALSA, TENDRA_TAMANHO_LOTE: "51" }, PASTA_BASE)).toThrow(/TENDRA_TAMANHO_LOTE/);
  });
});

describe("Configuração dos comandos que não chamam a IA", () => {
  it("não exige ANTHROPIC_API_KEY e aplica os mesmos padrões", () => {
    const configuracao = carregarConfiguracaoSemChave({}, PASTA_BASE);
    expect(configuracao).toEqual({ pastaDados: path.resolve(PASTA_BASE, "../dados"), nivelDeLog: "info", porta: 3000, bancoUrl: null, bancoCa: null });
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

  it("lê o certificado do Postgres de TENDRA_BANCO_CA e recusa o que não é PEM (etapa D10)", () => {
    const pem = "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----";
    expect(carregarConfiguracaoSemChave({ TENDRA_BANCO_CA: pem }, PASTA_BASE).bancoCa).toBe(pem);
    expect(() => carregarConfiguracaoSemChave({ TENDRA_BANCO_CA: "segredo" }, PASTA_BASE)).toThrow(/^TENDRA_BANCO_CA inválida/);
  });

  it("lê a conexão do Postgres de DATABASE_URL e recusa outro formato, sem mostrar o valor (etapa D1)", () => {
    expect(carregarConfiguracaoSemChave({ DATABASE_URL: " postgres://u@h:5432/b " }, PASTA_BASE).bancoUrl).toBe("postgres://u@h:5432/b");
    expect(() => carregarConfiguracaoSemChave({ DATABASE_URL: "mysql://u:segredo@h/b" }, PASTA_BASE)).toThrow(/^DATABASE_URL inválida\. Use uma conexão postgres:\/\/\.$/);
  });
});
