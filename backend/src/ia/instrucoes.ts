import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Instruções enviadas ao modelo, versionadas no repositório. A versão vai para o registro de
 * cada tarefa (cenário 38): mudar o texto exige um arquivo novo e a avaliação da A10 (cenário 36).
 */
export const VERSOES_DAS_INSTRUCOES = {
  geracao: "geracao-v1",
  identificacao: "identificacao-v1",
  conflito: "conflito-v1",
} as const;

export type NomeDasInstrucoes = keyof typeof VERSOES_DAS_INSTRUCOES;

export interface Instrucoes {
  versao: string;
  texto: string;
}

const PASTA = path.join(path.dirname(fileURLToPath(import.meta.url)), "instrucoes");

export async function lerInstrucoes(nome: NomeDasInstrucoes): Promise<Instrucoes> {
  const versao = VERSOES_DAS_INSTRUCOES[nome];
  const texto = (await readFile(path.join(PASTA, `${versao}.md`), "utf8")).trim();
  return { versao, texto };
}
