import { describe, expect, it } from "vitest";
import type { EntradaDoRegistro } from "../../src/ia/cliente.ts";
import { calcularMetricas, carregarPrecos } from "../../src/observabilidade/metricas.ts";
import type { ItemDaRevisao } from "../../src/rastreabilidade/montarItem.ts";

/** Cenário 37 · métricas da tarefa, sem conteúdo. */
const precos = await carregarPrecos();

const requisicao = (etapa: EntradaDoRegistro["etapa"], modelo: string, tokens: EntradaDoRegistro["tokens"], resultado: "sucesso" | "erro" = "sucesso"): EntradaDoRegistro => ({
  quando: "2026-10-22T10:00:00.000Z",
  etapa,
  modelo,
  documentos: ["politica.md"],
  perguntas: [1, 2],
  tokens,
  duracaoMs: 10,
  resultado,
});

const item = (st: ItemDaRevisao["st"], alertas: ItemDaRevisao["alerts"]): ItemDaRevisao => ({
  id: "r1",
  q: "Pergunta confidencial da RFP?",
  paras: st === "sugerida" ? [{ t: "Resposta confidencial.", s: [1] }] : [],
  srcs: [],
  alerts: alertas,
  st,
  orig: "",
});

describe("Cenário 37 · métricas da tarefa", () => {
  it("soma tokens e custo por modelo, conta itens por estado e alerta, sem conteúdo", () => {
    const metricas = calcularMetricas({
      registro: [
        requisicao("contagem", "claude-opus-5-5", { entrada: 60_000, saida: 0, lidosDoCache: 0, gravadosNoCache: 0 }),
        requisicao("geracao", "claude-opus-5-5", { entrada: 1_000, saida: 2_000, lidosDoCache: 0, gravadosNoCache: 60_000 }),
        requisicao("geracao", "claude-opus-5-5", { entrada: 1_000, saida: 2_000, lidosDoCache: 60_000, gravadosNoCache: 0 }),
        requisicao("conflito", "claude-haiku-5-5", { entrada: 4_000, saida: 200, lidosDoCache: 0, gravadosNoCache: 0 }),
        requisicao("geracao", "claude-opus-5-5", null, "erro"),
      ],
      itens: [item("sugerida", [{ t: "old" }]), item("sugerida", [{ t: "critical" }, { t: "lowconf" }, { t: "old" }]), item("sem-rascunho", [{ t: "nocontext" }])],
      checagens: [
        { citacoesValidas: 2, citacoesDescartadas: 1, trechosSemFonte: 0, semMarcador: false },
        { citacoesValidas: 1, citacoesDescartadas: 0, trechosSemFonte: 2, semMarcador: false },
        { citacoesValidas: 0, citacoesDescartadas: 0, trechosSemFonte: 0, semMarcador: true },
      ],
      etapas: [
        { etapa: "planilha", duracaoMs: 120 },
        { etapa: "geracao", duracaoMs: 30_000 },
        { etapa: "conflito", duracaoMs: 900 },
      ],
      precos,
    });

    // Opus 5.5: 2.000 × 4 + 4.000 × 20 + 60.000 × 5 + 60.000 × 0,2 = 400.000 → US$ 0,40.
    // Haiku 5.5: 4.000 × 0,1 + 200 × 0,5 = 500 → US$ 0,0005.
    expect(metricas).toEqual({
      duracaoTotalMs: 31_020,
      duracaoPorEtapa: { planilha: 120, geracao: 30_000, conflito: 900 },
      requisicoes: { total: 5, comErro: 1, porEtapa: { contagem: 1, geracao: 3, conflito: 1 } },
      tokens: { entrada: 6_000, saida: 4_200, lidosDoCache: 60_000, gravadosNoCache: 60_000 },
      tokensDaBaseContados: 60_000,
      custoEstimadoUsd: 0.4005,
      modelosSemPreco: [],
      itens: 3,
      itensPorEstado: { sugerida: 2, "sem-rascunho": 1 },
      itensPorAlerta: { old: 2, critical: 1, lowconf: 1, nocontext: 1 },
      ignorados: { citacoesDescartadas: 1, trechosSemFonte: 2, perguntasSemMarcador: 1 },
    });
    const serializado = JSON.stringify(metricas);
    expect(serializado).not.toContain("confidencial");
    expect(serializado).not.toContain("politica.md");
  });

  it("sem preço para algum modelo, informa em vez de estimar errado", () => {
    const metricas = calcularMetricas({
      registro: [requisicao("geracao", "modelo-novo", { entrada: 10, saida: 10, lidosDoCache: 0, gravadosNoCache: 0 })],
      itens: [],
      checagens: [],
      etapas: [],
      precos,
    });
    expect(metricas).toMatchObject({ custoEstimadoUsd: null, modelosSemPreco: ["modelo-novo"] });
  });
});
