import { classificarDocumento } from "../base/classificarDocumento.ts";
import { ClienteDaIa, type ApiDoClaude, type EntradaDoRegistro } from "../ia/cliente.ts";
import type { Banco } from "../persistencia/banco.ts";
import { gravarAreasDoDocumento, listarBlocos, listarDocumentosParaClassificar } from "../persistencia/documentos.ts";
import { AREA_GERAL } from "../regras/areas.ts";

/**
 * Classificação dos documentos pendentes por área (fase U, PU2, PU4 e PU5, cenários U1, U3 e U6).
 * Roda em segundo plano, depois de um envio pela tela (só a organização do envio) e ao iniciar o
 * backend (todas). Um documento por vez. Sem resposta válida da IA, o documento fica "Geral" e sem a
 * marca, para nova tentativa na próxima subida. As RFPs passadas nunca chegam aqui: já são gravadas
 * como "Geral" (U5b). Não há tarefa para o registro de requisições: cada requisição vai para o log,
 * só com números e nomes.
 */
export interface ResultadoDaClassificacaoDosDocumentos {
  classificados: number;
  /** Ficaram "Geral" por falha e serão tentados de novo ao iniciar. */
  comFalha: number;
}

export async function classificarDocumentosPendentes(opcoes: {
  banco: Banco;
  api: ApiDoClaude;
  modelo: string;
  /** Sem ela, todas as organizações (ao iniciar, U6). */
  organizacaoId?: string;
  aoRegistrar?: (entrada: EntradaDoRegistro) => void;
  /** Consultado antes de cada documento; falso interrompe (o servidor fechando). Os restantes ficam para depois. */
  continuar?: () => boolean;
}): Promise<ResultadoDaClassificacaoDosDocumentos> {
  const cliente = new ClienteDaIa(opcoes.api, (entrada) => opcoes.aoRegistrar?.(entrada));
  const resultado: ResultadoDaClassificacaoDosDocumentos = { classificados: 0, comFalha: 0 };
  // Uma volta só: um documento que falha agora fica para a próxima subida, sem repetir em laço.
  for (const documento of await listarDocumentosParaClassificar(opcoes.banco, opcoes.organizacaoId)) {
    if (opcoes.continuar?.() === false) break;
    const blocos = await listarBlocos(opcoes.banco, documento.organizacaoId, documento.nome);
    const classificacao = await classificarDocumento({ cliente, modelo: opcoes.modelo, documento: { ...documento, blocos } });
    if (classificacao.falhou) {
      await gravarAreasDoDocumento(opcoes.banco, documento, [AREA_GERAL], false);
      resultado.comFalha++;
    } else if (await gravarAreasDoDocumento(opcoes.banco, documento, classificacao.areas, true)) {
      resultado.classificados++;
    }
  }
  return resultado;
}
