import { describe, expect, it } from "vitest";
import { ErroDeArquivoMd, ehDataValida, lerArquivoMd } from "../../src/base/cabecalho.ts";

const HOJE = "2026-10-21";
const codificar = (texto: string) => new TextEncoder().encode(texto);
const ler = (texto: string) => lerArquivoMd(codificar(texto), HOJE);
const motivo = (texto: string) => {
  try {
    ler(texto);
  } catch (erro) {
    if (erro instanceof ErroDeArquivoMd) return erro.message;
    throw erro;
  }
  return null;
};

const VALIDO = `---
titulo: Política de Segurança da Informação
tipo: documento
atualizado_em: 2026-08-14
versao: "3.2"
---

# Política

Texto.
`;

describe("Cenário 7 · cabeçalho válido (FORMATO_BASE_MD.md, cenários 1 a 3)", () => {
  it("lê os quatro campos e aponta onde começa o corpo", () => {
    const lido = ler(VALIDO);
    expect(lido.cabecalho).toEqual({
      titulo: "Política de Segurança da Informação",
      tipo: "documento",
      atualizadoEm: "2026-08-14",
      versao: "3.2",
    });
    expect(lido.inicioDoCorpo).toBe(6);
    expect(lido.avisos).toEqual([]);
  });

  it("aceita o arquivo sem versao", () => {
    expect(ler(VALIDO.replace('versao: "3.2"\n', "")).cabecalho.versao).toBeNull();
  });

  it("guarda a versão sem aspas exatamente como escrita, sem convertê-la em número", () => {
    expect(ler(VALIDO.replace('"3.2"', "3.2")).cabecalho.versao).toBe("3.2");
    expect(ler(VALIDO.replace('"3.2"', "3.10")).cabecalho.versao).toBe("3.10");
  });

  it("aceita rfp-passada, aspas simples, comentários e a marca BOM", () => {
    const texto = "﻿" + VALIDO.replace("tipo: documento", "tipo: rfp-passada # tipo\n# comentário").replace(
      "titulo: Política de Segurança da Informação",
      "titulo: 'Respostas d''A Empresa'",
    );
    const lido = ler(texto);
    expect(lido.cabecalho.tipo).toBe("rfp-passada");
    expect(lido.cabecalho.titulo).toBe("Respostas d'A Empresa");
  });

  it("aceita a data de hoje", () => {
    expect(ler(VALIDO.replace("2026-08-14", HOJE)).cabecalho.atualizadoEm).toBe(HOJE);
  });
});

describe("Cenário 9 · arquivo recusado com o motivo (FORMATO_BASE_MD.md, seção 4)", () => {
  it.each([
    ["sem cabeçalho", "# Texto\n\nSem cabeçalho.\n", "cabeçalho ausente ou sem fechamento. O arquivo deve começar com --- na linha 1."],
    ["cabeçalho sem fechamento", "---\ntitulo: Teste\ntipo: documento\n\n# Texto\n", "cabeçalho ausente ou sem fechamento. O arquivo deve começar com --- na linha 1."],
    ["--- fora da linha 1", "\n---\ntitulo: Teste\n---\nTexto\n", "cabeçalho ausente ou sem fechamento. O arquivo deve começar com --- na linha 1."],
    ["sem atualizado_em", VALIDO.replace("atualizado_em: 2026-08-14\n", ""), "campo atualizado_em ausente. Use AAAA-MM-DD."],
    ["sem titulo", VALIDO.replace("titulo: Política de Segurança da Informação\n", ""), "campo titulo ausente."],
    ["tipo inválido", VALIDO.replace("tipo: documento", "tipo: politica"), 'tipo inválido "politica". Use documento ou rfp-passada.'],
    ["data dd/mm/aaaa", VALIDO.replace("2026-08-14", "14/08/2026"), 'atualizado_em "14/08/2026" inválido. Use AAAA-MM-DD.'],
    ["data inexistente", VALIDO.replace("2026-08-14", "2026-02-30"), 'atualizado_em "2026-02-30" inválido. Use AAAA-MM-DD.'],
    ["data no futuro", VALIDO.replace("2026-08-14", "2026-10-22"), "atualizado_em está no futuro."],
    ["título curto", VALIDO.replace("Política de Segurança da Informação", "Ab"), "titulo deve ter de 3 a 120 caracteres."],
    ["título longo", VALIDO.replace("Política de Segurança da Informação", "x".repeat(121)), "titulo deve ter de 3 a 120 caracteres."],
    ["versão longa", VALIDO.replace('"3.2"', '"versao-com-mais-de-vinte-caracteres"'), "versao deve ter até 20 caracteres."],
    ["corpo vazio", "---\ntitulo: Teste\ntipo: documento\natualizado_em: 2026-09-01\n---\n\n   \n", "o arquivo não tem conteúdo."],
    ["chave repetida", VALIDO.replace("tipo: documento", "tipo: documento\ntipo: rfp-passada"), "cabeçalho ilegível (linha 4)."],
    ["lista no cabeçalho", VALIDO.replace("tipo: documento", "tipo: [documento]"), "cabeçalho ilegível (linha 3)."],
    ["chave recuada", VALIDO.replace("tipo: documento", "  tipo: documento"), "cabeçalho ilegível (linha 3)."],
    ["aspas sem fechamento", VALIDO.replace('"3.2"', '"3.2'), "cabeçalho ilegível (linha 5)."],
  ])("%s", (_caso, texto, mensagem) => {
    expect(motivo(texto)).toBe(mensagem);
  });

  it("recusa arquivo fora de UTF-8", () => {
    const latin1 = Uint8Array.from(Buffer.from(VALIDO.replace("Texto.", "Ação e informação."), "latin1"));
    expect(() => lerArquivoMd(latin1, HOJE)).toThrow("o arquivo precisa estar em UTF-8.");
  });
});

describe("Cenário 9 · campo desconhecido gera aviso, não recusa", () => {
  it("carrega e avisa o campo ignorado", () => {
    const lido = ler(VALIDO.replace("tipo: documento", "tipo: documento\narea: juridico"));
    expect(lido.avisos).toEqual(['campo "area" ignorado.']);
    expect(lido.cabecalho.tipo).toBe("documento");
  });
});

describe("Datas do cabeçalho", () => {
  it.each([
    ["2026-08-14", true],
    ["2024-02-29", true],
    ["2026-02-29", false],
    ["2026-13-01", false],
    ["26-08-14", false],
  ])("%s é válida: %s", (data, valida) => {
    expect(ehDataValida(data)).toBe(valida);
  });
});
