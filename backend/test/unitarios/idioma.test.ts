import { describe, expect, it } from "vitest";
import { pareceEmPortugues } from "../../src/avaliacao/avaliar.ts";

/** Cenário 50 · heurística de idioma usada na avaliação. */
describe("Idioma da resposta", () => {
  it.each([
    ["Os registros de acesso são mantidos por 12 meses em armazenamento imutável.", true],
    ["Sim. A Pulse tem certificação ISO/IEC 27001.", true],
    ["Access logs are kept for 12 months in immutable storage and the backups are encrypted.", false],
    ["Yes, this is supported by the platform.", false],
  ])("%s", (texto, esperado) => {
    expect(pareceEmPortugues(texto)).toBe(esperado);
  });
});
