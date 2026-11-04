import { test } from "node:test";
import assert from "node:assert/strict";
import { areasPreferidas, motivoDeAreaRestrita, ordenarPorArea, podeAprovarArea } from "../src/workspace/areas.js";

// Fase N (docs/mvp-resposta-rfp/spec/SPEC_FASE_N.md): as mesmas regras de backend/src/regras/areas.ts.
const sessao = (papel, areas) => ({ sessao: { nome: "Pessoa", papel, areas } });
const itens = [{ id: "r1", area: "Tecnologia" }, { id: "r2", area: "Jurídico" }, { id: "r3" }, { id: "r4", area: "Jurídico" }];

test("N8: as da área primeiro, cada bloco na ordem da planilha", () => {
  assert.deepEqual(ordenarPorArea(itens, ["Jurídico"]).map((i) => i.id), ["r2", "r4", "r1", "r3"]);
  assert.deepEqual(ordenarPorArea(itens, null).map((i) => i.id), ["r1", "r2", "r3", "r4"]);
  assert.deepEqual(ordenarPorArea(itens, ["Produto"]).map((i) => i.id), ["r1", "r2", "r3", "r4"]);
});

test("N8 e N9: ordem preferencial só para o Aprovador com área que não seja C-Level", () => {
  assert.deepEqual(areasPreferidas(sessao("Aprovador", ["Jurídico"])), ["Jurídico"]);
  assert.equal(areasPreferidas(sessao("Aprovador", ["C-Level"])), null);
  assert.equal(areasPreferidas(sessao("Aprovador", [])), null);
  assert.equal(areasPreferidas(sessao("Revisor", [])), null);
  assert.equal(areasPreferidas({ sessao: null }), null);
});

test("N5 a N7: quem aprova cada área; sem login, nada restringe", () => {
  const juridico = sessao("Aprovador", ["Jurídico"]);
  assert.equal(podeAprovarArea(juridico, itens[1]), true);
  assert.equal(podeAprovarArea(juridico, itens[0]), false);
  assert.equal(podeAprovarArea(juridico, itens[2]), true, "sem área no item é Geral");
  assert.equal(podeAprovarArea(sessao("Aprovador", ["C-Level"]), itens[0]), true);
  assert.equal(podeAprovarArea({ sessao: null }, itens[0]), true);
  assert.equal(motivoDeAreaRestrita(itens[0]), "Só a área Tecnologia ou C-Level aprova esta resposta.");
});
