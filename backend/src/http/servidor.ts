import Fastify, { type FastifyBaseLogger, type FastifyError, type FastifyInstance } from "fastify";
import { carregarArquivos, type ArquivoParaCarga } from "../base/carga.ts";
import { estaVencido } from "../base/cabecalho.ts";
import type { Banco } from "../persistencia/banco.ts";
import { definirAtivo, listarDocumentos, type DocumentoGravado } from "../persistencia/documentos.ts";
import { MODELO_DE_CLASSIFICACAO_DE_DOCUMENTO_PADRAO } from "../config/config.ts";
import { classificarDocumentosPendentes } from "../fluxo/classificarDocumentos.ts";
import { ErroDaRota } from "./erros.ts";
import { organizacaoDo, registrarOrganizacao } from "./organizacao.ts";
import { registrarAutenticacao, type OpcoesDaAutenticacao } from "./rotasDeAutenticacao.ts";
import { ErroDeRevisao } from "../revisao/revisao.ts";
import { registrarRotasDeRevisao } from "./rotasDeRevisao.ts";
import { registrarRotasDeTarefas, type OpcoesDasTarefas } from "./rotasDeTarefas.ts";
import { ErroDaGestao } from "../autenticacao/gestaoDeUsuarios.ts";
import { registrarRotasDeGestaoDeUsuarios } from "./rotasDeGestaoDeUsuarios.ts";

/** Soma dos arquivos de um envio pela tela da Base, depois de decodificados. */
export const LIMITE_DO_ENVIO_EM_BYTES = 10 * 1024 * 1024;
export const LIMITE_DE_ARQUIVOS_POR_ENVIO = 100;
const TAMANHO_MAXIMO_DE_QUEM_ENVIA = 80;
// Os arquivos chegam em base64 (4 bytes para cada 3), mais o JSON em volta.
const LIMITE_DO_CORPO_EM_BYTES = Math.ceil((LIMITE_DO_ENVIO_EM_BYTES * 4) / 3) + 1024 * 1024;
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

export interface OpcoesDoServidor {
  banco: Banco;
  /** Data de hoje (AAAA-MM-DD). Nos testes, uma data fixa. */
  hoje?: () => string;
  /** Ambiente das tarefas (IA, armazenamento, configuração). Sem ele, só as rotas da base existem. */
  tarefas?: OpcoesDasTarefas;
  /** Log das requisições (sem corpo). Sem ele, o servidor não registra nada. */
  log?: FastifyBaseLogger;
  /** Login e sessão do modo compartilhado (etapa D4). Sem ela, o modo local: sem login, pessoa no corpo. */
  autenticacao?: OpcoesDaAutenticacao;
  /**
   * Transporte do modo compartilhado (etapa D6, cenário D10): atrás do proxy HTTPS do Render, exige
   * HTTPS e só aceita alterações vindas da origem do front. Sem ele, o modo local (127.0.0.1).
   */
  transporte?: { origemDoFront: string };
}

const METODOS_QUE_ALTERAM = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Documento como a tela da Base o recebe. */
export interface DocumentoDaBase {
  id: number;
  nome: string;
  titulo: string;
  tipo: DocumentoGravado["tipo"];
  atualizadoEm: string;
  versao: string | null;
  /** Validade (AAAA-MM-DD) ou null ("Indefinido" na tela). */
  validade: string | null;
  /** Validade atingida (cenário 80): fora da geração e sem reativação. */
  vencido: boolean;
  /** Ativo de fato: ligado na chave e não vencido. */
  ativo: boolean;
  enviadoPor: string | null;
  carregadoEm: string;
  /** Áreas do documento (fase U, cenário U17); null enquanto a IA não classificou ("Classificando…"). */
  areas: string[] | null;
}

interface CorpoDoEnvio {
  enviadoPor?: string;
  arquivos: { nome: string; conteudoBase64: string }[];
}


export const MENSAGEM_DE_DOCUMENTO_VENCIDO = "Documento vencido não pode ser reativado. Envie uma versão com nova validade.";

/** Documento como a tela o recebe, com o vencimento calculado pela data de hoje do backend. */
const paraTela = (hoje: string) => (documento: DocumentoGravado): DocumentoDaBase => {
  const vencido = estaVencido(documento.validade, hoje);
  return {
    id: documento.id,
    nome: documento.nome,
    titulo: documento.titulo,
    tipo: documento.tipo,
    atualizadoEm: documento.atualizadoEm,
    versao: documento.versao,
    validade: documento.validade,
    vencido,
    ativo: documento.ativo && !vencido,
    enviadoPor: documento.enviadoPor,
    carregadoEm: documento.carregadoEm,
    areas: documento.areas.length === 0 ? null : documento.areas,
  };
};

/**
 * Servidor HTTP local do backend. Rotas da base de conhecimento (listar, enviar `.md` com a mesma
 * carga do comando carregar-base, ativar ou desativar) e, com `tarefas`, as rotas de tarefas (B2).
 * Deve ouvir só em 127.0.0.1 (cenário 30); quem decide o endereço é o comando `servidor`.
 */
export function criarServidor(opcoes: OpcoesDoServidor): FastifyInstance {
  const { banco } = opcoes;
  const hoje = opcoes.hoje ?? (() => new Date().toISOString().slice(0, 10));
  const servidor = Fastify({
    bodyLimit: LIMITE_DO_CORPO_EM_BYTES,
    // Campo desconhecido no corpo é recusado, em vez de removido em silêncio.
    ajv: { customOptions: { removeAdditional: false } },
    // Atrás do proxy do Render, o IP da pessoa vem do X-Forwarded-For (limite de login, cenário D7).
    trustProxy: opcoes.transporte !== undefined,
    ...(opcoes.log === undefined ? { logger: false } : { loggerInstance: opcoes.log }),
  });

  // Uma carga por vez: duas cargas simultâneas do mesmo nome disputariam a mesma linha do banco.
  let fila: Promise<unknown> = Promise.resolve();
  const emFila = <T>(tarefa: () => Promise<T>): Promise<T> => {
    const resultado = fila.then(tarefa, tarefa);
    fila = resultado.catch(() => undefined);
    return resultado;
  };

  // Classificação dos documentos por área (fase U, PU2), numa fila própria: o envio não espera a IA,
  // e uma carga nova não espera a classificação da anterior. Ao fechar, termina o documento em curso
  // e deixa os demais para a próxima subida.
  const tarefas = opcoes.tarefas;
  let classificacao: Promise<void> = Promise.resolve();
  let fechando = false;
  /** Sem organização: a subida do backend, que também reclassifica as versões antigas da instrução. */
  const classificarEmSegundoPlano = (organizacaoId?: string) => {
    if (tarefas === undefined) return;
    classificacao = classificacao
      .then(async () => {
        if (fechando) return;
        const resultado = await classificarDocumentosPendentes({
          banco,
          api: tarefas.api,
          modelo: tarefas.ia.modeloDeClassificacaoDeDocumento ?? MODELO_DE_CLASSIFICACAO_DE_DOCUMENTO_PADRAO,
          ...(organizacaoId === undefined ? { reclassificarVersoesAntigas: true } : { organizacaoId }),
          continuar: () => !fechando,
          aoRegistrar: (entrada) =>
            opcoes.log?.info({ etapa: entrada.etapa, documentos: entrada.documentos, tokens: entrada.tokens, duracaoMs: entrada.duracaoMs, resultado: entrada.resultado, erro: entrada.erro }, "Requisição à IA"),
        });
        if (resultado.classificados + resultado.comFalha > 0) opcoes.log?.info(resultado, "Documentos classificados por área");
      })
      .catch((erro: unknown) => opcoes.log?.error({ erro: erro instanceof Error ? erro.name : "desconhecido" }, "Falha na classificação dos documentos"))
      .finally(() => tarefas.aoTerminarClassificacao?.());
  };
  if (tarefas?.classificarDocumentosAoIniciar === true) servidor.addHook("onReady", async () => classificarEmSegundoPlano());
  servidor.addHook("onClose", async () => {
    fechando = true;
    await classificacao;
  });

  servidor.setErrorHandler((erro: FastifyError, pedido, resposta) => {
    if (erro instanceof ErroDaRota || erro instanceof ErroDeRevisao || erro instanceof ErroDaGestao) return resposta.status(erro.statusCode).send({ erro: erro.message });
    if (erro.validation) return resposta.status(400).send({ erro: "Pedido inválido." });
    if (erro.code === "FST_ERR_CTP_BODY_TOO_LARGE") {
      return resposta.status(413).send({ erro: mensagemDeEnvioGrande() });
    }
    if (erro.statusCode !== undefined && erro.statusCode < 500) {
      return resposta.status(erro.statusCode).send({ erro: "Pedido inválido." });
    }
    pedido.log.error({ erro: erro.name }, "Falha ao atender o pedido");
    return resposta.status(500).send({ erro: "Erro interno do servidor. Tente novamente." });
  });

  servidor.decorateRequest("pessoaDaSessao", null);
  servidor.decorateRequest("organizacaoDaSessao", null);
  // Respostas da API nunca ficam em cache (navegador ou proxy): sessão e dados mudam a cada ação.
  servidor.addHook("onSend", async (pedido, resposta) => {
    if (pedido.url.startsWith("/api/")) resposta.header("cache-control", "no-store");
  });
  if (opcoes.transporte !== undefined) {
    const { origemDoFront } = opcoes.transporte;
    // Antes da sessão: um pedido recusado aqui não toca em nenhum dado.
    servidor.addHook("onRequest", async (pedido, resposta) => {
      // A verificação de saúde do Render chega direto ao serviço, sem passar pelo HTTPS do proxy.
      if (pedido.method === "GET" && pedido.url === "/api/saude") return;
      const protocolo = String(pedido.headers["x-forwarded-proto"] ?? "").split(",")[0]?.trim();
      if (protocolo !== "https") return resposta.status(403).send({ erro: "Conexão sem HTTPS recusada." });
      const origem = pedido.headers.origin;
      if (METODOS_QUE_ALTERAM.has(pedido.method) && origem !== undefined && origem !== origemDoFront) {
        return resposta.status(403).send({ erro: "Origem não autorizada." });
      }
    });
  }
  // Antes das rotas: a organização do pedido e a conferência do dono das tarefas (fase K).
  registrarOrganizacao(servidor, { banco, comLogin: opcoes.autenticacao !== undefined });
  if (opcoes.autenticacao !== undefined) {
    registrarAutenticacao(servidor, { banco, autenticacao: opcoes.autenticacao });
    // Painel de Usuários (fase Q): só com login; no modo local a tela usa os dados de exemplo.
    const { procurarConta } = opcoes.autenticacao;
    registrarRotasDeGestaoDeUsuarios(servidor, { banco, procurarConta: procurarConta ?? (async () => { throw new Error("Consulta de contas não configurada."); }) });
  }
  servidor.get("/api/saude", async () => ({ ok: true }));

  servidor.get("/api/base/documentos", async (pedido) => ({
    documentos: (await listarDocumentos(banco, organizacaoDo(pedido))).map(paraTela(hoje())),
  }));

  servidor.post<{ Body: CorpoDoEnvio }>(
    "/api/base/documentos",
    {
      schema: {
        body: {
          type: "object",
          required: ["arquivos"],
          additionalProperties: false,
          properties: {
            enviadoPor: { type: "string" },
            arquivos: {
              type: "array",
              minItems: 1,
              maxItems: LIMITE_DE_ARQUIVOS_POR_ENVIO,
              items: {
                type: "object",
                required: ["nome", "conteudoBase64"],
                additionalProperties: false,
                properties: { nome: { type: "string" }, conteudoBase64: { type: "string" } },
              },
            },
          },
        },
      },
    },
    async (pedido) => {
      const { arquivos: recebidos, enviadoPor } = pedido.body;
      let total = 0;
      const arquivos: ArquivoParaCarga[] = recebidos.map(({ nome, conteudoBase64 }) => {
        if (!BASE64.test(conteudoBase64)) throw new ErroDaRota(400, "Pedido inválido: conteúdo de arquivo mal codificado.");
        const conteudo = new Uint8Array(Buffer.from(conteudoBase64, "base64"));
        total += conteudo.byteLength;
        return { nome, conteudo };
      });
      if (total > LIMITE_DO_ENVIO_EM_BYTES) throw new ErroDaRota(413, mensagemDeEnvioGrande());

      // Com login, quem envia é a pessoa da sessão, nunca o valor do corpo (cenário D4).
      const quem = pedido.pessoaDaSessao?.nome ?? (enviadoPor?.trim().slice(0, TAMANHO_MAXIMO_DE_QUEM_ENVIA) || null);
      const organizacaoId = organizacaoDo(pedido);
      const resumo = await emFila(() => carregarArquivos({ banco, organizacaoId, arquivos, hoje: hoje(), enviadoPor: quem }));
      pedido.log.info(
        {
          arquivos: arquivos.length,
          carregados: resumo.carregados.length,
          atualizados: resumo.atualizados.length,
          semMudanca: resumo.semMudanca.length,
          recusados: resumo.recusados.length,
          ignorados: resumo.ignorados.length,
        },
        "Envio para a base",
      );
      if (resumo.carregados.length + resumo.atualizados.length > 0) classificarEmSegundoPlano(organizacaoId);
      return { resumo, documentos: (await listarDocumentos(banco, organizacaoId)).map(paraTela(hoje())) };
    },
  );

  servidor.patch<{ Params: { id: string }; Body: { ativo: boolean } }>(
    "/api/base/documentos/:id",
    {
      schema: {
        params: { type: "object", properties: { id: { type: "string", pattern: "^[1-9][0-9]{0,8}$" } } },
        body: {
          type: "object",
          required: ["ativo"],
          additionalProperties: false,
          properties: { ativo: { type: "boolean" } },
        },
      },
    },
    async (pedido) => {
      const organizacaoId = organizacaoDo(pedido);
      const id = Number(pedido.params.id);
      // Documento vencido não volta a ser ativo pela chave (cenário 80): só uma versão com nova validade.
      if (pedido.body.ativo) {
        const atual = (await listarDocumentos(banco, organizacaoId)).find((documento) => documento.id === id);
        if (atual !== undefined && estaVencido(atual.validade, hoje())) throw new ErroDaRota(409, MENSAGEM_DE_DOCUMENTO_VENCIDO);
      }
      // Documento de outra organização: 404, igual ao inexistente (cenário 70).
      const documento = await definirAtivo(banco, organizacaoId, id, pedido.body.ativo);
      if (documento === null) throw new ErroDaRota(404, "Documento não encontrado na base.");
      return { documento: paraTela(hoje())(documento) };
    },
  );

  if (opcoes.tarefas !== undefined) {
    registrarRotasDeTarefas(servidor, opcoes.tarefas);
    registrarRotasDeRevisao(servidor, { banco, pessoas: opcoes.tarefas.pessoas });
  }

  return servidor;
}

function mensagemDeEnvioGrande(): string {
  return `Envio acima de ${LIMITE_DO_ENVIO_EM_BYTES / (1024 * 1024)} MB. Envie os arquivos em partes menores.`;
}
