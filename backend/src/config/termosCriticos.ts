import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ErroDeConfiguracao } from "./config.ts";

/** Termos que marcam a pergunta com o alerta `critical` (cenário 21). */
const ARQUIVO_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../config/termos-criticos.json");

export async function carregarTermosCriticos(arquivo = ARQUIVO_PADRAO): Promise<string[]> {
  const conteudo: unknown = JSON.parse(await readFile(arquivo, "utf8"));
  const termos = (typeof conteudo === "object" && conteudo !== null ? (conteudo as Record<string, unknown>).termos : undefined) as unknown;
  if (!Array.isArray(termos) || termos.length === 0 || !termos.every((termo) => typeof termo === "string" && termo.trim() !== "")) {
    throw new ErroDeConfiguracao(`${path.basename(arquivo)}: termos deve ser uma lista não vazia de textos.`);
  }
  return termos as string[];
}
