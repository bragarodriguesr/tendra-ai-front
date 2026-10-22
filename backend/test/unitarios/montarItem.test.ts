import { describe, expect, it } from "vitest";
import type { Bloco } from "../../src/base/blocos.ts";
import type { RespostaGerada } from "../../src/geracao/separarRespostas.ts";
import { conferirCitacao, idadeEmDias, montarItem } from "../../src/rastreabilidade/montarItem.ts";
import type { DocumentoDoContexto } from "../../src/recuperacao/buscarFontes.ts";

/** Checagem determinística das respostas geradas (etapa A6). */
const HOJE = "2026-10-21";

const bloco = (ordem: number, secao: string, linhaInicial: number, texto: string): Bloco => ({
  ordem,
  secao,
  caminhoDeSecoes: [secao],
  linhaInicial,
  linhaFinal: linhaInicial + texto.split("\n").length - 1,
  texto,
});

const RETENCAO = "Os registros de acesso são mantidos por 12 meses em armazenamento imutável.";
const RPO = "RPO de 15 minutos e RTO de 4 horas.";
const documentos: DocumentoDoContexto[] = [
  {
    nome: "norma-registro.md",
    titulo: "Norma de Registro",
    tipo: "documento",
    atualizadoEm: "2026-06-23",
    versao: "2.0",
    tamanhoBytes: 1000,
    blocos: [bloco(1, "(início)", 7, "Documento fictício."), bloco(2, "2. Retenção dos registros", 18, RETENCAO)],
  },
  {
    nome: "rfp-antiga.md",
    titulo: "RFP antiga",
    tipo: "rfp-passada",
    atualizadoEm: "2026-10-21",
    versao: null,
    tamanhoBytes: 500,
    blocos: [bloco(1, "3. Continuidade", 30, RPO), bloco(2, "3. Continuidade", 32, "Testes anuais.")],
  },
];
const contexto = { documentos };

const citacao = (documento: string, blocoInicial: number, textoCitado: string, blocoFinal = blocoInicial + 1) => ({
  documento,
  blocoInicial,
  blocoFinal,
  textoCitado,
});

const respondida = (trechos: RespostaGerada["trechos"], citacoesDescartadas = 0): RespostaGerada => ({
  numero: 7,
  situacao: "respondida",
  trechos,
  citacoesDescartadas,
});

const pergunta = { numero: 7, texto: "Por quanto tempo os registros são guardados?" };

describe("Cenários 12 e 13 · resposta com fonte rastreável", () => {
  it("monta o item sugerido com parágrafos ligados às fontes e localização seção · linha", () => {
    const { item, checagem } = montarItem({
      pergunta,
      contexto,
      hoje: HOJE,
      resposta: respondida([
        { texto: "Os registros ficam guardados por 12 meses", citacoes: [citacao("norma-registro.md", 1, RETENCAO)] },
        { texto: ".\n\n", citacoes: [] },
        { texto: "O RPO é de 15 minutos.", citacoes: [citacao("rfp-antiga.md", 0, RPO)] },
      ]),
    });

    expect(item).toEqual({
      id: "r7",
      q: pergunta.texto,
      paras: [
        { t: "Os registros ficam guardados por 12 meses.", s: [1] },
        { t: "O RPO é de 15 minutos.", s: [2] },
      ],
      srcs: [
        { doc: "norma-registro.md", loc: "2. Retenção dos registros · linha 18", type: "Documento", age: 120, ex: RETENCAO },
        { doc: "rfp-antiga.md", loc: "3. Continuidade · linha 30", type: "RFP passada", age: 0, ex: RPO },
      ],
      alerts: [],
      st: "sugerida",
      orig: "Os registros ficam guardados por 12 meses.\n\nO RPO é de 15 minutos.",
    });
    expect(checagem).toEqual({ citacoesValidas: 2, citacoesDescartadas: 0, trechosSemFonte: 0, semMarcador: false });
  });

  it("reaproveita a mesma fonte citada duas vezes e junta as fontes de um parágrafo", () => {
    const { item } = montarItem({
      pergunta,
      contexto,
      hoje: HOJE,
      resposta: respondida([
        { texto: "Guardamos por 12 meses ", citacoes: [citacao("norma-registro.md", 1, RETENCAO)] },
        { texto: "e o RPO é de 15 minutos; ", citacoes: [citacao("rfp-antiga.md", 0, RPO)] },
        { texto: "o armazenamento é imutável.", citacoes: [citacao("norma-registro.md", 1, RETENCAO)] },
      ]),
    });
    expect(item.paras).toEqual([{ t: "Guardamos por 12 meses e o RPO é de 15 minutos; o armazenamento é imutável.", s: [1, 2] }]);
    expect(item.srcs).toHaveLength(2);
  });

  it("aceita citação de vários blocos e o trecho com espaços diferentes, mas guarda o texto literal", () => {
    const fonte = conferirCitacao(citacao("rfp-antiga.md", 0, `${RPO}   Testes  anuais.`, 2), documentos[1], HOJE);
    expect(fonte).toMatchObject({ loc: "3. Continuidade · linha 30", ex: `${RPO}\nTestes anuais.` });
  });
});

describe("Cenários 18 e 19 · texto sem citação e citação que não confere", () => {
  it("retira o texto sem citação e marca lowconf", () => {
    const { item, checagem } = montarItem({
      pergunta,
      contexto,
      hoje: HOJE,
      resposta: respondida([
        { texto: "Sim, e também temos certificação SOC 2. ", citacoes: [] },
        { texto: "Os registros ficam por 12 meses.", citacoes: [citacao("norma-registro.md", 1, RETENCAO)] },
        { texto: "\n\nAlém disso, somos líderes de mercado.", citacoes: [] },
      ]),
    });
    expect(item.paras).toEqual([{ t: "Os registros ficam por 12 meses.", s: [1] }]);
    expect(item.alerts).toEqual([{ t: "lowconf" }]);
    expect(checagem.trechosSemFonte).toBe(2);
  });

  it.each([
    ["trecho que não está no documento", citacao("norma-registro.md", 1, "Os registros são mantidos por 5 anos.")],
    ["bloco fora do documento", citacao("norma-registro.md", 5, RETENCAO)],
    ["documento fora do contexto", citacao("politica-fiscal.md", 0, RETENCAO)],
    ["intervalo invertido", citacao("norma-registro.md", 1, RETENCAO, 1)],
  ])("descarta a fonte com %s; o texto que dependia só dela sai", (_caso, invalida) => {
    const { item, checagem } = montarItem({
      pergunta,
      contexto,
      hoje: HOJE,
      resposta: respondida([
        { texto: "Guardamos por 5 anos.", citacoes: [invalida] },
        { texto: "\n\nO RPO é de 15 minutos.", citacoes: [citacao("rfp-antiga.md", 0, RPO)] },
      ]),
    });
    expect(item.paras).toEqual([{ t: "O RPO é de 15 minutos.", s: [1] }]);
    expect(item.srcs.map((src) => src.doc)).toEqual(["rfp-antiga.md"]);
    expect(item.alerts).toEqual([{ t: "lowconf" }]);
    expect(checagem).toMatchObject({ citacoesValidas: 1, citacoesDescartadas: 1 });
  });

  it("citação descartada já na separação também deixa lowconf", () => {
    const { item } = montarItem({
      pergunta,
      contexto,
      hoje: HOJE,
      resposta: respondida([{ texto: "Os registros ficam por 12 meses.", citacoes: [citacao("norma-registro.md", 1, RETENCAO)] }], 1),
    });
    expect(item.alerts).toEqual([{ t: "lowconf" }]);
  });
});

describe("Cenários 10, 14 e 34 · sem rascunho", () => {
  const semRascunho = { id: "r7", q: pergunta.texto, paras: [], srcs: [], alerts: [{ t: "nocontext" }], st: "sem-rascunho", orig: "" };

  it.each([
    ["sem resposta na base", { numero: 7, situacao: "sem_resposta", trechos: [], citacoesDescartadas: 0 } as RespostaGerada],
    ["sem marcador na resposta do lote", { numero: 7, situacao: "sem_marcador", trechos: [], citacoesDescartadas: 0 } as RespostaGerada],
    ["texto sem nenhuma citação válida", respondida([{ texto: "Aceitamos a multa de 10%.", citacoes: [] }])],
  ])("%s vira sem-rascunho com nocontext", (_caso, resposta) => {
    expect(montarItem({ pergunta, contexto, hoje: HOJE, resposta }).item).toEqual(semRascunho);
  });

  it("base vazia: sem resposta nem contexto", () => {
    expect(montarItem({ pergunta, contexto: null, hoje: HOJE, resposta: null }).item).toEqual(semRascunho);
  });
});

describe("Cenário 33 · nada aprovado pelo sistema", () => {
  it("o item nunca traz estado nem campos de aprovação ou revisão", () => {
    const { item } = montarItem({
      pergunta,
      contexto,
      hoje: HOJE,
      resposta: respondida([{ texto: "Os registros ficam por 12 meses.", citacoes: [citacao("norma-registro.md", 1, RETENCAO)] }]),
    });
    expect(["sugerida", "sem-rascunho"]).toContain(item.st);
    for (const campo of ["by", "at", "rby", "rat"]) expect(item).not.toHaveProperty(campo);
  });
});

describe("Idade da fonte", () => {
  it("conta os dias desde atualizado_em até a data do backend", () => {
    expect(idadeEmDias("2026-06-23", HOJE)).toBe(120);
    expect(idadeEmDias("2026-06-22", HOJE)).toBe(121);
    expect(idadeEmDias("2026-10-22", HOJE)).toBe(0);
  });
});
