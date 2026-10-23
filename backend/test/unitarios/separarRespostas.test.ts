import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatarPerguntas } from "../../src/geracao/gerarRespostas.ts";
import { separarRespostas } from "../../src/geracao/separarRespostas.ts";
import type { MensagemDaIa } from "../../src/ia/cliente.ts";
import { mensagem, texto } from "../apoio/apiSimulada.ts";

/** Separação das respostas de um lote pelos marcadores [Pn] (PLAN.md, A5), conferida com uma resposta real da API. */
const FIXTURE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/ia/geracao-lote-pulse.real.json");
const { _documentos: DOCUMENTOS, ...loteDaPulse } = JSON.parse(readFileSync(FIXTURE, "utf8")) as MensagemDaIa & { _documentos: string[] };

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
  it("separa respostas com citação, SEM_RESPOSTA e trechos sem citação (resposta real gravada)", () => {
    const [p1, p2, p3, p4, p5] = separarRespostas(loteDaPulse, [1, 2, 3, 4, 5], DOCUMENTOS);

    expect([p1, p2, p3, p4, p5].map((resposta) => [resposta?.situacao, resposta?.citacoesDescartadas])).toEqual([
      ["respondida", 0],
      ["respondida", 0],
      ["respondida", 0],
      ["sem_resposta", 0],
      ["respondida", 0],
    ]);
    expect(p2?.trechos).toEqual([
      {
        texto: "A contratante paga taxa de administração de 1,5% a 3,0% sobre o valor dos créditos, conforme o plano e o volume.",
        citacoes: [
          {
            documento: "contrato-prestacao-servicos.md",
            blocoInicial: 3,
            blocoFinal: 4,
            textoCitado: expect.stringContaining("taxa de administração de 1,5% a 3,0%") as string,
          },
        ],
      },
    ]);
    expect(p1?.trechos.map((trecho) => [trecho.texto.trim(), trecho.citacoes.map((c) => c.documento)])).toEqual([
      ["Oferecemos", []],
      ["os planos Essencial, Plus e Enterprise. As funcionalidades de cada plano constam na proposta comercial anexa.", ["contrato-prestacao-servicos.md"]],
      ["Como exemplo de diferença entre os planos,", []],
      ["o logon único (SSO) por SAML 2.0 está disponível no plano Enterprise.", ["portal-empresa-rh-funcionalidades.md"]],
    ]);
    expect(p4).toEqual({ numero: 4, situacao: "sem_resposta", trechos: [], citacoesDescartadas: 0 });
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
