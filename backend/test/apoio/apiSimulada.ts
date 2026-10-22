import type { ApiDoClaude, MensagemDaIa, ParametrosDaContagem, ParametrosDaGeracao } from "../../src/ia/cliente.ts";

type Resposta = MensagemDaIa | Error | ((parametros: ParametrosDaGeracao) => MensagemDaIa);

/**
 * API do Claude simulada: guarda os parâmetros de cada chamada e devolve as respostas da fila
 * (mensagem pronta, função que monta a mensagem a partir do pedido, ou erro a lançar).
 */
export class ApiSimulada implements ApiDoClaude {
  readonly geracoes: ParametrosDaGeracao[] = [];
  readonly contagens: ParametrosDaContagem[] = [];
  respostas: Resposta[] = [];
  tokensContados: number | Error = 50_000;

  async gerar(parametros: ParametrosDaGeracao): Promise<MensagemDaIa> {
    this.geracoes.push(parametros);
    const resposta = this.respostas.length > 1 ? this.respostas.shift() : this.respostas[0];
    if (resposta === undefined) throw new Error("ApiSimulada sem resposta configurada");
    if (resposta instanceof Error) throw resposta;
    return typeof resposta === "function" ? resposta(parametros) : resposta;
  }

  async contarTokens(parametros: ParametrosDaContagem): Promise<number> {
    this.contagens.push(parametros);
    if (this.tokensContados instanceof Error) throw this.tokensContados;
    return this.tokensContados;
  }
}

/** Mensagem no formato da API, com o uso de tokens preenchido. */
export function mensagem(
  conteudo: MensagemDaIa["content"],
  extra: Partial<Pick<MensagemDaIa, "stop_reason" | "model">> = {},
): MensagemDaIa {
  return {
    id: "msg_simulada",
    type: "message",
    role: "assistant",
    model: extra.model ?? "claude-opus-5-5",
    content: conteudo,
    stop_reason: extra.stop_reason ?? "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 20, cache_creation_input_tokens: 0, cache_read_input_tokens: 900 },
  } as MensagemDaIa;
}

export const texto = (text: string, citations: unknown[] | null = null) =>
  ({ type: "text", text, citations }) as MensagemDaIa["content"][number];
