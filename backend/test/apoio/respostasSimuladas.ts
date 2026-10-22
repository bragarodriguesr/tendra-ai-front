import type { MensagemDaIa, ParametrosDaGeracao } from "../../src/ia/cliente.ts";
import { mensagem, texto } from "./apiSimulada.ts";

/** Números das perguntas do lote, lidos dos marcadores [Pn] do pedido. */
export function numerosDoPedido(parametros: ParametrosDaGeracao): number[] {
  const conteudo = parametros.messages[0]?.content;
  const perguntas = Array.isArray(conteudo) ? conteudo.at(-1) : undefined;
  return perguntas?.type === "text" ? [...perguntas.text.matchAll(/^\[P(\d+)\]/gm)].map((m) => Number(m[1])) : [];
}

/** Perguntas ímpares: resposta citando o 2º bloco do 1º documento. Pares: SEM_RESPOSTA. */
export function respondeImparesCitando(parametros: ParametrosDaGeracao): MensagemDaIa {
  const conteudo = parametros.messages[0]?.content;
  if (!Array.isArray(conteudo)) throw new Error("conteúdo inesperado");
  const documento = conteudo[0];
  const blocos = documento?.type === "document" && documento.source.type === "content" && Array.isArray(documento.source.content) ? documento.source.content : [];
  const segundo = blocos[1];
  const citado = segundo?.type === "text" ? segundo.text : "";
  return mensagem(
    numerosDoPedido(parametros).flatMap((numero) =>
      numero % 2 === 0
        ? [texto(`[P${numero}]\nSEM_RESPOSTA\n\n`)]
        : [
            texto(`[P${numero}]\n`),
            texto(`Resposta ${numero}.`, [{ type: "content_block_location", cited_text: citado, document_index: 0, document_title: null, start_block_index: 1, end_block_index: 2, file_id: null }]),
            texto("\n\n"),
          ],
    ),
  );
}
