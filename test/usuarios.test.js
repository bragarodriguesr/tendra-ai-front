import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MENSAGEM_APROVADOR_SEM_AREA, MENSAGEM_SELECIONE_AREA, USUARIOS_DE_EXEMPLO, aprovadoresAtivos, areasAoMarcar, areasEmTexto, avisoDoNovoUsuario, ficariaSemArea, novoUsuario, ordenarUsuarios, recusaDoNovoUsuario } from "../src/workspace/usuarios.js";

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

describe("Fase T · cenário T1.6 · o Aprovador não fica sem área", () => {
  it("quem tem área não fica sem nenhuma; quem já está sem área não é afetado (T1.7)", () => {
    assert.equal(ficariaSemArea(["Jurídico"], areasAoMarcar(["Jurídico"], "Jurídico")), true);
    assert.equal(ficariaSemArea(["Jurídico", "Comercial"], areasAoMarcar(["Jurídico", "Comercial"], "Jurídico")), false);
    assert.equal(ficariaSemArea(["C-Level"], areasAoMarcar(["C-Level"], "Produto")), false);
    assert.equal(ficariaSemArea([], areasAoMarcar([], "Produto")), false);
    assert.equal(ficariaSemArea([], []), false);
  });

  it("as mensagens são as do backend", () => {
    assert.equal(MENSAGEM_SELECIONE_AREA, "Selecione pelo menos uma área.");
    assert.equal(MENSAGEM_APROVADOR_SEM_AREA, "O Aprovador precisa de pelo menos uma área.");
  });
});

describe("Fase T · cenários T2.3 e T2.4 · cadastro com papel, áreas e situação", () => {
  it("novo usuário com os valores escolhidos; o Revisor nunca leva área", () => {
    assert.deepEqual(novoUsuario("Lucas", "Lucas@Pulse.com.br", { papel: "Aprovador", areas: ["Jurídico"], ativo: false }), { id: "exemplo-lucas@pulse.com.br", nome: "Lucas", email: "lucas@pulse.com.br", papel: "Aprovador", areas: ["Jurídico"], ativo: false });
    assert.deepEqual(novoUsuario("Rita", "rita@pulse.com.br", { papel: "Revisor", areas: ["Jurídico"] }).areas, []);
  });

  it("Aprovador sem área é recusado; com área, não", () => {
    assert.equal(recusaDoNovoUsuario(USUARIOS_DE_EXEMPLO, "Lucas", "lucas@pulse.com.br", { papel: "Aprovador", areas: [] }), MENSAGEM_SELECIONE_AREA);
    assert.equal(recusaDoNovoUsuario(USUARIOS_DE_EXEMPLO, "Lucas", "lucas@pulse.com.br", { papel: "Aprovador" }), MENSAGEM_SELECIONE_AREA);
    assert.equal(recusaDoNovoUsuario(USUARIOS_DE_EXEMPLO, "Lucas", "lucas@pulse.com.br", { papel: "Aprovador", areas: ["Produto"] }), null);
    assert.equal(recusaDoNovoUsuario(USUARIOS_DE_EXEMPLO, "Lucas", "lucas@pulse.com.br", { papel: "Revisor", areas: [] }), null);
  });

  it("aviso conforme o papel, as áreas e a situação", () => {
    assert.equal(avisoDoNovoUsuario({ nome: "Rita", papel: "Revisor", areas: [], ativo: true }), "Rita entrou como Revisor, área Geral.");
    assert.equal(avisoDoNovoUsuario({ nome: "Lucas", papel: "Aprovador", areas: ["Jurídico", "Comercial"], ativo: true }), "Lucas entrou como Aprovador de Jurídico e Comercial.");
    assert.equal(avisoDoNovoUsuario({ nome: "Lucas", papel: "Aprovador", areas: ["C-Level"], ativo: false }), "Lucas entrou como Aprovador de C-Level. O acesso está inativo.");
  });
});

describe("Fase T · cenário T1.4 · áreas no aviso", () => {
  it("uma, duas e três áreas", () => {
    assert.equal(areasEmTexto(["Jurídico"]), "Jurídico");
    assert.equal(areasEmTexto(["Jurídico", "Comercial"]), "Jurídico e Comercial");
    assert.equal(areasEmTexto(["Produto", "Jurídico", "Comercial"]), "Produto, Jurídico e Comercial");
  });
});
