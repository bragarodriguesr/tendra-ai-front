import { randomUUID } from "node:crypto";
import { abrirBanco, abrirBancoPostgres, type Banco } from "../../src/persistencia/banco.ts";

/**
 * Banco novo para um teste de integração (etapa D1). Com TENDRA_TESTE_DATABASE_URL, abre o Postgres
 * num esquema só deste teste, apagado ao fechar, como no modo compartilhado; sem ela, um PGlite em memória.
 */
export const URL_DO_POSTGRES_DE_TESTE = process.env.TENDRA_TESTE_DATABASE_URL?.trim() || undefined;

export async function abrirBancoDeTeste(): Promise<Banco> {
  if (URL_DO_POSTGRES_DE_TESTE === undefined) return abrirBanco();
  const esquema = `teste_${randomUUID().replaceAll("-", "")}`;
  const banco = await abrirBancoPostgres(URL_DO_POSTGRES_DE_TESTE, { esquema });
  const fechar = banco.close.bind(banco);
  return {
    ...banco,
    close: async () => {
      await banco.exec(`DROP SCHEMA ${esquema} CASCADE`);
      await fechar();
    },
  };
}
