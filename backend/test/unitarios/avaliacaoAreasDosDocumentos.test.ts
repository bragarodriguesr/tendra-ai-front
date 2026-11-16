import { describe, expect, it } from "vitest";
import { avaliarClassificacaoDeDocumentos, relatorioDaClassificacaoEmMarkdown } from "../../src/avaliacao/areasDosDocumentos.ts";

/** Fase U, cenário U7: concordância da classificação dos documentos com as áreas rotuladas. */
describe("Cenário U7 · avaliação da classificação dos documentos", () => {
  it("concorda só com as mesmas áreas, sem faltar nem sobrar; aprova a partir de 85%", () => {
    const relatorio = avaliarClassificacaoDeDocumentos([
      { documento: "a.md", esperadas: ["Tecnologia", "Comercial"], atribuidas: ["Comercial", "Tecnologia"] },
      { documento: "b.md", esperadas: ["Tecnologia"], atribuidas: ["Tecnologia", "Jurídico"] },
      { documento: "c.md", esperadas: ["Jurídico", "Comercial"], atribuidas: ["Jurídico"] },
      { documento: "d.md", esperadas: ["Geral"], atribuidas: null },
    ]);
    expect(relatorio).toMatchObject({ total: 4, concordantes: 1, concordancia: 0.25, aprovado: false, falhas: 1 });
    expect(relatorio.divergentes.map((d) => d.documento)).toEqual(["b.md", "c.md", "d.md"]);
    expect(relatorio.porArea.find((linha) => linha.area === "Jurídico")).toEqual({ area: "Jurídico", rotulados: 1, acertos: 1, aMais: 1 });
    expect(relatorioDaClassificacaoEmMarkdown(relatorio, "claude-haiku-5-5")).toContain("**25%** (1 de 4)");

    const iguais = Array.from({ length: 17 }, (_, i) => ({ documento: `${i}.md`, esperadas: ["Produto"], atribuidas: ["Produto"] }));
    const comTresErros = [...iguais, ...Array.from({ length: 3 }, (_, i) => ({ documento: `e${i}.md`, esperadas: ["Produto"], atribuidas: ["Comercial"] }))];
    expect(avaliarClassificacaoDeDocumentos(comTresErros).aprovado).toBe(true);
  });
});
