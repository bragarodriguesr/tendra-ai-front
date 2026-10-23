import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

/** Consultas comuns ao banco e a uma transação aberta. */
export interface Consultas {
  query<T = Record<string, unknown>>(sql: string, parametros?: unknown[]): Promise<{ rows: T[]; affectedRows?: number }>;
  /** Executa um ou mais comandos sem parâmetros (migrações). */
  exec(sql: string): Promise<unknown>;
}

/**
 * Banco do backend (etapa D1): a mesma interface sobre o PGlite (Postgres embutido, modo local e
 * testes) ou sobre o Postgres do Supabase (modo compartilhado). As migrações são as mesmas.
 */
export interface Banco extends Consultas {
  transaction<T>(corpo: (transacao: Consultas) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

const PASTA_DE_MIGRACOES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migracoes");

/** O banco gravado em disco já está aberto por outro processo (por exemplo, o servidor). */
export class ErroDeBancoEmUso extends Error {
  override name = "ErroDeBancoEmUso";
}

/**
 * Abre o banco e aplica as migrações pendentes. Com `pasta`, os dados ficam gravados nela;
 * sem `pasta`, o banco fica só em memória (usado nos testes).
 *
 * O PGlite não aceita dois processos na mesma pasta. Por isso o banco em disco é aberto com uma
 * trava (`<pasta>.em-uso`, com o número do processo): o servidor e o comando carregar-base não
 * rodam ao mesmo tempo sobre os mesmos dados. A trava sai no `close()`; a de um processo que já
 * terminou é descartada.
 */
export async function abrirBanco(pasta?: string): Promise<Banco> {
  if (pasta === undefined) {
    const banco = await PGlite.create();
    await aplicarMigracoes(banco);
    return banco;
  }

  await mkdir(path.dirname(path.resolve(pasta)), { recursive: true });
  const trava = `${path.resolve(pasta)}.em-uso`;
  await travar(trava);
  try {
    const banco = await PGlite.create(pasta);
    await aplicarMigracoes(banco);
    const fechar = banco.close.bind(banco);
    banco.close = async () => {
      try {
        await fechar();
      } finally {
        await rm(trava, { force: true });
      }
    };
    return banco;
  } catch (erro) {
    await rm(trava, { force: true });
    throw erro;
  }
}

async function travar(trava: string): Promise<void> {
  try {
    await writeFile(trava, String(process.pid), { flag: "wx" });
    return;
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code !== "EEXIST") throw erro;
  }
  const dono = Number.parseInt(await readFile(trava, "utf8").catch(() => ""), 10);
  if (Number.isInteger(dono) && dono !== process.pid && processoAtivo(dono)) {
    throw new ErroDeBancoEmUso(
      `O banco de dados está em uso por outro processo (${dono}), provavelmente o servidor. Encerre-o antes de continuar.`,
    );
  }
  await writeFile(trava, String(process.pid));
}

function processoAtivo(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (erro) {
    return (erro as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Abre o banco da configuração: o Postgres de `bancoUrl` ou, sem ela, o PGlite em `<pastaDados>/banco`. */
export function abrirBancoConfigurado(configuracao: { pastaDados: string; bancoUrl: string | null }): Promise<Banco> {
  return configuracao.bancoUrl === null ? abrirBanco(path.join(configuracao.pastaDados, "banco")) : abrirBancoPostgres(configuracao.bancoUrl);
}

/** Tipos que o `pg` devolveria como texto e o PGlite devolve como número. */
const TIPOS_DO_POSTGRES: pg.CustomTypesConfig = {
  getTypeParser: ((oid: number) => (oid === pg.types.builtins.INT8 ? Number : pg.types.getTypeParser(oid))) as pg.CustomTypesConfig["getTypeParser"],
};

/**
 * Abre o Postgres de `url` (modo compartilhado) e aplica as migrações pendentes. Com `esquema`,
 * as tabelas ficam nesse esquema, criado se não existir (testes isolados num mesmo servidor).
 */
export async function abrirBancoPostgres(url: string, opcoes: { esquema?: string } = {}): Promise<Banco> {
  const { esquema } = opcoes;
  if (esquema !== undefined && !/^[a-z_][a-z0-9_]{0,62}$/.test(esquema)) throw new Error(`Esquema inválido: ${esquema}`);
  if (esquema !== undefined) {
    const cliente = new pg.Client({ connectionString: url });
    await cliente.connect();
    try {
      await cliente.query(`CREATE SCHEMA IF NOT EXISTS ${esquema}`);
    } finally {
      await cliente.end();
    }
  }
  const pool = new pg.Pool({
    connectionString: url,
    max: 5,
    types: TIPOS_DO_POSTGRES,
    ...(esquema === undefined ? {} : { options: `-c search_path=${esquema}` }),
  });
  const consultas = (cliente: pg.Pool | pg.PoolClient): Consultas => ({
    async query<T>(sql: string, parametros?: unknown[]) {
      const resultado = await cliente.query(sql, parametros);
      return { rows: resultado.rows as T[], affectedRows: resultado.rowCount ?? 0 };
    },
    exec: (sql) => cliente.query(sql),
  });
  const banco: Banco = {
    ...consultas(pool),
    async transaction(corpo) {
      const cliente = await pool.connect();
      try {
        await cliente.query("BEGIN");
        const resultado = await corpo(consultas(cliente));
        await cliente.query("COMMIT");
        return resultado;
      } catch (erro) {
        await cliente.query("ROLLBACK").catch(() => undefined);
        throw erro;
      } finally {
        cliente.release();
      }
    },
    close: () => pool.end(),
  };
  try {
    await aplicarMigracoes(banco);
  } catch (erro) {
    await pool.end();
    throw erro;
  }
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
