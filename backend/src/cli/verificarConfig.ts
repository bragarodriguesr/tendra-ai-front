import { carregarConfiguracao, ErroDeConfiguracao } from "../config/config.ts";
import { criarLog } from "../observabilidade/log.ts";

/**
 * Confere se o backend tem a configuração necessária para iniciar.
 * Sem uma variável obrigatória, termina com código de saída 1 e o nome da variável (cenário 27).
 */
try {
  const configuracao = carregarConfiguracao();
  const log = criarLog(configuracao.nivelDeLog);
  log.info({ pastaDados: configuracao.pastaDados }, "Configuração válida");
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
