import type { ConfiguracaoDaIa } from "../config/config.ts";
import type { ClienteDaIa, ParametrosDaGeracao } from "../ia/cliente.ts";
import { lerInstrucoes } from "../ia/instrucoes.ts";
import { paraBlocosDeDocumento, type ContextoDaBase } from "../recuperacao/buscarFontes.ts";
import { MARCADOR, separarRespostas, type RespostaGerada } from "./separarRespostas.ts";

/**
 * Geração das respostas sugeridas (etapa A5): perguntas em lotes, a base inteira como documentos
 * com citações e cache, e as respostas separadas pelos marcadores. A conferência das citações e os
 * estados dos itens são da etapa A6.
 */

export interface PerguntaParaGerar {
  /** Número da pergunta na tarefa (1, 2, 3…), usado no marcador [Pn] e no registro. */
  numero: number;
  texto: string;
}

export interface ResultadoDaGeracao {
  respostas: RespostaGerada[];
  /** O que gerou as respostas, para registrar na tarefa (cenário 38). */
  versaoDasInstrucoes: string;
  modelo: string;
  tamanhoDoLote: number;
}

export interface OpcoesDaGeracao {
  cliente: ClienteDaIa;
  contexto: Pick<ContextoDaBase, "documentos">;
  perguntas: PerguntaParaGerar[];
  ia: Pick<ConfiguracaoDaIa, "modelo" | "esforco" | "tamanhoDoLote">;
  /** Chamado ao fim de cada lote, para gravar o progresso (cenário 16). */
  aoConcluirLote?: (processadas: number, total: number) => void | Promise<void>;
  /** Respostas já geradas antes de um reinício, por número da pergunta (retomada, etapa D8). */
  jaGeradas?: ReadonlyMap<number, RespostaGerada>;
  /** Chamado com as respostas de cada lote gerado, antes do progresso, para gravá-las. */
  aoGerarLote?: (respostas: RespostaGerada[]) => void | Promise<void>;
}

/** Espaço de saída de um lote: respostas curtas, mais o raciocínio do modelo. A resposta vem por streaming. */
const MAXIMO_DE_TOKENS_POR_LOTE = 32_000;

/** Modelos com fallback no servidor quando o modelo recusa por engano (refusal). */
const MODELOS_COM_FALLBACK = new Set(["claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5", "claude-fable-5-1"]);

export async function gerarRespostas(opcoes: OpcoesDaGeracao): Promise<ResultadoDaGeracao> {
  const instrucoes = await lerInstrucoes("geracao");
  const documentos = paraBlocosDeDocumento(opcoes.contexto);
  const nomes = opcoes.contexto.documentos.map((documento) => documento.nome);
  const { modelo, esforco, tamanhoDoLote } = opcoes.ia;

  const respostas: RespostaGerada[] = [];
  for (let inicio = 0; inicio < opcoes.perguntas.length; inicio += tamanhoDoLote) {
    const lote = opcoes.perguntas.slice(inicio, inicio + tamanhoDoLote);
    const numeros = lote.map((pergunta) => pergunta.numero);
    // Lote inteiro já gerado antes do reinício: nenhuma chamada à API (cenário D15).
    const gravadas = numeros.map((numero) => opcoes.jaGeradas?.get(numero));
    if (gravadas.every((resposta) => resposta !== undefined)) {
      respostas.push(...(gravadas as RespostaGerada[]));
      await opcoes.aoConcluirLote?.(respostas.length, opcoes.perguntas.length);
      continue;
    }
    const parametros: ParametrosDaGeracao = {
      model: modelo,
      max_tokens: MAXIMO_DE_TOKENS_POR_LOTE,
      output_config: { effort: esforco },
      ...(MODELOS_COM_FALLBACK.has(modelo) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      system: [{ type: "text", text: instrucoes.texto }],
      messages: [{ role: "user", content: [...documentos, { type: "text", text: formatarPerguntas(lote) }] }],
    };
    const mensagem = await opcoes.cliente.gerar({ etapa: "geracao", documentos: nomes, perguntas: numeros, parametros });
    const doLote = separarRespostas(mensagem, numeros, nomes);
    await opcoes.aoGerarLote?.(doLote);
    respostas.push(...doLote);
    await opcoes.aoConcluirLote?.(respostas.length, opcoes.perguntas.length);
  }

  return { respostas, versaoDasInstrucoes: instrucoes.versao, modelo, tamanhoDoLote };
}

/**
 * Perguntas do lote, cada uma com o seu marcador. Um marcador escrito dentro do texto de uma
 * pergunta é neutralizado, para a planilha não conseguir embaralhar as respostas (cenário 15).
 */
export function formatarPerguntas(lote: PerguntaParaGerar[]): string {
  const linhas = lote.map((pergunta) => `[P${pergunta.numero}] ${pergunta.texto.replace(MARCADOR, "(P$1)").replace(/\s+/g, " ").trim()}`);
  return ["<perguntas>", ...linhas, "</perguntas>"].join("\n");
}
