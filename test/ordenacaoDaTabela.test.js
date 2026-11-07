import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ordenarLinhas, proximaOrdenacao } from "../src/workspace/ordenacaoDaTabela.js";

const linha = (numero, pergunta, area, estado) => ({ id: "r" + numero, ordem: { numero, pergunta, area, estado } });
const LINHAS = [
  linha(1, "Ética no uso de dados", "Jurídico", "sugerida"),
  linha(2, "backup diário", "Tecnologia", "aprovada"),
  linha(9, "Criptografia em repouso", "Segurança e privacidade", "sem-rascunho"),
  linha(10, "Auditoria externa", "Comercial", "em-revisao"),
  linha(11, "SLA mensal", "Geral", "revisada")
];
const numeros = (linhas) => linhas.map((l) => l.ordem.numero);

describe("Cenário P4 · ciclo dos cliques no título", () => {
  it("crescente, decrescente e volta para a ordem padrão", () => {
    const primeiro = proximaOrdenacao(null, "pergunta");
    assert.deepEqual(primeiro, { coluna: "pergunta", direcao: "asc" });
    const segundo = proximaOrdenacao(primeiro, "pergunta");
    assert.deepEqual(segundo, { coluna: "pergunta", direcao: "desc" });
    assert.equal(proximaOrdenacao(segundo, "pergunta"), null);
  });

  it("outra coluna começa em ordem crescente", () => {
    assert.deepEqual(proximaOrdenacao({ coluna: "pergunta", direcao: "desc" }, "area"), { coluna: "area", direcao: "asc" });
  });

  it("sem ordenação, a lista fica como veio", () => {
    const fora = [LINHAS[3], LINHAS[0]];
    assert.equal(ordenarLinhas(fora, null), fora);
  });
});

describe("Cenário P5 · critério de cada coluna", () => {
  it("código pelo número, não pelo texto (10 depois de 9)", () => {
    assert.deepEqual(numeros(ordenarLinhas([LINHAS[3], LINHAS[2], LINHAS[0]], { coluna: "codigo", direcao: "asc" })), [1, 9, 10]);
    assert.deepEqual(numeros(ordenarLinhas(LINHAS, { coluna: "codigo", direcao: "desc" })), [11, 10, 9, 2, 1]);
  });

  it("pergunta em ordem alfabética, sem diferenciar maiúsculas, minúsculas nem acentos", () => {
    assert.deepEqual(numeros(ordenarLinhas(LINHAS, { coluna: "pergunta", direcao: "asc" })), [10, 2, 9, 1, 11]);
  });

  it("área em ordem alfabética", () => {
    assert.deepEqual(numeros(ordenarLinhas(LINHAS, { coluna: "area", direcao: "asc" })), [10, 11, 1, 9, 2]);
  });

  it("status na ordem alfabética do filtro: aprovada, em revisão, revisada, sem rascunho, sugerida", () => {
    assert.deepEqual(numeros(ordenarLinhas(LINHAS, { coluna: "status", direcao: "asc" })), [2, 10, 11, 9, 1]);
  });

  it("empate segue o número do requisito, crescente mesmo na ordem decrescente", () => {
    const empatadas = [linha(5, "b", "Geral", "sugerida"), linha(3, "a", "Geral", "sugerida"), linha(4, "c", "Jurídico", "aprovada")];
    assert.deepEqual(numeros(ordenarLinhas(empatadas, { coluna: "status", direcao: "asc" })), [4, 3, 5]);
    assert.deepEqual(numeros(ordenarLinhas(empatadas, { coluna: "status", direcao: "desc" })), [3, 5, 4]);
  });
});
