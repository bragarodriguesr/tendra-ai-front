import { test } from "node:test";
import assert from "node:assert/strict";
import { dataBrParaIso, isoParaDataBr, mascararData } from "../src/workspace/dataBr.js";

// Prazo da Nova RFP em dd/mm/aaaa, sem depender do idioma do navegador (revisão de design de 05/11/2026).
test("máscara dd/mm/aaaa enquanto digita", () => {
  assert.equal(mascararData("3"), "3");
  assert.equal(mascararData("3112"), "31/12");
  assert.equal(mascararData("31122099"), "31/12/2099");
  assert.equal(mascararData("31/12/2099 extra"), "31/12/2099");
});

test("só data completa e existente vira AAAA-MM-DD", () => {
  assert.equal(dataBrParaIso("31/12/2099"), "2099-12-31");
  assert.equal(dataBrParaIso("29/02/2028"), "2028-02-29");
  assert.equal(dataBrParaIso("31/02/2099"), "");
  assert.equal(dataBrParaIso("31/12"), "");
});

test("data escolhida no calendário volta para dd/mm/aaaa", () => {
  assert.equal(isoParaDataBr("2099-12-31"), "31/12/2099");
  assert.equal(isoParaDataBr(""), "");
});
