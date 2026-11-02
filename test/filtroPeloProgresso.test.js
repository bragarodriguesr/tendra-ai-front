import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filtroAoClicar, numeroDoCartao } from "../src/workspace/filtroPeloProgresso.js";

const CONTAGENS = { "sem-rascunho": 1, sugerida: 6, "em-revisao": 2, revisada: 1, aprovada: 2 };

describe("Cenário M3 · clicar de novo no estado filtrado", () => {
  it("volta para todos", () => {
    assert.equal(filtroAoClicar("sem-rascunho", "sem-rascunho"), "todos");
  });
});

describe("Cenário M4 · trocar de estado", () => {
  it("passa direto para o estado clicado, a partir de todos, de outro estado ou de alerta", () => {
    assert.equal(filtroAoClicar("todos", "sugerida"), "sugerida");
    assert.equal(filtroAoClicar("sugerida", "aprovada"), "aprovada");
    assert.equal(filtroAoClicar("alerta", "revisada"), "revisada");
  });
});

describe("Cenário M7 · número do cartão segue o filtro", () => {
  it("mostra os aprovados em todos e em alerta pendente", () => {
    assert.deepEqual(numeroDoCartao("todos", CONTAGENS), { n: 2, texto: "itens aprovados" });
    assert.deepEqual(numeroDoCartao("alerta", CONTAGENS), { n: 2, texto: "itens aprovados" });
  });

  it("mostra a contagem e o texto do estado filtrado", () => {
    assert.deepEqual(numeroDoCartao("sem-rascunho", CONTAGENS), { n: 1, texto: "itens sem rascunho" });
    assert.deepEqual(numeroDoCartao("sugerida", CONTAGENS), { n: 6, texto: "itens sugeridos" });
    assert.deepEqual(numeroDoCartao("em-revisao", CONTAGENS), { n: 2, texto: "itens em revisão" });
    assert.deepEqual(numeroDoCartao("revisada", CONTAGENS), { n: 1, texto: "itens revisados" });
  });
});
