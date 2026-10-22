import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const pastaBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const comando = path.join(pastaBackend, "src", "cli", "carregarBase.ts");
const PULSE = path.resolve(pastaBackend, "../base-sintetica/pulse-beneficios");

let pastaDados: string;

beforeEach(async () => {
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-dados-"));
});

afterEach(async () => {
  await rm(pastaDados, { recursive: true, force: true });
});

/** Executa o comando sem ANTHROPIC_API_KEY: a carga não depende da chave. */
function executar(...argumentos: string[]) {
  return spawnSync(process.execPath, [comando, ...argumentos], {
    cwd: pastaBackend,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "", SystemRoot: process.env.SystemRoot ?? "", TENDRA_PASTA_DADOS: pastaDados },
  });
}

// Cada execução cria o banco em disco do zero, o que leva alguns segundos.
const LIMITE = 120_000;

describe("Comando carregar-base", () => {
  it("carrega a base sem a chave da API e grava o banco na pasta de dados", () => {
    const resultado = executar(path.join(PULSE, "base"), "--enviado-por", "Kadu Mendes");
    expect(resultado.status).toBe(0);
    expect(resultado.stdout).toContain("Carregados: 16");

    const segunda = executar(path.join(PULSE, "base"));
    expect(segunda.status).toBe(0);
    expect(segunda.stdout).toContain("Sem mudança: 16");
  }, LIMITE);

  it("termina com código 1 quando algum arquivo é recusado e lista os motivos", () => {
    const resultado = executar(path.join(PULSE, "casos-de-carga"));
    expect(resultado.status).toBe(1);
    expect(resultado.stdout).toContain("Recusados: 10");
    expect(resultado.stdout).toContain('tipo-invalido.md: tipo inválido "politica". Use documento ou rfp-passada.');
  }, LIMITE);

  it("não abre o banco enquanto outro processo (o servidor) o usa, e libera a trava ao terminar", async () => {
    await writeFile(path.join(pastaDados, "banco.em-uso"), String(process.pid));
    const emUso = executar(path.join(PULSE, "base"));
    expect(emUso.status).toBe(1);
    expect(emUso.stderr).toContain("O banco de dados está em uso por outro processo");

    await writeFile(path.join(pastaDados, "banco.em-uso"), "999999999");
    const travaAbandonada = executar(path.join(PULSE, "base"));
    expect(travaAbandonada.status).toBe(0);
    expect(await readdir(pastaDados)).toEqual(["banco"]);
  }, LIMITE);

  it("mostra o uso sem pasta e falha com pasta inexistente", () => {
    expect(executar().status).toBe(1);
    expect(executar().stderr).toContain("Uso: npm run carregar-base");
    const inexistente = executar(path.join(PULSE, "nao-existe"));
    expect(inexistente.status).toBe(1);
    expect(inexistente.stderr).toContain("Pasta não encontrada");
  }, LIMITE);
});
