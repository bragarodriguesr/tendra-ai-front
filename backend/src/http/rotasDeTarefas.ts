import path from "node:path";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Pessoa } from "../config/pessoas.ts";
import { ErroDePlanilha, lerPlanilha, validarArquivoDePlanilha } from "../documentos/planilha.ts";
import { criarTarefaComPlanilha, executarTarefa, type AmbienteDaTarefa } from "../fluxo/executarTarefa.ts";
import { ErroDaRota } from "./erros.ts";
import { exigirAprovador } from "./rotasDeAutenticacao.ts";
import { listarUsuarios } from "../autenticacao/perfis.ts";
import { normalizarCnpj } from "../regras/cnpj.ts";
import { MENSAGEM_DE_TAREFA_NAO_ENCONTRADA, organizacaoDo } from "./organizacao.ts";
import { gerarPlanilhaDaRevisao } from "../revisao/planilhaDaRevisao.ts";
import { mensagemDeSoLeitura, reconhecerPessoa } from "../revisao/revisao.ts";
import { obterEmpresaDaTarefa } from "../persistencia/empresas.ts";
import { ClienteDaIa, ErroDaIa } from "../ia/cliente.ts";
import { MODELO_DE_REVISAO_DE_TEXTO_PADRAO } from "../config/config.ts";
import { ErroDaRevisaoDeTexto, MAXIMO_DE_CARACTERES, MINIMO_DE_PALAVRAS, contarPalavras, revisarTexto } from "../revisao/revisaoDeTexto.ts";
import { excluirTarefa, listarEventosDeTarefa, listarItens, mudarSituacao, registrarEventoDeTarefa, type SituacaoDaTarefa, listarRequisicoes, registrarRequisicao, listarTarefas, listarTarefasEmProcessamento, obterTarefa, type DadosDaTarefa, type Tarefa } from "../persistencia/tarefas.ts";

/**
 * Rotas de tarefas (etapa B2). A planilha é validada na hora (cenários 4 e 31); o processamento
 * roda em segundo plano, uma tarefa por vez, e o front acompanha pelo estado (cenário 16).
 * Itens e planilha preenchida só existem para tarefas prontas (cenários 17, 23 e 24). Excluir
 * apaga a tarefa com todos os registros e arquivos dela (cenário 60).
 */

/** Tarefa como o front a recebe: sem caminhos de arquivo nem métricas. */
/** Tarefa como o front a recebe: sem caminhos de arquivo, métricas nem organização. */
export function tarefaPublica(tarefa: Tarefa) {
  return {
    id: tarefa.id,
    estado: tarefa.estado,
    motivo: tarefa.motivo,
    arquivo: tarefa.arquivo,
    dados: tarefa.dados,
    total: tarefa.total,
    processadas: tarefa.processadas,
    comportamento: tarefa.comportamento,
    criadaEm: tarefa.criadaEm,
    concluidaEm: tarefa.concluidaEm,
    situacao: tarefa.situacao,
    situacaoPor: tarefa.situacaoPor,
    situacaoEm: tarefa.situacaoEm,
  };
}

/**
 * Tarefa "Pronta": todos os itens aprovados e nenhum alerta pendente. A resposta manual é só registro
 * de autoria e não conta como pendente (ajuste I3), como na tela.
 */
function revisaoConcluida(itens: Awaited<ReturnType<typeof listarItens>>): boolean {
  return itens.length > 0 && itens.every((item) => item.st === "aprovada" && item.alerts.every((alerta) => alerta.ack !== undefined || alerta.t === "manual"));
}

export const MENSAGEM_DE_CNPJ_INVALIDO = "CNPJ inválido: informe os 14 caracteres (12 letras ou números e 2 dígitos verificadores).";

const ID = { type: "object", properties: { id: { type: "string", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$" } } } as const;
const TEXTO_CURTO = { type: "string", maxLength: 200 } as const;
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

interface CorpoDaTarefa {
  arquivo: { nome: string; conteudoBase64: string };
  dados?: DadosDaTarefa;
}

export interface OpcoesDasTarefas extends AmbienteDaTarefa {
  /** Pessoas que podem agir na revisão (config/pessoas.json, exceção E1). */
  pessoas: Pessoa[];
  /** Chamado quando o processamento de fundo termina (usado nos testes). */
  aoTerminarTarefa?: (id: string) => void;
  /** Chamado quando uma rodada da classificação dos documentos por área termina (fase U; usado nos testes). */
  aoTerminarClassificacao?: () => void;
  /** Classifica, ao ficar pronto, os documentos ainda sem área de todas as organizações (fase U, PU5, cenário U6). */
  classificarDocumentosAoIniciar?: boolean;
  /**
   * Modo compartilhado (etapa D8, cenário D15): ao ficar pronto, o servidor retoma, na fila, as
   * tarefas que ficaram em `processando` por um reinício. No modo local elas viram `falha` (cenário 32).
   */
  retomarInterrompidas?: boolean;
}

export function registrarRotasDeTarefas(servidor: FastifyInstance, opcoes: OpcoesDasTarefas): void {
  const { banco } = opcoes;
  // Uma tarefa por vez: o processamento disputa a API e o banco local.
  let fila: Promise<unknown> = Promise.resolve();
  const enfileirar = (tarefa: Tarefa) => {
    fila = fila
      .then(() => executarTarefa(opcoes, tarefa))
      .catch((erro: unknown) => opcoes.aoFalharInesperadamente?.(erro))
      .finally(() => opcoes.aoTerminarTarefa?.(tarefa.id));
  };

  if (opcoes.retomarInterrompidas === true) {
    servidor.addHook("onReady", async () => {
      const interrompidas = await listarTarefasEmProcessamento(banco);
      for (const tarefa of interrompidas) enfileirar(tarefa);
      if (interrompidas.length > 0) servidor.log.warn({ retomadas: interrompidas.length }, "Tarefas interrompidas por reinício retomadas");
    });
  }

  // A conferência central do dono (organizacao.ts) já recusou a tarefa de outra organização; aqui a
  // consulta também filtra pela organização do pedido.
  const tarefaExistente = async (pedido: FastifyRequest, id: string) => {
    const tarefa = await obterTarefa(banco, organizacaoDo(pedido), id);
    if (tarefa === null) throw new ErroDaRota(404, MENSAGEM_DE_TAREFA_NAO_ENCONTRADA);
    return tarefa;
  };
  const tarefaPronta = async (pedido: FastifyRequest, id: string) => {
    const tarefa = await tarefaExistente(pedido, id);
    if (tarefa.estado === "processando") throw new ErroDaRota(409, "A tarefa ainda está em processamento.");
    if (tarefa.estado === "falha") throw new ErroDaRota(409, `A tarefa falhou: ${tarefa.motivo ?? "sem motivo registrado"}`);
    return tarefa;
  };

  servidor.post<{ Body: CorpoDaTarefa }>(
    "/api/tarefas",
    {
      schema: {
        body: {
          type: "object",
          required: ["arquivo"],
          additionalProperties: false,
          properties: {
            arquivo: {
              type: "object",
              required: ["nome", "conteudoBase64"],
              additionalProperties: false,
              properties: { nome: { type: "string", minLength: 1, maxLength: 255 }, conteudoBase64: { type: "string" } },
            },
            dados: {
              type: "object",
              additionalProperties: false,
              properties: {
                nome: TEXTO_CURTO,
                empresa: TEXTO_CURTO,
                cnpj: TEXTO_CURTO,
                tipo: TEXTO_CURTO,
                prazo: TEXTO_CURTO,
                responsavel: TEXTO_CURTO,
                contatos: {
                  type: "array",
                  maxItems: 20,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: { nome: TEXTO_CURTO, cargo: TEXTO_CURTO, telefone: TEXTO_CURTO, email: TEXTO_CURTO },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (pedido, resposta) => {
      const { arquivo, dados = {} } = pedido.body;
      if (!BASE64.test(arquivo.conteudoBase64)) throw new ErroDaRota(400, "Pedido inválido: conteúdo de arquivo mal codificado.");
      // CNPJ numérico ou alfanumérico (IN RFB nº 2.229/2024).
      if (dados.cnpj !== undefined && dados.cnpj.trim() !== "" && normalizarCnpj(dados.cnpj) === null) {
        throw new ErroDaRota(400, MENSAGEM_DE_CNPJ_INVALIDO);
      }
      const organizacaoId = organizacaoDo(pedido);
      // Responsável só entre os usuários da organização (cenário 74); sem login, os da lista de configuração.
      const responsavel = dados.responsavel?.trim() ?? "";
      if (responsavel !== "") {
        const usuarios = pedido.pessoaDaSessao === null ? opcoes.pessoas : await listarUsuarios(banco, organizacaoId);
        if (!usuarios.some((usuario) => usuario.nome === responsavel)) throw new ErroDaRota(400, "Responsável inválido: escolha um usuário da organização.");
      }
      const nome = path.basename(arquivo.nome.replace(/\\/g, "/"));
      const planilha = new Uint8Array(Buffer.from(arquivo.conteudoBase64, "base64"));
      try {
        validarArquivoDePlanilha(nome, planilha);
        // Lê já no envio: arquivo corrompido é recusado na hora (cenário 31), sem criar tarefa.
        await lerPlanilha(planilha);
      } catch (erro) {
        if (erro instanceof ErroDePlanilha) throw new ErroDaRota(400, erro.message);
        throw erro;
      }

      const tarefa = await criarTarefaComPlanilha(opcoes, { organizacaoId, arquivo: nome, planilha, dados });
      // Cenário O18: a importação entra no Histórico, com quem importou (sem login, sem identificação).
      await registrarEventoDeTarefa(banco, { tarefa, acao: "importacao", pessoa: pedido.pessoaDaSessao?.nome ?? null, papel: pedido.pessoaDaSessao?.papel ?? null });
      enfileirar(tarefa);
      pedido.log.info({ tarefa: tarefa.id }, "Tarefa criada");
      return resposta.status(202).send({ tarefa: tarefaPublica(tarefa) });
    },
  );

  // Cenário O19: ações sobre as tarefas da organização, para o filtro "Tarefas" do Histórico.
  servidor.get("/api/historico/tarefas", async (pedido) => ({ eventos: await listarEventosDeTarefa(banco, organizacaoDo(pedido)) }));

  servidor.get("/api/tarefas", async (pedido) => ({ tarefas: (await listarTarefas(banco, organizacaoDo(pedido))).map(tarefaPublica) }));

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id", { schema: { params: ID } }, async (pedido) => ({
    tarefa: tarefaPublica(await tarefaExistente(pedido, pedido.params.id)),
  }));

  servidor.delete<{ Params: { id: string } }>("/api/tarefas/:id", { schema: { params: ID } }, async (pedido) => {
    exigirAprovador(pedido, "Só o Aprovador pode excluir tarefas.");
    const tarefa = await tarefaExistente(pedido, pedido.params.id);
    // A tarefa em processamento ainda grava itens e arquivos: excluir só depois que ela terminar.
    if (tarefa.estado === "processando") throw new ErroDaRota(409, "A tarefa ainda está em processamento. Exclua depois que ela terminar.");
    // Cenário O13: a finalizada é o registro do que foi entregue e não é excluída (PO5).
    if (tarefa.situacao === "finalizada") throw new ErroDaRota(409, "Tarefa finalizada não pode ser excluída.");
    const caminhos = await excluirTarefa(banco, tarefa.organizacaoId, tarefa.id);
    // Cenário O18: a exclusão fica no Histórico, com o nome da tarefa guardado no registro.
    await registrarEventoDeTarefa(banco, { tarefa, acao: "exclusao", pessoa: pedido.pessoaDaSessao?.nome ?? null, papel: pedido.pessoaDaSessao?.papel ?? null });
    // Os registros já saíram; um arquivo que falhe ao apagar fica só no log, sem tarefa que aponte para ele.
    for (const caminho of caminhos) {
      await opcoes.armazenamento.apagar(tarefa.organizacaoId, caminho).catch((erro: unknown) => pedido.log.warn({ tarefa: tarefa.id, caminho, erro: (erro as Error).message }, "Arquivo da tarefa excluída não foi apagado"));
    }
    pedido.log.info({ tarefa: tarefa.id, pessoa: pedido.pessoaDaSessao?.nome }, "Tarefa excluída");
    return { excluida: true };
  });

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/itens", { schema: { params: ID } }, async (pedido) => {
    const tarefa = await tarefaPronta(pedido, pedido.params.id);
    return { itens: await listarItens(banco, tarefa.id) };
  });

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/planilha", { schema: { params: ID } }, async (pedido, resposta) => {
    const tarefa = await tarefaPronta(pedido, pedido.params.id);
    const itens = await listarItens(banco, tarefa.id);
    // Cenário D9 (revisto em 26/10/2026): o Revisor baixa só a planilha da tarefa concluída; o Aprovador, em qualquer estado.
    if (!revisaoConcluida(itens)) exigirAprovador(pedido, "O Revisor só baixa a planilha de tarefas prontas: todos os itens aprovados e nenhum alerta pendente.");
    // Gerada a cada pedido, com o estado atual da revisão (edições, respostas manuais, aprovações), sem chamar a IA.
    const original = new Uint8Array(await opcoes.armazenamento.ler(tarefa.organizacaoId, tarefa.caminhoDaPlanilha));
    const conteudo = Buffer.from(await gerarPlanilhaDaRevisao(original, itens));
    const nome = `${tarefa.arquivo.replace(/\.xlsx$/i, "")}-preenchida.xlsx`;
    return resposta
      .header("content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .header("content-disposition", `attachment; filename="tarefa.xlsx"; filename*=UTF-8''${encodeURIComponent(nome)}`)
      .send(conteudo);
  });

  // Fase O: finalizar, arquivar e reativar (cenários O7, O10 e O12). Quem age é a pessoa da sessão;
  // sem login, a da lista de configuração (`pessoa`, como nas rotas da revisão).
  const quemAge = (pedido: FastifyRequest<{ Body: { pessoa?: string } | undefined }>) =>
    pedido.pessoaDaSessao ?? reconhecerPessoa(opcoes.pessoas, pedido.body?.pessoa);
  const MUDANCA = { schema: { params: ID, body: { type: "object", additionalProperties: false, properties: { pessoa: { type: "string" } } } } } as const;
  const mudar = async (
    pedido: FastifyRequest<{ Params: { id: string }; Body: { pessoa?: string } | undefined }>,
    de: SituacaoDaTarefa, para: SituacaoDaTarefa, recusa: (atual: SituacaoDaTarefa) => string, exigir?: (itens: Awaited<ReturnType<typeof listarItens>>) => void,
  ) => {
    const tarefa = await tarefaExistente(pedido, pedido.params.id);
    const { nome: pessoa, papel } = quemAge(pedido);
    if (tarefa.situacao !== de) throw new ErroDaRota(409, recusa(tarefa.situacao));
    const mudada = await mudarSituacao(banco, { organizacaoId: tarefa.organizacaoId, id: tarefa.id, de, para, pessoa, papel, ...(exigir === undefined ? {} : { exigir }) });
    if (mudada === null) throw new ErroDaRota(409, "A tarefa mudou de situação enquanto o pedido era atendido. Atualize a tela.");
    pedido.log.info({ tarefa: tarefa.id, pessoa, de, para }, "Situação da tarefa alterada");
    return { tarefa: tarefaPublica(mudada) };
  };
  const jaEncerrada = (atual: SituacaoDaTarefa) => (atual === "finalizada" ? "A tarefa já está finalizada." : "A tarefa está arquivada.");

  // PO3 e PO4: só a tarefa pronta (100% aprovada, sem alerta pendente), por quem pode baixá-la (Revisor e Aprovador).
  servidor.post<{ Params: { id: string }; Body: { pessoa?: string } | undefined }>("/api/tarefas/:id/finalizar", MUDANCA, async (pedido) => {
    const tarefa = await tarefaPronta(pedido, pedido.params.id);
    if (tarefa.situacao !== "em_andamento") throw new ErroDaRota(409, jaEncerrada(tarefa.situacao));
    return mudar(pedido, "em_andamento", "finalizada", jaEncerrada, (itens) => {
      if (!revisaoConcluida(itens)) throw new ErroDaRota(409, "Só a tarefa pronta é finalizada: todos os itens aprovados e nenhum alerta pendente.");
    });
  });

  // PO4 e PO6: só o Aprovador, e não durante o processamento, que ainda grava itens.
  servidor.post<{ Params: { id: string }; Body: { pessoa?: string } | undefined }>("/api/tarefas/:id/arquivar", MUDANCA, async (pedido) => {
    exigirAprovador(pedido, "Só o Aprovador pode arquivar tarefas.");
    const tarefa = await tarefaExistente(pedido, pedido.params.id);
    if (tarefa.estado === "processando") throw new ErroDaRota(409, "A tarefa ainda está em processamento. Arquive depois que ela terminar.");
    return mudar(pedido, "em_andamento", "arquivada", jaEncerrada);
  });

  // PO7: volta a em andamento com itens, aprovações e alertas como estavam. Só a arquivada (PO5).
  servidor.post<{ Params: { id: string }; Body: { pessoa?: string } | undefined }>("/api/tarefas/:id/reativar", MUDANCA, async (pedido) => {
    exigirAprovador(pedido, "Só o Aprovador pode reativar tarefas.");
    return mudar(pedido, "arquivada", "em_andamento", (atual) => (atual === "finalizada" ? "Tarefa finalizada não é reativada." : "A tarefa já está em andamento."));
  });

  // Dados da empresa e contatos informados na Nova RFP (cenários 63 e 64), em qualquer estado da tarefa.
  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/empresa", { schema: { params: ID } }, async (pedido) => {
    const tarefa = await tarefaExistente(pedido, pedido.params.id);
    return await obterEmpresaDaTarefa(banco, tarefa.id);
  });

  // "Revisar com IA" (cenário 65): só a redação de uma resposta manual (item sem sugestão da IA), com o
  // modelo da revisão de texto. Nada é gravado no item: o texto revisado volta para o editor da tela.
  // A requisição entra no registro da tarefa, sem o texto (cenário 29).
  servidor.post<{ Params: { id: string; numero: string }; Body: { texto: string } }>(
    "/api/tarefas/:id/itens/:numero/revisar-texto",
    {
      schema: {
        params: { type: "object", properties: { ...ID.properties, numero: { type: "string", pattern: "^[1-9][0-9]{0,5}$" } } },
        body: { type: "object", required: ["texto"], additionalProperties: false, properties: { texto: { type: "string", maxLength: MAXIMO_DE_CARACTERES } } },
      },
    },
    async (pedido) => {
      const { id } = pedido.params;
      const numero = Number(pedido.params.numero);
      const tarefa = await tarefaPronta(pedido, id);
      if (tarefa.situacao !== "em_andamento") throw new ErroDaRota(409, mensagemDeSoLeitura(tarefa.situacao));
      const { rows } = await banco.query<{ orig: string }>("SELECT orig FROM itens WHERE tarefa_id = $1 AND numero = $2", [tarefa.id, numero]);
      if (rows[0] === undefined) throw new ErroDaRota(404, "Item não encontrado.");
      if (rows[0].orig !== "") throw new ErroDaRota(409, "A revisão com IA é só para respostas escritas em itens sem rascunho.");
      if (contarPalavras(pedido.body.texto) < MINIMO_DE_PALAVRAS) throw new ErroDaRota(400, `Escreva ao menos ${MINIMO_DE_PALAVRAS} palavras para revisar com IA.`);

      let gravacao: Promise<void> = Promise.resolve();
      const cliente = new ClienteDaIa(opcoes.api, (entrada) => { gravacao = registrarRequisicao(banco, tarefa.id, entrada); });
      try {
        const texto = await revisarTexto({ cliente, modelo: opcoes.ia.modeloDeRevisaoDeTexto ?? MODELO_DE_REVISAO_DE_TEXTO_PADRAO, texto: pedido.body.texto, numero });
        return { texto };
      } catch (erro) {
        if (erro instanceof ErroDaRevisaoDeTexto) throw new ErroDaRota(422, erro.message);
        if (erro instanceof ErroDaIa) throw new ErroDaRota(502, `Revisão com IA indisponível: ${erro.message}`);
        throw erro;
      } finally {
        await gravacao;
      }
    },
  );

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/registro", { schema: { params: ID } }, async (pedido) => {
    const tarefa = await tarefaExistente(pedido, pedido.params.id);
    return { requisicoes: await listarRequisicoes(banco, tarefa.id) };
  });

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/metricas", { schema: { params: ID } }, async (pedido) => {
    const tarefa = await tarefaExistente(pedido, pedido.params.id);
    return { metricas: tarefa.metricas };
  });
}
