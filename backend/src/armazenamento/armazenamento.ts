import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/** Subpastas permitidas dentro da pasta de dados. */
export type Subpasta = "rfps" | "resultados";

export class ErroDeArmazenamento extends Error {
  override name = "ErroDeArmazenamento";
}

export interface Armazenamento {
  /**
   * Grava o conteúdo com um nome gerado pelo backend e devolve o caminho relativo
   * à pasta de dados. O nome original do arquivo nunca vira caminho (cenário 31).
   */
  salvar(subpasta: Subpasta, conteudo: Uint8Array, extensao: string): Promise<string>;
  /** Lê um arquivo a partir do caminho relativo devolvido por `salvar`. */
  ler(caminhoRelativo: string): Promise<Buffer>;
  /** Apaga um arquivo gravado por `salvar` (exclusão de tarefa, cenário 60). Arquivo que já não existe não é erro. */
  apagar(caminhoRelativo: string): Promise<void>;
}

const EXTENSAO_VALIDA = /^[a-z0-9]{1,10}$/;

/** Módulo único de leitura e gravação de arquivos (PUB-3), hoje sobre o disco local. */
export function criarArmazenamento(pastaDados: string): Armazenamento {
  const raiz = path.resolve(pastaDados);

  function caminhoAbsoluto(caminhoRelativo: string): string {
    const absoluto = path.resolve(raiz, caminhoRelativo);
    const relativo = path.relative(raiz, absoluto);
    if (relativo === "" || relativo.startsWith("..") || path.isAbsolute(relativo)) {
      throw new ErroDeArmazenamento("Caminho fora da pasta de dados.");
    }
    return absoluto;
  }

  return {
    async salvar(subpasta, conteudo, extensao) {
      if (!EXTENSAO_VALIDA.test(extensao)) {
        throw new ErroDeArmazenamento(`Extensão de arquivo inválida: ${extensao}`);
      }
      const caminhoRelativo = path.join(subpasta, `${randomUUID()}.${extensao}`);
      const absoluto = caminhoAbsoluto(caminhoRelativo);
      await mkdir(path.dirname(absoluto), { recursive: true });
      await writeFile(absoluto, conteudo, { flag: "wx" });
      return caminhoRelativo;
    },

    async ler(caminhoRelativo) {
      return readFile(caminhoAbsoluto(caminhoRelativo));
    },

    async apagar(caminhoRelativo) {
      await rm(caminhoAbsoluto(caminhoRelativo), { force: true });
    },
  };
}
