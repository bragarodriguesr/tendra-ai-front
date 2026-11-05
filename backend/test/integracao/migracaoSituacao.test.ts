import { copyFile, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { reclassificarTarefasEmAberto } from "../../src/fluxo/reclassificarAreas.ts";
import { aplicarMigracoes, type Banco } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { listarItens, listarTarefas } from "../../src/persistencia/tarefas.ts";
import { ApiSimulada, classificarTudoComo } from "../apoio/apiSimulada.ts";

/**
 * Cenário O16 (fase O): um banco com dados de antes da fase recebe a migração 012. Todas as tarefas
 * ficam em andamento, e nada mais muda. A reclassificação de áreas (N15) não toca na arquivada.
 */
const MIGRACOES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migracoes");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-sonnet-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };
let banco: Banco;
let antesDaFaseO: string;

beforeAll(async () => {
  antesDaFaseO = await mkdtemp(path.join(tmpdir(), "tendra-migracoes-o-"));
  for (const nome of (await readdir(MIGRACOES)).filter((arquivo) => arquivo.endsWith(".sql") && arquivo < "012")) {
    await copyFile(path.join(MIGRACOES, nome), path.join(antesDaFaseO, nome));
  }
  banco = await PGlite.create();
  await aplicarMigracoes(banco, antesDaFaseO);
  await banco.exec(`
    INSERT INTO tarefas (id, estado, arquivo, caminho_da_planilha, dados, organizacao_id, criada_em) VALUES
      ('aprovada', 'pronta', 'A.xlsx', 'rfps/a.xlsx', '{}', '${ORGANIZACAO_INICIAL}', now() - interval '2 days'),
      ('aberta', 'pronta', 'B.xlsx', 'rfps/b.xlsx', '{}', '${ORGANIZACAO_INICIAL}', now() - interval '1 day');
    INSERT INTO itens (tarefa_id, numero, aba, linha, q, paras, paras_originais, srcs, alerts, st, orig, aprovado_por) VALUES
      ('aprovada', 1, 'RFP', 2, 'Qual o SLA?', '[{"t":"Resposta."}]', '[{"t":"Resposta."}]', '[]', '[]', 'aprovada', 'Resposta.', 'Marcelo Vieira'),
      ('aberta', 1, 'RFP', 2, 'Qual o SLA?', '[{"t":"Resposta."}]', '[{"t":"Resposta."}]', '[]', '[]', 'sugerida', 'Resposta.', NULL);
  `);
  await aplicarMigracoes(banco);
});

afterAll(async () => {
  await banco.close();
  await rm(antesDaFaseO, { recursive: true, force: true });
});

describe("Cenário O16 · migração 012", () => {
  it("todas as tarefas ficam em andamento, sem autoria, inclusive a 100% aprovada", async () => {
    expect((await listarTarefas(banco, ORGANIZACAO_INICIAL)).map(({ id, situacao, situacaoPor, situacaoEm }) => ({ id, situacao, situacaoPor, situacaoEm }))).toEqual([
      { id: "aberta", situacao: "em_andamento", situacaoPor: null, situacaoEm: null },
      { id: "aprovada", situacao: "em_andamento", situacaoPor: null, situacaoEm: null },
    ]);
    expect((await listarItens(banco, "aprovada")).map(({ st, by }) => ({ st, by }))).toEqual([{ st: "aprovada", by: "Marcelo Vieira" }]);
  });

  it("encerrada exige quem e quando, e a situação só aceita os três valores", async () => {
    await expect(banco.query("UPDATE tarefas SET situacao = 'arquivada' WHERE id = 'aberta'")).rejects.toThrow();
    await expect(banco.query("UPDATE tarefas SET situacao = 'cancelada', situacao_por = 'X', situacao_em = now() WHERE id = 'aberta'")).rejects.toThrow();
  });

  it("a reclassificação de áreas não toca na tarefa arquivada; a em andamento é classificada", async () => {
    await banco.query("UPDATE tarefas SET situacao = 'arquivada', situacao_por = 'Marcelo Vieira', situacao_em = now() WHERE id = 'aberta'");
    const api = new ApiSimulada();
    api.classificacao = classificarTudoComo("Tecnologia");
    expect(await reclassificarTarefasEmAberto({ banco, api, ia: IA })).toEqual({ classificadas: 1, adiadas: 0 });
    expect((await listarItens(banco, "aberta")).map(({ area }) => area)).toEqual(["Geral"]);
    expect((await listarItens(banco, "aprovada")).map(({ area }) => area)).toEqual(["Tecnologia"]);
  });
});
