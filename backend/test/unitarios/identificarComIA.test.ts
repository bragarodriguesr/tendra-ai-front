import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { identificarPerguntas, lerPlanilha } from "../../src/documentos/planilha.ts";
import { criarIdentificadorComIA, planilhaComoTexto } from "../../src/geracao/identificarComIA.ts";
import { ClienteDaIa, ErroDaIa, type EntradaDoRegistro } from "../../src/ia/cliente.ts";
import { lerInstrucoes } from "../../src/ia/instrucoes.ts";
import { ApiSimulada, mensagem, texto } from "../apoio/apiSimulada.ts";

/** Cenário 3 com o identificador real e a API simulada: saída estruturada e conferência literal. */
const VARIANTE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica/rfps/variantes/RFP-sem-coluna-pergunta.xlsx");

describe("Cenário 3 · identificação de perguntas com IA", () => {
  it("usa o modelo pequeno com saída estruturada e mantém só os textos que estão na planilha", async () => {
    const planilha = await lerPlanilha(new Uint8Array(await readFile(VARIANTE)));
    const api = new ApiSimulada();
    api.respostas = [
      mensagem(
        [
          texto(
            JSON.stringify({
              perguntas: [
                { aba: "Questionário", linha: 5, texto: "Informe o RPO e o RTO do serviço." },
                { aba: "Questionário", linha: 4, texto: "Descreva como os dados dos beneficiários são protegidos em repouso e em trânsito." },
                { aba: "Questionário", linha: 9, texto: "Pergunta inventada que não está na planilha?" },
              ],
            }),
          ),
        ],
        { model: "claude-haiku-5-5" },
      ),
    ];
    const registro: EntradaDoRegistro[] = [];
    const identificador = criarIdentificadorComIA(new ClienteDaIa(api, (entrada) => registro.push(entrada)), "claude-haiku-5-5");

    const resultado = await identificarPerguntas(planilha, { nomes: await carregarCabecalhos(), identificadorComIA: identificador });

    expect(resultado.origem).toBe("ia");
    expect(resultado.perguntas.map((pergunta) => pergunta.linha)).toEqual([4, 5]);
    expect(api.geracoes[0]).toMatchObject({
      model: "claude-haiku-5-5",
      output_config: { effort: "low", format: { type: "json_schema" } },
      system: [{ type: "text", text: (await lerInstrucoes("identificacao")).texto }],
    });
    expect(registro).toEqual([expect.objectContaining({ etapa: "identificacao", modelo: "claude-haiku-5-5", documentos: [], resultado: "sucesso" })]);
  });

  it("resposta fora do formato vira erro legível", async () => {
    const api = new ApiSimulada();
    api.respostas = [mensagem([texto("não é JSON")])];
    const identificador = criarIdentificadorComIA(new ClienteDaIa(api, () => {}), "claude-haiku-5-5");
    await expect(identificador({ abas: [] })).rejects.toEqual(new ErroDaIa("resposta_invalida"));
  });

  it("envia cada linha com a aba e o número, para a posição poder ser conferida", () => {
    expect(
      planilhaComoTexto({
        abas: [{ nome: 'Aba "1"', listas: [], linhas: [{ numero: 7, celulas: [{ coluna: 1, texto: "1", mescladaEmVariasColunas: false }, { coluna: 2, texto: "Qual o SLA?", mescladaEmVariasColunas: false }] }] }],
      }),
    ).toBe("<planilha>\n<aba nome=\"Aba '1'\">\nLinha 7: 1 | Qual o SLA?\n</aba>\n</planilha>");
  });
});
