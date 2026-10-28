import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarArmazenamento, ErroDeArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";

let pastaDados: string;

beforeEach(async () => {
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-armazenamento-"));
});

afterEach(async () => {
  await rm(pastaDados, { recursive: true, force: true });
});

describe("Cenário 31 · arquivos gravados com nome gerado pelo backend", () => {
  it("grava na subpasta com nome gerado e lê de volta o mesmo conteúdo", async () => {
    const armazenamento = criarArmazenamento(pastaDados);
    const conteudo = new TextEncoder().encode("conteúdo de teste");

    const caminho = await armazenamento.salvar(ORGANIZACAO_INICIAL, "rfps", conteudo, "xlsx");

    expect(caminho).toMatch(new RegExp(`^${ORGANIZACAO_INICIAL}[\\\\/]rfps[\\\\/][0-9a-f-]{36}\\.xlsx$`));
    expect(await armazenamento.ler(ORGANIZACAO_INICIAL, caminho)).toEqual(Buffer.from(conteudo));
  });

  it("gera um nome diferente a cada gravação", async () => {
    const armazenamento = criarArmazenamento(pastaDados);
    const conteudo = new Uint8Array([1, 2, 3]);

    const primeiro = await armazenamento.salvar(ORGANIZACAO_INICIAL, "rfps", conteudo, "xlsx");
    const segundo = await armazenamento.salvar(ORGANIZACAO_INICIAL, "rfps", conteudo, "xlsx");

    expect(primeiro).not.toBe(segundo);
  });

  it("recusa extensão que poderia virar caminho", async () => {
    const armazenamento = criarArmazenamento(pastaDados);
    const conteudo = new Uint8Array([1]);

    await expect(armazenamento.salvar(ORGANIZACAO_INICIAL, "rfps", conteudo, "../xlsx")).rejects.toThrow(
      ErroDeArmazenamento,
    );
    await expect(armazenamento.salvar(ORGANIZACAO_INICIAL, "rfps", conteudo, "XLSX")).rejects.toThrow(
      ErroDeArmazenamento,
    );
  });

  it("recusa ler fora da pasta de dados", async () => {
    const armazenamento = criarArmazenamento(pastaDados);

    await expect(armazenamento.ler(ORGANIZACAO_INICIAL, "../fora.txt")).rejects.toThrow(ErroDeArmazenamento);
    await expect(armazenamento.ler(ORGANIZACAO_INICIAL, path.resolve("/etc/passwd"))).rejects.toThrow(
      ErroDeArmazenamento,
    );
    await expect(armazenamento.ler(ORGANIZACAO_INICIAL, "")).rejects.toThrow(ErroDeArmazenamento);
  });
});

describe("Cenário 60 · arquivos da tarefa excluída", () => {
  it("apaga o arquivo; apagar de novo não é erro; fora da pasta de dados é recusado", async () => {
    const armazenamento = criarArmazenamento(pastaDados);
    const caminho = await armazenamento.salvar(ORGANIZACAO_INICIAL, "resultados", new Uint8Array([1]), "xlsx");

    await armazenamento.apagar(ORGANIZACAO_INICIAL, caminho);
    await expect(armazenamento.ler(ORGANIZACAO_INICIAL, caminho)).rejects.toThrow();
    await armazenamento.apagar(ORGANIZACAO_INICIAL, caminho);
    await expect(armazenamento.apagar(ORGANIZACAO_INICIAL, "../fora.txt")).rejects.toThrow(ErroDeArmazenamento);
  });
});
