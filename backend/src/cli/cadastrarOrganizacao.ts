import { carregarConfiguracaoSemChave, ErroDeConfiguracao } from "../config/config.ts";
import { abrirBancoConfigurado, ErroDeBancoEmUso } from "../persistencia/banco.ts";
import { criarOrganizacao, ErroDeOrganizacao } from "../persistencia/organizacoes.ts";

/**
 * Comando `npm run cadastrar-organizacao -- <nome>` (fase K, cenário 66, PK4): cadastra a empresa
 * usuária, cliente da Tendra.ai, e mostra o id, usado no `cadastrar-perfil` dos usuários dela. Usa o
 * banco da configuração (DATABASE_URL no modo compartilhado; sem ela, o banco local).
 */
const USO = "Uso: npm run cadastrar-organizacao -- <nome>";

async function executar(): Promise<number> {
  const nome = process.argv.slice(2).join(" ").trim();
  if (nome === "") {
    console.error(USO);
    return 1;
  }
  const banco = await abrirBancoConfigurado(carregarConfiguracaoSemChave());
  try {
    const organizacao = await criarOrganizacao(banco, nome);
    console.log(`Organização cadastrada: ${organizacao.nome}`);
    console.log(`Id: ${organizacao.id}`);
    return 0;
  } finally {
    await banco.close();
  }
}

try {
  process.exitCode = await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao || erro instanceof ErroDeBancoEmUso || erro instanceof ErroDeOrganizacao)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
