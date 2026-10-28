import type Anthropic from "@anthropic-ai/sdk";
import type { Bloco } from "../base/blocos.ts";
import type { ClienteDaIa } from "../ia/cliente.ts";
import type { Banco } from "../persistencia/banco.ts";
import { listarBlocos, listarDocumentosAtivos, type DocumentoGravado } from "../persistencia/documentos.ts";

/**
 * Contexto da geração (cenários 10, 11, 35 e 40): só os documentos ativos do banco vão ao Claude,
 * inteiros e divididos nos mesmos blocos da carga, sem busca vetorial. Fica atrás deste módulo
 * para a recuperação poder ser trocada depois sem mexer na geração.
 */

export const TETO_EM_BYTES = 25 * 1024 * 1024;
export const TETO_EM_TOKENS = 400_000;

export interface DocumentoDoContexto {
  nome: string;
  titulo: string;
  tipo: DocumentoGravado["tipo"];
  atualizadoEm: string;
  versao: string | null;
  tamanhoBytes: number;
  blocos: Bloco[];
}

export interface ContextoDaBase {
  documentos: DocumentoDoContexto[];
  bytes: number;
  tokens: number;
}

export type Fontes = { tipo: "vazia" } | { tipo: "base"; contexto: ContextoDaBase };

/** A base ativa passa do teto: a tarefa falha inteira, sem usar só uma parte da base (cenário 11). */
export class ErroDeTeto extends Error {
  override name = "ErroDeTeto";
}

type BlocoDeDocumento = Anthropic.Beta.Messages.BetaRequestDocumentBlock;

/**
 * Um bloco de documento por arquivo, com as citações ativadas. O conteúdo é a lista de blocos da
 * carga: a citação devolve o índice do bloco, que leva à seção e à linha. O último documento marca
 * o ponto de cache, cobrindo as instruções e a base inteira.
 */
export function paraBlocosDeDocumento(contexto: Pick<ContextoDaBase, "documentos">): BlocoDeDocumento[] {
  return contexto.documentos.map((documento, posicao) => ({
    type: "document",
    title: documento.titulo,
    context: [
      `Arquivo: ${documento.nome}`,
      `Tipo: ${documento.tipo === "rfp-passada" ? "RFP passada" : "documento"}`,
      `Atualizado em: ${documento.atualizadoEm}`,
      `Versão: ${documento.versao ?? "sem versão"}`,
    ].join(". "),
    citations: { enabled: true },
    source: { type: "content", content: documento.blocos.map((bloco) => ({ type: "text", text: bloco.texto })) },
    ...(posicao === contexto.documentos.length - 1 ? { cache_control: { type: "ephemeral" } } : {}),
  }));
}

/**
 * Monta o contexto da tarefa. Base sem documento ativo devolve "vazia", sem chamar a IA
 * (cenário 10). Acima de 25 MB, falha antes de qualquer chamada; abaixo, conta os tokens pela
 * API e falha acima de 400 mil (cenário 11).
 */
export async function buscarFontes(opcoes: { banco: Banco; organizacaoId: string; cliente: ClienteDaIa; modelo: string }): Promise<Fontes> {
  // Só a base da organização da tarefa (cenário 71): teto e base vazia também contam só ela.
  const ativos = await listarDocumentosAtivos(opcoes.banco, opcoes.organizacaoId);
  if (ativos.length === 0) return { tipo: "vazia" };

  const bytes = ativos.reduce((soma, documento) => soma + documento.tamanhoBytes, 0);
  if (bytes > TETO_EM_BYTES) throw new ErroDeTeto(mensagemDoTeto(bytes, null));

  const documentos: DocumentoDoContexto[] = [];
  for (const documento of ativos) {
    documentos.push({
      nome: documento.nome,
      titulo: documento.titulo,
      tipo: documento.tipo,
      atualizadoEm: documento.atualizadoEm,
      versao: documento.versao,
      tamanhoBytes: documento.tamanhoBytes,
      blocos: await listarBlocos(opcoes.banco, opcoes.organizacaoId, documento.nome),
    });
  }

  const tokens = await opcoes.cliente.contarTokens({
    etapa: "contagem",
    documentos: documentos.map((documento) => documento.nome),
    perguntas: [],
    parametros: {
      model: opcoes.modelo,
      messages: [{ role: "user", content: [...paraBlocosDeDocumento({ documentos }), { type: "text", text: "Base de conhecimento." }] }],
    },
  });
  if (tokens > TETO_EM_TOKENS) throw new ErroDeTeto(mensagemDoTeto(bytes, tokens));

  return { tipo: "base", contexto: { documentos, bytes, tokens } };
}

function mensagemDoTeto(bytes: number, tokens: number | null): string {
  const megas = (bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const tamanho = tokens === null ? `${megas} MB` : `${megas} MB e ${tokens.toLocaleString("pt-BR")} tokens`;
  return `A base ativa tem ${tamanho}, acima do teto de 25 MB e 400 mil tokens. Desative documentos na tela da Base para continuar.`;
}
