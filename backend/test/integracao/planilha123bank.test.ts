import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { carregarCabecalhosDePergunta } from "../../src/config/cabecalhosDePergunta.ts";
import {
  identificarPerguntas,
  lerPlanilha,
  validarArquivoDePlanilha,
  type PlanilhaLida,
  type ResultadoDaIdentificacao,
} from "../../src/documentos/planilha.ts";

/**
 * Planilha sintética de exemplo com a estrutura de uma RFP real: aba de instruções, aba
 * "Questionnaire" com título mesclado na linha 3, cabeçalho "Question" na linha 5, referências
 * numéricas e linhas com referência mas sem pergunta, e uma aba oculta com a escala de notas.
 */
const ARQUIVO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/rfp-123bank-v1.xlsx",
);

let planilha: PlanilhaLida;
let resultado: ResultadoDaIdentificacao;

beforeAll(async () => {
  const conteudo = new Uint8Array(await readFile(ARQUIVO));
  validarArquivoDePlanilha(path.basename(ARQUIVO), conteudo);
  planilha = await lerPlanilha(conteudo);
  resultado = await identificarPerguntas(planilha, {
    nomesAceitos: await carregarCabecalhosDePergunta(),
    identificadorComIA: async () => {
      throw new Error("A IA não deveria ser chamada para esta planilha");
    },
  });
});

describe("Cenários 1 e 2 · planilha de exemplo 123BANK", () => {
  it("lê só as abas visíveis", () => {
    expect(planilha.abas.map((aba) => aba.nome)).toEqual(["Instructions to the Vendor", "Questionnaire"]);
  });

  it("identifica as perguntas pela regra, sem IA, na aba Questionnaire", () => {
    expect(resultado.origem).toBe("regra");
    expect(new Set(resultado.perguntas.map((pergunta) => pergunta.aba))).toEqual(new Set(["Questionnaire"]));
  });

  it("encontra as 204 perguntas das linhas 6 a 214, na ordem da planilha", () => {
    const linhas = resultado.perguntas.map((pergunta) => pergunta.linha);
    expect(resultado.perguntas).toHaveLength(204);
    expect(linhas[0]).toBe(6);
    expect(linhas.at(-1)).toBe(214);
    expect(linhas).toEqual([...linhas].sort((a, b) => a - b));
  });

  it("guarda o texto exato da primeira e da última pergunta, inclusive espaços no fim", () => {
    expect(resultado.perguntas[0]?.texto).toBe(
      "Provide a pricing estimate based on the scope described. (Include drivers behind the cost)",
    );
    expect(resultado.perguntas.at(-1)?.texto).toBe("Describe the configuration capabilities for the messages ");
  });

  it("ignora as linhas com referência mas sem pergunta", () => {
    const linhas = new Set(resultado.perguntas.map((pergunta) => pergunta.linha));
    for (const linhaSemPergunta of [47, 56, 86, 93, 159]) {
      expect(linhas.has(linhaSemPergunta)).toBe(false);
    }
  });

  it("não trata o título mesclado nem o cabeçalho como pergunta", () => {
    const linhas = new Set(resultado.perguntas.map((pergunta) => pergunta.linha));
    expect(linhas.has(3)).toBe(false);
    expect(linhas.has(5)).toBe(false);
  });
});
