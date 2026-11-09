import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AL } from "../src/workspace/data.js";

describe("Cenário S8 · ícone da resposta manual", () => {
  it("o alerta da resposta manual usa file-text, não o lápis", () => {
    assert.equal(AL.manual.i, "file-text");
  });

  it("nenhum alerta usa o lápis, que fica para trocar a área (S9)", () => {
    assert.deepEqual(Object.entries(AL).filter(([, a]) => a.i === "pencil"), []);
  });
});
