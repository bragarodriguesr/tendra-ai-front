import { ErroDeCadastro, gravarPerfil, idDaContaNoSupabase } from "../autenticacao/perfis.ts";
import { carregarConfiguracaoSemChave, ErroDeConfiguracao } from "../config/config.ts";
import { abrirBancoPostgres } from "../persistencia/banco.ts";
import { ErroDeOrganizacao, organizacaoAtiva } from "../persistencia/organizacoes.ts";

/**
 * Comando `npm run cadastrar-perfil -- <e-mail> <nome> <Revisor|Aprovador> <id-da-organização> [--areas <A,B>]`
 * (etapa D4, PD2, cenários 67 e N1): liga uma conta já criada no Supabase Auth ao nome, ao papel, à
 * organização e, no Aprovador, às áreas (fase N). Exige DATABASE_URL, SUPABASE_URL e
 * SUPABASE_SERVICE_ROLE_KEY. Rodar de novo atualiza nome, papel e, se informadas, as áreas, e reativa
 * o perfil; a organização não muda (PK5).
 */
const USO = "Uso: npm run cadastrar-perfil -- <e-mail> <nome> <Revisor|Aprovador> <id-da-organização> [--areas <área,área>]";

async function executar(): Promise<void> {
  const argumentos = process.argv.slice(2);
  const posicaoDasAreas = argumentos.indexOf("--areas");
  let areas: string[] | undefined;
  if (posicaoDasAreas !== -1) {
    const valor = argumentos[posicaoDasAreas + 1];
    if (valor === undefined) throw new ErroDeCadastro(USO);
    areas = valor.split(",");
    argumentos.splice(posicaoDasAreas, 2);
  }
  const [emailInformado, nome, papel, organizacaoInformada, ...sobra] = argumentos;
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
    await gravarPerfil(banco, { id, email, nome, papel, organizacaoId: organizacao.id, ...(areas === undefined ? {} : { areas }) });
    console.log(`Perfil gravado: ${nome.trim()} (${papel}${areas === undefined ? "" : ` · ${areas.join(", ")}`}), ${email}, na organização ${organizacao.nome}.`);
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
