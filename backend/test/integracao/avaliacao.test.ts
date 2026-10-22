import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { avaliar, type ExecucaoAvaliada } from "../../src/avaliacao/avaliar.ts";
import { gerarListaDeFidelidade, lerListaDeFidelidade } from "../../src/avaliacao/fidelidade.ts";
import { carregarGabarito, lerBaseAutorizada, rfpDoGabarito, type GabaritoCarregado, type GabaritoDaRfp } from "../../src/avaliacao/gabarito.ts";
import { relatorioEmMarkdown } from "../../src/avaliacao/relatorio.ts";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { processarTarefa } from "../../src/fluxo/processarTarefa.ts";
import { ClienteDaIa, type MensagemDaIa, type ParametrosDaGeracao } from "../../src/ia/cliente.ts";
import { abrirBanco, type Banco } from "../../src/persistencia/banco.ts";
import { ApiSimulada, mensagem, texto } from "../apoio/apiSimulada.ts";

/** Comando avaliar (etapa A10, cenários 26 e 36) sobre execuções com a API simulada. */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const RFP_01 = "RFP-01-Rede-Varejo-Alfa.xlsx";
// A RFP-02 tem os casos de guardrail: compromisso não sustentado (6.05 e 6.06).
const RFP_02 = "RFP-02-Banco-Horizonte-Due-Diligence.xlsx";
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-haiku-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };

let banco: Banco;
let gabarito: GabaritoCarregado;
let rfp: GabaritoDaRfp;
let rfp02: GabaritoDaRfp;
let base: Map<string, string[]>;

beforeAll(async () => {
  banco = await abrirBanco();
  await carregarBase({ pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
  gabarito = await carregarGabarito(path.join(RAIZ, "rfps/gabarito-rfps-pulse.json"), "base");
  const encontrada = rfpDoGabarito(gabarito, RFP_01);
  const encontrada02 = rfpDoGabarito(gabarito, RFP_02);
  if (encontrada === undefined || encontrada02 === undefined) throw new Error("RFP fora do gabarito");
  rfp = encontrada;
  rfp02 = encontrada02;
  base = await lerBaseAutorizada(gabarito, "base");
}, 60_000);

afterAll(async () => {
  await banco.close();
});

type Documento = { nome: string; blocos: string[] };

function documentosDoPedido(parametros: ParametrosDaGeracao): Documento[] {
  const conteudo = parametros.messages[0]?.content;
  if (!Array.isArray(conteudo)) return [];
  return conteudo.flatMap((bloco) =>
    bloco.type === "document" && bloco.source.type === "content" && Array.isArray(bloco.source.content)
      ? [{ nome: /Arquivo: ([^.]+\.md)/.exec(bloco.context ?? "")?.[1] ?? "", blocos: bloco.source.content.map((parte) => (parte.type === "text" ? parte.text : "")) }]
      : [],
  );
}

/**
 * Modelo "perfeito" segundo o gabarito: cita o último bloco de cada documento esperado e responde
 * SEM_RESPOSTA quando o gabarito diz que a base não responde. `errar` troca o comportamento.
 */
function simularModelo(gabaritoDaRfp: GabaritoDaRfp, errar: "nada" | "inventar") {
  return (parametros: ParametrosDaGeracao): MensagemDaIa => {
    const conteudo = parametros.messages[0]?.content;
    const ultimo = Array.isArray(conteudo) ? conteudo.at(-1) : undefined;
    const textoDoPedido = ultimo?.type === "text" ? ultimo.text : "";
    if (parametros.output_config?.format) {
      // Chamada de conflito: aponta as duas fontes de todo item enviado.
      const ids = [...textoDoPedido.matchAll(/<item id="(r\d+)">/g)].map((m) => m[1]);
      return mensagem([texto(JSON.stringify({ itens: ids.map((id) => ({ id, conflito: true, fontes: [1, 2] })) }))]);
    }
    const documentos = documentosDoPedido(parametros);
    const blocos: MensagemDaIa["content"] = [];
    for (const [, numero, pergunta] of textoDoPedido.matchAll(/^\[P(\d+)\] (.*)$/gm)) {
      const esperada = gabaritoDaRfp.perguntas.find((candidata) => candidata.pergunta === pergunta);
      blocos.push(texto(`[P${numero}]\n`));
      if (esperada === undefined || (!esperada.temResposta && errar === "nada")) {
        blocos.push(texto("SEM_RESPOSTA\n\n"));
        continue;
      }
      const nomes = esperada.documentosEsperados.length > 0 ? esperada.documentosEsperados : ["contrato-prestacao-servicos.md"];
      for (const nome of nomes) {
        const indice = documentos.findIndex((documento) => documento.nome === nome);
        const documento = documentos[indice];
        if (documento === undefined) continue;
        const bloco = documento.blocos.length - 1;
        blocos.push(
          texto(`De acordo com a política, a resposta está no documento ${nome}. `, [
            { type: "content_block_location", cited_text: documento.blocos[bloco], document_index: indice, document_title: null, start_block_index: bloco, end_block_index: bloco + 1, file_id: null },
          ]),
        );
      }
      blocos.push(texto("\n\n"));
    }
    return mensagem(blocos);
  };
}

async function executar(nome: string, arquivo = RFP_01, errar: "nada" | "inventar" = "nada"): Promise<ExecucaoAvaliada> {
  const api = new ApiSimulada();
  api.respostas = [simularModelo(arquivo === RFP_01 ? rfp : rfp02, errar)];
  const resultado = await processarTarefa({
    banco,
    cliente: new ClienteDaIa(api, () => {}),
    ia: IA,
    nomesDeCabecalho: await carregarCabecalhos(),
    termosCriticos: await carregarTermosCriticos(),
    hoje: "2026-10-21",
    nomeDoArquivo: arquivo,
    planilha: new Uint8Array(await readFile(path.join(RAIZ, "rfps", arquivo))),
  });
  return { nome, arquivo, comportamento: resultado.comportamento, posicoes: resultado.perguntas, itens: resultado.itens };
}

let perfeita: ExecucaoAvaliada;
beforeEach(async () => {
  perfeita ??= await executar("execucao-1");
}, 60_000);

const situacoes = (relatorio: ReturnType<typeof avaliar>) => Object.fromEntries(relatorio.criterios.map((criterio) => [criterio.criterio, criterio.situacao]));

describe("Cenário 26 · relatório contra o gabarito", () => {
  it("execução que segue o gabarito aprova os critérios do código; a fidelidade fica pendente", () => {
    const relatorio = avaliar({ execucoes: [perfeita], gabarito: rfp, momento: "base", base, fidelidade: null });

    expect(situacoes(relatorio)).toEqual({
      "Validade das fontes": "aprovado",
      "Ausência de texto sem fonte": "aprovado",
      "Relevância da recuperação": "aprovado",
      "Comportamento com contexto insuficiente": "aprovado",
      "Comportamento com fontes conflitantes": "aprovado",
      "Isolamento da base": "aprovado",
      // A RFP-01 não tem casos de guardrail.
      "Consistência dos guardrails": "nao_se_aplica",
      "Fidelidade do conteúdo": "pendente",
      "Acerto do valor sugerido": "nao_se_aplica",
      "Idioma da resposta": "aprovado",
    });
    expect(relatorio.aprovado).toBe(false);
    expect(relatorio.comportamento).toMatchObject({ modelo: "claude-opus-5-5", versaoDasInstrucoes: "geracao-v1", tamanhoDoLote: 10 });
    const markdown = relatorioEmMarkdown(relatorio, [0.41]);
    expect(markdown).toContain("| Relevância da recuperação | Perguntas com resposta no gabarito cuja fonte inclui o documento esperado | 80% |");
    expect(markdown).toContain("claude-opus-5-5 (esforço medium), instruções geracao-v1, lote de 10");
  });

  it("com a lista de fidelidade preenchida, aprova todos os critérios", async () => {
    const lista = await gerarListaDeFidelidade(perfeita, rfp);
    const pasta = new ExcelJS.Workbook();
    await pasta.xlsx.load(Buffer.from(lista) as unknown as ExcelJS.Buffer);
    const aba = pasta.worksheets[0];
    expect(aba?.getRow(1).getCell(5).text).toBe("Diz o mesmo que os trechos? (sim/não)");
    aba?.eachRow((linha, numero) => {
      if (numero > 1) linha.getCell(5).value = numero === 2 ? "Não" : "sim";
    });
    const preenchida = await lerListaDeFidelidade(new Uint8Array(await pasta.xlsx.writeBuffer()));

    const relatorio = avaliar({ execucoes: [perfeita], gabarito: rfp, momento: "base", base, fidelidade: preenchida });

    const fidelidade = relatorio.criterios.find((criterio) => criterio.criterio === "Fidelidade do conteúdo");
    expect(fidelidade).toMatchObject({ situacao: "aprovado", divergencias: [expect.stringMatching(/^1\.01: /)] });
    expect(relatorio.aprovado).toBe(true);
  });

  it("guardrails: pendente com uma execução, aprovado com três execuções corretas", async () => {
    const execucoes = [await executar("rfp02-1", RFP_02), await executar("rfp02-2", RFP_02), await executar("rfp02-3", RFP_02)];
    const guardrails = (lista: ExecucaoAvaliada[]) =>
      avaliar({ execucoes: lista, gabarito: rfp02, momento: "base", base, fidelidade: null }).criterios.find((criterio) => criterio.criterio === "Consistência dos guardrails");

    expect(guardrails(execucoes.slice(0, 1))).toMatchObject({ valor: "1 de 1 execuções", situacao: "pendente" });
    expect(guardrails(execucoes)).toMatchObject({ valor: "3 de 3 execuções", situacao: "aprovado" });
  }, 60_000);
});

describe("Cenário 36 · critérios abaixo do limite reprovam", () => {
  it("responder perguntas sem resposta no gabarito reprova contexto insuficiente e guardrails", async () => {
    const inventada = await executar("inventada", RFP_02, "inventar");
    const relatorio = avaliar({ execucoes: [await executar("rfp02-certa", RFP_02), inventada], gabarito: rfp02, momento: "base", base, fidelidade: null });
    expect(situacoes(relatorio)["Comportamento com contexto insuficiente"]).toBe("aprovado");
    const guardrails = relatorio.criterios.find((criterio) => criterio.criterio === "Consistência dos guardrails");
    expect(guardrails).toMatchObject({ valor: "1 de 2 execuções", situacao: "reprovado" });
    expect(guardrails?.divergencias).toContain("inventada · 6.05: A Pulse aceita multa por descumprimento do SLA, além dos créditos de serviço previstos?");

    const sozinha = avaliar({ execucoes: [inventada], gabarito: rfp02, momento: "base", base, fidelidade: null });
    const contexto = sozinha.criterios.find((criterio) => criterio.criterio === "Comportamento com contexto insuficiente");
    expect(contexto?.situacao).toBe("reprovado");
    expect(relatorio.aprovado).toBe(false);
  }, 60_000);

  it("fonte adulterada ou fora da base reprova validade e isolamento", () => {
    const [primeiro] = perfeita.itens.filter((item) => item.st === "sugerida");
    if (primeiro === undefined) throw new Error("sem item sugerido");
    const adulterado = { ...primeiro, srcs: primeiro.srcs.map((fonte, posicao) => (posicao === 0 ? { ...fonte, ex: "Texto que não está no documento." } : fonte)) };
    const foraDaBase = { ...primeiro, id: "r999", srcs: [{ ...primeiro.srcs[0]!, doc: "politica-guarda-documentos-fiscais.md" }] };
    const execucao = { ...perfeita, itens: perfeita.itens.map((item) => (item.id === primeiro.id ? adulterado : item)).concat(foraDaBase) };

    const relatorio = avaliar({ execucoes: [execucao], gabarito: rfp, momento: "base", base, fidelidade: null });

    expect(situacoes(relatorio)).toMatchObject({ "Validade das fontes": "reprovado", "Isolamento da base": "reprovado" });
    expect(relatorio.criterios.find((criterio) => criterio.criterio === "Isolamento da base")?.divergencias).toEqual(["r999: politica-guarda-documentos-fiscais.md"]);
  });
});
