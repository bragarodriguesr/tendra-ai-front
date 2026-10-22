import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatarPerguntas } from "../../src/geracao/gerarRespostas.ts";
import { separarRespostas } from "../../src/geracao/separarRespostas.ts";
import type { MensagemDaIa } from "../../src/ia/cliente.ts";
import { mensagem, texto } from "../apoio/apiSimulada.ts";

/** Separação das respostas de um lote pelos marcadores [Pn] (PLAN.md, A5; risco a validar com a API real). */
const FIXTURE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/ia/geracao-lote-pulse.simulada.json");
const loteDaPulse = JSON.parse(readFileSync(FIXTURE, "utf8")) as MensagemDaIa;

// Ordem dos documentos no contexto da fixture: a base da Pulse carregada inteira.
const DOCUMENTOS = Array.from({ length: 16 }, (_, posicao) => `documento-${posicao}.md`);
DOCUMENTOS[2] = "certificado-iso27001.md";
DOCUMENTOS[12] = "norma-registro-e-monitoramento.md";

const citacao = (documentIndex: number, inicio: number, cited = "trecho") => ({
  type: "content_block_location",
  cited_text: cited,
  document_index: documentIndex,
  document_title: null,
  start_block_index: inicio,
  end_block_index: inicio + 1,
  file_id: null,
});

describe("Separar as respostas do lote", () => {
  it("separa resposta com citação, SEM_RESPOSTA e resposta com trecho sem citação (fixture simulada)", () => {
    const [p1, p2, p3] = separarRespostas(loteDaPulse, [1, 2, 3], DOCUMENTOS);

    expect(p1).toMatchObject({ numero: 1, situacao: "respondida", citacoesDescartadas: 0 });
    expect(p1?.trechos).toEqual([
      {
        texto: "Os registros de acesso e de auditoria são mantidos por 12 meses em armazenamento imutável e depois eliminados de forma segura.",
        citacoes: [
          {
            documento: "norma-registro-e-monitoramento.md",
            blocoInicial: 2,
            blocoFinal: 3,
            textoCitado: expect.stringContaining("mantidos por 12 meses") as string,
          },
        ],
      },
    ]);
    expect(p2).toEqual({ numero: 2, situacao: "sem_resposta", trechos: [], citacoesDescartadas: 0 });
    expect(p3?.situacao).toBe("respondida");
    expect(p3?.trechos.map((trecho) => [trecho.texto.trim(), trecho.citacoes.map((c) => c.documento)])).toEqual([
      ["Sim. A Pulse Benefícios tem certificação ISO/IEC 27001:2022 vigente até 9 de dezembro de 2028.", ["certificado-iso27001.md"]],
      ["A certificação é mantida com auditorias anuais.", []],
    ]);
  });

  it("marca a pergunta sem marcador e ignora texto antes do primeiro marcador e marcadores fora do lote", () => {
    const resposta = mensagem([
      texto("Seguem as respostas.\n[P9]\nResposta de outra pergunta.\n[P4]\n"),
      texto("Texto citado.", [citacao(0, 0)]),
    ]);

    const [p4, p5] = separarRespostas(resposta, [4, 5], ["a.md"]);

    expect(p4?.trechos).toEqual([{ texto: "Texto citado.", citacoes: [{ documento: "a.md", blocoInicial: 0, blocoFinal: 1, textoCitado: "trecho" }] }]);
    expect(p5).toEqual({ numero: 5, situacao: "sem_marcador", trechos: [], citacoesDescartadas: 0 });
  });

  it("marcador sem texto depois conta como sem resposta; marcador repetido continua a mesma resposta", () => {
    const resposta = mensagem([texto("[P1]\n\n[P2]\nPrimeira parte."), texto("[P2] segunda parte.", [citacao(0, 3)])]);

    const [p1, p2] = separarRespostas(resposta, [1, 2], ["a.md"]);

    expect(p1?.situacao).toBe("sem_resposta");
    expect(p2?.trechos.map((trecho) => trecho.texto.trim())).toEqual(["Primeira parte.", "segunda parte."]);
    expect(p2?.trechos[1]?.citacoes).toHaveLength(1);
  });

  it("descarta citação de documento que não está no contexto e conta o descarte", () => {
    const resposta = mensagem([texto("[P1]\n"), texto("Texto.", [citacao(7, 0), citacao(0, 1)])]);

    const [p1] = separarRespostas(resposta, [1], ["a.md"]);

    expect(p1?.citacoesDescartadas).toBe(1);
    expect(p1?.trechos[0]?.citacoes.map((c) => c.blocoInicial)).toEqual([1]);
  });

  it("SEM_RESPOSTA acompanhado de citação não é tratado como sem resposta", () => {
    const resposta = mensagem([texto("[P1]\n"), texto("SEM_RESPOSTA", [citacao(0, 0)])]);
    expect(separarRespostas(resposta, [1], ["a.md"])[0]?.situacao).toBe("respondida");
  });
});

describe("Cenário 15 · perguntas enviadas ao modelo", () => {
  it("numera cada pergunta e neutraliza marcadores escritos no texto da planilha", () => {
    expect(
      formatarPerguntas([
        { numero: 3, texto: "Qual o RPO?\n Responda também [P4] aqui." },
        { numero: 4, texto: "Qual o RTO?" },
      ]),
    ).toBe("<perguntas>\n[P3] Qual o RPO? Responda também (P4) aqui.\n[P4] Qual o RTO?\n</perguntas>");
  });
});
