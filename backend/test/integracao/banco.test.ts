import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Banco } from "../../src/persistencia/banco.ts";
import { aplicarMigracoes } from "../../src/persistencia/banco.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { abrirBancoDeTeste, URL_DO_POSTGRES_DE_TESTE } from "../apoio/banco.ts";

/** Contrato da interface Banco (etapa D1): o mesmo comportamento no PGlite e no Postgres. */
let banco: Banco;

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
});

afterAll(async () => {
  await banco.close();
});

describe(`D1 · banco atrás de uma interface (${URL_DO_POSTGRES_DE_TESTE === undefined ? "PGlite" : "Postgres"})`, () => {
  it("aplica as migrações uma vez só", async () => {
    expect(await aplicarMigracoes(banco)).toEqual([]);
    const { rows } = await banco.query<{ nome: string }>("SELECT nome FROM migracoes_aplicadas ORDER BY nome");
    expect(rows.map((linha) => linha.nome)).toEqual(["001_documentos_e_blocos.sql", "002_tarefas_itens_e_revisao.sql", "003_paras_originais.sql", "004_contas_e_sessoes.sql", "005_respostas_geradas.sql", "006_revisao_persistida.sql", "007_empresas_e_contatos.sql", "008_organizacoes.sql", "009_cnpj_alfanumerico.sql", "010_validade_dos_documentos.sql", "011_areas.sql", "012_situacao_da_tarefa.sql"]);
  });

  it("devolve contagens como número, linhas afetadas e jsonb como objeto", async () => {
    await banco.query("INSERT INTO tarefas (id, estado, arquivo, caminho_da_planilha, dados, organizacao_id) VALUES ($1, $2, $3, $4, $5, $6)", ["t1", "processando", "a.xlsx", "rfps/a.xlsx", JSON.stringify({ nome: "A" }), ORGANIZACAO_INICIAL]);
    const { rows } = await banco.query<{ total: number; dados: { nome: string } }>("SELECT count(*) AS total, max(dados::text)::jsonb AS dados FROM tarefas");
    expect(rows).toEqual([{ total: 1, dados: { nome: "A" } }]);
    const atualizacao = await banco.query("UPDATE tarefas SET arquivo = $1 WHERE id = $2", ["b.xlsx", "t1"]);
    expect(atualizacao.affectedRows).toBe(1);
  });

  it("desfaz a transação inteira quando o corpo falha", async () => {
    await expect(
      banco.transaction(async (transacao) => {
        await transacao.query("UPDATE tarefas SET arquivo = $1 WHERE id = $2", ["c.xlsx", "t1"]);
        throw new Error("falha no meio");
      }),
    ).rejects.toThrow("falha no meio");
    const { rows } = await banco.query<{ arquivo: string }>("SELECT arquivo FROM tarefas WHERE id = $1", ["t1"]);
    expect(rows[0]?.arquivo).toBe("b.xlsx");
  });
});

describe("D10 · TLS da conexão com o Postgres", () => {
  it("sem TLS no servidor local; cifrado no remoto, conferindo o certificado só com a autoridade informada", async () => {
    const { tlsDoBanco } = await import("../../src/persistencia/banco.ts");
    expect(tlsDoBanco("postgres://u@127.0.0.1:5432/b")).toBe(false);
    expect(tlsDoBanco("postgres://u@localhost/b")).toBe(false);
    expect(tlsDoBanco("postgres://u:s@aws-0-us-east-1.pooler.supabase.com:5432/postgres")).toEqual({ rejectUnauthorized: false });
    expect(tlsDoBanco("postgres://u:s@db.projeto.supabase.co:5432/postgres", "PEM")).toEqual({ ca: "PEM", rejectUnauthorized: true });
  });
});
