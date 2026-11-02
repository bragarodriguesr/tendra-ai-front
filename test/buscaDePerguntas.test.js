import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { correspondeABusca, termosDaBusca } from "../src/workspace/buscaDePerguntas.js";

const BACKUP = { pergunta: "A empresa possui política de backup?", codigo: "1.04" };
const CRIPTO = { pergunta: "Descreva a Criptografia em repouso e em trânsito.", codigo: "2.11" };
const AMBAS = { pergunta: "O backup é protegido por criptografia?", codigo: "3.02" };

const busca = (texto, item) => correspondeABusca(item, termosDaBusca(texto));

describe("Cenário B2 · busca por uma palavra", () => {
  it("não diferencia maiúsculas, minúsculas nem acentos", () => {
    assert.equal(busca("BACKUP", BACKUP), true);
    assert.equal(busca("criptografia", CRIPTO), true);
    assert.equal(busca("politica", BACKUP), true);
    assert.equal(busca("TRANSITO", CRIPTO), true);
  });

  it("aceita trecho de palavra e recusa o que não aparece", () => {
    assert.equal(busca("cripto", CRIPTO), true);
    assert.equal(busca("backup", CRIPTO), false);
  });
});

describe("Cenário B3 · texto completo da pergunta", () => {
  it("encontra palavra depois do corte de 68 caracteres da lista", () => {
    const longa = { pergunta: "Descreva o processo completo de gestão de incidentes de segurança da informação, incluindo o prazo de notificação.", codigo: "4.01" };
    assert.ok(longa.pergunta.indexOf("notificação") > 68);
    assert.equal(busca("notificacao", longa), true);
  });
});

describe("Cenário B4 · código do item", () => {
  it("encontra pelo código inteiro ou por parte dele", () => {
    assert.equal(busca("2.11", CRIPTO), true);
    assert.equal(busca("2.1", CRIPTO), true);
    assert.equal(busca("2.11", BACKUP), false);
  });
});

describe("Cenário B5 · várias palavras", () => {
  it("exige todas as palavras, em qualquer ordem, ignorando espaços repetidos", () => {
    assert.equal(busca("backup criptografia", AMBAS), true);
    assert.equal(busca("criptografia   backup", AMBAS), true);
    assert.equal(busca("backup criptografia", BACKUP), false);
    assert.equal(busca("backup criptografia", CRIPTO), false);
  });
});

describe("Cenário B8 · busca vazia", () => {
  it("texto vazio ou só com espaços não tem termos e mostra tudo", () => {
    assert.deepEqual(termosDaBusca(""), []);
    assert.deepEqual(termosDaBusca("   "), []);
    assert.equal(busca("   ", BACKUP), true);
  });
});
