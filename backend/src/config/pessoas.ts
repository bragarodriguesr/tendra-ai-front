import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ErroDeConfiguracao } from "./config.ts";

/**
 * Pessoas que podem agir na revisão (exceção E1): a lista sintética de configuração, até o login da
 * fase D. O papel é gravado em cada ação, mas não restringe nada nesta versão (cenário 41).
 */
export interface Pessoa {
  id: string;
  nome: string;
  papel: string;
  /** Áreas do Aprovador (fase N, PN3). Só existe com login; a pessoa do modo local não tem área e nada restringe. */
  areas?: string[];
}

const ARQUIVO_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../config/pessoas.json");

export async function carregarPessoas(arquivo = ARQUIVO_PADRAO): Promise<Pessoa[]> {
  const pessoas: unknown = JSON.parse(await readFile(arquivo, "utf8"));
  const valida = (pessoa: unknown) =>
    typeof pessoa === "object" &&
    pessoa !== null &&
    (["id", "nome", "papel"] as const).every((campo) => {
      const valor = (pessoa as Record<string, unknown>)[campo];
      return typeof valor === "string" && valor.trim() !== "";
    });
  if (!Array.isArray(pessoas) || pessoas.length === 0 || !pessoas.every(valida)) {
    throw new ErroDeConfiguracao(`${path.basename(arquivo)}: lista de pessoas com id, nome e papel.`);
  }
  return pessoas as Pessoa[];
}
