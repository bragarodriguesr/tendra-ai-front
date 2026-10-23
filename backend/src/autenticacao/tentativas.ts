import type { Banco } from "../persistencia/banco.ts";

/**
 * Limite de tentativas de login (etapa D5, cenário D7): falhas seguidas do mesmo e-mail ou do
 * mesmo IP na janela bloqueiam novas tentativas, mesmo com a senha certa. Um login bem-sucedido
 * zera a contagem daquele e-mail e daquele IP.
 */
export const LIMITE_DE_FALHAS = 3;
export const JANELA_EM_MINUTOS = 15;

export async function tentativasEsgotadas(banco: Banco, email: string, ip: string): Promise<boolean> {
  const { rows } = await banco.query<{ por_email: number; por_ip: number }>(
    `SELECT
       (SELECT count(*) FROM tentativas_login
         WHERE email = $1 AND NOT sucesso AND em > now() - make_interval(mins => $3)
           AND em > coalesce((SELECT max(em) FROM tentativas_login WHERE email = $1 AND sucesso), '-infinity')) AS por_email,
       (SELECT count(*) FROM tentativas_login
         WHERE ip = $2 AND NOT sucesso AND em > now() - make_interval(mins => $3)
           AND em > coalesce((SELECT max(em) FROM tentativas_login WHERE ip = $2 AND sucesso), '-infinity')) AS por_ip`,
    [email, ip, JANELA_EM_MINUTOS],
  );
  const linha = rows[0];
  return linha !== undefined && (linha.por_email >= LIMITE_DE_FALHAS || linha.por_ip >= LIMITE_DE_FALHAS);
}

export async function registrarTentativa(banco: Banco, tentativa: { email: string; ip: string; sucesso: boolean }): Promise<void> {
  await banco.query("INSERT INTO tentativas_login (email, ip, sucesso) VALUES ($1, $2, $3)", [tentativa.email, tentativa.ip, tentativa.sucesso]);
}
