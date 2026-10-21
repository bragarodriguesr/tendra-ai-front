import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import {
  ErroDePlanilha,
  identificarPerguntas,
  identificarPerguntasComIA,
  identificarPerguntasPorRegra,
  LIMITE_DA_PLANILHA_EM_BYTES,
  lerPlanilha,
  validarArquivoDePlanilha,
  type IdentificadorDePerguntasComIA,
} from "../../src/documentos/planilha.ts";

const NOMES_ACEITOS = ["Pergunta", "Questão", "Question"];

type Valor = string | number | null;

/** Monta uma planilha em memória: cada aba é uma lista de linhas, a partir da linha 1. */
async function montarPlanilha(
  abas: { nome: string; linhas: Valor[][]; oculta?: boolean; mesclagens?: string[] }[],
): Promise<Uint8Array> {
  const pasta = new ExcelJS.Workbook();
  for (const definicao of abas) {
    const aba = pasta.addWorksheet(definicao.nome, { state: definicao.oculta ? "hidden" : "visible" });
    definicao.linhas.forEach((valores, indice) => {
      valores.forEach((valor, coluna) => {
        if (valor !== null) aba.getCell(indice + 1, coluna + 1).value = valor;
      });
    });
    for (const intervalo of definicao.mesclagens ?? []) aba.mergeCells(intervalo);
  }
  return new Uint8Array(await pasta.xlsx.writeBuffer());
}

const semIA: IdentificadorDePerguntasComIA = async () => {
  throw new Error("A IA não deveria ser chamada");
};

describe("Cenário 1 · coluna de perguntas identificável", () => {
  it("cria um item por célula preenchida abaixo do cabeçalho, na ordem, com aba e linha", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        {
          nome: "RFP",
          linhas: [
            ["Ref", "Pergunta"],
            ["1", "A empresa possui ISO 27001?"],
            ["2", "Qual é o RPO do ambiente de produção?"],
          ],
        },
      ]),
    );

    const resultado = await identificarPerguntas(planilha, { nomesAceitos: NOMES_ACEITOS, identificadorComIA: semIA });

    expect(resultado.origem).toBe("regra");
    expect(resultado.perguntas).toEqual([
      { aba: "RFP", linha: 2, texto: "A empresa possui ISO 27001?" },
      { aba: "RFP", linha: 3, texto: "Qual é o RPO do ambiente de produção?" },
    ]);
  });

  it.each(["PERGUNTA", "  pergunta  ", "Questao", "QUESTÃO", "question"])(
    "aceita o cabeçalho %j sem diferenciar maiúsculas, acentos e espaços",
    async (cabecalho) => {
      const planilha = await lerPlanilha(
        await montarPlanilha([{ nome: "RFP", linhas: [[cabecalho], ["Pergunta de teste?"]] }]),
      );
      expect(identificarPerguntasPorRegra(planilha, NOMES_ACEITOS)).toEqual([
        { aba: "RFP", linha: 2, texto: "Pergunta de teste?" },
      ]);
    },
  );

  it("procura o cabeçalho nas 20 primeiras linhas, e não além", async () => {
    const linhasAte20: Valor[][] = Array.from({ length: 19 }, () => [null]);
    linhasAte20.push(["Pergunta"], ["Dentro do limite?"]);
    const linhasAte21: Valor[][] = Array.from({ length: 20 }, () => [null]);
    linhasAte21.push(["Pergunta"], ["Fora do limite?"]);

    const dentro = await lerPlanilha(await montarPlanilha([{ nome: "A", linhas: linhasAte20 }]));
    const fora = await lerPlanilha(await montarPlanilha([{ nome: "A", linhas: linhasAte21 }]));

    expect(identificarPerguntasPorRegra(dentro, NOMES_ACEITOS)).toEqual([
      { aba: "A", linha: 21, texto: "Dentro do limite?" },
    ]);
    expect(identificarPerguntasPorRegra(fora, NOMES_ACEITOS)).toBeNull();
  });

  it("usa a primeira aba visível com cabeçalho e ignora abas ocultas", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        { nome: "Oculta", oculta: true, linhas: [["Pergunta"], ["Não deve aparecer?"]] },
        { nome: "Instruções", linhas: [["Leia antes de responder."]] },
        { nome: "Primeira", linhas: [["Pergunta"], ["Desta aba?"]] },
        { nome: "Segunda", linhas: [["Pergunta"], ["Não desta?"]] },
      ]),
    );

    expect(planilha.abas.map((aba) => aba.nome)).toEqual(["Instruções", "Primeira", "Segunda"]);
    expect(identificarPerguntasPorRegra(planilha, NOMES_ACEITOS)).toEqual([
      { aba: "Primeira", linha: 2, texto: "Desta aba?" },
    ]);
  });

  it("não confunde o cabeçalho com um texto que só contém o nome", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([{ nome: "A", linhas: [["Perguntas frequentes do questionário"], ["Texto?"]] }]),
    );
    expect(identificarPerguntasPorRegra(planilha, NOMES_ACEITOS)).toBeNull();
  });
});

describe("Cenário 2 · linhas vazias, linhas sem pergunta e títulos de seção", () => {
  it("ignora linhas vazias, linhas só com referência e títulos mesclados", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        {
          nome: "RFP",
          linhas: [
            ["Ref", "Pergunta", "Resposta"],
            ["SEGURANÇA", null, null],
            ["1.01", "Possui ISO 27001?", null],
            [null, null, null],
            ["1.02", null, "0"],
            ["Seção 2 · Continuidade", null, null],
            ["2.01", "Qual é o RPO?", null],
          ],
          mesclagens: ["A6:C6"],
        },
      ]),
    );

    expect(identificarPerguntasPorRegra(planilha, NOMES_ACEITOS)).toEqual([
      { aba: "RFP", linha: 3, texto: "Possui ISO 27001?" },
      { aba: "RFP", linha: 7, texto: "Qual é o RPO?" },
    ]);
  });
});

describe("Cenário 3 · planilha sem coluna de perguntas identificável", () => {
  const conteudo = () =>
    montarPlanilha([
      { nome: "Questionário", linhas: [["Item", "Descrição"], ["1", "Possui ISO 27001?"], ["2", "Qual é o RPO?"]] },
      { nome: "Oculta", oculta: true, linhas: [["Segredo"]] },
    ]);

  it("chama a IA só com as abas visíveis e mantém as perguntas que existem literalmente na linha indicada", async () => {
    const planilha = await lerPlanilha(await conteudo());
    const identificador = vi.fn<IdentificadorDePerguntasComIA>(async () => [
      { aba: "Questionário", linha: 3, texto: "Qual é o RPO?" },
      { aba: "Questionário", linha: 2, texto: "Possui ISO 27001?" },
      { aba: "Questionário", linha: 2, texto: "A empresa possui a certificação ISO 27001?" },
      { aba: "Questionário", linha: 3, texto: "Possui ISO 27001?" },
      { aba: "Outra", linha: 2, texto: "Possui ISO 27001?" },
      { aba: "Questionário", linha: 2, texto: "Possui ISO 27001?" },
    ]);

    const resultado = await identificarPerguntas(planilha, {
      nomesAceitos: NOMES_ACEITOS,
      identificadorComIA: identificador,
    });

    expect(identificador).toHaveBeenCalledTimes(1);
    expect(identificador.mock.calls[0]?.[0].abas.map((aba) => aba.nome)).toEqual(["Questionário"]);
    expect(resultado.origem).toBe("ia");
    expect(resultado.perguntas).toEqual([
      { aba: "Questionário", linha: 2, texto: "Possui ISO 27001?" },
      { aba: "Questionário", linha: 3, texto: "Qual é o RPO?" },
    ]);
  });

  it("descarta tudo que a IA reescreveu", async () => {
    const planilha = await lerPlanilha(await conteudo());
    const perguntas = await identificarPerguntasComIA(planilha, async () => [
      { aba: "Questionário", linha: 2, texto: "possui iso 27001?" },
      { aba: "Questionário", linha: 3, texto: "Qual é o RPO? " },
    ]);
    expect(perguntas).toEqual([]);
  });
});

describe("Cenário 5 · planilha sem perguntas", () => {
  it("falha com a mensagem do SPEC quando nem a regra nem a IA encontram perguntas", async () => {
    const planilha = await lerPlanilha(await montarPlanilha([{ nome: "A", linhas: [["Instruções gerais."]] }]));

    await expect(
      identificarPerguntas(planilha, { nomesAceitos: NOMES_ACEITOS, identificadorComIA: async () => [] }),
    ).rejects.toThrow("Nenhuma pergunta encontrada na planilha");
  });

  it("falha sem chamar a IA quando há cabeçalho mas a coluna está vazia", async () => {
    const planilha = await lerPlanilha(await montarPlanilha([{ nome: "A", linhas: [["Pergunta"], [null]] }]));

    await expect(
      identificarPerguntas(planilha, { nomesAceitos: NOMES_ACEITOS, identificadorComIA: semIA }),
    ).rejects.toMatchObject({ motivo: "sem-perguntas" });
  });
});

describe("Cenários 4 e 31 · validação do arquivo", () => {
  it.each(["rfp.csv", "rfp.docx", "rfp.pdf", "rfp.xls", "rfp"])(
    "recusa %j com a mensagem de formato",
    (nome) => {
      expect(() => validarArquivoDePlanilha(nome, new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toThrow(
        "Envie a RFP em formato .xlsx",
      );
    },
  );

  it("aceita a extensão sem diferenciar maiúsculas", async () => {
    const conteudo = await montarPlanilha([{ nome: "A", linhas: [["Pergunta"]] }]);
    expect(() => validarArquivoDePlanilha("RFP.XLSX", conteudo)).not.toThrow();
  });

  it("recusa planilha acima de 10 MB", () => {
    const grande = new Uint8Array(LIMITE_DA_PLANILHA_EM_BYTES + 1);
    grande.set([0x50, 0x4b, 0x03, 0x04]);
    expect(() => validarArquivoDePlanilha("rfp.xlsx", grande)).toThrow("A planilha passa do limite de 10 MB");
  });

  it("recusa arquivo de outro tipo renomeado para .xlsx", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7 conteúdo qualquer");
    expect(() => validarArquivoDePlanilha("rfp.xlsx", pdf)).toThrow("Arquivo .xlsx inválido");
  });

  it("recusa arquivo com assinatura de ZIP que não é uma planilha", async () => {
    const zipCorrompido = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 1, 2, 3]);
    expect(() => validarArquivoDePlanilha("rfp.xlsx", zipCorrompido)).not.toThrow();
    await expect(lerPlanilha(zipCorrompido)).rejects.toBeInstanceOf(ErroDePlanilha);
    await expect(lerPlanilha(zipCorrompido)).rejects.toThrow("Arquivo .xlsx inválido");
  });
});
