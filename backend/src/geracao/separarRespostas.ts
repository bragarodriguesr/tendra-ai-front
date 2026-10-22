import type { MensagemDaIa } from "../ia/cliente.ts";

/**
 * Separa a resposta de um lote em respostas por pergunta (etapa A5). A API não combina citações
 * com saída estruturada, então cada resposta começa com o marcador da pergunta, como [P12].
 * A conferência das citações, a localização e os estados ficam para a etapa A6.
 */

export const MARCADOR = /\[P(\d+)\]/g;
export const SEM_RESPOSTA = "SEM_RESPOSTA";

/** Citação devolvida pela API, ligada ao documento e aos blocos da carga. */
export interface CitacaoGerada {
  /** Nome do arquivo citado. */
  documento: string;
  /** Índice (a partir de 0) do primeiro bloco citado no documento. */
  blocoInicial: number;
  /** Índice (exclusivo) do fim do intervalo de blocos citado. */
  blocoFinal: number;
  /** Texto dos blocos citados, como a API devolve. */
  textoCitado: string;
}

/** Parte do texto da resposta, com as citações que a API ligou a ela. */
export interface TrechoGerado {
  texto: string;
  citacoes: CitacaoGerada[];
}

export interface RespostaGerada {
  numero: number;
  /**
   * respondida: há texto (com ou sem citação; a A6 remove o que não tem fonte válida).
   * sem_resposta: o modelo indicou que a base não responde.
   * sem_marcador: a resposta do lote não trouxe o marcador da pergunta.
   */
  situacao: "respondida" | "sem_resposta" | "sem_marcador";
  trechos: TrechoGerado[];
  /** Citações que não apontam para um documento do contexto em blocos, descartadas aqui. */
  citacoesDescartadas: number;
}

/**
 * Lê os blocos de texto na ordem. O texto antes do primeiro marcador e os marcadores de perguntas
 * que não estão no lote são ignorados. As citações de um bloco ficam com a pergunta em que o bloco
 * termina (o texto citado vem depois do marcador). Um marcador repetido continua a mesma resposta.
 */
export function separarRespostas(mensagem: MensagemDaIa, numeros: number[], documentos: string[]): RespostaGerada[] {
  const doLote = new Set(numeros);
  const trechos = new Map<number, TrechoGerado[]>();
  const descartadas = new Map<number, number>();
  let atual: number | null = null;

  const anotar = (texto: string, citacoes: CitacaoGerada[]) => {
    if (atual === null || !doLote.has(atual)) return;
    if (texto.trim() === "" && citacoes.length === 0) return;
    trechos.set(atual, [...(trechos.get(atual) ?? []), { texto, citacoes }]);
  };

  for (const bloco of mensagem.content) {
    if (bloco.type !== "text") continue;
    const partes = bloco.text.split(MARCADOR);
    // split com grupo de captura: [texto, número, texto, número, texto...]
    const numerosNoBloco = partes.filter((_, posicao) => posicao % 2 === 1).map(Number);
    const ultimo = numerosNoBloco.at(-1) ?? atual;
    const { validas, invalidas } = lerCitacoes(bloco.citations ?? [], documentos);
    if (ultimo !== null && doLote.has(ultimo)) descartadas.set(ultimo, (descartadas.get(ultimo) ?? 0) + invalidas);

    for (let posicao = 0; posicao < partes.length; posicao++) {
      if (posicao % 2 === 1) {
        atual = Number(partes[posicao]);
        continue;
      }
      const ehUltimaParte = posicao === partes.length - 1;
      anotar(partes[posicao] ?? "", ehUltimaParte ? validas : []);
    }
  }

  const vistos = marcadoresVistos(mensagem);
  return numeros.map((numero) => {
    const daPergunta = trechos.get(numero);
    const citacoesDescartadas = descartadas.get(numero) ?? 0;
    if (daPergunta === undefined) {
      // Marcador sem texto depois dele conta como sem resposta; marcador ausente é outro caso para a A6.
      return { numero, situacao: vistos.has(numero) ? "sem_resposta" : "sem_marcador", trechos: [], citacoesDescartadas };
    }
    const texto = daPergunta.map((trecho) => trecho.texto).join("").trim();
    const temCitacao = daPergunta.some((trecho) => trecho.citacoes.length > 0);
    if (!temCitacao && texto.replace(/[.\s]+$/, "") === SEM_RESPOSTA) {
      return { numero, situacao: "sem_resposta", trechos: [], citacoesDescartadas };
    }
    return { numero, situacao: "respondida", trechos: daPergunta, citacoesDescartadas };
  });
}

/** Marcadores presentes no texto, para distinguir "marcador sem texto" de "marcador ausente". */
function marcadoresVistos(mensagem: MensagemDaIa): Set<number> {
  const vistos = new Set<number>();
  for (const bloco of mensagem.content) {
    if (bloco.type !== "text") continue;
    for (const encontrado of bloco.text.matchAll(MARCADOR)) vistos.add(Number(encontrado[1]));
  }
  return vistos;
}

function lerCitacoes(
  citacoes: NonNullable<Extract<MensagemDaIa["content"][number], { type: "text" }>["citations"]>,
  documentos: string[],
): { validas: CitacaoGerada[]; invalidas: number } {
  const validas: CitacaoGerada[] = [];
  let invalidas = 0;
  for (const citacao of citacoes) {
    const documento = citacao.type === "content_block_location" ? documentos[citacao.document_index] : undefined;
    if (citacao.type !== "content_block_location" || documento === undefined) {
      invalidas++;
      continue;
    }
    validas.push({
      documento,
      blocoInicial: citacao.start_block_index,
      blocoFinal: citacao.end_block_index,
      textoCitado: citacao.cited_text,
    });
  }
  return { validas, invalidas };
}
