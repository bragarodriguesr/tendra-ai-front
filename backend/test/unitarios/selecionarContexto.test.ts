import { describe, expect, it } from "vitest";
import type { ContextoDaBase, DocumentoDoContexto } from "../../src/recuperacao/buscarFontes.ts";
import { selecionarContexto } from "../../src/recuperacao/selecionarContexto.ts";

/** Fase U: a regra da seleção por área (PU7, PU9, PU11 e PU12, cenários U9, U10, U12 e U13). */
const documento = (nome: string, areas: string[]): DocumentoDoContexto => ({ nome, titulo: nome, tipo: "documento", atualizadoEm: "2026-10-01", versao: null, tamanhoBytes: 10, blocos: [], areas });
const base: ContextoDaBase = {
  documentos: [documento("seg.md", ["Segurança e privacidade"]), documento("jur.md", ["Jurídico"]), documento("geral.md", ["Geral"]), documento("pendente.md", []), documento("contrato.md", ["Jurídico", "Segurança e privacidade"])],
  bytes: 50,
  tokens: 60_000,
};
const LIGADA = { porArea: true, minimoDeTokens: 50_000 };
const nomes = (contexto: Pick<ContextoDaBase, "documentos">) => contexto.documentos.map((d) => d.nome);

describe("Cenário U9 · pergunta com área e documentos da área", () => {
  it("o contexto tem os documentos da área e os 'Geral' (inclusive os pendentes), na ordem da base", () => {
    const { motivo, grupos } = selecionarContexto({ contexto: base, perguntas: [{ numero: 1, area: "Segurança e privacidade" }], configuracao: LIGADA });
    expect(motivo).toBe("ligada");
    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.area).toBe("Segurança e privacidade");
    expect(nomes(grupos[0]!.contexto)).toEqual(["seg.md", "geral.md", "pendente.md", "contrato.md"]);
  });
});

describe("Cenário U10 · pergunta 'Geral' ou área sem documento", () => {
  it("as duas vão para o grupo da base inteira", () => {
    const { grupos } = selecionarContexto({ contexto: base, perguntas: [{ numero: 1, area: "Geral" }, { numero: 2, area: "Comercial" }], configuracao: LIGADA });
    expect(grupos).toEqual([{ area: null, contexto: base, perguntas: [1, 2] }]);
  });
});

describe("Cenário U12 · grupos por área", () => {
  it("agrupa por área na ordem da lista, mantém a ordem das perguntas dentro do grupo e põe a base inteira por último", () => {
    const { grupos } = selecionarContexto({
      contexto: base,
      perguntas: [
        { numero: 1, area: "Jurídico" },
        { numero: 2, area: "Geral" },
        { numero: 3, area: "Segurança e privacidade" },
        { numero: 4, area: "Jurídico" },
        { numero: 5, area: "Produto" },
      ],
      configuracao: LIGADA,
    });
    expect(grupos.map((grupo) => [grupo.area, grupo.perguntas])).toEqual([
      ["Segurança e privacidade", [3]],
      ["Jurídico", [1, 4]],
      [null, [2, 5]],
    ]);
    expect(nomes(grupos[1]!.contexto)).toEqual(["jur.md", "geral.md", "pendente.md", "contrato.md"]);
  });
});

describe("Cenário U13 · base pequena ou seleção desligada", () => {
  const perguntas = [{ numero: 1, area: "Jurídico" }, { numero: 2, area: "Produto" }];
  it("desligada: um grupo com a base inteira", () => {
    expect(selecionarContexto({ contexto: base, perguntas, configuracao: { porArea: false, minimoDeTokens: 0 } })).toEqual({ motivo: "desligada", grupos: [{ area: null, contexto: base, perguntas: [1, 2] }] });
  });
  it("base no limiar ou abaixo: um grupo com a base inteira", () => {
    expect(selecionarContexto({ contexto: { ...base, tokens: 50_000 }, perguntas, configuracao: LIGADA }).motivo).toBe("base_pequena");
    expect(selecionarContexto({ contexto: base, perguntas, configuracao: { porArea: true, minimoDeTokens: 60_000 } }).grupos).toHaveLength(1);
  });
});
