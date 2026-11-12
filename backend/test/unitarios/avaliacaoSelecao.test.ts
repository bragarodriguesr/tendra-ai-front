import { describe, expect, it } from "vitest";
import type { RelatorioDeAvaliacao } from "../../src/avaliacao/avaliar.ts";
import type { GabaritoDaRfp } from "../../src/avaliacao/gabarito.ts";
import { comparacaoEmMarkdown, compararSelecao, type ExecucaoDaSelecao } from "../../src/avaliacao/selecao.ts";
import type { EntradaDoRegistro } from "../../src/ia/cliente.ts";

/** Fase U, cenário U16: comparação das execuções com a seleção ligada e desligada. */
const gabarito: GabaritoDaRfp = {
  arquivo: "rfp.xlsx",
  aba: "Q",
  perguntas: [
    { ref: "1", linha: 2, pergunta: "SLA?", temResposta: true, documentosEsperados: ["sla.md"], alertasEsperados: [], caso: null },
    { ref: "2", linha: 3, pergunta: "Preço?", temResposta: true, documentosEsperados: ["precos.md", "contrato.md"], alertasEsperados: [], caso: null },
    { ref: "3", linha: 4, pergunta: "Sem resposta", temResposta: false, documentosEsperados: [], alertasEsperados: [], caso: "sem-resposta" },
  ],
};
const requisicao = (documentos: string[], perguntas: number[], entrada: number): EntradaDoRegistro => ({
  quando: "2026-11-12T10:00:00Z",
  etapa: "geracao",
  modelo: "claude-sonnet-5-5",
  documentos,
  perguntas,
  tokens: { entrada, saida: 10, lidosDoCache: 0, gravadosNoCache: 0 },
  duracaoMs: 1000,
  resultado: "sucesso",
});
const item = (numero: number, st: "sugerida" | "sem-rascunho") => ({ id: `r${numero}`, q: "", paras: [], srcs: [], alerts: [], st, orig: "" });
const execucao = (registro: EntradaDoRegistro[], geracaoMs: number, itens = [item(1, "sugerida"), item(2, "sugerida"), item(3, "sem-rascunho")]): ExecucaoDaSelecao => ({
  nome: "x",
  arquivo: "rfp.xlsx",
  comportamento: {} as ExecucaoDaSelecao["comportamento"],
  posicoes: [{ aba: "Q", linha: 2 }, { aba: "Q", linha: 3 }, { aba: "Q", linha: 4 }],
  itens,
  metricas: { duracaoPorEtapa: { geracao: geracaoMs } } as ExecucaoDaSelecao["metricas"],
  registro,
  contextos: ["area", "area", "base"],
});
const relatorio = (relevancia: "aprovado" | "reprovado"): RelatorioDeAvaliacao => ({
  rfp: "rfp.xlsx",
  momento: "base",
  execucoes: ["x"],
  comportamento: {} as RelatorioDeAvaliacao["comportamento"],
  criterios: [{ criterio: "Relevância da recuperação", mede: "", limite: "80%", valor: "90%", situacao: relevancia, divergencias: [] }],
  aprovado: true,
});

describe("Cenário U16 · avaliação da seleção", () => {
  it("aprova com tokens e tempo abaixo das metas, cobertura completa e nenhum 'Sem rascunho' indevido", () => {
    const ligada = execucao([requisicao(["sla.md", "geral.md"], [1], 1_000), requisicao(["precos.md", "geral.md"], [2], 1_000), requisicao(["sla.md", "precos.md", "contrato.md", "geral.md"], [3], 2_000)], 6_000);
    const desligada = execucao([requisicao(["sla.md", "precos.md", "contrato.md", "geral.md"], [1, 2, 3], 10_000)], 10_000);
    const comparacao = compararSelecao({ ligada, desligada, gabarito, relatorios: { ligada: relatorio("aprovado"), desligada: relatorio("aprovado") } });
    expect(comparacao.tokens).toEqual({ ligada: 4_000, desligada: 10_000, reducao: 0.6 });
    expect(comparacao.tempoDaGeracaoMs.reducao).toBeCloseTo(0.4);
    expect(comparacao.cobertura).toEqual({ perguntas: 2, comAlgum: 2, comTodos: 1, fora: [] });
    expect(comparacao.perguntasPorContexto).toEqual({ area: 2, base: 1 });
    expect(comparacao.reprovacoes).toEqual([]);
    expect(comparacaoEmMarkdown(comparacao, "rfp.xlsx")).toContain("**Aprovada**");
  });

  it("reprova com a cobertura baixa, 'Sem rascunho' indevido, economia insuficiente e relevância reprovada", () => {
    const ligada = execucao([requisicao(["geral.md"], [1, 2], 9_000), requisicao(["sla.md", "precos.md", "contrato.md", "geral.md"], [1, 2, 3], 1_000)], 9_000, [item(1, "sem-rascunho"), item(2, "sugerida"), item(3, "sem-rascunho")]);
    const desligada = execucao([requisicao(["sla.md", "precos.md", "contrato.md", "geral.md"], [1, 2, 3], 10_000)], 10_000);
    const comparacao = compararSelecao({ ligada, desligada, gabarito, relatorios: { ligada: relatorio("reprovado"), desligada: relatorio("aprovado") } });
    expect(comparacao.cobertura).toEqual({ perguntas: 2, comAlgum: 0, comTodos: 0, fora: ["1", "2"] });
    expect(comparacao.semRascunhoIndevido).toEqual(["1"]);
    expect(comparacao.reprovacoes).toHaveLength(5);
  });
});
