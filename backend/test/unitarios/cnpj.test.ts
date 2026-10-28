import { describe, expect, it } from "vitest";
import { normalizarCnpj } from "../../src/regras/cnpj.ts";

/** CNPJ numérico ou alfanumérico (IN RFB nº 2.229/2024), sem máscara e em maiúsculas. */
describe("normalizarCnpj", () => {
  it("aceita o numérico e o alfanumérico, com ou sem máscara, em maiúsculas", () => {
    expect(normalizarCnpj("11.222.333/0001-81")).toBe("11222333000181");
    expect(normalizarCnpj("12.ABC.345/01DE-35")).toBe("12ABC34501DE35");
    expect(normalizarCnpj("12abc34501de35")).toBe("12ABC34501DE35");
  });

  it("recusa tamanho errado e letra nos dígitos verificadores", () => {
    expect(normalizarCnpj("123")).toBeNull();
    expect(normalizarCnpj("12ABC34501DE3A")).toBeNull();
    expect(normalizarCnpj("12ABC34501DE351")).toBeNull();
    expect(normalizarCnpj(undefined)).toBeNull();
  });
});
