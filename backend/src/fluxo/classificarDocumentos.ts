import { classificarDocumento } from "../base/classificarDocumento.ts";
import { ClienteDaIa, type ApiDoClaude, type EntradaDoRegistro } from "../ia/cliente.ts";
import type { Banco } from "../persistencia/banco.ts";
import { gravarAreasDoDocumento, listarBlocos, listarDocumentosParaClassificar } from "../persistencia/documentos.ts";
import { VERSOES_DAS_INSTRUCOES } from "../ia/instrucoes.ts";
import { AREA_GERAL } from "../regras/areas.ts";

/**
 * Classificação dos documentos pendentes por área (fase U, PU2, PU4 e PU5, cenários U1, U3 e U6).
 * Roda em segundo plano, depois de um envio pela tela (só a organização do envio) e ao iniciar o
 * backend (todas). Um documento por vez. Sem resposta válida da IA, o documento fica "Geral" e sem a
 * marca, para nova tentativa na próxima subida. Ao iniciar, também volta aos documentos classificados
 * por uma versão anterior da instrução; neles, uma falha mantém as áreas que já tinham. As RFPs passadas nunca chegam aqui: já são gravadas
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
  /**
   * Também reclassifica os documentos classificados por outra versão da instrução (ao iniciar). Depois
   * de um envio, só os pendentes.
   */
  reclassificarVersoesAntigas?: boolean;
  /** Consultado antes de cada documento; falso interrompe (o servidor fechando). Os restantes ficam para depois. */
  continuar?: () => boolean;
}): Promise<ResultadoDaClassificacaoDosDocumentos> {
  const cliente = new ClienteDaIa(opcoes.api, (entrada) => opcoes.aoRegistrar?.(entrada));
  const resultado: ResultadoDaClassificacaoDosDocumentos = { classificados: 0, comFalha: 0 };
  // Uma volta só: um documento que falha agora fica para a próxima subida, sem repetir em laço.
  const versao = VERSOES_DAS_INSTRUCOES.classificacaoDocumento;
  const documentos = await listarDocumentosParaClassificar(opcoes.banco, opcoes.organizacaoId, opcoes.reclassificarVersoesAntigas === true ? versao : undefined);
  for (const documento of documentos) {
    if (opcoes.continuar?.() === false) break;
    const blocos = await listarBlocos(opcoes.banco, documento.organizacaoId, documento.nome);
    const classificacao = await classificarDocumento({ cliente, modelo: opcoes.modelo, documento: { ...documento, blocos } });
    if (classificacao.falhou) {
      // Na reclassificação de um documento já classificado, uma falha mantém as áreas da versão anterior.
      if (documento.areasClassificadasEm === null) await gravarAreasDoDocumento(opcoes.banco, documento, [AREA_GERAL], false);
      resultado.comFalha++;
    } else if (await gravarAreasDoDocumento(opcoes.banco, documento, classificacao.areas, true, versao)) {
      resultado.classificados++;
    }
  }
  return resultado;
}
