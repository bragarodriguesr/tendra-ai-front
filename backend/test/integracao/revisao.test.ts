import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { criarArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarPessoas } from "../../src/config/pessoas.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { criarTarefaComPlanilha, executarTarefa } from "../../src/fluxo/executarTarefa.ts";
import { criarServidor } from "../../src/http/servidor.ts";
import { carregarPrecos } from "../../src/observabilidade/metricas.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import { abrirBanco, type Banco } from "../../src/persistencia/banco.ts";
import { listarItens, obterTarefa } from "../../src/persistencia/tarefas.ts";
import { aprovarItem, avaliarItem, editarTexto, listarEventos, relatorioDeAceitacao } from "../../src/revisao/revisao.ts";
import { ApiSimulada } from "../apoio/apiSimulada.ts";
import { respondeImparesCitando } from "../apoio/respostasSimuladas.ts";

/** Revisão persistida e aceitação (etapa B5, cenários 41 a 49). Itens gerados com a API simulada. */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const RFP = path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-haiku-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };

let banco: Banco;
let pastaDados: string;
let servidor: FastifyInstance;
let tarefaId: string;

async function ambiente(comBanco: Banco) {
  const api = new ApiSimulada();
  api.respostas = [respondeImparesCitando];
  return {
    banco: comBanco,
    armazenamento: criarArmazenamento(pastaDados),
    api,
    ia: IA,
    nomesDeCabecalho: await carregarCabecalhos(),
    termosCriticos: await carregarTermosCriticos(),
    precos: await carregarPrecos(),
    pessoas: await carregarPessoas(),
    hoje: () => "2026-10-21",
  };
}

async function tarefaPronta(comBanco: Banco): Promise<string> {
  const contexto = await ambiente(comBanco);
  const tarefa = await criarTarefaComPlanilha(contexto, { arquivo: "RFP-01-Rede-Varejo-Alfa.xlsx", planilha: new Uint8Array(await readFile(RFP)), dados: {} });
  await executarTarefa(contexto, tarefa);
  return tarefa.id;
}

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  await carregarBase({ pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-21", enviadoPor: null });
}, 60_000);

afterAll(async () => {
  await banco.close();
});

beforeEach(async () => {
  await banco.exec("TRUNCATE tarefas CASCADE");
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-revisao-"));
  servidor = criarServidor({ banco, tarefas: await ambiente(banco) });
  await servidor.ready();
  tarefaId = await tarefaPronta(banco);
});

afterEach(async () => {
  await servidor.close();
  await rm(pastaDados, { recursive: true, force: true });
});

const acao = (metodo: "PUT" | "POST", caminho: string, payload: object) =>
  servidor.inject({ method: metodo, url: `/api/tarefas/${tarefaId}/itens/${caminho}`, payload });
const item = async (numero: number) => (await listarItens(banco, tarefaId))[numero - 1];
const eventos = () => listarEventos(banco, tarefaId);

describe("Cenário 41 · pessoa que age", () => {
  it.each([
    ["sem pessoa", {}],
    ["pessoa fora da lista", { pessoa: "intrusa" }],
  ])("%s: 400 Pessoa não reconhecida e nada muda", async (_caso, corpo) => {
    const antes = await item(1);
    for (const resposta of [
      await acao("PUT", "1/texto", { ...corpo, texto: "Outro texto." }),
      await acao("POST", "1/aprovar", corpo),
      await acao("POST", "1/restaurar", corpo),
      await acao("PUT", "1/avaliacao", { ...corpo, valor: "positiva" }),
      await acao("POST", "1/revisar", corpo),
      await acao("POST", "1/fonte", { ...corpo, fonte: 1 }),
      await acao("POST", "1/alertas/old/reconhecer", corpo),
    ]) {
      expect(resposta.statusCode).toBe(400);
      expect(resposta.json()).toEqual({ erro: "Pessoa não reconhecida" });
    }
    expect(await item(1)).toEqual(antes);
    expect(await eventos()).toEqual([]);
  });

  it("lista as pessoas da configuração para o front, sem cache", async () => {
    const resposta = await servidor.inject({ method: "GET", url: "/api/pessoas" });
    expect(resposta.json().pessoas.map((pessoa: { id: string }) => pessoa.id)).toEqual(["kadu", "marcelo"]);
    expect(resposta.headers["cache-control"]).toBe("no-store");
  });
});

describe("Cenários 42 a 45 · editar, restaurar e aprovar", () => {
  it("edita mantendo as fontes por parágrafo, orig e a sugestão original; restaurar volta ao original", async () => {
    const editado = await acao("PUT", "1/texto", { pessoa: "kadu", texto: "Resposta revisada.\n\nSegundo parágrafo novo." });
    expect(editado.statusCode).toBe(200);
    expect(editado.json().item).toMatchObject({
      st: "em-revisao",
      orig: "Resposta 1.",
      paras: [
        { t: "Resposta revisada.", s: [1] },
        { t: "Segundo parágrafo novo.", s: [1] },
      ],
    });

    const restaurado = await acao("POST", "1/restaurar", { pessoa: "kadu" });
    expect(restaurado.json().item).toMatchObject({ st: "em-revisao", paras: [{ t: "Resposta 1.", s: [1] }], orig: "Resposta 1." });
    expect((await eventos()).map((evento) => [evento.acao, evento.pessoa, evento.papel, evento.porcentagemAlterada])).toEqual([
      // "Resposta 1." (2 palavras) → 5 palavras, 1 em comum: (1 + 4) / 7 = 71,4%.
      ["edicao", "Kadu Mendes", "Revisor", 71.4],
      ["restauracao", "Kadu Mendes", "Revisor", 0],
    ]);
  });

  it("aprovar grava quem e quando; editar depois remove a aprovação e registra o evento", async () => {
    const aprovado = (await acao("POST", "1/aprovar", { pessoa: "marcelo" })).json().item;
    expect(aprovado).toMatchObject({ st: "aprovada", by: "Marcelo Vieira" });
    expect(Date.parse(aprovado.at)).not.toBeNaN();

    const editado = (await acao("PUT", "1/texto", { pessoa: "kadu", texto: "Texto novo." })).json().item;
    expect(editado.st).toBe("em-revisao");
    expect(editado).not.toHaveProperty("by");
    expect(editado).not.toHaveProperty("at");
    expect((await eventos()).map((evento) => evento.acao)).toEqual(["aprovacao", "aprovacao_removida", "edicao"]);
  });

  it("item sem rascunho não pode ser aprovado nem restaurado; nada muda", async () => {
    const antes = await item(2);
    expect(antes?.st).toBe("sem-rascunho");
    const aprovar = await acao("POST", "2/aprovar", { pessoa: "marcelo" });
    expect(aprovar.statusCode).toBe(400);
    expect(aprovar.json()).toEqual({ erro: "Item sem rascunho não pode ser aprovado." });
    expect((await acao("POST", "2/restaurar", { pessoa: "marcelo" })).statusCode).toBe(400);
    expect(await item(2)).toEqual(antes);
  });

  it("texto vazio é recusado; item ou tarefa inexistente dão 404", async () => {
    expect((await acao("PUT", "1/texto", { pessoa: "kadu", texto: "  \n\n " })).json()).toEqual({ erro: "O texto não pode ficar vazio." });
    expect((await acao("POST", "999/aprovar", { pessoa: "kadu" })).statusCode).toBe(404);
    const outra = await servidor.inject({ method: "POST", url: "/api/tarefas/00000000-0000-4000-8000-000000000000/itens/1/aprovar", payload: { pessoa: "kadu" } });
    expect(outra.json()).toEqual({ erro: "Tarefa não encontrada." });
  });
});

describe("Cenário 46 · avaliação", () => {
  it("negativa exige motivo da lista; nova avaliação da mesma pessoa substitui a anterior", async () => {
    expect((await acao("PUT", "1/avaliacao", { pessoa: "kadu", valor: "negativa" })).json().erro).toMatch(/^Avaliação negativa exige um motivo/);
    expect((await acao("PUT", "1/avaliacao", { pessoa: "kadu", valor: "negativa", motivo: "Qualquer" })).statusCode).toBe(400);

    expect((await acao("PUT", "1/avaliacao", { pessoa: "kadu", valor: "negativa", motivo: "Fonte incorreta" })).json().avaliacao).toMatchObject({
      pessoa: "Kadu Mendes",
      valor: "negativa",
      motivo: "Fonte incorreta",
    });
    await acao("PUT", "1/avaliacao", { pessoa: "kadu", valor: "positiva" });
    await acao("PUT", "1/avaliacao", { pessoa: "marcelo", valor: "negativa", motivo: "Texto impreciso" });

    const avaliacoes = (await servidor.inject({ method: "GET", url: `/api/tarefas/${tarefaId}/avaliacoes` })).json().avaliacoes;
    expect(avaliacoes.map((avaliacao: { pessoa: string; valor: string; motivo: string | null }) => [avaliacao.pessoa, avaliacao.valor, avaliacao.motivo])).toEqual([
      ["Kadu Mendes", "positiva", null],
      ["Marcelo Vieira", "negativa", "Texto impreciso"],
    ]);
  });
});

describe("Cenários 48 e 49 · aceitação e eventos", () => {
  it("o relatório confere com as ações gravadas; os eventos não têm texto e não podem ser alterados", async () => {
    await acao("POST", "1/aprovar", { pessoa: "marcelo" });
    await acao("PUT", "3/texto", { pessoa: "kadu", texto: "Resposta 3 revisada pela equipe." });
    await acao("POST", "3/aprovar", { pessoa: "marcelo" });
    await acao("PUT", "1/avaliacao", { pessoa: "kadu", valor: "positiva" });
    await acao("PUT", "3/avaliacao", { pessoa: "kadu", valor: "negativa", motivo: "Texto impreciso" });

    const aceitacao = (await servidor.inject({ method: "GET", url: `/api/tarefas/${tarefaId}/aceitacao` })).json().aceitacao;
    // "Resposta 3." → "Resposta 3 revisada pela equipe.": 2 e 5 palavras, 2 em comum → 3 de 7 = 42,9%; média com 0% = 21,5%.
    expect(aceitacao).toEqual({
      itens: 46,
      comRascunho: 23,
      semRascunho: 23,
      aprovados: 2,
      aprovadosSemEdicao: 1,
      porcentagemMediaAlterada: 21.5,
      avaliacoes: { positivas: 1, negativas: 1, motivos: { "Texto impreciso": 1 } },
    });

    const lista = (await servidor.inject({ method: "GET", url: `/api/tarefas/${tarefaId}/eventos` })).json().eventos;
    expect(lista.map((evento: { item: string; acao: string }) => `${evento.item}:${evento.acao}`)).toEqual(["r1:aprovacao", "r3:edicao", "r3:aprovacao", "r1:avaliacao", "r3:avaliacao"]);
    expect(JSON.stringify(lista)).not.toContain("revisada pela equipe");
    await expect(banco.exec("UPDATE eventos SET pessoa = 'outra'")).rejects.toThrow(/só aceitam inclusão/);
    await expect(banco.exec("DELETE FROM eventos")).rejects.toThrow(/só aceitam inclusão/);
  });

  it("ações numa tarefa que não está pronta são recusadas com 409", async () => {
    await banco.query("UPDATE tarefas SET estado = 'processando' WHERE id = $1", [tarefaId]);
    expect((await acao("POST", "1/aprovar", { pessoa: "marcelo" })).json()).toEqual({ erro: "A tarefa não está pronta para revisão." });
  });
});

describe("Cenário 47 · persistência da revisão após reiniciar", () => {
  it("edições, aprovações e avaliações continuam depois de fechar e reabrir o banco em disco", async () => {
    const pasta = await mkdtemp(path.join(tmpdir(), "tendra-banco-revisao-"));
    try {
      let emDisco = await abrirBanco(path.join(pasta, "banco"));
      await carregarBase({ pasta: path.join(RAIZ, "pulse-beneficios/base"), banco: emDisco, hoje: "2026-10-21", enviadoPor: null });
      const id = await tarefaPronta(emDisco);
      const [kadu, marcelo] = await carregarPessoas();
      if (kadu === undefined || marcelo === undefined) throw new Error("pessoas ausentes");
      await editarTexto(emDisco, { tarefaId: id, numero: 1, pessoa: kadu, texto: "Texto editado." });
      await aprovarItem(emDisco, { tarefaId: id, numero: 1, pessoa: marcelo });
      await avaliarItem(emDisco, { tarefaId: id, numero: 1, pessoa: kadu, valor: "positiva" });
      const antes = { tarefa: await obterTarefa(emDisco, id), itens: await listarItens(emDisco, id), eventos: await listarEventos(emDisco, id), aceitacao: await relatorioDeAceitacao(emDisco, id) };
      await emDisco.close();

      emDisco = await abrirBanco(path.join(pasta, "banco"));
      expect({ tarefa: await obterTarefa(emDisco, id), itens: await listarItens(emDisco, id), eventos: await listarEventos(emDisco, id), aceitacao: await relatorioDeAceitacao(emDisco, id) }).toEqual(antes);
      expect(antes.itens[0]).toMatchObject({ st: "aprovada", by: "Marcelo Vieira", paras: [{ t: "Texto editado.", s: [1] }] });
      await emDisco.close();
    } finally {
      await rm(pasta, { recursive: true, force: true });
    }
  }, 120_000);
});

/** Põe no item 1 alertas e fontes de teste, para os cenários que dependem deles. */
async function prepararItem1(dados: { alerts: object[]; srcs?: object[]; paras?: object[] }) {
  const atual = await item(1);
  await banco.query("UPDATE itens SET alerts = $3, srcs = $4, paras = $5 WHERE tarefa_id = $1 AND numero = $2", [
    tarefaId,
    1,
    JSON.stringify(dados.alerts),
    JSON.stringify(dados.srcs ?? atual?.srcs),
    JSON.stringify(dados.paras ?? atual?.paras),
  ]);
}

describe("Cenário 57 · reconhecer alerta", () => {
  it("grava quem reconheceu e quando no item; reconhecer de novo não muda nada", async () => {
    await prepararItem1({ alerts: [{ t: "critical" }, { t: "old" }] });
    const reconhecido = await acao("POST", "1/alertas/old/reconhecer", { pessoa: "kadu" });
    expect(reconhecido.statusCode).toBe(200);
    const [critico, antigo] = reconhecido.json().item.alerts;
    expect(critico).toEqual({ t: "critical" });
    expect(antigo).toMatchObject({ t: "old", ack: { by: "Kadu Mendes" } });
    expect(Date.parse(antigo.ack.at)).not.toBeNaN();

    expect((await acao("POST", "1/alertas/old/reconhecer", { pessoa: "marcelo" })).json().item.alerts[1]).toEqual(antigo);
    expect((await item(1))?.alerts).toEqual([{ t: "critical" }, antigo]);
    expect((await eventos()).map((evento) => [evento.acao, evento.pessoa, evento.detalhe])).toEqual([["alerta_reconhecido", "Kadu Mendes", "old"]]);
  });

  it("alerta que o item não tem dá 404 e tipo desconhecido dá 400; nada muda", async () => {
    await prepararItem1({ alerts: [{ t: "old" }] });
    const ausente = await acao("POST", "1/alertas/conflict/reconhecer", { pessoa: "kadu" });
    expect(ausente.statusCode).toBe(404);
    expect(ausente.json()).toEqual({ erro: "O item não tem esse alerta." });
    expect((await acao("POST", "1/alertas/qualquer/reconhecer", { pessoa: "kadu" })).statusCode).toBe(400);
    expect((await item(1))?.alerts).toEqual([{ t: "old" }]);
    expect(await eventos()).toEqual([]);
  });
});

describe("Cenário 58 · escolher fonte em conflito", () => {
  const fonte = (doc: string) => ({ doc, loc: "Seção · linha 1", type: "Documento", age: 10, ex: `Trecho de ${doc}.`, conflict: true });

  beforeEach(async () => {
    await prepararItem1({
      alerts: [{ t: "conflict" }],
      srcs: [fonte("a.md"), fonte("b.md")],
      paras: [{ t: "Primeiro parágrafo.", s: [1] }, { t: "Segundo parágrafo.", s: [1, 2] }],
    });
  });

  it("a fonte escolhida sustenta todos os parágrafos e o conflito fica reconhecido pela mesma pessoa", async () => {
    const escolhido = (await acao("POST", "1/fonte", { pessoa: "kadu", fonte: 2 })).json().item;
    expect(escolhido.srcs.map((x: { doc: string; chosen: boolean }) => [x.doc, x.chosen])).toEqual([["a.md", false], ["b.md", true]]);
    expect(escolhido.paras).toEqual([{ t: "Primeiro parágrafo.", s: [2] }, { t: "Segundo parágrafo.", s: [2] }]);
    expect(escolhido.alerts).toEqual([{ t: "conflict", ack: { by: "Kadu Mendes", at: expect.any(String) } }]);
    expect(await item(1)).toMatchObject({ srcs: escolhido.srcs, paras: escolhido.paras, alerts: escolhido.alerts });
    expect((await eventos()).map((evento) => [evento.acao, evento.detalhe])).toEqual([["fonte_escolhida", "2"]]);
  });

  it("fonte fora do conflito dá 400; sem conflito pendente, 409; nada muda", async () => {
    const antes = await item(1);
    expect((await acao("POST", "1/fonte", { pessoa: "kadu", fonte: 3 })).json()).toEqual({ erro: "Escolha uma das fontes em conflito." });
    expect((await acao("POST", "1/fonte", { pessoa: "kadu", fonte: 0 })).statusCode).toBe(400);
    expect(await item(1)).toEqual(antes);

    await acao("POST", "1/alertas/conflict/reconhecer", { pessoa: "kadu" });
    const semConflito = await acao("POST", "1/fonte", { pessoa: "kadu", fonte: 1 });
    expect(semConflito.statusCode).toBe(409);
    expect(semConflito.json()).toEqual({ erro: "O item não tem conflito pendente." });
    expect((await eventos()).map((evento) => evento.acao)).toEqual(["alerta_reconhecido"]);
  });
});

describe("Cenário 59 · marcar como revisado", () => {
  it("grava quem marcou e quando; marcar de novo não muda nada; editar tira a marca", async () => {
    const revisado = (await acao("POST", "1/revisar", { pessoa: "kadu" })).json().item;
    expect(revisado).toMatchObject({ st: "revisada", rby: "Kadu Mendes" });
    expect(Date.parse(revisado.rat)).not.toBeNaN();
    expect((await acao("POST", "1/revisar", { pessoa: "marcelo" })).json().item).toEqual(revisado);

    const editado = (await acao("PUT", "1/texto", { pessoa: "kadu", texto: "Texto novo." })).json().item;
    expect(editado.st).toBe("em-revisao");
    expect(editado).not.toHaveProperty("rby");
    expect(editado).not.toHaveProperty("rat");
    expect((await eventos()).map((evento) => evento.acao)).toEqual(["revisao", "edicao"]);
  });

  it("aprovar mantém quem revisou; item aprovado ou sem rascunho não é marcado", async () => {
    await acao("POST", "1/revisar", { pessoa: "kadu" });
    expect((await acao("POST", "1/aprovar", { pessoa: "marcelo" })).json().item).toMatchObject({ st: "aprovada", by: "Marcelo Vieira", rby: "Kadu Mendes" });
    const aprovado = await acao("POST", "1/revisar", { pessoa: "kadu" });
    expect(aprovado.statusCode).toBe(409);
    expect(aprovado.json()).toEqual({ erro: "Item já aprovado." });
    expect((await acao("POST", "2/revisar", { pessoa: "kadu" })).json()).toEqual({ erro: "Item sem rascunho não pode ser marcado como revisado." });
  });

  it("restaurar um item revisado e editado o devolve para em revisão", async () => {
    await acao("PUT", "1/texto", { pessoa: "kadu", texto: "Texto novo." });
    await acao("POST", "1/revisar", { pessoa: "kadu" });
    const restaurado = (await acao("POST", "1/restaurar", { pessoa: "kadu" })).json().item;
    expect(restaurado).toMatchObject({ st: "em-revisao", paras: [{ t: "Resposta 1.", s: [1] }] });
    expect(restaurado).not.toHaveProperty("rby");
  });
});

describe("Cenário 60 · excluir tarefa", () => {
  const existe = (caminho: string) => access(path.join(pastaDados, caminho)).then(() => true, () => false);
  const linhas = async (tabela: string, id: string) =>
    (await banco.query<{ total: number }>(`SELECT count(*)::int AS total FROM ${tabela} WHERE tarefa_id = $1`, [id])).rows[0]?.total;

  it("apaga a tarefa com itens, eventos, avaliações, requisições e arquivos; as outras tarefas não mudam", async () => {
    const outra = await tarefaPronta(banco);
    await acao("POST", "1/aprovar", { pessoa: "marcelo" });
    await acao("POST", "3/revisar", { pessoa: "kadu" });
    await acao("PUT", "1/avaliacao", { pessoa: "kadu", valor: "positiva" });
    await servidor.inject({ method: "POST", url: `/api/tarefas/${outra}/itens/1/aprovar`, payload: { pessoa: "marcelo" } });
    const tarefa = await obterTarefa(banco, tarefaId);
    const arquivos = [tarefa?.caminhoDaPlanilha ?? "", tarefa?.caminhoDaPlanilhaPreenchida ?? ""];
    expect(await Promise.all(arquivos.map(existe))).toEqual([true, true]);

    const resposta = await servidor.inject({ method: "DELETE", url: `/api/tarefas/${tarefaId}` });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ excluida: true });

    expect((await servidor.inject({ method: "GET", url: `/api/tarefas/${tarefaId}` })).statusCode).toBe(404);
    for (const tabela of ["itens", "eventos", "avaliacoes", "requisicoes", "respostas_geradas"]) expect(await linhas(tabela, tarefaId)).toBe(0);
    expect(await Promise.all(arquivos.map(existe))).toEqual([false, false]);
    expect((await servidor.inject({ method: "GET", url: "/api/tarefas" })).json().tarefas.map((t: { id: string }) => t.id)).toEqual([outra]);
    expect(await linhas("eventos", outra)).toBe(1);
    await expect(banco.exec("DELETE FROM eventos")).rejects.toThrow(/só aceitam inclusão/);

    const deNovo = await servidor.inject({ method: "DELETE", url: `/api/tarefas/${tarefaId}` });
    expect(deNovo.statusCode).toBe(404);
  });

  it("tarefa em processamento não é excluída", async () => {
    await banco.query("UPDATE tarefas SET estado = 'processando' WHERE id = $1", [tarefaId]);
    const resposta = await servidor.inject({ method: "DELETE", url: `/api/tarefas/${tarefaId}` });
    expect(resposta.statusCode).toBe(409);
    expect(resposta.json()).toEqual({ erro: "A tarefa ainda está em processamento. Exclua depois que ela terminar." });
    expect(await linhas("itens", tarefaId)).toBe(46);
  });
});

describe("Cenário 61 · resposta manual em item sem rascunho", () => {
  it("a resposta escrita fica sem fonte, com o alerta de resposta manual e quem escreveu; o item vai para em revisão", async () => {
    const antes = await item(2);
    expect(antes).toMatchObject({ st: "sem-rascunho", orig: "", paras: [] });
    const outros = antes?.alerts.filter((alerta) => alerta.t !== "nocontext") ?? [];

    const escrito = (await acao("PUT", "2/texto", { pessoa: "marcelo", texto: "Resposta escrita pela equipe.\n\nSegundo parágrafo." })).json().item;
    expect(escrito).toMatchObject({
      st: "em-revisao",
      orig: "",
      paras: [{ t: "Resposta escrita pela equipe.", s: [] }, { t: "Segundo parágrafo.", s: [] }],
      alerts: [{ t: "manual", by: "Marcelo Vieira" }, ...outros],
    });
    expect((await acao("POST", "2/restaurar", { pessoa: "kadu" })).statusCode).toBe(400);

    // Outra pessoa edita: quem escreveu continua sendo quem escreveu primeiro.
    const editado = (await acao("PUT", "2/texto", { pessoa: "kadu", texto: "Resposta revisada." })).json().item;
    expect(editado.alerts[0]).toEqual({ t: "manual", by: "Marcelo Vieira" });
    expect((await acao("POST", "2/alertas/manual/reconhecer", { pessoa: "kadu" })).json().item.alerts[0]).toMatchObject({ t: "manual", ack: { by: "Kadu Mendes" } });
    expect((await acao("POST", "2/aprovar", { pessoa: "marcelo" })).json().item).toMatchObject({ st: "aprovada", by: "Marcelo Vieira" });

    // A resposta manual não conta como sugestão da IA no relatório de aceitação.
    const aceitacao = (await servidor.inject({ method: "GET", url: `/api/tarefas/${tarefaId}/aceitacao` })).json().aceitacao;
    expect(aceitacao).toMatchObject({ comRascunho: 23, semRascunho: 23, aprovados: 0 });
    expect((await eventos()).map((evento) => [evento.acao, evento.detalhe])).toEqual([
      ["edicao", "manual"],
      ["edicao", "manual"],
      ["alerta_reconhecido", "manual"],
      ["aprovacao", null],
    ]);
  });

  it("apagar todo o texto devolve o item para sem rascunho, com o alerta sem contexto", async () => {
    await acao("PUT", "2/texto", { pessoa: "kadu", texto: "Resposta manual." });
    const apagado = (await acao("PUT", "2/texto", { pessoa: "kadu", texto: "  " })).json().item;
    expect(apagado).toMatchObject({ st: "sem-rascunho", paras: [], orig: "" });
    expect(apagado.alerts[0]).toEqual({ t: "nocontext" });
    expect(apagado.alerts.some((alerta: { t: string }) => alerta.t === "manual")).toBe(false);
    expect((await acao("POST", "2/aprovar", { pessoa: "marcelo" })).statusCode).toBe(400);
  });
});
