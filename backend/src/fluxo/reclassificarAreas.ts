import { MODELO_DE_CLASSIFICACAO_PADRAO, type ConfiguracaoDaIa } from "../config/config.ts";
import { classificarAreas } from "../geracao/classificarAreas.ts";
import { ClienteDaIa, type ApiDoClaude } from "../ia/cliente.ts";
import type { Banco } from "../persistencia/banco.ts";
import { registrarRequisicao } from "../persistencia/tarefas.ts";
import { AREA_GERAL } from "../regras/areas.ts";

/**
 * Reclassificação das tarefas em aberto (fase N, PN8, cenário N15). Roda ao iniciar o backend, em
 * segundo plano: classifica as tarefas prontas que ainda não têm `areas_classificadas_em` (as que a
 * migração 011 deixou sem a marca, por terem algum item não aprovado) e as marca. Os itens
 * aprovados continuam aprovados. Só muda itens ainda em "Geral", para não desfazer uma troca manual.
 * Quando a IA não classifica nenhuma pergunta da tarefa (falha), a tarefa fica sem a marca e é
 * tentada de novo na próxima subida.
 */
export async function reclassificarTarefasEmAberto(opcoes: { banco: Banco; api: ApiDoClaude; ia: ConfiguracaoDaIa }): Promise<{ classificadas: number; adiadas: number }> {
  const { banco } = opcoes;
  const modelo = opcoes.ia.modeloDeClassificacao ?? MODELO_DE_CLASSIFICACAO_PADRAO;
  const { rows: tarefas } = await banco.query<{ id: string }>(
    "SELECT id FROM tarefas WHERE estado = 'pronta' AND areas_classificadas_em IS NULL ORDER BY criada_em, id",
  );
  let classificadas = 0;
  let adiadas = 0;
  for (const { id } of tarefas) {
    const { rows: itens } = await banco.query<{ numero: number; q: string }>("SELECT numero, q FROM itens WHERE tarefa_id = $1 ORDER BY numero", [id]);
    let gravacoes: Promise<void> = Promise.resolve();
    const cliente = new ClienteDaIa(opcoes.api, (entrada) => {
      gravacoes = gravacoes.then(() => registrarRequisicao(banco, id, entrada));
    });
    const resultado = await classificarAreas({ cliente, modelo, perguntas: itens.map((item) => ({ numero: item.numero, texto: item.q })) });
    await gravacoes;
    if (itens.length > 0 && resultado.falhas === itens.length) {
      adiadas++;
      continue;
    }
    await banco.transaction(async (transacao) => {
      for (const [posicao, item] of itens.entries()) {
        const area = resultado.areas[posicao] ?? AREA_GERAL;
        if (area === AREA_GERAL) continue;
        await transacao.query("UPDATE itens SET area = $3 WHERE tarefa_id = $1 AND numero = $2 AND area = $4", [id, item.numero, area, AREA_GERAL]);
      }
      await transacao.query("UPDATE tarefas SET areas_classificadas_em = now() WHERE id = $1", [id]);
    });
    classificadas++;
  }
  return { classificadas, adiadas };
}
