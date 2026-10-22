import type { Bloco } from "../base/blocos.ts";
import type { Cabecalho } from "../base/cabecalho.ts";
import type { Banco } from "./banco.ts";

/** Documento da base como está gravado no banco. */
export interface DocumentoGravado {
  id: number;
  caminho: string;
  titulo: string;
  tipo: Cabecalho["tipo"];
  atualizadoEm: string;
  versao: string | null;
  hash: string;
  tamanhoBytes: number;
  tokensEstimados: number;
  ativo: boolean;
  enviadoPor: string | null;
}

/** Dados de um documento a gravar, já validado e dividido em blocos. */
export interface DocumentoParaGravar {
  caminho: string;
  cabecalho: Cabecalho;
  hash: string;
  tamanhoBytes: number;
  tokensEstimados: number;
  enviadoPor: string | null;
  blocos: Bloco[];
}

interface LinhaDeDocumento {
  id: number;
  caminho: string;
  titulo: string;
  tipo: Cabecalho["tipo"];
  atualizado_em: string;
  versao: string | null;
  hash: string;
  tamanho_bytes: number;
  tokens_estimados: number;
  ativo: boolean;
  enviado_por: string | null;
}

const COLUNAS = `id, caminho, titulo, tipo, to_char(atualizado_em, 'YYYY-MM-DD') AS atualizado_em, versao, hash,
  tamanho_bytes, tokens_estimados, ativo, enviado_por`;

function paraDocumento(linha: LinhaDeDocumento): DocumentoGravado {
  return {
    id: linha.id,
    caminho: linha.caminho,
    titulo: linha.titulo,
    tipo: linha.tipo,
    atualizadoEm: linha.atualizado_em,
    versao: linha.versao,
    hash: linha.hash,
    tamanhoBytes: linha.tamanho_bytes,
    tokensEstimados: linha.tokens_estimados,
    ativo: linha.ativo,
    enviadoPor: linha.enviado_por,
  };
}

/** Todos os documentos da base, ativos ou não, em ordem de caminho. */
export async function listarDocumentos(banco: Banco): Promise<DocumentoGravado[]> {
  const { rows } = await banco.query<LinhaDeDocumento>(`SELECT ${COLUNAS} FROM documentos ORDER BY caminho`);
  return rows.map(paraDocumento);
}

/** Só os documentos ativos: os únicos que podem ser fontes de uma nova tarefa (cenário 40). */
export async function listarDocumentosAtivos(banco: Banco): Promise<DocumentoGravado[]> {
  const { rows } = await banco.query<LinhaDeDocumento>(
    `SELECT ${COLUNAS} FROM documentos WHERE ativo ORDER BY caminho`,
  );
  return rows.map(paraDocumento);
}

/**
 * Grava um documento novo ou substitui a versão anterior do mesmo caminho, com os blocos,
 * numa única transação. A substituição mantém o estado ativo ou inativo (cenário 39).
 */
export async function gravarDocumento(banco: Banco, documento: DocumentoParaGravar): Promise<"novo" | "substituido"> {
  return banco.transaction(async (transacao) => {
    const { cabecalho } = documento;
    const existente = await transacao.query<{ id: number }>("SELECT id FROM documentos WHERE caminho = $1", [
      documento.caminho,
    ]);
    const idExistente = existente.rows[0]?.id;

    let id: number;
    if (idExistente === undefined) {
      const inserido = await transacao.query<{ id: number }>(
        `INSERT INTO documentos (caminho, titulo, tipo, atualizado_em, versao, hash, tamanho_bytes, tokens_estimados, enviado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          documento.caminho,
          cabecalho.titulo,
          cabecalho.tipo,
          cabecalho.atualizadoEm,
          cabecalho.versao,
          documento.hash,
          documento.tamanhoBytes,
          documento.tokensEstimados,
          documento.enviadoPor,
        ],
      );
      const novoId = inserido.rows[0]?.id;
      if (novoId === undefined) throw new Error(`Falha ao gravar ${documento.caminho}.`);
      id = novoId;
    } else {
      id = idExistente;
      await transacao.query(
        `UPDATE documentos SET titulo = $2, tipo = $3, atualizado_em = $4, versao = $5, hash = $6,
           tamanho_bytes = $7, tokens_estimados = $8, enviado_por = COALESCE($9, enviado_por), substituido_em = now()
         WHERE id = $1`,
        [
          id,
          cabecalho.titulo,
          cabecalho.tipo,
          cabecalho.atualizadoEm,
          cabecalho.versao,
          documento.hash,
          documento.tamanhoBytes,
          documento.tokensEstimados,
          documento.enviadoPor,
        ],
      );
      await transacao.query("DELETE FROM blocos WHERE documento_id = $1", [id]);
    }

    for (const bloco of documento.blocos) {
      await transacao.query(
        `INSERT INTO blocos (documento_id, ordem, secao, caminho_de_secoes, linha_inicial, linha_final, texto)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, bloco.ordem, bloco.secao, bloco.caminhoDeSecoes, bloco.linhaInicial, bloco.linhaFinal, bloco.texto],
      );
    }
    return idExistente === undefined ? "novo" : "substituido";
  });
}

/** Ativa ou desativa um documento pelo caminho. Devolve false se o caminho não existe na base. */
export async function definirAtivo(banco: Banco, caminho: string, ativo: boolean): Promise<boolean> {
  const resultado = await banco.query("UPDATE documentos SET ativo = $2 WHERE caminho = $1", [caminho, ativo]);
  return (resultado.affectedRows ?? 0) > 0;
}

/** Blocos de um documento, na ordem do arquivo. */
export async function listarBlocos(banco: Banco, caminho: string): Promise<Bloco[]> {
  const { rows } = await banco.query<{
    ordem: number;
    secao: string;
    caminho_de_secoes: string[];
    linha_inicial: number;
    linha_final: number;
    texto: string;
  }>(
    `SELECT b.ordem, b.secao, b.caminho_de_secoes, b.linha_inicial, b.linha_final, b.texto
       FROM blocos b JOIN documentos d ON d.id = b.documento_id
      WHERE d.caminho = $1 ORDER BY b.ordem`,
    [caminho],
  );
  return rows.map((linha) => ({
    ordem: linha.ordem,
    secao: linha.secao,
    caminhoDeSecoes: linha.caminho_de_secoes,
    linhaInicial: linha.linha_inicial,
    linhaFinal: linha.linha_final,
    texto: linha.texto,
  }));
}
