import { describe, expect, it } from "vitest";
import { criarLog } from "../../src/observabilidade/log.ts";

const CHAVE_FALSA = "chave-falsa-de-teste-123";

function capturarLinhas() {
  const linhas: string[] = [];
  return { linhas, destino: { write: (linha: string) => void linhas.push(linha) } };
}

describe("Cenários 27 e 29 · logs sem a chave da API", () => {
  it("grava eventos em JSON, uma linha por evento", () => {
    const { linhas, destino } = capturarLinhas();
    criarLog("info", destino).info({ tarefa: "t1" }, "Tarefa criada");

    expect(linhas).toHaveLength(1);
    expect(JSON.parse(linhas[0] ?? "")).toMatchObject({ tarefa: "t1", msg: "Tarefa criada" });
  });

  it("omite a chave mesmo quando ela é passada por engano", () => {
    const { linhas, destino } = capturarLinhas();
    const log = criarLog("info", destino);

    log.info({ chaveApi: CHAVE_FALSA }, "a");
    log.info({ cliente: { apiKey: CHAVE_FALSA } }, "b");
    log.info({ requisicao: { headers: { "x-api-key": CHAVE_FALSA } } }, "c");
    log.info({ ANTHROPIC_API_KEY: CHAVE_FALSA }, "d");

    expect(linhas).toHaveLength(4);
    for (const linha of linhas) {
      expect(linha).not.toContain(CHAVE_FALSA);
      expect(linha).toContain("[omitido]");
    }
  });

  it("respeita o nível configurado", () => {
    const { linhas, destino } = capturarLinhas();
    const log = criarLog("warn", destino);

    log.info("ignorado");
    log.warn("registrado");

    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toContain("registrado");
  });
});
