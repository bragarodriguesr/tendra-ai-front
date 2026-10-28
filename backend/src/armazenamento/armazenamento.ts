import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { ORGANIZACAO_INICIAL } from "../persistencia/organizacoes.ts";

/** Subpastas permitidas dentro da pasta de dados. */
export type Subpasta = "rfps" | "resultados";

export class ErroDeArmazenamento extends Error {
  override name = "ErroDeArmazenamento";
}

/**
 * Arquivos separados por organização (cenário 76): o caminho começa pelo id da organização dona,
 * e ler ou apagar confere esse dono antes de tocar no arquivo.
 */
export interface Armazenamento {
  /**
   * Grava o conteúdo com um nome gerado pelo backend e devolve o caminho relativo
   * à pasta de dados (`<organização>/<subpasta>/<uuid>.<extensão>`). O nome original do
   * arquivo nunca vira caminho (cenário 31).
   */
  salvar(organizacaoId: string, subpasta: Subpasta, conteudo: Uint8Array, extensao: string): Promise<string>;
  /** Lê um arquivo da organização a partir do caminho relativo devolvido por `salvar`. */
  ler(organizacaoId: string, caminhoRelativo: string): Promise<Buffer>;
  /** Apaga um arquivo da organização gravado por `salvar` (exclusão de tarefa, cenário 60). Arquivo que já não existe não é erro. */
  apagar(organizacaoId: string, caminhoRelativo: string): Promise<void>;
}

const EXTENSAO_VALIDA = /^[a-z0-9]{1,10}$/;
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
/** Caminho gravado por `salvar`: com a organização ou, antes da fase K, sem ela. */
export const CAMINHO_GERADO = new RegExp(`^(?:(${UUID})/)?(?:rfps|resultados)/${UUID}\\.[a-z0-9]{1,10}$`);

/** Pasta da organização para um arquivo novo. Recusa um id fora do formato. */
export function pastaDaOrganizacao(organizacaoId: string, subpasta: Subpasta): string {
  if (!new RegExp(`^${UUID}$`).test(organizacaoId)) throw new ErroDeArmazenamento("Organização inválida para o armazenamento.");
  return `${organizacaoId}/${subpasta}`;
}

/**
 * Confere que o caminho é um gerado por `salvar` e pertence à organização (cenário 76). Os arquivos
 * gravados antes da fase K, sem a organização no caminho, são todos da organização inicial (PK3).
 */
export function conferirDono(organizacaoId: string, caminhoRelativo: string): void {
  const encontrado = CAMINHO_GERADO.exec(caminhoRelativo.split(path.sep).join("/"));
  if (encontrado === null) throw new ErroDeArmazenamento("Caminho fora da pasta de dados.");
  const dono = encontrado[1] ?? ORGANIZACAO_INICIAL;
  if (dono !== organizacaoId) throw new ErroDeArmazenamento("Arquivo de outra organização.");
}

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
    async salvar(organizacaoId, subpasta, conteudo, extensao) {
      if (!EXTENSAO_VALIDA.test(extensao)) {
        throw new ErroDeArmazenamento(`Extensão de arquivo inválida: ${extensao}`);
      }
      const caminhoRelativo = path.join(pastaDaOrganizacao(organizacaoId, subpasta), `${randomUUID()}.${extensao}`);
      const absoluto = caminhoAbsoluto(caminhoRelativo);
      await mkdir(path.dirname(absoluto), { recursive: true });
      await writeFile(absoluto, conteudo, { flag: "wx" });
      return caminhoRelativo;
    },

    async ler(organizacaoId, caminhoRelativo) {
      conferirDono(organizacaoId, caminhoRelativo);
      return readFile(caminhoAbsoluto(caminhoRelativo));
    },

    async apagar(organizacaoId, caminhoRelativo) {
      conferirDono(organizacaoId, caminhoRelativo);
      await rm(caminhoAbsoluto(caminhoRelativo), { force: true });
    },
  };
}
