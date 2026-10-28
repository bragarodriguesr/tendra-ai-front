import { ErroDeCadastro, gravarPerfil, idDaContaNoSupabase } from "../autenticacao/perfis.ts";
import { carregarConfiguracaoSemChave, ErroDeConfiguracao } from "../config/config.ts";
import { abrirBancoPostgres } from "../persistencia/banco.ts";
import { ErroDeOrganizacao, organizacaoAtiva } from "../persistencia/organizacoes.ts";

/**
 * Comando `npm run cadastrar-perfil -- <e-mail> <nome> <Revisor|Aprovador> <id-da-organização>` (etapa
 * D4, PD2, cenário 67): liga uma conta já criada no Supabase Auth ao nome, ao papel e à organização.
 * Exige DATABASE_URL, SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. Rodar de novo atualiza nome e papel e
 * reativa o perfil; a organização não muda (PK5).
 */
const USO = "Uso: npm run cadastrar-perfil -- <e-mail> <nome> <Revisor|Aprovador> <id-da-organização>";

async function executar(): Promise<void> {
  const [emailInformado, nome, papel, organizacaoInformada, ...sobra] = process.argv.slice(2);
  if (emailInformado === undefined || nome === undefined || papel === undefined || organizacaoInformada === undefined || sobra.length > 0) throw new ErroDeCadastro(USO);
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
  const banco = await abrirBancoPostgres(configuracao.bancoUrl, configuracao.bancoCa === null ? {} : { ca: configuracao.bancoCa });
  try {
    const organizacao = await organizacaoAtiva(banco, organizacaoInformada.trim());
    const id = await idDaContaNoSupabase({ supabaseUrl, chaveDeServico, email });
    await gravarPerfil(banco, { id, email, nome, papel, organizacaoId: organizacao.id });
    console.log(`Perfil gravado: ${nome.trim()} (${papel}), ${email}, na organização ${organizacao.nome}.`);
  } finally {
    await banco.close();
  }
}

try {
  await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeCadastro || erro instanceof ErroDeConfiguracao || erro instanceof ErroDeOrganizacao)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
