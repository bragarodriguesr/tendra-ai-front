import { test } from "node:test";
import assert from "node:assert/strict";
import { blocoDaExportacao, correspondeAExportacao, ordenarParaExportacao } from "../src/workspace/cicloDaTarefa.js";
import { termosDaBusca } from "../src/workspace/buscaDePerguntas.js";

// Fase O (SPEC_FASE_O.md), cenários O4 e O5.
const t = (id, extra = {}) => ({ id, isReady: false, isClosed: false, ...extra });

test("O4: prontas primeiro, depois as demais em andamento e por último as encerradas", () => {
  const lista = [t("arquivada", { isClosed: true }), t("revisao1"), t("pronta1", { isReady: true }), t("finalizada", { isClosed: true, isReady: true }), t("revisao2"), t("pronta2", { isReady: true })];
  assert.deepEqual(ordenarParaExportacao(lista).map((x) => x.id), ["pronta1", "pronta2", "revisao1", "revisao2", "arquivada", "finalizada"]);
});

test("O4: a finalizada 100% aprovada fica no bloco das encerradas, não no das prontas", () => {
  assert.equal(blocoDaExportacao(t("x", { isReady: true, isClosed: true })), 2);
  assert.equal(blocoDaExportacao(t("x", { isReady: true })), 0);
  assert.equal(blocoDaExportacao(t("x")), 1);
});

test("O5: busca na empresa e no título, sem acentos nem maiúsculas, com todas as palavras", () => {
  const cartao = { company: "Pulse Benefícios", title: "Questionário de Segurança" };
  assert.equal(correspondeAExportacao(cartao, termosDaBusca("")), true);
  assert.equal(correspondeAExportacao(cartao, termosDaBusca("beneficios")), true);
  assert.equal(correspondeAExportacao(cartao, termosDaBusca("SEGURANCA pulse")), true);
  assert.equal(correspondeAExportacao(cartao, termosDaBusca("pulse jurídico")), false);
});
