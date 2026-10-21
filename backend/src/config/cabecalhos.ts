import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ErroDeConfiguracao } from "./config.ts";

/** Nomes de cabeçalho aceitos para as colunas da planilha de RFP (cenários 1 e 51). */
export interface NomesDeCabecalho {
  pergunta: string[];
  resposta: string[];
  comentario: string[];
}

const ARQUIVO_PADRAO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../config/cabecalhos.json",
);

const CAMPOS: (keyof NomesDeCabecalho)[] = ["pergunta", "resposta", "comentario"];

function listaDeTextos(valor: unknown): valor is string[] {
  return (
    Array.isArray(valor) &&
    valor.length > 0 &&
    valor.every((nome) => typeof nome === "string" && nome.trim() !== "")
  );
}

/** Lê os nomes de cabeçalho aceitos do arquivo de configuração. */
export async function carregarCabecalhos(arquivo = ARQUIVO_PADRAO): Promise<NomesDeCabecalho> {
  const conteudo: unknown = JSON.parse(await readFile(arquivo, "utf8"));
  const objeto = (typeof conteudo === "object" && conteudo !== null ? conteudo : {}) as Record<string, unknown>;
  const invalidos = CAMPOS.filter((campo) => !listaDeTextos(objeto[campo]));
  if (invalidos.length > 0) {
    throw new ErroDeConfiguracao(
      `${path.basename(arquivo)}: ${invalidos.join(", ")} deve ser uma lista não vazia de textos.`,
    );
  }
  return {
    pergunta: objeto.pergunta as string[],
    resposta: objeto.resposta as string[],
    comentario: objeto.comentario as string[],
  };
}
