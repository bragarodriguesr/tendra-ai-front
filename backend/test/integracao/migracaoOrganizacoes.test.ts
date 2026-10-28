import { copyFile, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { aplicarMigracoes, type Banco } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";

/**
 * Cenário 78 (etapa K1): um banco com dados de antes da fase K recebe a migração 008, e tudo passa à
 * organização inicial, "Pulse Benefícios", sem perda. Roda no PGlite, com as migrações aplicadas em
 * duas vezes: até a 007, os dados, e depois o resto.
 */
const MIGRACOES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migracoes");
let banco: Banco;
let antesDaFaseK: string;

beforeAll(async () => {
  antesDaFaseK = await mkdtemp(path.join(tmpdir(), "tendra-migracoes-"));
  for (const nome of (await readdir(MIGRACOES)).filter((arquivo) => arquivo.endsWith(".sql") && arquivo < "008")) {
    await copyFile(path.join(MIGRACOES, nome), path.join(antesDaFaseK, nome));
  }
  banco = await PGlite.create();
  await aplicarMigracoes(banco, antesDaFaseK);
  await banco.exec(`
    INSERT INTO perfis (id, email, nome, papel) VALUES ('11111111-1111-4111-8111-111111111111', 'a@tendra.test', 'Marcelo Vieira', 'Aprovador');
    INSERT INTO documentos (nome, titulo, tipo, atualizado_em, hash, tamanho_bytes, tokens_estimados) VALUES ('politica.md', 'Política', 'documento', '2026-10-01', 'h', 10, 3);
    INSERT INTO blocos (documento_id, ordem, secao, caminho_de_secoes, linha_inicial, linha_final, texto) VALUES (1, 1, 'Início', '{Início}', 1, 2, 'Texto');
    INSERT INTO empresas (nome, cnpj) VALUES ('Banco Horizonte', '12345678000199');
    INSERT INTO tarefas (id, estado, arquivo, caminho_da_planilha, dados, empresa_id) VALUES ('t1', 'pronta', 'RFP.xlsx', 'rfps/a.xlsx', '{}', 1);
  `);
  await aplicarMigracoes(banco);
});

afterAll(async () => {
  await banco.close();
  await rm(antesDaFaseK, { recursive: true, force: true });
});

describe("Cenário 78 · dados atuais na organização inicial", () => {
  it("cria a Pulse Benefícios com o id fixo da organização inicial", async () => {
    const { rows } = await banco.query("SELECT id, nome, ativa FROM organizacoes");
    expect(rows).toEqual([{ id: ORGANIZACAO_INICIAL, nome: "Pulse Benefícios", ativa: true }]);
  });

  it("perfis, documentos, tarefas e empresas passam à organização inicial, sem perda", async () => {
    for (const tabela of ["perfis", "documentos", "tarefas", "empresas"]) {
      const { rows } = await banco.query<{ organizacao_id: string }>(`SELECT organizacao_id FROM ${tabela}`);
      expect({ tabela, donos: rows.map((linha) => linha.organizacao_id) }).toEqual({ tabela, donos: [ORGANIZACAO_INICIAL] });
    }
    expect((await banco.query("SELECT empresa_id FROM tarefas")).rows).toEqual([{ empresa_id: 1 }]);
    expect((await banco.query("SELECT count(*)::int AS total FROM blocos")).rows).toEqual([{ total: 1 }]);
  });

  it("nome do documento e CNPJ passam a ser únicos por organização", async () => {
    const outra = (await banco.query<{ id: string }>("INSERT INTO organizacoes (nome) VALUES ('Outra') RETURNING id")).rows[0]?.id;
    await banco.query("INSERT INTO documentos (nome, titulo, tipo, atualizado_em, hash, tamanho_bytes, tokens_estimados, organizacao_id) VALUES ('politica.md', 'Política', 'documento', '2026-10-01', 'h', 10, 3, $1)", [outra]);
    await banco.query("INSERT INTO empresas (nome, cnpj, organizacao_id) VALUES ('Banco Horizonte', '12345678000199', $1)", [outra]);
    await expect(
      banco.query("INSERT INTO documentos (nome, titulo, tipo, atualizado_em, hash, tamanho_bytes, tokens_estimados, organizacao_id) VALUES ('politica.md', 'Política', 'documento', '2026-10-01', 'h', 10, 3, $1)", [outra]),
    ).rejects.toThrow();
    await expect(banco.query("INSERT INTO empresas (nome, cnpj, organizacao_id) VALUES ('Outro nome', '12345678000199', $1)", [outra])).rejects.toThrow();
  });
});
