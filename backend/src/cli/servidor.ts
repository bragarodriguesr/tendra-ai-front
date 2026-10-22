import path from "node:path";
import { carregarConfiguracaoSemChave, ErroDeConfiguracao } from "../config/config.ts";
import { criarServidor } from "../http/servidor.ts";
import { criarLog } from "../observabilidade/log.ts";
import { abrirBanco, ErroDeBancoEmUso } from "../persistencia/banco.ts";
import { marcarInterrompidas } from "../persistencia/tarefas.ts";

/**
 * Comando `npm run servidor`: sobe o servidor da base de conhecimento em 127.0.0.1 (cenário 30),
 * usado pela tela Base de conhecimento do front. Não usa a chave da API.
 * Enquanto ele roda, o comando carregar-base não abre o mesmo banco.
 */
async function executar(): Promise<void> {
  const configuracao = carregarConfiguracaoSemChave();
  const log = criarLog(configuracao.nivelDeLog);
  const banco = await abrirBanco(path.join(configuracao.pastaDados, "banco"));
  // Cenário 32: ao iniciar, nenhuma tarefa está de fato em processamento.
  const interrompidas = await marcarInterrompidas(banco);
  if (interrompidas > 0) log.warn({ interrompidas }, "Tarefas interrompidas por reinício marcadas como falha");
  const servidor = criarServidor({ banco, log });

  let encerrando = false;
  const encerrar = async () => {
    if (encerrando) return;
    encerrando = true;
    await servidor.close();
    await banco.close();
  };
  process.once("SIGINT", () => void encerrar());
  process.once("SIGTERM", () => void encerrar());

  try {
    await servidor.listen({ host: "127.0.0.1", port: configuracao.porta });
  } catch (erro) {
    await encerrar();
    throw erro;
  }
  console.log(`Servidor da base em http://127.0.0.1:${configuracao.porta}. Encerre com Ctrl+C.`);
}

try {
  await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao || erro instanceof ErroDeBancoEmUso)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
