import { expect, test } from "@playwright/test";

/**
 * Cabeçalho com ordenação na tabela dos detalhes da tarefa (docs/mvp-resposta-rfp/spec/SPEC_FASE_P.md).
 * Com a API desligada, "Questionário de segurança — Banco Meridian" tem os 12 itens de exemplo de
 * src/workspace/data.js, todos da área Geral. A área e o "Minha área primeiro" usam uma API respondida
 * pelo próprio teste, como em e2e/areas.spec.js.
 */

async function entrar(page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 503, json: { erro: "Offline" } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await page.getByRole("button", { name: "Entrar na Tendra.ai" }).click();
}

async function irPara(page, tela) {
  if ((await page.viewportSize()).width < 900) await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page.getByRole("navigation", { name: "Workspace" }).getByText(tela, { exact: true }).click();
}

async function abrirDetalhes(page, nome = "Questionário de segurança") {
  await irPara(page, "Tarefas");
  const naTabela = page.getByRole("row", { name: `Abrir ${nome}` }).first();
  const noCartao = page.getByRole("button", { name: new RegExp(`^${nome}`) }).first();
  await ((await page.viewportSize()).width < 900 ? noCartao : naTabela).click();
}

const titulo = (page, nome) => page.getByRole("button", { name: new RegExp(`^Ordenar por ${nome}`) });
const cabecalho = (page, nome) => page.getByRole("columnheader").filter({ has: titulo(page, nome) });
const linhas = (page, total = 12) => page.locator('[role="button"]').filter({ hasText: new RegExp(`REQ-\\d{3}/${String(total).padStart(3, "0")}`) });
const ordem = async (page, total = 12) => (await linhas(page, total).allInnerTexts()).map((t) => Number(/REQ-(\d{3})/.exec(t)[1]));
const PADRAO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

test("Cenário P1: cabeçalho com Código, Pergunta, Área e Status, no padrão da Base", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  const titulos = await page.getByRole("columnheader").allInnerTexts();
  expect(titulos.map((t) => t.trim().toLowerCase())).toEqual(["código", "pergunta", "área", "status"]);
  const estilo = await page.getByRole("columnheader").first().locator("..").evaluate((el) => {
    const c = getComputedStyle(el);
    return { caixa: c.textTransform, fonte: c.fontSize, fundo: c.backgroundColor };
  });
  expect(estilo.caixa).toBe("uppercase");
  expect(estilo.fonte).toBe("11px");
  await expect(linhas(page).first()).toContainText("REQ-001/012");
  // Títulos alinhados às colunas: "Status" começa onde começa a etiqueta do estado.
  const xDoTitulo = (await cabecalho(page, "Status").boundingBox()).x;
  const xDaEtiqueta = (await linhas(page).first().getByText("Sugerida", { exact: true }).boundingBox()).x;
  expect(Math.abs(xDoTitulo - xDaEtiqueta)).toBeLessThan(24);
});

test("Cenário P2: alertas na coluna Status, sem coluna própria", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  const comAlerta = linhas(page).filter({ hasText: "REQ-002/012" });
  const caixaDoStatus = await cabecalho(page, "Status").boundingBox();
  const caixaDoAlerta = await comAlerta.getByText("1 alerta", { exact: true }).boundingBox();
  expect(caixaDoAlerta.x).toBeGreaterThanOrEqual(caixaDoStatus.x - 1);
  const colunas = await comAlerta.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(colunas).toBe(4);
  await expect(linhas(page).filter({ hasText: "REQ-001/012" })).not.toContainText("alerta");
});

test("Cenário P3: ordem padrão pelo número do requisito, sem título ordenado", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  expect(await ordem(page)).toEqual(PADRAO);
  for (const nome of ["Código", "Pergunta", "Área", "Status"]) await expect(cabecalho(page, nome)).toHaveAttribute("aria-sort", "none");
});

test("Cenário P4: crescente, decrescente e volta para a ordem padrão", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await titulo(page, "Pergunta").click();
  expect(await ordem(page)).toEqual([5, 12, 6, 3, 7, 2, 11, 8, 1, 10, 4, 9]);
  await expect(cabecalho(page, "Pergunta")).toHaveAttribute("aria-sort", "ascending");
  await titulo(page, "Pergunta").click();
  expect(await ordem(page)).toEqual([9, 4, 10, 1, 8, 11, 2, 7, 3, 6, 12, 5]);
  await expect(cabecalho(page, "Pergunta")).toHaveAttribute("aria-sort", "descending");
  await titulo(page, "Pergunta").click();
  expect(await ordem(page)).toEqual(PADRAO);
  await expect(cabecalho(page, "Pergunta")).toHaveAttribute("aria-sort", "none");
  // Outro título depois de um ordenado começa em ordem crescente.
  await titulo(page, "Pergunta").click();
  await titulo(page, "Status").click();
  await expect(cabecalho(page, "Status")).toHaveAttribute("aria-sort", "ascending");
  await expect(cabecalho(page, "Pergunta")).toHaveAttribute("aria-sort", "none");
});

test("Cenário P5: código pelo número e status na ordem do filtro, com empate pelo número", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await titulo(page, "Código").click();
  expect(await ordem(page)).toEqual(PADRAO);
  await titulo(page, "Código").click();
  expect(await ordem(page)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  await titulo(page, "Status").click();
  // aprovada, em revisão, revisada, sem rascunho, sugerida; empates pelo número.
  expect(await ordem(page)).toEqual([3, 10, 9, 12, 7, 8, 1, 2, 4, 5, 6, 11]);
  await titulo(page, "Status").click();
  expect(await ordem(page)).toEqual([1, 2, 4, 5, 6, 11, 8, 7, 9, 12, 3, 10]);
  // Todos os itens de exemplo são da área Geral: ordenar por Área deixa o empate pelo número.
  await titulo(page, "Área").click();
  expect(await ordem(page)).toEqual(PADRAO);
});

test("Cenário P6: ordenação junto com a busca e o filtro", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await titulo(page, "Código").click();
  await titulo(page, "Código").click();
  await page.getByRole("textbox", { name: "Buscar perguntas" }).fill("empresa");
  expect(await ordem(page)).toEqual([12, 6, 5]);
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /^Sugerida/ }).click();
  expect(await ordem(page)).toEqual([6, 5]);
  await expect(cabecalho(page, "Código")).toHaveAttribute("aria-sort", "descending");
});

test("Cenário P7: a ordenação vale só nos detalhes e volta ao padrão em outra tarefa", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await titulo(page, "Código").click();
  await titulo(page, "Código").click();
  expect((await ordem(page))[0]).toBe(12);
  await page.getByRole("button", { name: "Abrir revisão" }).click();
  // Lista da Revisão na ordem de hoje.
  await expect(page.getByText("12 de 12", { exact: true })).toBeVisible();
  expect(await ordem(page)).toEqual(PADRAO);
  // Clicar numa pergunta dos detalhes abre a Revisão nesse item.
  await irPara(page, "Tarefas");
  await abrirDetalhes(page);
  await expect(cabecalho(page, "Código")).toHaveAttribute("aria-sort", "descending");
  await linhas(page).filter({ hasText: "REQ-009/012" }).click();
  await expect(page.getByRole("heading", { name: "Qual é o SLA de disponibilidade mensal?" })).toBeVisible();
  // Outra tarefa abre na ordem padrão.
  await abrirDetalhes(page, "Questionário de privacidade");
  await expect(page.getByRole("columnheader").first()).toBeVisible();
  for (const nome of ["Código", "Pergunta", "Área", "Status"]) await expect(cabecalho(page, nome)).toHaveAttribute("aria-sort", "none");
});

test("Cenário P8: teclado e leitores de tela", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await titulo(page, "Pergunta").focus();
  await page.keyboard.press("Enter");
  await expect(cabecalho(page, "Pergunta")).toHaveAttribute("aria-sort", "ascending");
  await expect(titulo(page, "Pergunta")).toHaveAccessibleName("Ordenar por Pergunta, ordem crescente");
  await page.keyboard.press(" ");
  await expect(titulo(page, "Pergunta")).toHaveAccessibleName("Ordenar por Pergunta, ordem decrescente");
  await expect(titulo(page, "Área")).toHaveAccessibleName("Ordenar por Área");
  expect(await titulo(page, "Área").evaluate((el) => getComputedStyle(el).cursor)).toBe("pointer");
});

test("Cenário P9: celular sem cabeçalho, na ordem padrão e sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  await abrirDetalhes(page);
  await expect(linhas(page).first()).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveCount(0);
  expect(await ordem(page)).toEqual(PADRAO);
  await expect(linhas(page).filter({ hasText: "REQ-002/012" })).toContainText("1 alerta");
  const rolagemLateral = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(rolagemLateral).toBe(false);
});

test("Cenário P10: busca sem resultado com o cabeçalho visível e a ordenação mantida", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await titulo(page, "Pergunta").click();
  const busca = page.getByRole("textbox", { name: "Buscar perguntas" });
  await busca.fill("xyzinexistente");
  await expect(page.getByText("Nenhuma pergunta encontrada.", { exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveCount(4);
  const yDoCabecalho = (await cabecalho(page, "Pergunta").boundingBox()).y;
  expect((await page.getByText("Nenhuma pergunta encontrada.", { exact: true }).boundingBox()).y).toBeGreaterThan(yDoCabecalho);
  await busca.fill("");
  await expect(cabecalho(page, "Pergunta")).toHaveAttribute("aria-sort", "ascending");
  expect((await ordem(page))[0]).toBe(5);
});

test("Cenário P11: ordenar não faz requisições ao backend", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  const requisicoes = [];
  page.on("request", (pedido) => { if (pedido.url().includes("/api/")) requisicoes.push(pedido.url()); });
  for (let n = 0; n < 3; n++) await titulo(page, "Status").click();
  await titulo(page, "Área").click();
  await page.waitForTimeout(500);
  expect(requisicoes).toEqual([]);
});

// Área e "Minha área primeiro" com o Aprovador do Jurídico (P3 e P5), numa API respondida pelo teste.
const TAREFA = {
  id: "8f0e7c62-1b5a-4c3e-9d2f-6a7b8c9d0e1f", estado: "pronta", motivo: null, arquivo: "RFP.xlsx",
  dados: { nome: "RFP das áreas", empresa: "Banco Horizonte", prazo: "2026-11-20" },
  total: 4, processadas: 4, comportamento: null, criadaEm: "2026-11-04T12:00:00.000Z", concluidaEm: "2026-11-04T12:01:00.000Z"
};
const item = (numero, area, q) => ({ id: `r${numero}`, numero, aba: "RFP", linha: numero + 1, q, paras: [{ t: `Resposta ${numero}.`, s: [] }], srcs: [], alerts: [], st: "sugerida", orig: `Resposta ${numero}.`, area });
const ITENS = [
  item(1, "Tecnologia", "Qual é o SLA de disponibilidade da plataforma?"),
  item(2, "Jurídico", "A empresa aceita multa por descumprimento contratual?"),
  item(3, "Comercial", "Descreva a empresa em poucas linhas."),
  item(4, "Jurídico", "Qual o foro eleito para controvérsias?")
];

test("Cenários P3 e P5: Minha área primeiro na ordem padrão e ordenação por Área", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const caminho = new URL(route.request().url()).pathname, metodo = route.request().method();
    if (caminho === "/api/auth/me") return route.fulfill({ json: { pessoa: { nome: "Antônio Carlos", papel: "Aprovador", areas: ["Jurídico"] }, organizacao: { nome: "Vereda Documental" } } });
    if (caminho === "/api/tarefas" && metodo === "GET") return route.fulfill({ json: { tarefas: [TAREFA] } });
    if (caminho === `/api/tarefas/${TAREFA.id}/itens`) return route.fulfill({ json: { itens: ITENS } });
    if (caminho === "/api/base/documentos") return route.fulfill({ json: { documentos: [] } });
    if (caminho === "/api/pessoas") return route.fulfill({ json: { pessoas: [{ nome: "Antônio Carlos", papel: "Aprovador", areas: ["Jurídico"] }] } });
    if (caminho === "/api/usuarios") return route.fulfill({ json: { usuarios: [] } });
    if (caminho.endsWith("/eventos")) return route.fulfill({ json: { eventos: [] } });
    if (caminho.endsWith("/avaliacoes")) return route.fulfill({ json: { avaliacoes: [] } });
    return route.fulfill({ status: 404, json: { erro: "Sem resposta no teste." } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  const menu = page.getByRole("navigation", { name: "Workspace" });
  await expect(menu).toBeVisible({ timeout: 20_000 });
  await menu.getByText("Tarefas", { exact: true }).click();
  await page.getByText("RFP das áreas").first().click();
  await expect(linhas(page, 4).first()).toBeVisible();
  // P3: as do Jurídico primeiro, cada bloco pelo número.
  expect(await ordem(page, 4)).toEqual([2, 4, 1, 3]);
  // P5: Área em ordem alfabética (Comercial, Jurídico, Tecnologia), empate pelo número.
  await titulo(page, "Área").click();
  expect(await ordem(page, 4)).toEqual([3, 2, 4, 1]);
  await titulo(page, "Área").click();
  expect(await ordem(page, 4)).toEqual([1, 2, 4, 3]);
  // Terceiro clique: volta ao "Minha área primeiro".
  await titulo(page, "Área").click();
  expect(await ordem(page, 4)).toEqual([2, 4, 1, 3]);
});
