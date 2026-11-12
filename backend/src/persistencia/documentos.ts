import type { Bloco } from "../base/blocos.ts";
import type { Cabecalho } from "../base/cabecalho.ts";
import { AREA_GERAL } from "../regras/areas.ts";
import type { Banco } from "./banco.ts";

/** Documento da base como está gravado no banco. */
export interface DocumentoGravado {
  id: number;
  /** Nome do arquivo, sem pastas: a identidade do documento. */
  nome: string;
  titulo: string;
  tipo: Cabecalho["tipo"];
  atualizadoEm: string;
  versao: string | null;
  /** Validade (AAAA-MM-DD) ou null (sem validade, "Indefinido"). */
  validade: string | null;
  hash: string;
  tamanhoBytes: number;
  tokensEstimados: number;
  /** Estado gravado pela chave Ativar/Desativar; o vencimento é calculado pela validade. */
  ativo: boolean;
  enviadoPor: string | null;
  /** Data e hora da primeira carga, em ISO 8601. */
  carregadoEm: string;
  /**
   * Áreas do documento (fase U, PU1). Vazia enquanto a IA não classificou; `["Geral"]` quando vale
   * para todas as perguntas, inclusive depois de uma falha da classificação (PU4).
   */
  areas: string[];
  /** Quando a IA classificou (ou a RFP passada foi gravada). Null: pendente ou com falha, tentado de novo ao iniciar. */
  areasClassificadasEm: string | null;
}

/** Dados de um documento a gravar, já validado e dividido em blocos. */
export interface DocumentoParaGravar {
  nome: string;
  cabecalho: Cabecalho;
  hash: string;
  tamanhoBytes: number;
  tokensEstimados: number;
  enviadoPor: string | null;
  blocos: Bloco[];
}

interface LinhaDeDocumento {
  id: number;
  nome: string;
  titulo: string;
  tipo: Cabecalho["tipo"];
  atualizado_em: string;
  versao: string | null;
  validade: string | null;
  hash: string;
  tamanho_bytes: number;
  tokens_estimados: number;
  ativo: boolean;
  enviado_por: string | null;
  carregado_em: Date;
  areas: string[];
  areas_classificadas_em: Date | null;
}

const COLUNAS = `id, nome, titulo, tipo, to_char(atualizado_em, 'YYYY-MM-DD') AS atualizado_em, versao,
  to_char(validade, 'YYYY-MM-DD') AS validade, hash,
  tamanho_bytes, tokens_estimados, ativo, enviado_por, carregado_em, areas, areas_classificadas_em`;

function paraDocumento(linha: LinhaDeDocumento): DocumentoGravado {
  return {
    id: linha.id,
    nome: linha.nome,
    titulo: linha.titulo,
    tipo: linha.tipo,
    atualizadoEm: linha.atualizado_em,
    versao: linha.versao,
    validade: linha.validade,
    hash: linha.hash,
    tamanhoBytes: linha.tamanho_bytes,
    tokensEstimados: linha.tokens_estimados,
    ativo: linha.ativo,
    enviadoPor: linha.enviado_por,
    carregadoEm: linha.carregado_em.toISOString(),
    areas: linha.areas,
    areasClassificadasEm: linha.areas_classificadas_em?.toISOString() ?? null,
  };
}

/** Todos os documentos da base da organização, ativos ou não, na ordem em que entraram. */
export async function listarDocumentos(banco: Banco, organizacaoId: string): Promise<DocumentoGravado[]> {
  const { rows } = await banco.query<LinhaDeDocumento>(`SELECT ${COLUNAS} FROM documentos WHERE organizacao_id = $1 ORDER BY id`, [organizacaoId]);
  return rows.map(paraDocumento);
}

/**
 * Só os documentos ativos e não vencidos da organização: os únicos que podem ser fontes de uma nova
 * tarefa dela (cenários 40, 71 e 80). Vencido é o documento cuja validade é hoje ou já passou.
 */
export async function listarDocumentosAtivos(banco: Banco, organizacaoId: string, hoje: string): Promise<DocumentoGravado[]> {
  const { rows } = await banco.query<LinhaDeDocumento>(
    `SELECT ${COLUNAS} FROM documentos WHERE organizacao_id = $1 AND ativo AND (validade IS NULL OR validade > $2::date) ORDER BY id`,
    [organizacaoId, hoje],
  );
  return rows.map(paraDocumento);
}

/**
 * Grava um documento novo ou substitui a versão anterior do mesmo nome na mesma organização, com os
 * blocos, numa única transação. A substituição mantém o estado ativo ou inativo (cenário 39); o mesmo
 * nome em outra organização é outro documento (cenário 70).
 */
export async function gravarDocumento(banco: Banco, organizacaoId: string, documento: DocumentoParaGravar): Promise<"novo" | "substituido"> {
  return banco.transaction(async (transacao) => {
    const { cabecalho } = documento;
    const existente = await transacao.query<{ id: number }>("SELECT id FROM documentos WHERE organizacao_id = $1 AND nome = $2", [
      organizacaoId,
      documento.nome,
    ]);
    const idExistente = existente.rows[0]?.id;

    // Conteúdo novo: classificação pendente (PU2); a RFP passada fica "Geral" sem ir à IA (U5b).
    const rfpPassada = cabecalho.tipo === "rfp-passada";
    let id: number;
    if (idExistente === undefined) {
      const inserido = await transacao.query<{ id: number }>(
        `INSERT INTO documentos (nome, titulo, tipo, atualizado_em, versao, hash, tamanho_bytes, tokens_estimados, enviado_por, organizacao_id, validade,
           areas, areas_classificadas_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::text[], CASE WHEN $13::boolean THEN now() END) RETURNING id`,
        [
          documento.nome,
          cabecalho.titulo,
          cabecalho.tipo,
          cabecalho.atualizadoEm,
          cabecalho.versao,
          documento.hash,
          documento.tamanhoBytes,
          documento.tokensEstimados,
          documento.enviadoPor,
          organizacaoId,
          cabecalho.validade,
          rfpPassada ? [AREA_GERAL] : [],
          rfpPassada,
        ],
      );
      const novoId = inserido.rows[0]?.id;
      if (novoId === undefined) throw new Error(`Falha ao gravar ${documento.nome}.`);
      id = novoId;
    } else {
      id = idExistente;
      await transacao.query(
        `UPDATE documentos SET titulo = $2, tipo = $3, atualizado_em = $4, versao = $5, hash = $6,
           tamanho_bytes = $7, tokens_estimados = $8, enviado_por = COALESCE($9, enviado_por), validade = $10, substituido_em = now(),
           areas = $11::text[], areas_classificadas_em = CASE WHEN $12::boolean THEN now() END
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
          cabecalho.validade,
          rfpPassada ? [AREA_GERAL] : [],
          rfpPassada,
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

/**
 * Ativa ou desativa um documento (cenário 40). Devolve o documento, ou null se o id não existe na base
 * da organização, igual para um documento de outra organização (cenário 70).
 */
export async function definirAtivo(banco: Banco, organizacaoId: string, id: number, ativo: boolean): Promise<DocumentoGravado | null> {
  const { rows } = await banco.query<LinhaDeDocumento>(
    `UPDATE documentos SET ativo = $3 WHERE id = $2 AND organizacao_id = $1 RETURNING ${COLUNAS}`,
    [organizacaoId, id, ativo],
  );
  const linha = rows[0];
  return linha === undefined ? null : paraDocumento(linha);
}

/** Blocos de um documento da organização, na ordem do arquivo. */
export async function listarBlocos(banco: Banco, organizacaoId: string, nome: string): Promise<Bloco[]> {
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
      WHERE d.organizacao_id = $1 AND d.nome = $2 ORDER BY b.ordem`,
    [organizacaoId, nome],
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

/** Documento à espera da classificação por área (fase U): novo, alterado ou com falha anterior (PU4, PU5). */
export interface DocumentoParaClassificar {
  id: number;
  organizacaoId: string;
  nome: string;
  titulo: string;
  tipo: Cabecalho["tipo"];
  hash: string;
}

/** Documentos sem a marca de classificação, de uma organização ou de todas, na ordem em que entraram. */
export async function listarDocumentosParaClassificar(banco: Banco, organizacaoId?: string): Promise<DocumentoParaClassificar[]> {
  const { rows } = await banco.query<{ id: number; organizacao_id: string; nome: string; titulo: string; tipo: Cabecalho["tipo"]; hash: string }>(
    `SELECT id, organizacao_id, nome, titulo, tipo, hash FROM documentos
      WHERE areas_classificadas_em IS NULL AND ($1::uuid IS NULL OR organizacao_id = $1::uuid) ORDER BY id`,
    [organizacaoId ?? null],
  );
  return rows.map((linha) => ({ id: linha.id, organizacaoId: linha.organizacao_id, nome: linha.nome, titulo: linha.titulo, tipo: linha.tipo, hash: linha.hash }));
}

/**
 * Grava as áreas de um documento. Só grava se o conteúdo ainda é o classificado (mesmo hash): um
 * reenvio durante a classificação não recebe as áreas da versão anterior. Sem `classificado`
 * (falha, PU4), o documento fica "Geral" e sem a marca, para nova tentativa ao iniciar.
 */
export async function gravarAreasDoDocumento(banco: Banco, documento: { id: number; hash: string }, areas: string[], classificado: boolean): Promise<boolean> {
  const resultado = await banco.query(
    "UPDATE documentos SET areas = $3::text[], areas_classificadas_em = CASE WHEN $4::boolean THEN now() END WHERE id = $1 AND hash = $2",
    [documento.id, documento.hash, areas, classificado],
  );
  return (resultado.affectedRows ?? 0) > 0;
}
