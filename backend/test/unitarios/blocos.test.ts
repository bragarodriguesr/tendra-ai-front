import { describe, expect, it } from "vitest";
import { dividirEmBlocos, SECAO_DO_INICIO } from "../../src/base/blocos.ts";

/** Linhas como se viessem de um arquivo com cabeçalho de 5 linhas (corpo a partir da linha 6). */
const CABECALHO = ["---", "titulo: Teste", "tipo: documento", "atualizado_em: 2026-09-01", "---"];
const dividir = (corpo: string) => dividirEmBlocos([...CABECALHO, ...corpo.split("\n")], CABECALHO.length);

describe("Cenário 7 · blocos com seção e linha (FORMATO_BASE_MD.md, seção 3)", () => {
  it("divide por parágrafo, guarda a seção e conta as linhas desde o início do arquivo", () => {
    const blocos = dividir(
      ["", "Texto antes do primeiro título.", "", "# Política", "", "## 4. Registro", "", "### 4.2 Retenção de logs", "", "Logs ficam 12 meses.", "Em armazenamento imutável.", "", "Segundo parágrafo."].join("\n"),
    );

    expect(blocos.map(({ secao, linhaInicial, linhaFinal }) => ({ secao, linhaInicial, linhaFinal }))).toEqual([
      { secao: SECAO_DO_INICIO, linhaInicial: 7, linhaFinal: 7 },
      { secao: "4.2 Retenção de logs", linhaInicial: 15, linhaFinal: 16 },
      { secao: "4.2 Retenção de logs", linhaInicial: 18, linhaFinal: 18 },
    ]);
    expect(blocos[1]?.caminhoDeSecoes).toEqual(["Política", "4. Registro", "4.2 Retenção de logs"]);
    expect(blocos[1]?.texto).toBe("Logs ficam 12 meses.\nEm armazenamento imutável.");
    expect(blocos.map((bloco) => bloco.ordem)).toEqual([1, 2, 3]);
  });

  it("volta ao nível certo quando aparece um título de nível mais alto", () => {
    const blocos = dividir(["# A", "## A.1", "texto 1", "## A.2", "texto 2", "# B", "texto 3"].join("\n"));
    expect(blocos.map((bloco) => bloco.caminhoDeSecoes)).toEqual([["A", "A.1"], ["A", "A.2"], ["B"]]);
  });

  it("não deixa lacunas no caminho quando um nível é pulado", () => {
    const blocos = dividir(["# A", "### A.x.1", "texto"].join("\n"));
    expect(blocos[0]?.caminhoDeSecoes).toEqual(["A", "A.x.1"]);
  });

  it("mantém listas e tabelas inteiras num bloco", () => {
    const blocos = dividir(["## Itens", "- um", "- dois", "", "| Campo | Valor |", "|---|---|", "| Norma | ISO |"].join("\n"));
    expect(blocos.map((bloco) => bloco.texto)).toEqual(["- um\n- dois", "| Campo | Valor |\n|---|---|\n| Norma | ISO |"]);
  });

  it("mantém um bloco de código inteiro, mesmo com linhas em branco e títulos dentro", () => {
    const blocos = dividir(["```", "# não é título", "", "fim", "```", "depois"].join("\n"));
    expect(blocos.map((bloco) => bloco.texto)).toEqual(["```\n# não é título\n\nfim\n```", "depois"]);
    expect(blocos[0]?.secao).toBe(SECAO_DO_INICIO);
  });

  it("trata a linha separadora como fim de bloco, sem incluí-la", () => {
    const blocos = dividir(["a", "---", "b"].join("\n"));
    expect(blocos.map((bloco) => bloco.texto)).toEqual(["a", "b"]);
  });

  it("não cria bloco para um corpo só com títulos", () => {
    expect(dividir(["# A", "", "## B"].join("\n"))).toEqual([]);
  });
});
