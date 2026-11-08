import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { conferirDono, criarArmazenamento, ErroDeArmazenamento } from "../../src/armazenamento/armazenamento.ts";
import { ErroDeCadastro, gravarPerfil } from "../../src/autenticacao/perfis.ts";
import type { VerificadorDeSenha } from "../../src/autenticacao/verificadorSupabase.ts";
import { carregarBase } from "../../src/base/carga.ts";
import { carregarCabecalhos } from "../../src/config/cabecalhos.ts";
import { carregarPessoas } from "../../src/config/pessoas.ts";
import { carregarTermosCriticos } from "../../src/config/termosCriticos.ts";
import { criarTarefaComPlanilha, executarTarefa } from "../../src/fluxo/executarTarefa.ts";
import { MENSAGEM_DE_TAREFA_NAO_ENCONTRADA } from "../../src/http/organizacao.ts";
import { criarServidor } from "../../src/http/servidor.ts";
import { carregarPrecos } from "../../src/observabilidade/metricas.ts";
import type { Banco } from "../../src/persistencia/banco.ts";
import { listarDocumentos } from "../../src/persistencia/documentos.ts";
import { criarOrganizacao, ErroDeOrganizacao, ORGANIZACAO_INICIAL } from "../../src/persistencia/organizacoes.ts";
import { listarItens, obterTarefa, type Tarefa } from "../../src/persistencia/tarefas.ts";
import { listarEventos } from "../../src/revisao/revisao.ts";
import { ApiSimulada } from "../apoio/apiSimulada.ts";
import { abrirBancoDeTeste } from "../apoio/banco.ts";
import { respondeImparesCitando } from "../apoio/respostasSimuladas.ts";

/**
 * Fase K (cenários 66 a 79): duas organizações no mesmo banco. A é a organização inicial, com a base
 * Pulse e uma tarefa revisada; B é um segundo cliente. Toda rota do Workspace, chamada por uma pessoa
 * de B com identificadores de A, responde 404 ou devolve só dados de B (cenário 79).
 */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../base-sintetica");
const RFP = path.join(RAIZ, "rfps/RFP-01-Rede-Varejo-Alfa.xlsx");
const IA = { modelo: "claude-opus-5-5", modeloDeIdentificacao: "claude-haiku-5-5", modeloDeConflito: "claude-sonnet-5-5", esforco: "medium" as const, tamanhoDoLote: 10 };
const CNPJ = "12345678000199";

const DE_A = { id: "11111111-1111-4111-8111-111111111111", email: "aprovador.a@tendra.test", nome: "Marcelo Vieira", papel: "Aprovador", senha: "senha-a" };
const DE_B = { id: "44444444-4444-4444-8444-444444444444", email: "aprovador.b@tendra.test", nome: "Bruna Costa", papel: "Aprovador", senha: "senha-b" };
const REVISOR_DE_B = { id: "55555555-5555-4555-8555-555555555555", email: "revisor.b@tendra.test", nome: "Bruno Lima", papel: "Revisor", senha: "senha-rb" };

let banco: Banco;
let pastaDados: string;
let servidor: FastifyInstance;
let api: ApiSimulada;
let organizacaoB: string;
let tarefaDeA: Tarefa;
let tarefas: Parameters<typeof executarTarefa>[0] & { pessoas: Awaited<ReturnType<typeof carregarPessoas>> };

const verificador: VerificadorDeSenha = {
  async conferir(email, senha) {
    const conta = [DE_A, DE_B, REVISOR_DE_B].find((perfil) => perfil.email === email);
    return conta !== undefined && conta.senha === senha ? conta.id : null;
  },
};

beforeAll(async () => {
  banco = await abrirBancoDeTeste();
  pastaDados = await mkdtemp(path.join(tmpdir(), "tendra-organizacoes-"));
  organizacaoB = (await criarOrganizacao(banco, "Organização de teste B")).id;
  await gravarPerfil(banco, { ...DE_A, organizacaoId: ORGANIZACAO_INICIAL });
  await gravarPerfil(banco, { ...DE_B, organizacaoId: organizacaoB });
  await gravarPerfil(banco, { ...REVISOR_DE_B, organizacaoId: organizacaoB });
  await carregarBase({ organizacaoId: ORGANIZACAO_INICIAL, pasta: path.join(RAIZ, "pulse-beneficios/base"), banco, hoje: "2026-10-28", enviadoPor: null });

  api = new ApiSimulada();
  api.respostas = [respondeImparesCitando];
  tarefas = {
    banco,
    armazenamento: criarArmazenamento(pastaDados),
    api,
    ia: IA,
    nomesDeCabecalho: await carregarCabecalhos(),
    termosCriticos: await carregarTermosCriticos(),
    precos: await carregarPrecos(),
    pessoas: await carregarPessoas(),
    hoje: () => "2026-10-28",
  };
  tarefaDeA = await criarTarefaComPlanilha(tarefas, {
    organizacaoId: ORGANIZACAO_INICIAL,
    arquivo: "RFP-01.xlsx",
    planilha: new Uint8Array(await readFile(RFP)),
    dados: { nome: "RFP de A", empresa: "Rede Varejo Alfa", cnpj: CNPJ, contatos: [{ nome: "Ana de A", email: "ana@alfa.test" }] },
  });
  await executarTarefa(tarefas, tarefaDeA);
  servidor = criarServidor({ banco, tarefas, autenticacao: { verificador, horasSemUso: 8, cookieSeguro: false } });
  await servidor.ready();
}, 120_000);

afterAll(async () => {
  await servidor.close();
  await banco.close();
  await rm(pastaDados, { recursive: true, force: true });
});

async function cookieDe(perfil: { email: string; senha: string }): Promise<string> {
  const resposta = await servidor.inject({ method: "POST", url: "/api/auth/login", payload: { email: perfil.email, senha: perfil.senha } });
  expect(resposta.statusCode).toBe(200);
  return String(resposta.headers["set-cookie"]).split(";")[0] ?? "";
}

const pedir = (cookie: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, payload?: object) =>
  servidor.inject({ method, url, headers: { cookie }, ...(payload === undefined ? {} : { payload }) });

/** Rotas do servidor no formato "MÉTODO caminho", lidas da árvore do Fastify (sem HEAD). */
function rotasDoServidor(): string[] {
  const rotas: string[] = [];
  const caminhos: string[] = [];
  for (const linha of servidor.printRoutes({ commonPrefix: false }).split("\n")) {
    const encontrado = /^([│ ]*)[├└]── (\S+) \(([^)]+)\)/.exec(linha);
    if (encontrado === null) continue;
    const nivel = (encontrado[1] ?? "").length / 4;
    caminhos.length = nivel;
    caminhos[nivel] = encontrado[2] ?? "";
    const caminho = caminhos.join("");
    for (const metodo of (encontrado[3] ?? "").split(", ")) if (metodo !== "HEAD") rotas.push(`${metodo} ${caminho}`);
  }
  return rotas.sort();
}

/** Corpo válido de cada rota de tarefa: com corpo inválido a resposta seria 400, antes da conferência do dono. */
const ROTAS_DE_TAREFA: Record<string, object | undefined> = {
  "GET /api/tarefas/:id": undefined,
  "DELETE /api/tarefas/:id": undefined,
  "GET /api/tarefas/:id/itens": undefined,
  "GET /api/tarefas/:id/planilha": undefined,
  "GET /api/tarefas/:id/empresa": undefined,
  "GET /api/tarefas/:id/eventos": undefined,
  "GET /api/tarefas/:id/registro": undefined,
  "GET /api/tarefas/:id/metricas": undefined,
  "GET /api/tarefas/:id/avaliacoes": undefined,
  "GET /api/tarefas/:id/aceitacao": undefined,
  "PUT /api/tarefas/:id/itens/:numero/texto": { texto: "Texto de B." },
  "POST /api/tarefas/:id/itens/:numero/restaurar": {},
  "POST /api/tarefas/:id/itens/:numero/aprovar": {},
  "POST /api/tarefas/:id/itens/:numero/alertas/:tipo/reconhecer": {},
  "POST /api/tarefas/:id/itens/:numero/fonte": { fonte: 1 },
  "POST /api/tarefas/:id/itens/:numero/revisar": {},
  "PUT /api/tarefas/:id/itens/:numero/area": { area: "Jurídico" },
  "PUT /api/tarefas/:id/itens/:numero/avaliacao": { valor: "positiva" },
  "POST /api/tarefas/:id/finalizar": {},
  "POST /api/tarefas/:id/arquivar": {},
  "POST /api/tarefas/:id/reativar": {},
  "POST /api/tarefas/:id/itens/:numero/revisar-texto": { texto: Array.from({ length: 40 }, (_, i) => `palavra${i}`).join(" ") },
};
/** Rotas sem id de tarefa, cobertas pelos demais testes deste arquivo. */
const ROTAS_SEM_ID = [
  "GET /api/saude",
  "POST /api/auth/login",
  "GET /api/auth/me",
  "POST /api/auth/logout",
  "GET /api/base/documentos",
  "POST /api/base/documentos",
  "PATCH /api/base/documentos/:id",
  "GET /api/tarefas",
  "POST /api/tarefas",
  "GET /api/historico/tarefas",
  "GET /api/pessoas",
  "GET /api/usuarios",
  // Painel de Usuários (fase Q): a pessoa de outra organização responde 404 (abaixo e em gestaoDeUsuarios.test.ts).
  "GET /api/gestao/usuarios",
  "POST /api/gestao/usuarios",
  "PATCH /api/gestao/usuarios/:id",
];

describe("Cenário 79 · isolamento comprovado por teste", () => {
  it("a suíte cobre todas as rotas do servidor: uma rota nova sem teste de isolamento faz este teste falhar", () => {
    expect(rotasDoServidor()).toEqual([...Object.keys(ROTAS_DE_TAREFA), ...ROTAS_SEM_ID].sort());
  });

  it("toda rota com o id de uma tarefa de A responde 404 para uma pessoa de B, e nada de A muda", async () => {
    const cookie = await cookieDe(DE_B);
    const itensAntes = await listarItens(banco, tarefaDeA.id);
    for (const [rota, corpo] of Object.entries(ROTAS_DE_TAREFA)) {
      const [metodo, molde] = rota.split(" ") as ["GET" | "POST" | "PUT" | "DELETE", string];
      const url = molde.replace(":id", tarefaDeA.id).replace(":numero", "1").replace(":tipo", "conflict");
      const resposta = await pedir(cookie, metodo, url, corpo);
      expect({ rota, status: resposta.statusCode, erro: resposta.json().erro }).toEqual({ rota, status: 404, erro: MENSAGEM_DE_TAREFA_NAO_ENCONTRADA });
    }
    expect(await obterTarefa(banco, ORGANIZACAO_INICIAL, tarefaDeA.id)).not.toBeNull();
    expect(await listarItens(banco, tarefaDeA.id)).toEqual(itensAntes);
    expect(await listarEventos(banco, tarefaDeA.id)).toEqual([]);
    expect(api.geracoes.filter((pedido) => pedido.model === "claude-haiku-5-5" && JSON.stringify(pedido).includes("palavra0"))).toEqual([]);
  });

  it("a mesma rota responde para a pessoa de A, dona da tarefa", async () => {
    const cookie = await cookieDe(DE_A);
    expect((await pedir(cookie, "GET", `/api/tarefas/${tarefaDeA.id}/itens`)).statusCode).toBe(200);
    expect((await pedir(cookie, "GET", `/api/tarefas/${tarefaDeA.id}/empresa`)).json()).toMatchObject({ empresa: { nome: "Rede Varejo Alfa", cnpj: CNPJ } });
  });
});

describe("Cenários 66 a 69 · organização, perfis e sessão", () => {
  it("cria a organização com id UUID e recusa nome vazio ou repetido", async () => {
    expect(organizacaoB).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    await expect(criarOrganizacao(banco, "  ")).rejects.toThrow(ErroDeOrganizacao);
    await expect(criarOrganizacao(banco, "organização de teste b")).rejects.toThrow("Já existe uma organização");
  });

  it("um perfil não muda de organização: a mesma conta, ou o mesmo e-mail, em outra é recusada", async () => {
    await expect(gravarPerfil(banco, { ...DE_B, organizacaoId: ORGANIZACAO_INICIAL })).rejects.toThrow(ErroDeCadastro);
    await expect(gravarPerfil(banco, { ...DE_B, id: "66666666-6666-4666-8666-666666666666", organizacaoId: ORGANIZACAO_INICIAL })).rejects.toThrow("já pertence a outra organização");
    await gravarPerfil(banco, { ...DE_B, nome: "Bruna Costa", organizacaoId: organizacaoB });
  });

  it("login e /api/auth/me trazem a organização da sessão", async () => {
    const login = await servidor.inject({ method: "POST", url: "/api/auth/login", payload: { email: DE_B.email, senha: DE_B.senha } });
    expect(login.json()).toEqual({ pessoa: { nome: "Bruna Costa", papel: "Aprovador", areas: [] }, organizacao: { nome: "Organização de teste B" } });
    const cookie = String(login.headers["set-cookie"]).split(";")[0] ?? "";
    expect((await pedir(cookie, "GET", "/api/auth/me")).json()).toEqual({ pessoa: { nome: "Bruna Costa", papel: "Aprovador", areas: [] }, organizacao: { nome: "Organização de teste B" } });
  });

  it("organização informada no pedido é recusada; na URL ou em cabeçalho, ignorada", async () => {
    const cookie = await cookieDe(DE_B);
    const comCampo = await pedir(cookie, "POST", "/api/base/documentos", { organizacaoId: ORGANIZACAO_INICIAL, arquivos: [{ nome: "x.md", conteudoBase64: "" }] });
    expect(comCampo.statusCode).toBe(400);
    const naUrl = await servidor.inject({ method: "GET", url: `/api/base/documentos?organizacao=${ORGANIZACAO_INICIAL}`, headers: { cookie, "x-organizacao": ORGANIZACAO_INICIAL } });
    expect(naUrl.json()).toEqual({ documentos: [] });
  });

  it("organização desativada: login recusado com a mensagem de sempre e sessões abertas sem acesso", async () => {
    const cookie = await cookieDe(REVISOR_DE_B);
    await banco.query("UPDATE organizacoes SET ativa = false WHERE id = $1", [organizacaoB]);
    try {
      expect((await pedir(cookie, "GET", "/api/tarefas")).statusCode).toBe(401);
      const login = await servidor.inject({ method: "POST", url: "/api/auth/login", payload: { email: REVISOR_DE_B.email, senha: REVISOR_DE_B.senha } });
      expect({ status: login.statusCode, erro: login.json().erro }).toEqual({ status: 401, erro: "E-mail ou senha incorretos." });
    } finally {
      await banco.query("UPDATE organizacoes SET ativa = true WHERE id = $1", [organizacaoB]);
    }
  });
});

describe("Cenários 70 e 71 · base de conhecimento e geração isoladas", () => {
  it("B não vê a base de A, e o mesmo nome de arquivo é outro documento em B", async () => {
    const cookie = await cookieDe(DE_B);
    expect((await pedir(cookie, "GET", "/api/base/documentos")).json()).toEqual({ documentos: [] });

    const deA = await listarDocumentos(banco, ORGANIZACAO_INICIAL);
    const alvo = deA[0];
    if (alvo === undefined) throw new Error("base de A vazia");
    const conteudo = "---\ntitulo: Documento de B\ntipo: documento\natualizado_em: 2026-10-01\n---\n\n# Seção de B\n\nTexto só de B.\n\nOutro parágrafo, também só de B.\n";
    const envio = await pedir(cookie, "POST", "/api/base/documentos", { arquivos: [{ nome: alvo.nome, conteudoBase64: Buffer.from(conteudo).toString("base64") }] });
    expect(envio.statusCode).toBe(200);
    expect(envio.json().resumo.carregados).toEqual([alvo.nome]);
    expect(envio.json().documentos.map((documento: { titulo: string }) => documento.titulo)).toEqual(["Documento de B"]);
    // A continua com a própria versão do arquivo de mesmo nome.
    expect((await listarDocumentos(banco, ORGANIZACAO_INICIAL)).find((documento) => documento.nome === alvo.nome)).toEqual(alvo);

    const desativar = await pedir(cookie, "PATCH", `/api/base/documentos/${alvo.id}`, { ativo: false });
    expect({ status: desativar.statusCode, erro: desativar.json().erro }).toEqual({ status: 404, erro: "Documento não encontrado na base." });
    expect((await listarDocumentos(banco, ORGANIZACAO_INICIAL)).find((documento) => documento.id === alvo.id)?.ativo).toBe(true);
  });

  it("a geração de uma tarefa de B usa só os documentos ativos de B; com a base de B vazia, nada vai à IA", async () => {
    const vaziaB = await criarOrganizacao(banco, "Organização sem base");
    const semBase = await criarTarefaComPlanilha(tarefas, { organizacaoId: vaziaB.id, arquivo: "RFP-01.xlsx", planilha: new Uint8Array(await readFile(RFP)), dados: {} });
    const geracoesAntes = api.geracoes.length;
    await executarTarefa(tarefas, semBase);
    expect(api.geracoes.length).toBe(geracoesAntes);
    const itensSemBase = await listarItens(banco, semBase.id);
    expect(itensSemBase.length).toBeGreaterThan(0);
    expect(itensSemBase.every((item) => item.st === "sem-rascunho" && item.srcs.length === 0)).toBe(true);

    const deB = await criarTarefaComPlanilha(tarefas, { organizacaoId: organizacaoB, arquivo: "RFP-01.xlsx", planilha: new Uint8Array(await readFile(RFP)), dados: {} });
    await executarTarefa(tarefas, deB);
    const nomesDeB = new Set((await listarDocumentos(banco, organizacaoB)).map((documento) => documento.nome));
    const enviados = api.geracoes.slice(geracoesAntes).flatMap((pedido) => {
      const conteudo = pedido.messages[0]?.content;
      return Array.isArray(conteudo) ? conteudo.flatMap((bloco) => (bloco.type === "document" ? [bloco.title] : [])) : [];
    });
    expect(enviados.length).toBeGreaterThan(0);
    expect(new Set(enviados)).toEqual(new Set(["Documento de B"]));
    const fontes = (await listarItens(banco, deB.id)).flatMap((item) => item.srcs.map((fonte) => fonte.doc));
    expect(fontes.length).toBeGreaterThan(0);
    expect(fontes.every((nome) => nomesDeB.has(nome))).toBe(true);
  });
});

describe("Cenários 72 a 75 · tarefas, empresas, usuários e números da organização", () => {
  it("B cria e lista só as próprias tarefas; a de A não aparece", async () => {
    const cookie = await cookieDe(DE_B);
    const criada = await pedir(cookie, "POST", "/api/tarefas", {
      arquivo: { nome: "RFP-B.xlsx", conteudoBase64: (await readFile(RFP)).toString("base64") },
      dados: { nome: "RFP de B", empresa: "Rede Varejo Alfa", cnpj: CNPJ, responsavel: "Bruno Lima", contatos: [{ nome: "Beto de B", email: "ana@alfa.test" }] },
    });
    expect(criada.statusCode).toBe(202);
    const id = criada.json().tarefa.id as string;
    expect((await obterTarefa(banco, organizacaoB, id))?.organizacaoId).toBe(organizacaoB);
    expect(await obterTarefa(banco, ORGANIZACAO_INICIAL, id)).toBeNull();

    const lista = (await pedir(cookie, "GET", "/api/tarefas")).json().tarefas as { id: string }[];
    expect(lista.map((tarefa) => tarefa.id)).toContain(id);
    expect(lista.map((tarefa) => tarefa.id)).not.toContain(tarefaDeA.id);
    expect(JSON.stringify(lista)).not.toContain("organizacao");
    const listaDeA = (await pedir(await cookieDe(DE_A), "GET", "/api/tarefas")).json().tarefas as { id: string }[];
    expect(listaDeA.map((tarefa) => tarefa.id)).toEqual([tarefaDeA.id]);

    // Cenário 73: mesmo CNPJ, outra empresa; o contato de mesmo e-mail também é outro.
    expect((await pedir(cookie, "GET", `/api/tarefas/${id}/empresa`)).json()).toEqual({ empresa: { nome: "Rede Varejo Alfa", cnpj: CNPJ }, contatos: [{ nome: "Beto de B", cargo: "", telefone: "", email: "ana@alfa.test" }] });
    const { rows } = await banco.query<{ organizacao_id: string }>("SELECT organizacao_id FROM empresas WHERE cnpj = $1 ORDER BY organizacao_id", [CNPJ]);
    expect(rows.map((linha) => linha.organizacao_id).sort()).toEqual([ORGANIZACAO_INICIAL, organizacaoB].sort());
    const deA = await pedir(await cookieDe(DE_A), "GET", `/api/tarefas/${tarefaDeA.id}/empresa`);
    expect(deA.json().contatos).toEqual([{ nome: "Ana de A", cargo: "", telefone: "", email: "ana@alfa.test" }]);
  });

  it("usuários e responsável: só os perfis da organização", async () => {
    const cookie = await cookieDe(DE_B);
    expect((await pedir(cookie, "GET", "/api/usuarios")).json()).toEqual({ usuarios: [{ nome: "Bruna Costa", papel: "Aprovador" }, { nome: "Bruno Lima", papel: "Revisor" }] });
    expect((await pedir(cookie, "GET", "/api/pessoas")).json().pessoas.map((pessoa: { nome: string }) => pessoa.nome)).toEqual(["Bruna Costa"]);
    const comResponsavelDeA = await pedir(cookie, "POST", "/api/tarefas", {
      arquivo: { nome: "RFP-B.xlsx", conteudoBase64: (await readFile(RFP)).toString("base64") },
      dados: { nome: "RFP de B", responsavel: DE_A.nome },
    });
    expect({ status: comResponsavelDeA.statusCode, erro: comResponsavelDeA.json().erro }).toEqual({ status: 400, erro: "Responsável inválido: escolha um usuário da organização." });
  });

  it("gestão de usuários: B lista só os próprios perfis e não altera nem adiciona os de A (fase Q, Q10)", async () => {
    const cookie = await cookieDe(DE_B);
    const lista = (await pedir(cookie, "GET", "/api/gestao/usuarios")).json().usuarios as { email: string }[];
    expect(lista.map((u) => u.email)).toEqual([DE_B.email, REVISOR_DE_B.email]);
    const alterar = await pedir(cookie, "PATCH", `/api/gestao/usuarios/${DE_A.id}`, { ativo: false });
    expect({ status: alterar.statusCode, erro: alterar.json().erro }).toEqual({ status: 404, erro: "Pessoa não encontrada." });
    const adicionar = await pedir(cookie, "POST", "/api/gestao/usuarios", { nome: "Marcelo", email: DE_A.email });
    expect({ status: adicionar.statusCode, erro: adicionar.json().erro }).toEqual({ status: 409, erro: "Este e-mail não pode ser usado nesta organização." });
    expect((await banco.query<{ ativo: boolean }>("SELECT ativo FROM perfis WHERE id = $1", [DE_A.id])).rows[0]?.ativo).toBe(true);
  });
});

describe("Cenários 76 e 77 · arquivos e banco", () => {
  it("o arquivo da tarefa fica na pasta da organização e não é lido nem apagado por outra", async () => {
    expect(tarefaDeA.caminhoDaPlanilha.startsWith(`${ORGANIZACAO_INICIAL}/rfps/`)).toBe(true);
    expect(() => conferirDono(organizacaoB, tarefaDeA.caminhoDaPlanilha)).toThrow("Arquivo de outra organização.");
    await expect(tarefas.armazenamento.ler(organizacaoB, tarefaDeA.caminhoDaPlanilha)).rejects.toBeInstanceOf(ErroDeArmazenamento);
    await expect(tarefas.armazenamento.apagar(organizacaoB, tarefaDeA.caminhoDaPlanilha)).rejects.toBeInstanceOf(ErroDeArmazenamento);
    expect((await tarefas.armazenamento.ler(ORGANIZACAO_INICIAL, tarefaDeA.caminhoDaPlanilha)).byteLength).toBeGreaterThan(0);
    // Arquivo de antes da fase K, sem organização no caminho: só da organização inicial.
    expect(() => conferirDono(ORGANIZACAO_INICIAL, "rfps/0b032a65-1800-4c37-b4ec-b3040eb30ebe.xlsx")).not.toThrow();
    expect(() => conferirDono(organizacaoB, "rfps/0b032a65-1800-4c37-b4ec-b3040eb30ebe.xlsx")).toThrow("Arquivo de outra organização.");
  });

  it("o banco recusa registro sem organização e tarefa ligada a empresa de outra organização", async () => {
    await expect(banco.query("INSERT INTO organizacoes (nome) VALUES ('Org C') RETURNING id")).resolves.toBeDefined();
    await expect(banco.query("INSERT INTO documentos (nome, titulo, tipo, atualizado_em, hash, tamanho_bytes, tokens_estimados) VALUES ('x.md', 'X', 'documento', '2026-10-01', 'h', 1, 1)")).rejects.toThrow();
    const { rows } = await banco.query<{ id: number }>("SELECT id FROM empresas WHERE organizacao_id = $1", [ORGANIZACAO_INICIAL]);
    const deB = (await banco.query<{ id: string }>("SELECT id FROM tarefas WHERE organizacao_id = $1 LIMIT 1", [organizacaoB])).rows[0];
    await expect(banco.query("UPDATE tarefas SET empresa_id = $1 WHERE id = $2", [rows[0]?.id, deB?.id])).rejects.toThrow();
  });
});
