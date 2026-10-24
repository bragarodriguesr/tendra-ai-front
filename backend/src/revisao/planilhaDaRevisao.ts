import { preencherColunas, SEM_FONTE } from "../documentos/planilhaPreenchida.ts";
import type { ItemGravado } from "../persistencia/tarefas.ts";

/**
 * Planilha preenchida no download (cenário 24, revisto em 24/10/2026): gerada a cada pedido a partir
 * da planilha original e dos itens gravados, sem chamar a IA. Traz o texto atual de cada item
 * (sugestão, texto editado ou resposta manual), as fontes que ele cita e a situação na revisão.
 */

export const TITULOS_DA_REVISAO = ["Resposta (estado atual da revisão)", "Fonte", "Situação na revisão"];
export const RESPOSTA_MANUAL_SEM_FONTE = "Resposta manual, sem fonte na base";

const DATA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const data = (iso: string | undefined) => (iso === undefined ? "" : ` em ${DATA.format(new Date(iso))}`);
const texto = (item: ItemGravado) => item.paras.map((paragrafo) => paragrafo.t).join("\n\n");
const normalizar = (valor: string) => valor.replace(/\s+/g, " ").trim();

/** Situação do item na revisão, como a tela mostra. */
export function situacaoNaRevisao(item: ItemGravado): string {
  const base =
    item.st === "aprovada" ? `Aprovada por ${item.by ?? "—"}${data(item.at)}`
    : item.st === "revisada" ? `Revisada por ${item.rby ?? "—"}${data(item.rat)}`
    : item.st === "em-revisao" ? "Em revisão"
    : item.st === "sugerida" ? "Sugestão da IA, não revisada"
    : "Sem resposta";
  const manual = item.alerts.find((alerta) => alerta.t === "manual");
  if (manual !== undefined) return `${base} · resposta manual${manual.by === undefined ? "" : ` escrita por ${manual.by}`}`;
  if (item.orig !== "" && item.paras.length > 0 && normalizar(texto(item)) !== normalizar(item.orig)) return `${base} · texto editado`;
  return base;
}

/** Fontes citadas pelos parágrafos atuais (depois de escolher uma fonte num conflito, só ela). */
function fontes(item: ItemGravado): string {
  if (item.paras.length === 0) return SEM_FONTE;
  const citadas = [...new Set(item.paras.flatMap((paragrafo) => paragrafo.s))].sort((a, b) => a - b);
  const linhas = citadas.flatMap((k) => {
    const fonte = item.srcs[k - 1];
    return fonte === undefined ? [] : [`${fonte.doc} · ${fonte.loc}`];
  });
  if (linhas.length > 0) return linhas.join("\n");
  return item.alerts.some((alerta) => alerta.t === "manual") ? RESPOSTA_MANUAL_SEM_FONTE : SEM_FONTE;
}

export function gerarPlanilhaDaRevisao(original: Uint8Array, itens: ItemGravado[]): Promise<Uint8Array> {
  return preencherColunas(
    original,
    TITULOS_DA_REVISAO,
    [60, 45, 40],
    itens.map((item) => ({ aba: item.aba, linha: item.linha, valores: [texto(item), fontes(item), situacaoNaRevisao(item)] })),
  );
}
