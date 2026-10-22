import { describe, expect, it } from "vitest";
import { porcentagemAlterada } from "../../src/revisao/diferenca.ts";

/** P9 · porcentagem de texto alterado por palavras (etapa B5). */
describe("Porcentagem de texto alterado", () => {
  it.each([
    ["Os logs são mantidos por 12 meses.", "Os logs são mantidos por 12 meses.", 0],
    ["Os logs são mantidos por 12 meses.", "os LOGS são mantidos por 12 meses", 0],
    ["Os logs são mantidos por 12 meses.", "Os logs são mantidos por 24 meses.", 14.3],
    ["Os logs são mantidos por 12 meses.", "Os logs são mantidos por 12 meses em armazenamento imutável.", 17.6],
    ["Os logs são mantidos.", "Retenção anual garantida.", 100],
    ["", "", 0],
  ])("%s → %s", (original, final, esperado) => {
    expect(porcentagemAlterada(original, final)).toBe(esperado);
  });
});
