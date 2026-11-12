import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { processarTarefa } from "../../src/fluxo/processarTarefa.ts";
import { ClienteDaIa, type EntradaDoRegistro, type MensagemDaIa, type ParametrosDaGeracao } from "../../src/ia/cliente.ts";
import { calcularMetricasDaSelecao, carregarPrecos, type MetricasDaTarefa } from "../../src/observabilidade/metricas.ts";
import { criarArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { criarTarefaComPlanilha, executarTarefa } from "../../src/fluxo/executarTarefa.ts";
import { obterTarefa } from "../../src/persistencia/tarefas.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { criarOrganizacao, ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import type { RespostaGravada } from "../../src/persistencia/tarefas.ts";
import { ApiSimulada, mensagem, texto } from "../apoio/apiSimulada.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import { numerosDoPedido } from "../apoio/respostasSimuladas.ts";

/**
 * Fase U, etapa U-b (SPEC_FASE_U.md, cenários U8 a U15): seleção do contexto por área no
 * processamento, com a base da Pulse marcada com áreas e a contagem de tokens acima do limiar.
 */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const RFP = path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-haiku-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };
const AREA_DA_PERGUNTA = ["Tecnologia", "Jurídico", "Produto", "Geral"] as const;
/** Área de cada pergunta pelo número: 1 Jurídico, 2 Produto, 3 Geral, 4 Tecnologia, 5 Jurídico... */
const areaDe = (numero: number) => AREA_DA_PERGUNTA[numero % 4] ?? "Geral";

let banco: Banco;
let api: ApiSimulada;
let registro: EntradaDoRegistro[];

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
}, 60_000);

afterAll(async () => {
  await banco.close();
});

beforeEach(async () => {
  await banco.exec("TRUNCATE documentos RESTART IDENTITY CASCADE");
  await carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
  await banco.exec(`
    UPDATE documentos SET areas = '{Tecnologia}', areas_classificadas_em = now() WHERE nome IN ('arquitetura-sistemas-aplicacoes.md', 'plano-continuidade-negocios.md');
    UPDATE documentos SET areas = '{Jurídico,Comercial}', areas_classificadas_em = now() WHERE nome IN ('contrato-prestacao-servicos.md', 'termo-responsabilidade-administrador.md');
    UPDATE documentos SET areas = '{Comercial}', areas_classificadas_em = now() WHERE nome = 'anexo-sla-slo-rto.md';
    UPDATE documentos SET areas = '{Segurança e privacidade}', areas_classificadas_em = now() WHERE nome LIKE 'norma-%' OR nome LIKE 'politica-%';
    UPDATE documentos SET areas = '{Geral}', areas_classificadas_em = now() WHERE nome = 'portal-empresa-rh-funcionalidades.md';
  `);
  api = new ApiSimulada();
  api.tokensContados = 60_000;
  api.classificacao = (parametros) => mensagem([texto(JSON.stringify({ itens: numerosDoPedido(parametros).map((numero) => ({ numero, area: areaDe(numero) })) }))], { model: parametros.model });
  registro = [];
});

/** Nomes dos arquivos enviados num pedido de geração, lidos do contexto de cada documento. */
function documentosDoPedido(parametros: ParametrosDaGeracao): string[] {
  const conteudo = parametros.messages[0]?.content;
  return Array.isArray(conteudo) ? conteudo.flatMap((bloco) => (bloco.type === "document" && typeof bloco.context === "string" ? [/^Arquivo: ([^.]+\.md)/.exec(bloco.context)?.[1] ?? ""] : [])) : [];
}

/** Responde citando o 1º bloco do documento `nome` quando ele está no contexto; sem ele, SEM_RESPOSTA. */
function citaSeTiver(nome: string) {
  return (parametros: ParametrosDaGeracao): MensagemDaIa => {
    const conteudo = parametros.messages[0]?.content;
    if (!Array.isArray(conteudo)) throw new Error("conteúdo inesperado");
    const indice = documentosDoPedido(parametros).indexOf(nome);
    const documento = conteudo[indice];
    const blocos = documento?.type === "document" && documento.source.type === "content" && Array.isArray(documento.source.content) ? documento.source.content : [];
    const primeiro = blocos[0];
    const citado = primeiro?.type === "text" ? primeiro.text : "";
    return mensagem(
      numerosDoPedido(parametros).flatMap((numero) =>
        indice < 0
          ? [texto(`[P${numero}]\nSEM_RESPOSTA\n\n`)]
          : [
              texto(`[P${numero}]\n`),
              texto(`Resposta ${numero}.`, [{ type: "content_block_location", cited_text: citado, document_index: indice, document_title: null, start_block_index: 0, end_block_index: 1, file_id: null }]),
              texto("\n\n"),
            ],
      ),
    );
  };
}

async function processar(extra: { ia?: object; respostasGravadas?: RespostaGravada[]; organizacaoId?: string } = {}) {
  return processarTarefa({
    banco,
    organizacaoId: extra.organizacaoId ?? ORGANIZACAO_INICIAL,
    cliente: new ClienteDaIa(api, (entrada) => registro.push(entrada)),
    ia: { ...IA, ...extra.ia },
    nomesDeCabecalho: await carregarCabecalhos(),
    termosCriticos: await carregarTermosCriticos(),
    hoje: "2026-10-21",
    nomeDoArquivo: "RFP-01-Rede-Varejo-Alfa.xlsx",
    planilha: new Uint8Array(await readFile(RFP)),
    ...(extra.respostasGravadas === undefined ? {} : { respostasGravadas: extra.respostasGravadas }),
  });
}

const GERAIS = ["portal-empresa-rh-funcionalidades.md"];
/** Documentos sem área marcada no teste: pendentes, contam como "Geral". */
const PENDENTES = [
  "app-mobile-funcionalidades.md",
  "auditoria-aderencia-lgpd-2025.md",
  "auditoria-aderencia-lgpd-2026.md",
  "certificado-iso27001-ciclo-anterior.md",
  "certificado-iso27001.md",
  "procedimento-recuperacao-desastres.md",
  "relatorio-auditoria-manutencao-iso27001.md",
];

describe("Cenários U8, U9, U10 e U12 · seleção ligada, base acima do limiar", () => {
  it("classifica antes de gerar, gera por grupo de área com o contexto do grupo e mantém a ordem da planilha", async () => {
    api.respostas = [citaSeTiver("portal-empresa-rh-funcionalidades.md")];
    const resultado = await processar();

    // U8: a classificação termina antes de qualquer geração, e a etapa "selecao" é medida.
    const ordem = registro.map((entrada) => entrada.etapa);
    expect(ordem.indexOf("classificacao")).toBeLessThan(ordem.indexOf("geracao"));
    expect(resultado.etapas.map((etapa) => etapa.etapa)).toContain("selecao");

    // U9 e U12: um grupo por área, na ordem da lista; Geral e Produto (sem documento da área) na base inteira.
    expect(resultado.selecao?.motivo).toBe("ligada");
    expect(resultado.selecao?.grupos.map((grupo) => [grupo.area, grupo.perguntas])).toEqual([
      ["Tecnologia", 11],
      ["Jurídico", 12],
      [null, 23],
    ]);
    const pedidos = api.geracoes.map((parametros) => ({ numeros: numerosDoPedido(parametros), documentos: documentosDoPedido(parametros) }));
    const tecnologia = pedidos.filter((pedido) => pedido.numeros.every((numero) => areaDe(numero) === "Tecnologia"));
    expect(tecnologia[0]?.documentos.sort()).toEqual(["arquitetura-sistemas-aplicacoes.md", "plano-continuidade-negocios.md", ...GERAIS, ...PENDENTES].sort());
    const juridico = pedidos.filter((pedido) => pedido.numeros.every((numero) => areaDe(numero) === "Jurídico"));
    expect(juridico[0]?.documentos.sort()).toEqual(["contrato-prestacao-servicos.md", "termo-responsabilidade-administrador.md", ...GERAIS, ...PENDENTES].sort());
    // U10: perguntas "Geral" e de Produto (nenhum documento de Produto) recebem a base inteira.
    const naBase = pedidos.filter((pedido) => pedido.numeros.some((numero) => areaDe(numero) === "Geral"));
    expect(naBase.every((pedido) => pedido.documentos.length === 16)).toBe(true);
    expect(naBase.flatMap((pedido) => pedido.numeros).every((numero) => ["Geral", "Produto"].includes(areaDe(numero)))).toBe(true);

    // U12: itens e áreas na ordem original, e o contexto de cada item (PU10).
    expect(resultado.itens.map((item) => item.id)).toEqual(resultado.perguntas.map((_, posicao) => `r${posicao + 1}`));
    expect(resultado.contextos).toEqual(resultado.perguntas.map((_, posicao) => (["Tecnologia", "Jurídico"].includes(areaDe(posicao + 1)) ? "area" : "base")));
    expect(resultado.itens.every((item) => item.st === "sugerida")).toBe(true);

    const metricas = calcularMetricasDaSelecao({ registro, selecao: resultado.selecao!, contextos: resultado.contextos, documentosDaBase: resultado.documentos.length });
    expect(metricas.perguntasPorContexto).toEqual({ area: 23, base: 23 });
    expect(metricas.tokensDeEntradaDaGeracao.area).toBeGreaterThan(0);
    expect(metricas.tokensDeEntradaDaGeracao.base).toBeGreaterThan(0);
  });
});

describe("Cenário U11 · segunda tentativa com a base inteira", () => {
  it("pergunta da área sem fonte válida volta com a base inteira; achando, fica sugerida", async () => {
    // A resposta das perguntas de Tecnologia está só no anexo de SLA, classificado como Comercial.
    api.respostas = [citaSeTiver("anexo-sla-slo-rto.md")];
    const resultado = await processar();
    const segunda = api.geracoes.at(-1);
    expect(documentosDoPedido(segunda!)).toHaveLength(16);
    const tecnologia = resultado.perguntas.map((_, posicao) => posicao + 1).filter((numero) => ["Tecnologia", "Jurídico"].includes(areaDe(numero)));
    expect(numerosDoPedido(segunda!).every((numero) => tecnologia.includes(numero))).toBe(true);
    for (const numero of tecnologia) {
      expect(resultado.contextos[numero - 1]).toBe("base_segunda_tentativa");
      expect(resultado.itens[numero - 1]?.st).toBe("sugerida");
    }
  });

  it("sem resposta nem na base inteira, fica 'Sem rascunho', como hoje", async () => {
    api.respostas = [citaSeTiver("nao-existe.md")];
    const resultado = await processar();
    const daArea = resultado.perguntas.map((_, posicao) => posicao + 1).filter((numero) => ["Tecnologia", "Jurídico"].includes(areaDe(numero)));
    for (const numero of daArea) {
      expect(resultado.contextos[numero - 1]).toBe("base_segunda_tentativa");
      expect(resultado.itens[numero - 1]?.st).toBe("sem-rascunho");
      expect(resultado.itens[numero - 1]?.alerts.map((alerta) => alerta.t)).toContain("nocontext");
    }
    // As perguntas que já tiveram a base inteira não têm segunda tentativa.
    const enviadas = api.geracoes.flatMap(numerosDoPedido).filter((numero) => ["Geral", "Produto"].includes(areaDe(numero)));
    expect(enviadas).toHaveLength(new Set(enviadas).size);
    expect(resultado.contextos.filter((contexto) => contexto === "base")).toHaveLength(23);
  });
});

describe("Cenário U13 · base pequena ou seleção desligada", () => {
  it("desligada: base inteira em todos os lotes, na ordem de hoje, sem segunda tentativa", async () => {
    api.respostas = [citaSeTiver("nao-existe.md")];
    const resultado = await processar({ ia: { selecao: { porArea: false, minimoDeTokens: 50_000 } } });
    expect(resultado.selecao).toEqual({ motivo: "desligada", grupos: [{ area: null, documentos: 16, perguntas: 46 }] });
    expect(api.geracoes.map(numerosDoPedido)).toEqual([0, 10, 20, 30, 40].map((inicio) => Array.from({ length: Math.min(10, 46 - inicio) }, (_, i) => inicio + i + 1)));
    expect(api.geracoes.every((parametros) => documentosDoPedido(parametros).length === 16)).toBe(true);
    expect(new Set(resultado.contextos)).toEqual(new Set(["base"]));
  });

  it("base abaixo do limiar: o mesmo comportamento", async () => {
    api.tokensContados = 40_000;
    api.respostas = [citaSeTiver("nao-existe.md")];
    const resultado = await processar();
    expect(resultado.selecao?.motivo).toBe("base_pequena");
    expect(api.geracoes).toHaveLength(5);
  });
});

describe("Cenário U14 · retomada depois de um reinício", () => {
  it("as perguntas gravadas não voltam à IA, e as demais seguem com o contexto do grupo", async () => {
    api.respostas = [citaSeTiver("portal-empresa-rh-funcionalidades.md")];
    const primeira = await processar();
    const gravadas: RespostaGravada[] = [1, 4, 5, 8].map((numero) => ({
      numero,
      texto: primeira.perguntas[numero - 1]?.texto ?? "",
      resposta: { numero, situacao: "sem_resposta", trechos: [], citacoesDescartadas: 0 },
    }));
    // A resposta gravada da pergunta 3 (Geral) tem outro texto: não vale e é gerada de novo.
    gravadas.push({ numero: 3, texto: "outra pergunta", resposta: { numero: 3, situacao: "sem_resposta", trechos: [], citacoesDescartadas: 0 } });
    api.geracoes.length = 0;
    const retomada = await processar({ respostasGravadas: gravadas });
    const reenviadas = api.geracoes.flatMap(numerosDoPedido);
    for (const numero of [1, 4, 5, 8]) expect(reenviadas.filter((n) => n === numero).length).toBeLessThanOrEqual(1);
    expect(reenviadas).toContain(3);
    // As gravadas sem fonte, do contexto da área, passam pela segunda tentativa; as outras não voltam.
    const primeiraRodada = api.geracoes.slice(0, -1).flatMap(numerosDoPedido);
    for (const numero of [1, 4, 5, 8]) expect(primeiraRodada).not.toContain(numero);
    expect(retomada.itens).toHaveLength(46);
  });
});

describe("Cenário U15 · isolamento entre organizações", () => {
  it("a seleção só considera os documentos da organização da tarefa", async () => {
    const outra = (await criarOrganizacao(banco, `Outra organização ${Date.now()}`)).id;
    await carregarBase({ organizacaoId: outra, pasta: path.join(RAIZ, "vereda-documental/base/tecnologia"), banco, hoje: "2026-11-12", enviadoPor: null });
    await banco.query("UPDATE documentos SET areas = '{Tecnologia}', areas_classificadas_em = now() WHERE organizacao_id = $1", [outra]);
    const daOutra = (await banco.query<{ nome: string }>("SELECT nome FROM documentos WHERE organizacao_id = $1", [outra])).rows.map((linha) => linha.nome);
    expect(daOutra.length).toBeGreaterThan(0);
    api.respostas = [citaSeTiver("portal-empresa-rh-funcionalidades.md")];
    await processar();
    const enviados = new Set(api.geracoes.flatMap(documentosDoPedido));
    for (const nome of daOutra) expect(enviados.has(nome)).toBe(false);
  });
});

describe("PU10 · contexto do item e métricas gravados com a tarefa", () => {
  it("itens.contexto no banco e as métricas da seleção, sem nada novo no item da Revisão", async () => {
    const pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-selecao-"));
    try {
      api.respostas = [citaSeTiver("anexo-sla-slo-rto.md")];
      const ambiente = {
        banco,
        armazenamento: criarArmazenamento(pastaDados),
        api,
        ia: IA,
        nomesDeCabecalho: await carregarCabecalhos(),
        termosCriticos: await carregarTermosCriticos(),
        precos: await carregarPrecos(),
        hoje: () => "2026-10-21",
      };
      const tarefa = await criarTarefaComPlanilha(ambiente, { organizacaoId: ORGANIZACAO_INICIAL, arquivo: "RFP-01-Rede-Varejo-Alfa.xlsx", planilha: new Uint8Array(await readFile(RFP)), dados: { nome: "RFP Alfa" } });
      await executarTarefa(ambiente, tarefa);
      const gravada = await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefa.id);
      expect(gravada?.estado).toBe("pronta");
      const { rows } = await banco.query<{ contexto: string; total: number }>("SELECT contexto, count(*)::int AS total FROM itens WHERE tarefa_id = $1 GROUP BY contexto ORDER BY contexto", [tarefa.id]);
      expect(rows).toEqual([
        { contexto: "base", total: 23 },
        { contexto: "base_segunda_tentativa", total: 23 },
      ]);
      const metricas = (await banco.query<{ metricas: MetricasDaTarefa }>("SELECT metricas FROM tarefas WHERE id = $1", [tarefa.id])).rows[0]?.metricas;
      expect(metricas?.selecao?.motivo).toBe("ligada");
      expect(metricas?.selecao?.perguntasPorContexto).toEqual({ base: 23, base_segunda_tentativa: 23 });
      expect(metricas?.duracaoPorEtapa.selecao).toBeTypeOf("number");
    } finally {
      await rm(pastaDados, { recursive: true, force: true });
      await banco.exec("TRUNCATE tarefas CASCADE");
    }
  });
});
