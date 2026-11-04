import Anthropic from "@anthropic-ai/sdk";

/**
 * Cliente da API do Claude (etapa A5). Isola o SDK: erros tipados, novas tentativas em falhas
 * temporárias (feitas pelo SDK) e o registro de cada requisição, sem a chave da API e sem o
 * conteúdo dos documentos ou das respostas (cenários 17 e 29).
 */

export type ParametrosDaGeracao = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
export type ParametrosDaContagem = Anthropic.Beta.Messages.MessageCountTokensParams;
export type MensagemDaIa = Anthropic.Beta.Messages.BetaMessage;

/** Novas tentativas do SDK em 408, 409, 429, 5xx e falhas de conexão, com espera crescente. */
export const NOVAS_TENTATIVAS = 3;

/** Só o que o backend usa da API. Nos testes, é trocada por uma API simulada. */
export interface ApiDoClaude {
  gerar(parametros: ParametrosDaGeracao): Promise<MensagemDaIa>;
  contarTokens(parametros: ParametrosDaContagem): Promise<number>;
}

/**
 * API real, com a chave da configuração. Respostas longas vêm por streaming, para não estourar o
 * tempo limite. `enderecoBase` só é usado nos testes, com um servidor local no lugar da API.
 */
export function criarApiDoClaude(chaveApi: string, opcoes: { enderecoBase?: string } = {}): ApiDoClaude {
  const cliente = new Anthropic({
    apiKey: chaveApi,
    maxRetries: NOVAS_TENTATIVAS,
    ...(opcoes.enderecoBase === undefined ? {} : { baseURL: opcoes.enderecoBase }),
  });
  return {
    gerar: (parametros) => cliente.beta.messages.stream(parametros).finalMessage(),
    contarTokens: async (parametros) => (await cliente.beta.messages.countTokens(parametros)).input_tokens,
  };
}

export type TipoDeErroDaIa =
  | "chave_recusada"
  | "falha_de_comunicacao"
  | "pedido_recusado"
  | "recusa"
  | "resposta_incompleta"
  | "resposta_invalida";

const MENSAGENS: Record<TipoDeErroDaIa, string> = {
  chave_recusada: "Chave da API recusada.",
  falha_de_comunicacao: "Falha na comunicação com o provedor de IA.",
  pedido_recusado: "O provedor de IA recusou o pedido.",
  recusa: "O modelo se recusou a responder.",
  resposta_incompleta: "A resposta da IA foi cortada pelo limite de tamanho.",
  resposta_invalida: "A resposta da IA veio num formato inesperado.",
};

/** Falha da IA com motivo legível. A mensagem nunca traz a chave nem o texto do provedor. */
export class ErroDaIa extends Error {
  override name = "ErroDaIa";
  readonly tipo: TipoDeErroDaIa;

  constructor(tipo: TipoDeErroDaIa) {
    super(MENSAGENS[tipo]);
    this.tipo = tipo;
  }
}

/**
 * "revisao-texto" é o "Revisar com IA" de uma resposta manual, pedido na tela de revisão (cenário 65);
 * "classificacao", a área das perguntas (fase N, PN5).
 */
export type EtapaDaIa = "identificacao" | "classificacao" | "geracao" | "conflito" | "contagem" | "revisao-texto";

/** Uma linha do registro de requisições (cenário 29). Sem chave e sem conteúdo. */
export interface EntradaDoRegistro {
  quando: string;
  etapa: EtapaDaIa;
  /** Modelo pedido; com fallback, o modelo que respondeu. */
  modelo: string;
  /** Nomes dos arquivos enviados. */
  documentos: string[];
  /** Números das perguntas enviadas. */
  perguntas: number[];
  tokens: { entrada: number; saida: number; lidosDoCache: number; gravadosNoCache: number } | null;
  duracaoMs: number;
  resultado: "sucesso" | "erro";
  erro?: TipoDeErroDaIa;
}

export interface PedidoAIa<P> {
  etapa: EtapaDaIa;
  documentos: string[];
  perguntas: number[];
  parametros: P;
}

export class ClienteDaIa {
  readonly #api: ApiDoClaude;
  readonly #registrar: (entrada: EntradaDoRegistro) => void;
  readonly #agora: () => Date;

  constructor(api: ApiDoClaude, registrar: (entrada: EntradaDoRegistro) => void, agora: () => Date = () => new Date()) {
    this.#api = api;
    this.#registrar = registrar;
    this.#agora = agora;
  }

  /** Uma chamada de geração. Recusa e resposta cortada viram ErroDaIa: nada parcial segue adiante. */
  async gerar(pedido: PedidoAIa<ParametrosDaGeracao>): Promise<MensagemDaIa> {
    const inicio = this.#agora();
    try {
      const mensagem = await this.#api.gerar(pedido.parametros);
      const { usage } = mensagem;
      const tokens = {
        entrada: usage.input_tokens,
        saida: usage.output_tokens,
        lidosDoCache: usage.cache_read_input_tokens ?? 0,
        gravadosNoCache: usage.cache_creation_input_tokens ?? 0,
      };
      const erro = mensagem.stop_reason === "refusal" ? "recusa" : mensagem.stop_reason === "max_tokens" ? "resposta_incompleta" : null;
      this.#registrarFim(pedido, inicio, mensagem.model, tokens, erro);
      if (erro !== null) throw new ErroDaIa(erro);
      return mensagem;
    } catch (erro) {
      if (erro instanceof ErroDaIa) throw erro;
      const tipo = classificarErro(erro);
      this.#registrarFim(pedido, inicio, pedido.parametros.model, null, tipo);
      throw new ErroDaIa(tipo);
    }
  }

  /** Contagem de tokens de um pedido, usada no teto da base (cenário 11). */
  async contarTokens(pedido: PedidoAIa<ParametrosDaContagem>): Promise<number> {
    const inicio = this.#agora();
    try {
      const entrada = await this.#api.contarTokens(pedido.parametros);
      this.#registrarFim(pedido, inicio, pedido.parametros.model, { entrada, saida: 0, lidosDoCache: 0, gravadosNoCache: 0 }, null);
      return entrada;
    } catch (erro) {
      const tipo = classificarErro(erro);
      this.#registrarFim(pedido, inicio, pedido.parametros.model, null, tipo);
      throw new ErroDaIa(tipo);
    }
  }

  #registrarFim(
    pedido: PedidoAIa<unknown>,
    inicio: Date,
    modelo: string,
    tokens: EntradaDoRegistro["tokens"],
    erro: TipoDeErroDaIa | null,
  ): void {
    this.#registrar({
      quando: inicio.toISOString(),
      etapa: pedido.etapa,
      modelo,
      documentos: pedido.documentos,
      perguntas: pedido.perguntas,
      tokens,
      duracaoMs: this.#agora().getTime() - inicio.getTime(),
      resultado: erro === null ? "sucesso" : "erro",
      ...(erro === null ? {} : { erro }),
    });
  }
}

/** Traduz os erros do SDK, do mais específico ao mais geral. Outros erros são falhas do backend e seguem. */
export function classificarErro(erro: unknown): TipoDeErroDaIa {
  if (erro instanceof Anthropic.AuthenticationError || erro instanceof Anthropic.PermissionDeniedError) return "chave_recusada";
  if (
    erro instanceof Anthropic.BadRequestError ||
    erro instanceof Anthropic.NotFoundError ||
    erro instanceof Anthropic.UnprocessableEntityError
  ) {
    return "pedido_recusado";
  }
  if (erro instanceof Anthropic.APIError) return "falha_de_comunicacao";
  throw erro;
}
