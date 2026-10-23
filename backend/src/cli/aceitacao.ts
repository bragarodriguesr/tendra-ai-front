import { parseArgs } from "node:util";
import { carregarConfiguracaoSemChave, ErroDeConfiguracao } from "../config/config.ts";
import { abrirBancoConfigurado, ErroDeBancoEmUso } from "../persistencia/banco.ts";
import { ErroDeRevisao, relatorioDeAceitacao } from "../revisao/revisao.ts";

/**
 * Comando `npm run aceitacao -- <id-da-tarefa>` (cenário 48): mostra o relatório de aceitação da
 * tarefa, o mesmo da rota GET /api/tarefas/:id/aceitacao. Não usa a chave da API e não roda com o
 * servidor aberto sobre o mesmo banco.
 */
async function executar(): Promise<number> {
  const { positionals } = parseArgs({ allowPositionals: true });
  const id = positionals[0];
  if (id === undefined || positionals.length > 1) {
    console.error("Uso: npm run aceitacao -- <id-da-tarefa>");
    return 1;
  }
  const configuracao = carregarConfiguracaoSemChave();
  const banco = await abrirBancoConfigurado(configuracao);
  try {
    const relatorio = await relatorioDeAceitacao(banco, id);
    console.log(`Itens: ${relatorio.itens} (${relatorio.comRascunho} com rascunho, ${relatorio.semRascunho} sem rascunho)`);
    console.log(`Aprovados: ${relatorio.aprovados}, dos quais ${relatorio.aprovadosSemEdicao} sem nenhuma edição`);
    console.log(`Texto alterado em média: ${relatorio.porcentagemMediaAlterada === null ? "sem aprovados" : `${relatorio.porcentagemMediaAlterada}%`}`);
    const motivos = Object.entries(relatorio.avaliacoes.motivos).map(([motivo, total]) => `${motivo}: ${total}`);
    console.log(`Avaliações: ${relatorio.avaliacoes.positivas} positivas e ${relatorio.avaliacoes.negativas} negativas${motivos.length ? ` (${motivos.join(", ")})` : ""}`);
    return 0;
  } finally {
    await banco.close();
  }
}

try {
  process.exitCode = await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao || erro instanceof ErroDeBancoEmUso || erro instanceof ErroDeRevisao)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
