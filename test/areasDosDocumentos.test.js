import { test } from "node:test";
import assert from "node:assert/strict";
import { paraDocumentoDaTela } from "../src/api.js";

// Fase U (docs/mvp-resposta-rfp/spec/SPEC_FASE_U.md, cenário U17): áreas do documento na tela da Base.
const doBackend = (areas) => ({ id: 7, nome: "anexo-sla.md", titulo: "Anexo de SLA", tipo: "documento", atualizadoEm: "2026-01-15", versao: "1.0", validade: null, vencido: false, ativo: true, enviadoPor: null, carregadoEm: "2026-11-12T10:00:00Z", areas });

test("U17: áreas do backend viram a lista da tela", () => {
  const d = paraDocumentoDaTela(doBackend(["Tecnologia", "Comercial"]), new Date(2026, 10, 12));
  assert.deepEqual(d.areas, ["Tecnologia", "Comercial"]);
  assert.equal(d.classifying, false);
});

test("U17: areas null é 'Classificando…'", () => {
  const d = paraDocumentoDaTela(doBackend(null), new Date(2026, 10, 12));
  assert.equal(d.areas, null);
  assert.equal(d.classifying, true);
});

test("U17: um backend sem o campo não deixa o documento preso em 'Classificando…'", () => {
  const { areas, ...semAreas } = doBackend([]);
  const d = paraDocumentoDaTela(semAreas, new Date(2026, 10, 12));
  assert.equal(d.classifying, false);
  assert.equal(d.areas, null);
});
