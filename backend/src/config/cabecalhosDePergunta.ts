import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ErroDeConfiguracao } from "./config.ts";

const ARQUIVO_PADRAO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../config/cabecalhos-de-pergunta.json",
);

/** Lê a lista de nomes de cabeçalho aceitos para a coluna de perguntas (cenário 1). */
export async function carregarCabecalhosDePergunta(arquivo = ARQUIVO_PADRAO): Promise<string[]> {
  const conteudo: unknown = JSON.parse(await readFile(arquivo, "utf8"));
  if (
    !Array.isArray(conteudo) ||
    conteudo.length === 0 ||
    !conteudo.every((nome) => typeof nome === "string" && nome.trim() !== "")
  ) {
    throw new ErroDeConfiguracao(
      `${path.basename(arquivo)} deve ser uma lista não vazia de textos.`,
    );
  }
  return conteudo;
}
