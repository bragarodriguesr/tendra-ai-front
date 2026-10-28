import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { carregarBase } from "../../src/base/carga.ts";
import { gerarRespostas, type PerguntaParaGerar } from "../../src/geracao/gerarRespostas.ts";
import { ClienteDaIa, ErroDaIa, type EntradaDoRegistro, type MensagemDaIa, type ParametrosDaGeracao } from "../../src/ia/cliente.ts";
import { lerInstrucoes } from "../../src/ia/instrucoes.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { definirAtivo, listarDocumentos } from "../../src/persistencia/documentos.ts";
import { ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { buscarFontes, ErroDeTeto, type ContextoDaBase } from "../../src/recuperacao/buscarFontes.ts";
import Anthropic from "@anthropic-ai/sdk";
import { ApiSimulada, mensagem, texto } from "../apoio/apiSimulada.ts";

/** Contexto da base e geração em lotes com a API simulada (etapa A5). */
const PULSE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica/pulse-beneficios");
const IA = { modelo: "claude-opus-5-5", esforco: "medium" as const, tamanhoDoLote: 5 };

let banco: Banco;
let api: ApiSimulada;
let registro: EntradaDoRegistro[];
let cliente: ClienteDaIa;

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
}, 60_000);

afterAll(async () => {
  await banco.close();
});

beforeEach(async () => {
  await banco.exec("TRUNCATE documentos RESTART IDENTITY CASCADE");
  api = new ApiSimulada();
  registro = [];
  cliente = new ClienteDaIa(api, (entrada) => registro.push(entrada));
});

const carregar = () => carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta: path.join(PULSE, "base"), banco, hoje: "2026-10-21", enviadoPor: null });

async function contexto(): Promise<ContextoDaBase> {
  const fontes = await buscarFontes({ organizacaoId: ORGANIZACAO_INICIAL, banco, cliente, modelo: IA.modelo });
  if (fontes.tipo !== "base") throw new Error("esperava base com documentos");
  return fontes.contexto;
}

describe("Cenário 10 · base vazia", () => {
  it("devolve base vazia sem nenhuma chamada à IA", async () => {
    expect(await buscarFontes({ organizacaoId: ORGANIZACAO_INICIAL, banco, cliente, modelo: IA.modelo })).toEqual({ tipo: "vazia" });
    await carregar();
    for (const documento of await listarDocumentos(banco, ORGANIZACAO_INICIAL)) await definirAtivo(banco, ORGANIZACAO_INICIAL, documento.id, false);

    expect(await buscarFontes({ organizacaoId: ORGANIZACAO_INICIAL, banco, cliente, modelo: IA.modelo })).toEqual({ tipo: "vazia" });
    expect(api.contagens).toHaveLength(0);
    expect(registro).toHaveLength(0);
  });
});

describe("Cenários 35 e 40 · só a base ativa e carregada vai à IA", () => {
  it("monta o contexto só com os documentos ativos, inteiros e nos blocos da carga", async () => {
    await carregar();
    const desativado = (await listarDocumentos(banco, ORGANIZACAO_INICIAL)).find((documento) => documento.nome === "certificado-iso27001-ciclo-anterior.md");
    await definirAtivo(banco, ORGANIZACAO_INICIAL, desativado?.id ?? 0, false);

    const { documentos, tokens } = await contexto();

    const nomes = documentos.map((documento) => documento.nome);
    expect(nomes).toHaveLength(15);
    expect(nomes).not.toContain("certificado-iso27001-ciclo-anterior.md");
    expect(nomes).not.toContain("politica-guarda-documentos-fiscais.md");
    expect(tokens).toBe(50_000);
    const enviado = JSON.stringify(api.contagens[0]);
    expect(enviado).not.toContain("Registro mantido apenas para histórico");
    expect(enviado).not.toContain("fica fora da pasta da base de propósito");
    expect(registro).toEqual([expect.objectContaining({ etapa: "contagem", documentos: nomes, perguntas: [], resultado: "sucesso" })]);
  });
});

describe("Cenário 11 · base acima do teto", () => {
  it("falha acima de 25 MB sem chamar a IA, informando o tamanho", async () => {
    await carregar();
    await banco.exec("UPDATE documentos SET tamanho_bytes = 2 * 1024 * 1024");

    await expect(buscarFontes({ organizacaoId: ORGANIZACAO_INICIAL, banco, cliente, modelo: IA.modelo })).rejects.toThrow(
      new ErroDeTeto("A base ativa tem 32 MB, acima do teto de 25 MB e 400 mil tokens. Desative documentos na tela da Base para continuar."),
    );
    expect(api.contagens).toHaveLength(0);
  });

  it("falha acima de 400 mil tokens, contados pela API", async () => {
    await carregar();
    api.tokensContados = 400_001;
    await expect(buscarFontes({ organizacaoId: ORGANIZACAO_INICIAL, banco, cliente, modelo: IA.modelo })).rejects.toThrow(/400\.001 tokens, acima do teto de 25 MB e 400 mil tokens/);
  });
});

/** Responde cada pergunta do lote citando o primeiro bloco do primeiro documento do pedido. */
function respondeCitando(parametros: ParametrosDaGeracao): MensagemDaIa {
  const conteudo = parametros.messages[0]?.content;
  if (!Array.isArray(conteudo)) throw new Error("conteúdo inesperado");
  const perguntas = conteudo.at(-1);
  const numeros = perguntas?.type === "text" ? [...perguntas.text.matchAll(/^\[P(\d+)\]/gm)].map((m) => Number(m[1])) : [];
  const documento = conteudo[0];
  const primeiroBloco = documento?.type === "document" && documento.source.type === "content" && Array.isArray(documento.source.content) ? documento.source.content[0] : undefined;
  const citado = primeiroBloco?.type === "text" ? primeiroBloco.text : "";
  return mensagem(
    numeros.flatMap((numero) => [
      texto(`[P${numero}]\n`),
      texto(`Resposta da pergunta ${numero}.`, [
        { type: "content_block_location", cited_text: citado, document_index: 0, document_title: null, start_block_index: 0, end_block_index: 1, file_id: null },
      ]),
      texto("\n\n"),
    ]),
  );
}

const perguntas = (total: number): PerguntaParaGerar[] =>
  Array.from({ length: total }, (_, posicao) => ({ numero: posicao + 1, texto: `Pergunta ${posicao + 1}?` }));

describe("Geração em lotes com citações e cache", () => {
  it("envia as perguntas em lotes, com as instruções versionadas e a base como documentos citáveis", async () => {
    await carregar();
    const base = await contexto();
    api.respostas = [respondeCitando];
    const progresso: [number, number][] = [];

    const resultado = await gerarRespostas({
      cliente,
      contexto: base,
      perguntas: perguntas(12),
      ia: IA,
      aoConcluirLote: (processadas, total) => {
        progresso.push([processadas, total]);
      },
    });

    expect(api.geracoes).toHaveLength(3);
    expect(progresso).toEqual([
      [5, 12],
      [10, 12],
      [12, 12],
    ]);
    expect(resultado).toMatchObject({ versaoDasInstrucoes: "geracao-v3", modelo: "claude-opus-5-5", tamanhoDoLote: 5 });
    expect(resultado.respostas.map((resposta) => [resposta.numero, resposta.situacao])).toEqual(
      Array.from({ length: 12 }, (_, posicao) => [posicao + 1, "respondida"]),
    );
    expect(resultado.respostas[0]?.trechos[0]?.citacoes[0]).toMatchObject({ documento: base.documentos[0]?.nome, blocoInicial: 0, blocoFinal: 1 });

    const [primeiro] = api.geracoes;
    expect(primeiro).toMatchObject({
      model: "claude-opus-5-5",
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: (await lerInstrucoes("geracao")).texto }],
    });
    expect(primeiro).not.toHaveProperty("temperature");
    const conteudo = primeiro?.messages[0]?.content;
    if (!Array.isArray(conteudo)) throw new Error("conteúdo inesperado");
    const documentos = conteudo.filter((bloco) => bloco.type === "document");
    expect(documentos).toHaveLength(16);
    expect(documentos.every((bloco) => bloco.type === "document" && bloco.citations?.enabled === true)).toBe(true);
    expect(documentos.map((bloco) => (bloco.type === "document" ? Boolean(bloco.cache_control) : false))).toEqual([...Array(15).fill(false), true]);
    expect(conteudo.at(-1)).toEqual({ type: "text", text: "<perguntas>\n[P1] Pergunta 1?\n[P2] Pergunta 2?\n[P3] Pergunta 3?\n[P4] Pergunta 4?\n[P5] Pergunta 5?\n</perguntas>" });

    const geracoes = registro.filter((entrada) => entrada.etapa === "geracao");
    expect(geracoes.map((entrada) => entrada.perguntas)).toEqual([[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12]]);
    expect(geracoes[0]?.documentos).toHaveLength(16);
    const serializado = JSON.stringify(registro);
    expect(serializado).not.toContain("Pergunta 1?");
    expect(serializado).not.toContain(base.documentos[0]?.blocos[0]?.texto.slice(0, 40));
  });

  it("modelo sem fallback no servidor não recebe o parâmetro", async () => {
    await carregar();
    api.respostas = [respondeCitando];
    await gerarRespostas({ cliente, contexto: await contexto(), perguntas: perguntas(1), ia: { ...IA, modelo: "claude-haiku-5-5" } });
    expect(api.geracoes[0]).not.toHaveProperty("fallbacks");
    expect(api.geracoes[0]).not.toHaveProperty("betas");
  });

  it("Cenário 17 · falha no segundo lote interrompe a geração sem devolver resultado parcial", async () => {
    await carregar();
    const base = await contexto();
    api.respostas = [respondeCitando, new Anthropic.APIConnectionError({ message: "fetch failed" })];
    const progresso: number[] = [];

    const falha = gerarRespostas({ cliente, contexto: base, perguntas: perguntas(8), ia: IA, aoConcluirLote: (processadas) => void progresso.push(processadas) });

    await expect(falha).rejects.toEqual(new ErroDaIa("falha_de_comunicacao"));
    expect(progresso).toEqual([5]);
    expect(registro.filter((entrada) => entrada.etapa === "geracao").map((entrada) => entrada.resultado)).toEqual(["sucesso", "erro"]);
  });
});
