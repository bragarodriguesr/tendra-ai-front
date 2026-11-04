import { copyFile, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { reclassificarTarefasEmAberto } from "../../src/fluxo/reclassificarAreas.ts";
import { aplicarMigracoes, type Banco } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { listarItens, listarRequisicoes } from "../../src/persistencia/tarefas.ts";
import { ApiSimulada, classificarTudoComo } from "../apoio/apiSimulada.ts";

/**
 * Cenários N12 e N15 (fase N): um banco com dados de antes da fase recebe a migração 011, e as
 * tarefas em aberto são reclassificadas ao iniciar o backend. Roda no PGlite, com as migrações
 * aplicadas em duas vezes: até a 010, os dados, e depois o resto.
 */
const MIGRACOES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migracoes");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-sonnet-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };
let banco: Banco;
let antesDaFaseN: string;

const item = (tarefa: string, numero: number, st: string, q: string) =>
  `INSERT INTO itens (tarefa_id, numero, aba, linha, q, paras, paras_originais, srcs, alerts, st, orig, aprovado_por) VALUES
     ('${tarefa}', ${numero}, 'RFP', ${numero + 1}, '${q}', '[{"t":"Resposta."}]', '[{"t":"Resposta."}]', '[]', '[]', '${st}', 'Resposta.', ${st === "aprovada" ? "'Marcelo Vieira'" : "NULL"});`;

beforeAll(async () => {
  antesDaFaseN = await mkdtemp(path.join(tmpdir(), "tendra-migracoes-n-"));
  for (const nome of (await readdir(MIGRACOES)).filter((arquivo) => arquivo.endsWith(".sql") && arquivo < "011")) {
    await copyFile(path.join(MIGRACOES, nome), path.join(antesDaFaseN, nome));
  }
  banco = await PGlite.create();
  await aplicarMigracoes(banco, antesDaFaseN);
  await banco.exec(`
    INSERT INTO perfis (id, email, nome, papel, organizacao_id) VALUES
      ('11111111-1111-4111-8111-111111111111', 'a@tendra.test', 'Marcelo Vieira', 'Aprovador', '${ORGANIZACAO_INICIAL}'),
      ('22222222-2222-4222-8222-222222222222', 'r@tendra.test', 'Kadu Mendes', 'Revisor', '${ORGANIZACAO_INICIAL}');
    INSERT INTO tarefas (id, estado, arquivo, caminho_da_planilha, dados, organizacao_id, criada_em) VALUES
      ('aberta', 'pronta', 'A.xlsx', 'rfps/a.xlsx', '{}', '${ORGANIZACAO_INICIAL}', now() - interval '3 days'),
      ('concluida', 'pronta', 'C.xlsx', 'rfps/c.xlsx', '{}', '${ORGANIZACAO_INICIAL}', now() - interval '2 days'),
      ('outra-aberta', 'pronta', 'B.xlsx', 'rfps/b.xlsx', '{}', '${ORGANIZACAO_INICIAL}', now() - interval '1 day');
    ${item("aberta", 1, "aprovada", "Qual o SLA de disponibilidade?")}
    ${item("aberta", 2, "sugerida", "A empresa aceita multa contratual?")}
    ${item("concluida", 1, "aprovada", "Qual o SLA de disponibilidade?")}
    ${item("outra-aberta", 1, "em-revisao", "Como os dados pessoais são protegidos?")}
    INSERT INTO eventos (tarefa_id, item_numero, acao, pessoa, papel) VALUES ('aberta', 1, 'aprovacao', 'Marcelo Vieira', 'Aprovador');
  `);
  await aplicarMigracoes(banco);
});

afterAll(async () => {
  await banco.close();
  await rm(antesDaFaseN, { recursive: true, force: true });
});

const marcas = async () =>
  Object.fromEntries((await banco.query<{ id: string; marcada: boolean }>("SELECT id, areas_classificadas_em IS NOT NULL AS marcada FROM tarefas ORDER BY id")).rows.map((linha) => [linha.id, linha.marcada]));

describe("Cenário N12 · migração 011", () => {
  it("Aprovadores atuais viram C-Level, Revisores ficam sem área e os itens começam em Geral", async () => {
    expect((await banco.query("SELECT nome, areas FROM perfis ORDER BY nome")).rows).toEqual([
      { nome: "Kadu Mendes", areas: [] },
      { nome: "Marcelo Vieira", areas: ["C-Level"] },
    ]);
    expect((await banco.query("SELECT DISTINCT area FROM itens")).rows).toEqual([{ area: "Geral" }]);
    expect((await banco.query("SELECT count(*)::int AS total FROM eventos")).rows).toEqual([{ total: 1 }]);
    expect((await listarItens(banco, "aberta")).map(({ st, by }) => ({ st, by }))).toEqual([{ st: "aprovada", by: "Marcelo Vieira" }, { st: "sugerida" }]);
  });

  it("só a tarefa com todos os itens aprovados fica marcada como classificada", async () => {
    expect(await marcas()).toEqual({ aberta: false, concluida: true, "outra-aberta": false });
  });
});

describe("Cenário N15 · reclassificação das tarefas em aberto", () => {
  it("falha da IA: nada muda, as tarefas ficam para a próxima subida e a falha fica no registro", async () => {
    const api = new ApiSimulada();
    api.classificacao = new Anthropic.APIConnectionError({ message: "fetch failed" });
    expect(await reclassificarTarefasEmAberto({ banco, api, ia: IA })).toEqual({ classificadas: 0, adiadas: 2 });
    expect(await marcas()).toEqual({ aberta: false, concluida: true, "outra-aberta": false });
    expect((await listarRequisicoes(banco, "aberta")).map(({ etapa, resultado }) => ({ etapa, resultado }))).toEqual([{ etapa: "classificacao", resultado: "erro" }]);
  });

  it("classifica todos os itens das tarefas em aberto, mantém as aprovações e não toca na concluída nem numa troca manual", async () => {
    await banco.query("UPDATE itens SET area = 'Comercial' WHERE tarefa_id = 'outra-aberta'");
    const api = new ApiSimulada();
    api.classificacao = classificarTudoComo("Tecnologia");
    expect(await reclassificarTarefasEmAberto({ banco, api, ia: IA })).toEqual({ classificadas: 2, adiadas: 0 });

    expect((await listarItens(banco, "aberta")).map(({ area, st }) => ({ area, st }))).toEqual([
      { area: "Tecnologia", st: "aprovada" },
      { area: "Tecnologia", st: "sugerida" },
    ]);
    expect((await listarItens(banco, "concluida")).map(({ area }) => area)).toEqual(["Geral"]);
    expect((await listarItens(banco, "outra-aberta")).map(({ area }) => area)).toEqual(["Comercial"]);
    expect(await marcas()).toEqual({ aberta: true, concluida: true, "outra-aberta": true });
    expect(api.classificacoes).toHaveLength(2);
    expect(api.classificacoes[0]).toMatchObject({ model: "claude-haiku-5-5" });

    // Já marcadas, não são reclassificadas de novo.
    const deNovo = new ApiSimulada();
    expect(await reclassificarTarefasEmAberto({ banco, api: deNovo, ia: IA })).toEqual({ classificadas: 0, adiadas: 0 });
    expect(deNovo.classificacoes).toEqual([]);
  });
});
