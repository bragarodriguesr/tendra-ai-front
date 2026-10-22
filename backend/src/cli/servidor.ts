import path from "node:path";
import { criarArmazenamento } from "../armazenamento/armazenamento.ts";
import { carregarCabecalhos } from "../config/cabecalhos.ts";
import { carregarConfiguracaoDoServidor, ErroDeConfiguracao } from "../config/config.ts";
import { carregarTermosCriticos } from "../config/termosCriticos.ts";
import { criarServidor } from "../http/servidor.ts";
import { AVISO_DA_API_SIMULADA, criarApiSimulada } from "../ia/apiSimulada.ts";
import { criarApiDoClaude } from "../ia/cliente.ts";
import { criarLog } from "../observabilidade/log.ts";
import { carregarPrecos } from "../observabilidade/metricas.ts";
import { abrirBanco, ErroDeBancoEmUso } from "../persistencia/banco.ts";
import { marcarInterrompidas } from "../persistencia/tarefas.ts";

/**
 * Comando `npm run servidor`: sobe o backend local em 127.0.0.1 (cenário 30), com as rotas da base
 * e das tarefas usadas pelo front. Exige ANTHROPIC_API_KEY (cenário 27); com TENDRA_API_SIMULADA=1,
 * usa a API simulada até a A1. Enquanto ele roda, o comando carregar-base não abre o mesmo banco.
 */
async function executar(): Promise<void> {
  const configuracao = carregarConfiguracaoDoServidor();
  const log = criarLog(configuracao.nivelDeLog);
  if (configuracao.api.tipo === "simulada") log.warn(AVISO_DA_API_SIMULADA);

  const banco = await abrirBanco(path.join(configuracao.pastaDados, "banco"));
  // Cenário 32: ao iniciar, nenhuma tarefa está de fato em processamento.
  const interrompidas = await marcarInterrompidas(banco);
  if (interrompidas > 0) log.warn({ interrompidas }, "Tarefas interrompidas por reinício marcadas como falha");

  const servidor = criarServidor({
    banco,
    log,
    tarefas: {
      banco,
      armazenamento: criarArmazenamento(configuracao.pastaDados),
      api: configuracao.api.tipo === "real" ? criarApiDoClaude(configuracao.api.chaveApi) : criarApiSimulada(),
      ia: configuracao.ia,
      nomesDeCabecalho: await carregarCabecalhos(),
      termosCriticos: await carregarTermosCriticos(),
      precos: await carregarPrecos(),
      hoje: () => new Date().toISOString().slice(0, 10),
      aoFalharInesperadamente: (erro) => log.error({ erro: erro instanceof Error ? erro.name : "desconhecido" }, "Falha inesperada no processamento"),
    },
  });

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
  console.log(`Servidor em http://127.0.0.1:${configuracao.porta}${configuracao.api.tipo === "simulada" ? " (API do Claude SIMULADA)" : ""}. Encerre com Ctrl+C.`);
}

try {
  await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao || erro instanceof ErroDeBancoEmUso)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
