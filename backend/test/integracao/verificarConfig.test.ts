import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pastaBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const comando = path.join(pastaBackend, "src", "cli", "verificarConfig.ts");
const CHAVE_FALSA = "chave-falsa-de-teste-123";

function executar(ambiente: Record<string, string>) {
  return spawnSync(process.execPath, [comando], {
    cwd: pastaBackend,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "", SystemRoot: process.env.SystemRoot ?? "", ...ambiente },
  });
}

describe("Cenário 27 · o backend não inicia sem a chave", () => {
  it("termina com código 1 e informa o nome da variável que falta", () => {
    const resultado = executar({});

    expect(resultado.status).toBe(1);
    expect(resultado.stderr).toContain("ANTHROPIC_API_KEY");
  });

  it("termina com código 0 quando a configuração é válida, sem exibir a chave", () => {
    const resultado = executar({ ANTHROPIC_API_KEY: CHAVE_FALSA });

    expect(resultado.status).toBe(0);
    expect(resultado.stdout).toContain("Configuração válida");
    expect(resultado.stdout + resultado.stderr).not.toContain(CHAVE_FALSA);
  });
});
