import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

/** Banco do backend: Postgres embutido (PGlite), o mesmo dialeto do Supabase da fase D. */
export type Banco = PGlite;

const PASTA_DE_MIGRACOES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migracoes");

/**
 * Abre o banco e aplica as migrações pendentes. Com `pasta`, os dados ficam gravados nela;
 * sem `pasta`, o banco fica só em memória (usado nos testes).
 */
export async function abrirBanco(pasta?: string): Promise<Banco> {
  if (pasta !== undefined) await mkdir(path.dirname(path.resolve(pasta)), { recursive: true });
  const banco = pasta === undefined ? await PGlite.create() : await PGlite.create(pasta);
  await aplicarMigracoes(banco);
  return banco;
}

/** Aplica, em ordem de nome, os arquivos `.sql` de `migracoes/` que ainda não foram aplicados. */
export async function aplicarMigracoes(banco: Banco, pasta = PASTA_DE_MIGRACOES): Promise<string[]> {
  await banco.exec(`
    CREATE TABLE IF NOT EXISTS migracoes_aplicadas (
      nome text PRIMARY KEY,
      aplicada_em timestamptz NOT NULL DEFAULT now()
    )
  `);
  const aplicadas = new Set(
    (await banco.query<{ nome: string }>("SELECT nome FROM migracoes_aplicadas")).rows.map((linha) => linha.nome),
  );

  const arquivos = (await readdir(pasta)).filter((nome) => nome.endsWith(".sql")).sort();
  const novas: string[] = [];
  for (const nome of arquivos) {
    if (aplicadas.has(nome)) continue;
    const sql = await readFile(path.join(pasta, nome), "utf8");
    await banco.transaction(async (transacao) => {
      await transacao.exec(sql);
      await transacao.query("INSERT INTO migracoes_aplicadas (nome) VALUES ($1)", [nome]);
    });
    novas.push(nome);
  }
  return novas;
}
