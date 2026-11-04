import { describe, expect, it } from "vitest";
import { areaDoItem, podeAprovarArea, validarAreasDoPerfil } from "../../src/regras/areas.ts";

/** Regras de área da fase N (PN1 a PN4, cenários N1 e N5 a N7). */
describe("Fase N · regras de área", () => {
  it("quem aprova cada área", () => {
    expect(podeAprovarArea(["Jurídico"], "Jurídico")).toBe(true);
    expect(podeAprovarArea(["Jurídico"], "Tecnologia")).toBe(false);
    expect(podeAprovarArea(["Jurídico", "Comercial"], "Comercial")).toBe(true);
    expect(podeAprovarArea(["C-Level"], "Tecnologia")).toBe(true);
    expect(podeAprovarArea([], "Geral")).toBe(true);
    expect(podeAprovarArea([], "Produto")).toBe(false);
    // Modo local, sem login: a pessoa da configuração não tem área e nada restringe (cenário 41).
    expect(podeAprovarArea(undefined, "Jurídico")).toBe(true);
  });

  it("área do item: só as da lista, sem diferença de maiúsculas", () => {
    expect(areaDoItem(" segurança E privacidade ")).toBe("Segurança e privacidade");
    expect(areaDoItem("geral")).toBe("Geral");
    expect(areaDoItem("C-Level")).toBeNull();
    expect(areaDoItem("Marketing")).toBeNull();
  });

  it("áreas do perfil: sem vazias nem repetidas; Revisor sem área", () => {
    expect(validarAreasDoPerfil("Aprovador", ["Tecnologia", "", "tecnologia", "Segurança e privacidade"])).toEqual(["Tecnologia", "Segurança e privacidade"]);
    expect(validarAreasDoPerfil("Revisor", [])).toEqual([]);
    expect(() => validarAreasDoPerfil("Revisor", ["Jurídico"])).toThrow("Só o Aprovador tem área.");
    expect(() => validarAreasDoPerfil("Aprovador", ["Geral"])).toThrow(/Área inválida "Geral"/);
  });
});
