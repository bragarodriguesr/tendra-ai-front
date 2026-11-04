import { criarArmazenamento } from "../armazenamento/armazenamento.ts";
import { criarArmazenamentoSupabase } from "../armazenamento/armazenamentoSupabase.ts";
import { criarVerificadorSupabase } from "../autenticacao/verificadorSupabase.ts";
import { carregarCabecalhos } from "../config/cabecalhos.ts";
import { carregarConfiguracaoDoServidor, ErroDeConfiguracao } from "../config/config.ts";
import { carregarPessoas } from "../config/pessoas.ts";
import { carregarTermosCriticos } from "../config/termosCriticos.ts";
import { criarServidor } from "../http/servidor.ts";
import { AVISO_DA_API_SIMULADA, criarApiSimulada } from "../ia/apiSimulada.ts";
import { criarApiDoClaude } from "../ia/cliente.ts";
import { criarLog } from "../observabilidade/log.ts";
import { carregarPrecos } from "../observabilidade/metricas.ts";
import { abrirBancoConfigurado, ErroDeBancoEmUso } from "../persistencia/banco.ts";
import { marcarInterrompidas } from "../persistencia/tarefas.ts";
import { reclassificarTarefasEmAberto } from "../fluxo/reclassificarAreas.ts";

/**
 * Comando `npm run servidor`: sobe o backend com as rotas da base e das tarefas usadas pelo front.
 * Modo local: em 127.0.0.1 (cenário 30), sem login; exige ANTHROPIC_API_KEY (cenário 27) ou, com
 * TENDRA_API_SIMULADA=1, usa a API simulada; com o PGlite, o comando carregar-base não abre o mesmo
 * banco enquanto ele roda. Modo compartilhado (fase D): Postgres e Storage do Supabase, login,
 * limite de tentativas, HTTPS e origem do front exigidos, ouvindo em todas as interfaces do Render.
 */
async function executar(): Promise<void> {
  const configuracao = carregarConfiguracaoDoServidor();
  const { modo } = configuracao;
  const log = criarLog(configuracao.nivelDeLog);
  if (configuracao.api.tipo === "simulada") log.warn(AVISO_DA_API_SIMULADA);

  if (configuracao.bancoUrl !== null && configuracao.bancoCa === null) {
    log.warn("Conexão com o Postgres cifrada sem conferir o certificado: defina TENDRA_BANCO_CA para conferir");
  }
  const banco = await abrirBancoConfigurado(configuracao);
  // Cenário 32: no modo local, ao iniciar, nenhuma tarefa está de fato em processamento. No modo
  // compartilhado, o serviço "dorme" e é reimplantado: as interrompidas são retomadas (cenário D15).
  if (modo.tipo === "local") {
    const interrompidas = await marcarInterrompidas(banco);
    if (interrompidas > 0) log.warn({ interrompidas }, "Tarefas interrompidas por reinício marcadas como falha");
  }

  const api = configuracao.api.tipo === "real" ? criarApiDoClaude(configuracao.api.chaveApi) : criarApiSimulada();
  const servidor = criarServidor({
    banco,
    log,
    ...(modo.tipo === "compartilhado"
      ? {
          autenticacao: { verificador: criarVerificadorSupabase(modo), horasSemUso: modo.horasDeSessao, cookieSeguro: true },
          transporte: { origemDoFront: modo.origemDoFront },
        }
      : {}),
    tarefas: {
      banco,
      armazenamento: modo.tipo === "compartilhado" ? criarArmazenamentoSupabase(modo) : criarArmazenamento(configuracao.pastaDados),
      api,
      ia: configuracao.ia,
      nomesDeCabecalho: await carregarCabecalhos(),
      termosCriticos: await carregarTermosCriticos(),
      precos: await carregarPrecos(),
      pessoas: await carregarPessoas(),
      retomarInterrompidas: modo.tipo === "compartilhado",
      hoje: () => new Date().toISOString().slice(0, 10),
      aoFalharInesperadamente: (erro) => log.error({ erro: erro instanceof Error ? erro.name : "desconhecido" }, "Falha inesperada no processamento"),
    },
  });

  // Modo local: só esta máquina (cenário 30). Compartilhado: todas as interfaces do Render (cenário D10).
  const host = modo.tipo === "compartilhado" ? "0.0.0.0" : "127.0.0.1";
  const porta = modo.tipo === "compartilhado" ? (modo.porta ?? configuracao.porta) : configuracao.porta;

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
    await servidor.listen({ host, port: porta });
  } catch (erro) {
    await encerrar();
    throw erro;
  }
  // Fase N (cenário N15): as tarefas em aberto ainda sem área são classificadas em segundo plano,
  // sem atrasar a subida; uma falha fica para a próxima.
  void reclassificarTarefasEmAberto({ banco, api, ia: configuracao.ia })
    .then(({ classificadas, adiadas }) => {
      if (classificadas + adiadas > 0) log.info({ classificadas, adiadas }, "Tarefas em aberto reclassificadas por área");
    })
    .catch((erro: unknown) => log.error({ erro: erro instanceof Error ? erro.name : "desconhecido" }, "Falha na reclassificação por área"));
  console.log(`Servidor em http://${host}:${porta}${modo.tipo === "compartilhado" ? " (modo compartilhado, atrás do HTTPS do Render)" : ""}${configuracao.api.tipo === "simulada" ? " (API do Claude SIMULADA)" : ""}. Encerre com Ctrl+C.`);
}

try {
  await executar();
} catch (erro) {
  if (!(erro instanceof ErroDeConfiguracao || erro instanceof ErroDeBancoEmUso)) throw erro;
  console.error(erro.message);
  process.exitCode = 1;
}
