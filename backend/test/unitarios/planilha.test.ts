import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import type { NomesDeCabecalho } from "../../src/config/cabecalhos.ts";
import {
  ErroDePlanilha,
  identificarPerguntas,
  identificarPerguntasComIA,
  identificarPerguntasPorRegra,
  LIMITE_DA_PLANILHA_EM_BYTES,
  lerPlanilha,
  validarArquivoDePlanilha,
  type IdentificadorDePerguntasComIA,
  type PlanilhaLida,
} from "../../src/documentos/planilha.ts";
import { contem, lerCelula, lerIntervalos } from "../../src/documentos/validacoesDeLista.ts";

const NOMES: NomesDeCabecalho = {
  pergunta: ["Pergunta", "Questão", "Question"],
  resposta: ["Resposta", "Resposta do fornecedor", "Vendor response", "Response"],
  comentario: ["Comentários", "Observações", "Comments"],
};

type Valor = string | number | null;

interface DefinicaoDeAba {
  nome: string;
  linhas: Valor[][];
  oculta?: boolean;
  mesclagens?: string[];
  /** Validações em lista: célula ou intervalo e a fórmula da lista. */
  listas?: { celulas: string; formula: string }[];
}

/** Monta uma planilha em memória: cada aba é uma lista de linhas, a partir da linha 1. */
async function montarPlanilha(abas: DefinicaoDeAba[]): Promise<Uint8Array> {
  const pasta = new ExcelJS.Workbook();
  for (const definicao of abas) {
    const aba = pasta.addWorksheet(definicao.nome, { state: definicao.oculta ? "hidden" : "visible" });
    definicao.linhas.forEach((valores, indice) => {
      valores.forEach((valor, coluna) => {
        if (valor !== null) aba.getCell(indice + 1, coluna + 1).value = valor;
      });
    });
    for (const intervalo of definicao.mesclagens ?? []) aba.mergeCells(intervalo);
    for (const { celulas, formula } of definicao.listas ?? []) {
      for (const intervalo of lerIntervalos(celulas)) {
        for (let linha = intervalo.linhaInicial; linha <= intervalo.linhaFinal; linha++) {
          for (let coluna = intervalo.colunaInicial; coluna <= intervalo.colunaFinal; coluna++) {
            aba.getCell(linha, coluna).dataValidation = { type: "list", allowBlank: true, formulae: [formula] };
          }
        }
      }
    }
  }
  return new Uint8Array(await pasta.xlsx.writeBuffer());
}

function perguntasPorRegra(planilha: PlanilhaLida) {
  return identificarPerguntasPorRegra(planilha, NOMES.pergunta)?.perguntas ?? null;
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

    const resultado = await identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: semIA });

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
      expect(perguntasPorRegra(planilha)).toEqual([{ aba: "RFP", linha: 2, texto: "Pergunta de teste?" }]);
    },
  );

  it("procura o cabeçalho nas 20 primeiras linhas, e não além", async () => {
    const linhasAte20: Valor[][] = Array.from({ length: 19 }, () => [null]);
    linhasAte20.push(["Pergunta"], ["Dentro do limite?"]);
    const linhasAte21: Valor[][] = Array.from({ length: 20 }, () => [null]);
    linhasAte21.push(["Pergunta"], ["Fora do limite?"]);

    const dentro = await lerPlanilha(await montarPlanilha([{ nome: "A", linhas: linhasAte20 }]));
    const fora = await lerPlanilha(await montarPlanilha([{ nome: "A", linhas: linhasAte21 }]));

    expect(perguntasPorRegra(dentro)).toEqual([{ aba: "A", linha: 21, texto: "Dentro do limite?" }]);
    expect(perguntasPorRegra(fora)).toBeNull();
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
    expect(perguntasPorRegra(planilha)).toEqual([{ aba: "Primeira", linha: 2, texto: "Desta aba?" }]);
  });

  it("não confunde o cabeçalho com um texto que só contém o nome", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([{ nome: "A", linhas: [["Perguntas frequentes do questionário"], ["Texto?"]] }]),
    );
    expect(perguntasPorRegra(planilha)).toBeNull();
  });
});

describe("Cenário 1 · abas com cabeçalho e sem perguntas", () => {
  it("passa para a próxima aba quando a primeira tem o cabeçalho mas nenhuma pergunta", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        { nome: "Legenda", linhas: [["Question", "Significado"]] },
        { nome: "Real", linhas: [["Pergunta"], ["Pergunta real?"]] },
      ]),
    );

    expect(identificarPerguntasPorRegra(planilha, NOMES.pergunta)).toMatchObject({
      aba: "Real",
      linhaDoCabecalho: 1,
      perguntas: [{ aba: "Real", linha: 2, texto: "Pergunta real?" }],
    });
  });

  it("falha sem chamar a IA quando todas as abas com cabeçalho estão sem perguntas", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        { nome: "A", linhas: [["Pergunta"]] },
        { nome: "B", linhas: [["Question"]] },
      ]),
    );

    await expect(identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: semIA })).rejects.toMatchObject({
      motivo: "sem-perguntas",
    });
  });

  it("devolve null quando nenhuma aba tem o cabeçalho", async () => {
    const planilha = await lerPlanilha(await montarPlanilha([{ nome: "A", linhas: [["Item"], ["Texto?"]] }]));
    expect(identificarPerguntasPorRegra(planilha, NOMES.pergunta)).toBeNull();
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

    expect(perguntasPorRegra(planilha)).toEqual([
      { aba: "RFP", linha: 3, texto: "Possui ISO 27001?" },
      { aba: "RFP", linha: 7, texto: "Qual é o RPO?" },
    ]);
  });
});

describe("Cenário 2 · células mescladas na coluna de perguntas", () => {
  it("não duplica a pergunta mesclada na vertical", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        {
          nome: "RFP",
          linhas: [["Pergunta", "Resposta"], ["Pergunta longa em três linhas?", null], [null, null], [null, null], ["Outra?", null]],
          mesclagens: ["A2:A4"],
        },
      ]),
    );

    expect(perguntasPorRegra(planilha)).toEqual([
      { aba: "RFP", linha: 2, texto: "Pergunta longa em três linhas?" },
      { aba: "RFP", linha: 5, texto: "Outra?" },
    ]);
  });

  it("continua ignorando o título de seção mesclado na horizontal", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        {
          nome: "RFP",
          linhas: [["Pergunta", "Resposta", "Nota"], ["SEÇÃO 1", null, null], ["Possui ISO 27001?", null, null]],
          mesclagens: ["A2:C2"],
        },
      ]),
    );

    expect(perguntasPorRegra(planilha)).toEqual([{ aba: "RFP", linha: 3, texto: "Possui ISO 27001?" }]);
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

    const resultado = await identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: identificador });

    expect(identificador).toHaveBeenCalledTimes(1);
    expect(identificador.mock.calls[0]?.[0].abas.map((aba) => aba.nome)).toEqual(["Questionário"]);
    expect(resultado.origem).toBe("ia");
    expect(resultado.modelo).toBeNull();
    expect(resultado.perguntas).toEqual([
      { aba: "Questionário", linha: 2, texto: "Possui ISO 27001?" },
      { aba: "Questionário", linha: 3, texto: "Qual é o RPO?" },
    ]);
  });

  it("descarta tudo que a IA reescreveu", async () => {
    const planilha = await lerPlanilha(await conteudo());
    const perguntas = await identificarPerguntasComIA(planilha, async () => [
      { aba: "Questionário", linha: 2, texto: "possui iso 27001?" },
      { aba: "Questionário", linha: 3, texto: "Qual o RPO?" },
      { aba: "Questionário", linha: 3, texto: "Qual é o RPO? Detalhe." },
    ]);
    expect(perguntas).toEqual([]);
  });

  it("aceita o texto devolvido sem os espaços das pontas e guarda o texto exato da célula", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        { nome: "Q", linhas: [["Item", "Descrição"], ["1", "Descreva as mensagens.  "], ["2", "  Qual é o RPO?"]] },
      ]),
    );
    const perguntas = await identificarPerguntasComIA(planilha, async () => [
      { aba: "Q", linha: 2, texto: "Descreva as mensagens." },
      { aba: "Q", linha: 2, texto: "Descreva as mensagens.  " },
      { aba: "Q", linha: 3, texto: "Qual é o RPO?" },
    ]);
    expect(perguntas).toEqual([
      { aba: "Q", linha: 2, texto: "Descreva as mensagens.  " },
      { aba: "Q", linha: 3, texto: "  Qual é o RPO?" },
    ]);
  });

  it("aceita o texto devolvido com quebras de linha e espaços repetidos reduzidos a um espaço", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([{ nome: "Q", linhas: [["Item", "Descrição"], ["1", "Descreva o plano\nde continuidade   e o RTO."]] }]),
    );
    const perguntas = await identificarPerguntasComIA(planilha, async () => [
      { aba: "Q", linha: 2, texto: "Descreva o plano de continuidade e o RTO." },
    ]);
    expect(perguntas).toEqual([{ aba: "Q", linha: 2, texto: "Descreva o plano\nde continuidade   e o RTO." }]);
  });
});

describe("Cenário 5 · planilha sem perguntas", () => {
  it("falha com a mensagem do SPEC quando nem a regra nem a IA encontram perguntas", async () => {
    const planilha = await lerPlanilha(await montarPlanilha([{ nome: "A", linhas: [["Instruções gerais."]] }]));

    await expect(identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: async () => [] })).rejects.toThrow(
      "Nenhuma pergunta encontrada na planilha",
    );
  });

  it("falha sem chamar a IA quando há cabeçalho mas a coluna está vazia", async () => {
    const planilha = await lerPlanilha(await montarPlanilha([{ nome: "A", linhas: [["Pergunta"], [null]] }]));

    await expect(identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: semIA })).rejects.toMatchObject({
      motivo: "sem-perguntas",
    });
  });
});

describe("Cenário 51 · modelo de resposta da RFP", () => {
  it("reconhece as colunas de resposta e de comentário na linha do cabeçalho", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        {
          nome: "RFP",
          linhas: [
            ["Ref", "Pergunta", "Resposta do fornecedor", "Comentários (descreva)"],
            ["1", "Possui ISO 27001?", null, null],
          ],
        },
      ]),
    );

    const { modelo } = await identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: semIA });

    expect(modelo).toEqual({
      colunaDeResposta: 3,
      cabecalhoDaResposta: "Resposta do fornecedor",
      colunaDeComentario: 4,
      cabecalhoDoComentario: "Comentários (descreva)",
      valoresPermitidos: null,
    });
  });

  it("aceita modelo só com coluna de resposta", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([{ nome: "RFP", linhas: [["Question", "Response"], ["Do you have ISO 27001?", null]] }]),
    );

    const { modelo } = await identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: semIA });

    expect(modelo).toMatchObject({ colunaDeResposta: 2, colunaDeComentario: null });
  });

  it("segue sem modelo quando não há coluna de resposta reconhecida", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        { nome: "RFP", linhas: [["Pergunta", "Comentários", "Responsável"], ["Possui ISO 27001?", null, null]] },
      ]),
    );

    const { modelo } = await identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: semIA });

    expect(modelo).toBeNull();
  });

  it("não confunde a coluna de resposta com cabeçalhos que só começam com as mesmas letras", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([{ nome: "RFP", linhas: [["Pergunta", "Respostas anteriores"], ["Possui ISO 27001?", null]] }]),
    );

    const { modelo } = await identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: semIA });

    expect(modelo).toBeNull();
  });
});

describe("Cenário 52 · valores permitidos da resposta", () => {
  const linhas: Valor[][] = [
    ["Pergunta", "Resposta"],
    ["Possui ISO 27001?", null],
    ["Qual é o RPO?", null],
  ];

  it("lê a lista escrita na própria validação", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([{ nome: "RFP", linhas, listas: [{ celulas: "B2:B3", formula: '"Sim,Não,Parcial"' }] }]),
    );

    const { modelo } = await identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: semIA });

    expect(modelo?.valoresPermitidos).toEqual(["Sim", "Não", "Parcial"]);
  });

  it("lê a lista de células de outra aba, mesmo oculta, na ordem da lista", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([
        { nome: "RFP", linhas, listas: [{ celulas: "B2:B3", formula: "Escala!$A$1:$A$5" }] },
        { nome: "Escala", oculta: true, linhas: [[0], [1], [2], [3], [4]] },
      ]),
    );

    const { modelo } = await identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: semIA });

    expect(modelo?.valoresPermitidos).toEqual(["0", "1", "2", "3", "4"]);
  });

  it("considera texto livre quando a lista não cobre a coluna de resposta", async () => {
    const planilha = await lerPlanilha(
      await montarPlanilha([{ nome: "RFP", linhas, listas: [{ celulas: "C2:C3", formula: '"Sim,Não"' }] }]),
    );

    const { modelo } = await identificarPerguntas(planilha, { nomes: NOMES, identificadorComIA: semIA });

    expect(modelo).toMatchObject({ colunaDeResposta: 2, valoresPermitidos: null });
  });
});

describe("Cenário 52 · referências de células das listas", () => {
  it("converte referências de célula e de intervalo, com ou sem $", () => {
    expect(lerCelula("E6")).toEqual({ linha: 6, coluna: 5 });
    expect(lerCelula("AA10")).toEqual({ linha: 10, coluna: 27 });
    expect(lerCelula("6E")).toBeUndefined();
    expect(lerIntervalos("$E$6:$E$216 G2")).toEqual([
      { linhaInicial: 6, linhaFinal: 216, colunaInicial: 5, colunaFinal: 5 },
      { linhaInicial: 2, linhaFinal: 2, colunaInicial: 7, colunaFinal: 7 },
    ]);
  });

  it("confere se uma célula está dentro do intervalo", () => {
    const [intervalo] = lerIntervalos("E6:E216");
    expect(intervalo && contem(intervalo, 6, 5)).toBe(true);
    expect(intervalo && contem(intervalo, 217, 5)).toBe(false);
    expect(intervalo && contem(intervalo, 10, 6)).toBe(false);
  });
});

describe("Cenários 4 e 31 · validação do arquivo", () => {
  it.each(["rfp.csv", "rfp.docx", "rfp.pdf", "rfp.xls", "rfp"])("recusa %j com a mensagem de formato", (nome) => {
    expect(() => validarArquivoDePlanilha(nome, new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toThrow(
      "Envie a RFP em formato .xlsx",
    );
  });

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
