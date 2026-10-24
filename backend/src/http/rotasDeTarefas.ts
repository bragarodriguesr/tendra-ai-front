import path from "node:path";
import type { FastifyInstance } from "fastify";
import type { Pessoa } from "../config/pessoas.ts";
import { ErroDePlanilha, lerPlanilha, validarArquivoDePlanilha } from "../documentos/planilha.ts";
import { criarTarefaComPlanilha, executarTarefa, type AmbienteDaTarefa } from "../fluxo/executarTarefa.ts";
import { ErroDaRota } from "./erros.ts";
import { exigirAprovador } from "./rotasDeAutenticacao.ts";
import { excluirTarefa, listarItens, listarRequisicoes, listarTarefas, listarTarefasEmProcessamento, obterTarefa, type DadosDaTarefa, type Tarefa } from "../persistencia/tarefas.ts";

/**
 * Rotas de tarefas (etapa B2). A planilha é validada na hora (cenários 4 e 31); o processamento
 * roda em segundo plano, uma tarefa por vez, e o front acompanha pelo estado (cenário 16).
 * Itens e planilha preenchida só existem para tarefas prontas (cenários 17, 23 e 24). Excluir
 * apaga a tarefa com todos os registros e arquivos dela (cenário 60).
 */

/** Tarefa como o front a recebe: sem caminhos de arquivo nem métricas. */
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
  };
}

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

  const tarefaExistente = async (id: string) => {
    const tarefa = await obterTarefa(banco, id);
    if (tarefa === null) throw new ErroDaRota(404, "Tarefa não encontrada.");
    return tarefa;
  };
  const tarefaPronta = async (id: string) => {
    const tarefa = await tarefaExistente(id);
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
      if (dados.cnpj !== undefined && dados.cnpj.trim() !== "" && dados.cnpj.replace(/\D/g, "").length !== 14) {
        throw new ErroDaRota(400, "CNPJ inválido: informe os 14 dígitos.");
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

      const tarefa = await criarTarefaComPlanilha(opcoes, { arquivo: nome, planilha, dados });
      enfileirar(tarefa);
      pedido.log.info({ tarefa: tarefa.id }, "Tarefa criada");
      return resposta.status(202).send({ tarefa: tarefaPublica(tarefa) });
    },
  );

  servidor.get("/api/tarefas", async () => ({ tarefas: (await listarTarefas(banco)).map(tarefaPublica) }));

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id", { schema: { params: ID } }, async (pedido) => ({
    tarefa: tarefaPublica(await tarefaExistente(pedido.params.id)),
  }));

  servidor.delete<{ Params: { id: string } }>("/api/tarefas/:id", { schema: { params: ID } }, async (pedido) => {
    exigirAprovador(pedido, "Só o Aprovador pode excluir tarefas.");
    const tarefa = await tarefaExistente(pedido.params.id);
    // A tarefa em processamento ainda grava itens e arquivos: excluir só depois que ela terminar.
    if (tarefa.estado === "processando") throw new ErroDaRota(409, "A tarefa ainda está em processamento. Exclua depois que ela terminar.");
    const caminhos = await excluirTarefa(banco, tarefa.id);
    // Os registros já saíram; um arquivo que falhe ao apagar fica só no log, sem tarefa que aponte para ele.
    for (const caminho of caminhos) {
      await opcoes.armazenamento.apagar(caminho).catch((erro: unknown) => pedido.log.warn({ tarefa: tarefa.id, caminho, erro: (erro as Error).message }, "Arquivo da tarefa excluída não foi apagado"));
    }
    pedido.log.info({ tarefa: tarefa.id, pessoa: pedido.pessoaDaSessao?.nome }, "Tarefa excluída");
    return { excluida: true };
  });

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/itens", { schema: { params: ID } }, async (pedido) => {
    await tarefaPronta(pedido.params.id);
    return { itens: await listarItens(banco, pedido.params.id) };
  });

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/planilha", { schema: { params: ID } }, async (pedido, resposta) => {
    exigirAprovador(pedido, "Só o Aprovador pode baixar a planilha preenchida.");
    const tarefa = await tarefaPronta(pedido.params.id);
    if (tarefa.caminhoDaPlanilhaPreenchida === null) throw new ErroDaRota(409, "A planilha preenchida não está disponível.");
    const conteudo = await opcoes.armazenamento.ler(tarefa.caminhoDaPlanilhaPreenchida);
    const nome = `${tarefa.arquivo.replace(/\.xlsx$/i, "")}-preenchida.xlsx`;
    return resposta
      .header("content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .header("content-disposition", `attachment; filename="tarefa.xlsx"; filename*=UTF-8''${encodeURIComponent(nome)}`)
      .send(conteudo);
  });

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/registro", { schema: { params: ID } }, async (pedido) => {
    await tarefaExistente(pedido.params.id);
    return { requisicoes: await listarRequisicoes(banco, pedido.params.id) };
  });

  servidor.get<{ Params: { id: string } }>("/api/tarefas/:id/metricas", { schema: { params: ID } }, async (pedido) => {
    const tarefa = await tarefaExistente(pedido.params.id);
    return { metricas: tarefa.metricas };
  });
}
