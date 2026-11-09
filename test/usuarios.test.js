import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { USUARIOS_DE_EXEMPLO, aprovadoresAtivos, areasAoMarcar, novoUsuario, ordenarUsuarios, recusaDoNovoUsuario } from "../src/workspace/usuarios.js";

const nomes = (lista) => lista.map((u) => u.nome);

describe("Cenário Q3 · usuário novo", () => {
  it("nasce Revisor, área Geral (sem área) e ativo", () => {
    assert.deepEqual(novoUsuario("  Ana Souza ", " Ana.Souza@Pulse.com.br "), { id: "exemplo-ana.souza@pulse.com.br", nome: "Ana Souza", email: "ana.souza@pulse.com.br", papel: "Revisor", areas: [], ativo: true });
  });
});

describe("Cenário Q4 · recusas do formulário", () => {
  it("recusa nome vazio, e-mail mal formado e pessoa já na lista", () => {
    assert.equal(recusaDoNovoUsuario(USUARIOS_DE_EXEMPLO, "  ", "a@b.com"), "Informe o nome da pessoa.");
    assert.equal(recusaDoNovoUsuario(USUARIOS_DE_EXEMPLO, "Ana", "ana@pulse"), "Informe um e-mail válido.");
    assert.equal(recusaDoNovoUsuario(USUARIOS_DE_EXEMPLO, "Kadu", "KADU.MENDES@pulse.com.br"), "Esta pessoa já está na lista.");
    assert.equal(recusaDoNovoUsuario(USUARIOS_DE_EXEMPLO, "Ana", "ana@pulse.com.br"), null);
  });
});

describe("Cenário Q6 · áreas do Aprovador", () => {
  it("marca e desmarca uma área", () => {
    assert.deepEqual(areasAoMarcar(["Jurídico"], "Comercial"), ["Jurídico", "Comercial"]);
    assert.deepEqual(areasAoMarcar(["Jurídico", "Comercial"], "Jurídico"), ["Comercial"]);
  });

  it("C-Level não se combina com outras áreas", () => {
    assert.deepEqual(areasAoMarcar(["Jurídico", "Comercial"], "C-Level"), ["C-Level"]);
    assert.deepEqual(areasAoMarcar(["C-Level"], "Produto"), ["Produto"]);
  });
});

describe("Cenário Q2b · ordenação pelas colunas", () => {
  it("ordem padrão pelo nome", () => {
    assert.deepEqual(nomes(ordenarUsuarios(USUARIOS_DE_EXEMPLO, null)), ["Carla Diretora", "Kadu Mendes", "Marcelo Vieira", "Paula Rocha"]);
  });

  it("papel, áreas e situação em ordem alfabética, com empate pelo nome", () => {
    assert.deepEqual(nomes(ordenarUsuarios(USUARIOS_DE_EXEMPLO, { coluna: "papel", direcao: "asc" })), ["Carla Diretora", "Marcelo Vieira", "Kadu Mendes", "Paula Rocha"]);
    assert.deepEqual(nomes(ordenarUsuarios(USUARIOS_DE_EXEMPLO, { coluna: "areas", direcao: "asc" })), ["Carla Diretora", "Kadu Mendes", "Paula Rocha", "Marcelo Vieira"]);
    assert.deepEqual(nomes(ordenarUsuarios(USUARIOS_DE_EXEMPLO, { coluna: "situacao", direcao: "desc" })), ["Paula Rocha", "Carla Diretora", "Kadu Mendes", "Marcelo Vieira"]);
  });
});

describe("Cenário Q8 · ao menos um Aprovador ativo", () => {
  it("conta só os Aprovadores ativos", () => {
    assert.equal(aprovadoresAtivos(USUARIOS_DE_EXEMPLO), 2);
    assert.equal(aprovadoresAtivos(USUARIOS_DE_EXEMPLO.map((u) => (u.nome === "Carla Diretora" ? { ...u, ativo: false } : u))), 1);
  });
});
