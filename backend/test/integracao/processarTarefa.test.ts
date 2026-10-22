import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import ExcelJS from "exceljs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { SEM_FONTE, TITULO_DA_FONTE, TITULO_DA_RESPOSTA } from "../../src/documentos/planilhaPreenchida.ts";
import { processarTarefa } from "../../src/fluxo/processarTarefa.ts";
import { ClienteDaIa, ErroDaIa, type MensagemDaIa, type ParametrosDaGeracao } from "../../src/ia/cliente.ts";
import { abrirBanco, type Banco } from "../../src/persistencia/banco.ts";
import { ApiSimulada, mensagem, texto } from "../apoio/apiSimulada.ts";

/** Processamento completo com a API simulada: da planilha aos itens e à planilha preenchida (A6). */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const RFP = path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };

let banco: Banco;
let api: ApiSimulada;

beforeAll(async () => {
  banco = await abrirBanco();
}, 60_000);

afterAll(async () => {
  await banco.close();
});

beforeEach(async () => {
  await banco.exec("TRUNCATE documentos RESTART IDENTITY CASCADE");
  api = new ApiSimulada();
});

/** Perguntas ímpares: resposta citando o 2º bloco do 1º documento. Pares: SEM_RESPOSTA. */
function respondeImparesCitando(parametros: ParametrosDaGeracao): MensagemDaIa {
  const conteudo = parametros.messages[0]?.content;
  if (!Array.isArray(conteudo)) throw new Error("conteúdo inesperado");
  const perguntas = conteudo.at(-1);
  const numeros = perguntas?.type === "text" ? [...perguntas.text.matchAll(/^\[P(\d+)\]/gm)].map((m) => Number(m[1])) : [];
  const documento = conteudo[0];
  const blocos = documento?.type === "document" && documento.source.type === "content" && Array.isArray(documento.source.content) ? documento.source.content : [];
  const segundo = blocos[1];
  const citado = segundo?.type === "text" ? segundo.text : "";
  return mensagem(
    numeros.flatMap((numero) =>
      numero % 2 === 0
        ? [texto(`[P${numero}]\nSEM_RESPOSTA\n\n`)]
        : [
            texto(`[P${numero}]\n`),
            texto(`Resposta ${numero}.`, [{ type: "content_block_location", cited_text: citado, document_index: 0, document_title: null, start_block_index: 1, end_block_index: 2, file_id: null }]),
            texto("\n\n"),
          ],
    ),
  );
}

async function processar() {
  return processarTarefa({
    banco,
    cliente: new ClienteDaIa(api, () => {}),
    ia: IA,
    nomesDeCabecalho: await carregarCabecalhos(),
    hoje: "2026-10-21",
    nomeDoArquivo: "RFP-01-Rede-Varejo-Alfa.xlsx",
    planilha: new Uint8Array(await readFile(RFP)),
  });
}

async function celulas(conteudo: Uint8Array): Promise<Map<string, string>> {
  const pasta = new ExcelJS.Workbook();
  await pasta.xlsx.load(Buffer.from(conteudo) as unknown as ExcelJS.Buffer);
  const valores = new Map<string, string>();
  pasta.eachSheet((aba) =>
    aba.eachRow((linha, numero) =>
      linha.eachCell((celula, coluna) => {
        valores.set(`${aba.name}!${numero}:${coluna}`, String(celula.text));
      }),
    ),
  );
  return valores;
}

describe("Processamento da RFP-01 com a base da Pulse", () => {
  it("gera os itens no formato de data.js e a planilha preenchida, sem alterar as células originais", async () => {
    await carregarBase({ pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
    api.respostas = [respondeImparesCitando];
    const progresso: number[] = [];

    const resultado = await processarTarefa({
      banco,
      cliente: new ClienteDaIa(api, () => {}),
      ia: IA,
      nomesDeCabecalho: await carregarCabecalhos(),
      hoje: "2026-10-21",
      nomeDoArquivo: "RFP-01-Rede-Varejo-Alfa.xlsx",
      planilha: new Uint8Array(await readFile(RFP)),
      aoProgredir: (processadas) => void progresso.push(processadas),
    });

    expect(resultado.perguntas).toHaveLength(46);
    expect(api.geracoes).toHaveLength(5);
    expect(progresso).toEqual([0, 10, 20, 30, 40, 46]);
    expect(resultado.comportamento).toEqual({ modelo: "claude-opus-5-5", versaoDasInstrucoes: "geracao-v1", tamanhoDoLote: 10 });
    expect(resultado.documentos).toHaveLength(16);

    const [primeiro, segundo] = resultado.itens;
    expect(primeiro).toMatchObject({ id: "r1", q: resultado.perguntas[0]?.texto, st: "sugerida", paras: [{ t: "Resposta 1.", s: [1] }], alerts: [] });
    expect(primeiro?.srcs[0]).toMatchObject({ doc: "arquitetura-sistemas-aplicacoes.md", type: "Documento" });
    expect(primeiro?.srcs[0]?.loc).toMatch(/ · linha \d+$/);
    expect(segundo).toMatchObject({ id: "r2", st: "sem-rascunho", paras: [], srcs: [], alerts: [{ t: "nocontext" }] });
    expect(resultado.itens.filter((item) => item.st === "sugerida")).toHaveLength(23);

    const original = await celulas(new Uint8Array(await readFile(RFP)));
    const preenchida = await celulas(resultado.planilhaPreenchida);
    for (const [endereco, valor] of original) expect(preenchida.get(endereco), endereco).toBe(valor);

    const aba = resultado.perguntas[0]?.aba ?? "";
    const linhaDaPrimeira = resultado.perguntas[0]?.linha ?? 0;
    const novas = [...preenchida.keys()].filter((endereco) => !original.has(endereco));
    const colunas = [...new Set(novas.map((endereco) => Number(endereco.split(":")[1])))].sort((a, b) => a - b);
    expect(colunas).toHaveLength(2);
    const [colunaDaResposta, colunaDaFonte] = colunas;
    expect(preenchida.get(`${aba}!${linhaDaPrimeira - 1}:${colunaDaResposta}`)).toBe(TITULO_DA_RESPOSTA);
    expect(preenchida.get(`${aba}!${linhaDaPrimeira - 1}:${colunaDaFonte}`)).toBe(TITULO_DA_FONTE);
    expect(preenchida.get(`${aba}!${linhaDaPrimeira}:${colunaDaResposta}`)).toBe("Resposta 1.");
    expect(preenchida.get(`${aba}!${linhaDaPrimeira}:${colunaDaFonte}`)).toBe(`${primeiro?.srcs[0]?.doc} · ${primeiro?.srcs[0]?.loc}`);
    const linhaDaSegunda = resultado.perguntas[1]?.linha ?? 0;
    expect(preenchida.get(`${aba}!${linhaDaSegunda}:${colunaDaFonte}`)).toBe(SEM_FONTE);
  });

  it("Cenário 10 · base vazia: todos sem rascunho e nenhuma chamada à IA", async () => {
    const resultado = await processar();
    expect(resultado.itens.every((item) => item.st === "sem-rascunho" && item.alerts[0]?.t === "nocontext")).toBe(true);
    expect(api.geracoes).toHaveLength(0);
    expect(api.contagens).toHaveLength(0);
    expect(resultado.documentos).toEqual([]);
  });

  it("Cenário 17 · falha da IA no meio interrompe a tarefa sem resultado", async () => {
    await carregarBase({ pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
    api.respostas = [respondeImparesCitando, new Anthropic.AuthenticationError(401, undefined, "invalid", new Headers())];
    await expect(processar()).rejects.toEqual(new ErroDaIa("chave_recusada"));
  });
});
