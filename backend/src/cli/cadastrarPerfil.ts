import { ErroDeCadastro, gravarPerfil, idDaContaNoSupabase } from "../autenticacao/perfis.ts";
import { carregarConfiguracaoSemChave, ErroDeConfiguracao } from "../config/config.ts";
import { abrirBancoPostgres } from "../persistencia/banco.ts";

/**
 * Comando `npm run cadastrar-perfil -- <e-mail> <nome> <Revisor|Aprovador>` (etapa D4, PD2): liga uma
 * conta já criada no Supabase Auth ao nome e ao papel. Exige DATABASE_URL, SUPABASE_URL e
 * SUPABASE_SERVICE_ROLE_KEY. Rodar de novo atualiza nome e papel e reativa o perfil.
 */
const USO = "Uso: npm run cadastrar-perfil -- <e-mail> <nome> <Revisor|Aprovador>";

async function executar(): Promise<void> {
  const [emailInformado, nome, papel, ...sobra] = process.argv.slice(2);
  if (emailInformado === undefined || nome === undefined || papel === undefined || sobra.length > 0) throw new ErroDeCadastro(USO);
  const configuracao = carregarConfiguracaoSemChave();
  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, "") ?? "";
  const chaveDeServico = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const faltam = [
    ...(configuracao.bancoUrl === null ? ["DATABASE_URL"] : []),
    ...(supabaseUrl === "" ? ["SUPABASE_URL"] : []),
    ...(chaveDeServico === "" ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
  ];
  if (configuracao.bancoUrl === null || faltam.length > 0) throw new ErroDeConfiguracao(`Variáveis de ambiente obrigatórias ausentes: ${faltam.join(", ")}`);

  const email = emailInformado.trim().toLowerCase();
  const id = await idDaContaNoSupabase({ supabaseUrl, chaveDeServico, email });
  const banco = await abrirBancoPostgres(configuracao.bancoUrl);
  try {
    await gravarPerfil(banco, { id, email, nome, papel });
  } finally {
    await banco.close();
  }
  console.log(`Perfil gravado: ${nome.trim()} (${papel}), ${email}.`);
}

try {
  await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeCadastro || erro instanceof ErroDeConfiguracao)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
