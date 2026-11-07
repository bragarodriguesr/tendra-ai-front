import { expect, test } from "@playwright/test";

/**
 * Filtro pela barra e pela legenda de estados nos detalhes da tarefa (docs/mvp-resposta-rfp/spec/SPEC_FASE_M.md):
 * com a API desligada, "Questionário de segurança — Banco Meridian" tem os 12 itens de exemplo de
 * src/workspace/data.js: 1 sem rascunho (REQ-008), 6 sugeridas, 2 em revisão, 1 revisada (REQ-007) e 2 aprovadas.
 */

async function entrar(page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 503, json: { erro: "Offline" } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await page.getByRole("button", { name: "Entrar na Tendra.ai" }).click();
}

async function irPara(page, tela) {
  // No celular, o menu lateral fica atrás do botão "Abrir menu".
  if ((await page.viewportSize()).width < 900) await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page.getByRole("navigation", { name: "Workspace" }).getByText(tela, { exact: true }).click();
}

async function abrirDetalhes(page) {
  await irPara(page, "Tarefas");
  // No computador a lista de tarefas é uma tabela; no celular, cartões clicáveis.
  const naTabela = page.getByRole("row", { name: "Abrir Questionário de segurança" }).first();
  const noCartao = page.getByRole("button", { name: /^Questionário de segurança Banco Meridian/ });
  await ((await page.viewportSize()).width < 900 ? noCartao : naTabela).click();
  await expect(page.getByRole("heading", { name: "Questionário de segurança — Banco Meridian" })).toBeVisible();
}

// O segmento da barra e o item da legenda têm o mesmo nome acessível; a barra vem antes na página.
const estado = (page, nome) => page.getByRole("button", { name: new RegExp(`^${nome}: \\d+ de 12 itens$`) });
const segmento = (page, nome) => estado(page, nome).first();
const legenda = (page, nome) => estado(page, nome).last();
const botaoDoFiltro = (page, texto) => page.getByRole("button", { name: new RegExp(`^${texto}$`) });
const linha = (page, codigo) => page.getByText(codigo, { exact: true });
const textoDoCartao = (page, texto) => expect(page.getByText(texto, { exact: true })).toBeVisible();
const numeroDoCartao = (page) => page.getByText(/^\d+ de 12$/);
const opacidade = (local) => local.evaluate((el) => getComputedStyle(el).opacity);

test("Cenário M1: clicar num segmento aplica o filtro do estado", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await segmento(page, "sem rascunho").click();
  await expect(linha(page, "REQ-008/012")).toBeVisible();
  await expect(linha(page, "REQ-001/012")).toHaveCount(0);
  await expect(botaoDoFiltro(page, "Sem rascunho 1")).toBeVisible();
  const outros = [["sugerida", "Sugerida 6"], ["em revisão", "Em revisão 2"], ["revisada", "Revisada 1"], ["aprovada", "Aprovada 2"]];
  for (const [nome, filtro] of outros) {
    await segmento(page, nome).click();
    await expect(botaoDoFiltro(page, filtro)).toBeVisible();
  }
});

test("Cenário M2: clicar num item da legenda aplica o mesmo filtro", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await legenda(page, "revisada").getByText("revisada", { exact: true }).click();
  await expect(linha(page, "REQ-007/012")).toBeVisible();
  await expect(linha(page, "REQ-008/012")).toHaveCount(0);
  await expect(botaoDoFiltro(page, "Revisada 1")).toBeVisible();
  await legenda(page, "sem rascunho").getByText("1", { exact: true }).click();
  await expect(botaoDoFiltro(page, "Sem rascunho 1")).toBeVisible();
});

test("Cenário M3: clicar de novo no estado filtrado volta para Todos", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await segmento(page, "sem rascunho").click();
  await segmento(page, "sem rascunho").click();
  await expect(botaoDoFiltro(page, "Todos 12")).toHaveAttribute("aria-pressed", "true");
  await expect(linha(page, "REQ-001/012")).toBeVisible();
  // Filtrado pelo menu, o clique no mesmo estado também volta para Todos.
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /^Aprovada/ }).click();
  await legenda(page, "aprovada").click();
  await expect(botaoDoFiltro(page, "Todos 12")).toHaveAttribute("aria-pressed", "true");
});

test("Cenário M4: clicar em outro estado troca o filtro direto", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await segmento(page, "sugerida").click();
  await legenda(page, "em revisão").click();
  await expect(botaoDoFiltro(page, "Em revisão 2")).toBeVisible();
  await expect(linha(page, "REQ-009/012")).toBeVisible();
  await expect(linha(page, "REQ-002/012")).toHaveCount(0);
});

test("Cenário M5: os outros estados esmaecem, inclusive com o filtro do menu", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  expect(await opacidade(segmento(page, "sugerida"))).toBe("1");
  expect(await opacidade(legenda(page, "sugerida"))).toBe("1");
  await segmento(page, "sem rascunho").click();
  await expect.poll(() => opacidade(segmento(page, "sugerida"))).toBe("0.42");
  await expect.poll(() => opacidade(legenda(page, "aprovada"))).toBe("0.42");
  expect(await opacidade(segmento(page, "sem rascunho"))).toBe("1");
  expect(await opacidade(legenda(page, "sem rascunho"))).toBe("1");
  await botaoDoFiltro(page, "Todos 12").click();
  await expect.poll(() => opacidade(segmento(page, "sugerida"))).toBe("1");
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /^Revisada/ }).click();
  await expect.poll(() => opacidade(segmento(page, "sugerida"))).toBe("0.42");
  expect(await opacidade(segmento(page, "revisada"))).toBe("1");
  await expect(segmento(page, "revisada")).toHaveAttribute("aria-pressed", "true");
});

test("Cenário M6: o mesmo filtro na Revisão, junto com a busca", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await page.getByRole("textbox", { name: "Buscar perguntas" }).fill("logs");
  await segmento(page, "aprovada").click();
  await expect(linha(page, "REQ-010/012")).toBeVisible();
  await expect(linha(page, "REQ-003/012")).toHaveCount(0);
  await page.getByRole("button", { name: "Abrir revisão" }).click();
  await expect(botaoDoFiltro(page, "Aprovada 2")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Buscar perguntas" })).toHaveValue("logs");
});

test("Cenário M6: clicar numa pergunta da tabela abre a Revisão com o mesmo filtro", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await legenda(page, "sugerida").click();
  await linha(page, "REQ-006/012").click();
  await expect(botaoDoFiltro(page, "Sugerida 6")).toBeVisible();
  await expect(page.getByText("6 de 12", { exact: true })).toBeVisible();
  await expect(page.getByText("A empresa possui relatório SOC 2 Type II vigente?", { exact: true }).last()).toBeVisible();
  await expect(linha(page, "REQ-003/012")).toHaveCount(0);
});

test("Cenário M6: filtro do menu mantido ao abrir a Revisão pelo menu lateral", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /^Revisada/ }).click();
  await irPara(page, "Revisão");
  await expect(botaoDoFiltro(page, "Revisada 1")).toBeVisible();
  await expect(page.getByText("1 de 12", { exact: true })).toBeVisible();
  await expect(linha(page, "REQ-008/012")).toHaveCount(0);
});

test("Cenário M7: o número do cartão segue o filtro, sem mudar com a busca", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await textoDoCartao(page, "itens aprovados");
  await expect(numeroDoCartao(page)).toHaveText("2 de 12");
  await segmento(page, "sem rascunho").click();
  await textoDoCartao(page, "itens sem rascunho");
  await expect(numeroDoCartao(page)).toHaveText("1 de 12");
  for (const [nome, texto] of [["sugerida", "itens sugeridos"], ["em revisão", "itens em revisão"], ["revisada", "itens revisados"], ["aprovada", "itens aprovados"]]) {
    await segmento(page, nome).click();
    await textoDoCartao(page, texto);
  }
  await segmento(page, "sugerida").click();
  await page.getByRole("textbox", { name: "Buscar perguntas" }).fill("SOC 2");
  await textoDoCartao(page, "itens sugeridos");
  await expect(numeroDoCartao(page)).toHaveText("6 de 12");
  await botaoDoFiltro(page, "Todos 12").click();
  await textoDoCartao(page, "itens aprovados");
});

test("Cenário M8: legenda, barra e menu mantêm os números", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  const larguraAntes = (await segmento(page, "sugerida").boundingBox()).width;
  await segmento(page, "revisada").click();
  await expect(estado(page, "sugerida")).toHaveCount(2);
  await expect(legenda(page, "sugerida")).toHaveText("6sugerida");
  expect((await segmento(page, "sugerida").boundingBox()).width).toBeCloseTo(larguraAntes, 0);
  await page.getByRole("button", { name: "Revisada 1", exact: true }).click();
  await expect(page.getByRole("menuitemradio", { name: /^Sugerida/ })).toContainText("6");
});

test("Cenário M9: estado sem itens na legenda não é clicável", async ({ page }) => {
  await entrar(page);
  // Painel de demo: aprova todos os itens, e os outros quatro estados ficam com 0.
  await page.getByRole("button", { name: "Aprovar todos os itens", exact: true }).click();
  await abrirDetalhes(page);
  await expect(estado(page, "sem rascunho")).toHaveCount(0);
  const semItens = page.getByText("sem rascunho", { exact: true });
  await semItens.click();
  await expect(botaoDoFiltro(page, "Todos 12")).toHaveAttribute("aria-pressed", "true");
  await textoDoCartao(page, "itens aprovados");
  // Fora da ordem do Tab: depois do segmento único da barra, o foco vai para "aprovada" na legenda.
  await segmento(page, "aprovada").focus();
  await page.keyboard.press("Tab");
  await expect(legenda(page, "aprovada")).toBeFocused();
  // Filtrado pelo menu, os demais esmaecem e o item sem itens continua sem clique.
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /^Sem rascunho/ }).click();
  await expect.poll(() => opacidade(legenda(page, "aprovada"))).toBe("0.42");
  await expect(estado(page, "sem rascunho")).toHaveCount(0);
});

test("Cenário M10: teclado e leitores de tela", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await segmento(page, "sem rascunho").focus();
  await page.keyboard.press("Enter");
  await expect(botaoDoFiltro(page, "Sem rascunho 1")).toBeVisible();
  await expect(segmento(page, "sem rascunho")).toHaveAttribute("aria-pressed", "true");
  await expect(legenda(page, "sem rascunho")).toHaveAttribute("aria-pressed", "true");
  await expect(legenda(page, "sugerida")).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press(" ");
  await expect(botaoDoFiltro(page, "Todos 12")).toHaveAttribute("aria-pressed", "true");
  await legenda(page, "revisada").focus();
  await page.keyboard.press("Enter");
  await expect(botaoDoFiltro(page, "Revisada 1")).toBeVisible();
  // A dica continua ao passar o mouse, e o cursor indica o clique.
  await segmento(page, "sugerida").hover();
  await expect(page.getByRole("tooltip")).toContainText("sugerida: 6 de 12 itens");
  expect(await segmento(page, "sugerida").evaluate((el) => getComputedStyle(el).cursor)).toBe("pointer");
  expect(await legenda(page, "sugerida").evaluate((el) => getComputedStyle(el).cursor)).toBe("pointer");
});

test("Cenário M11: celular, sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  await abrirDetalhes(page);
  await legenda(page, "sem rascunho").click();
  await expect(linha(page, "REQ-008/012")).toBeVisible();
  await textoDoCartao(page, "itens sem rascunho");
  await segmento(page, "sem rascunho").click();
  await expect(botaoDoFiltro(page, "Todos 12")).toHaveAttribute("aria-pressed", "true");
  const rolagemLateral = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(rolagemLateral).toBe(false);
});

test("Cenário M12: clicar não faz requisições ao backend", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  const requisicoes = [];
  page.on("request", (pedido) => { if (pedido.url().includes("/api/")) requisicoes.push(pedido.url()); });
  await segmento(page, "sugerida").click();
  await legenda(page, "aprovada").click();
  await legenda(page, "aprovada").click();
  await page.waitForTimeout(500);
  expect(requisicoes).toEqual([]);
});

test("Cenário M13: ordem alfabética no filtro, na barra e na legenda", async ({ page }) => {
  await entrar(page);
  await abrirDetalhes(page);
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  const opcoes = await page.getByRole("menuitemradio").allTextContents();
  expect(opcoes.map((t) => t.replace(/\d+$/, ""))).toEqual(["Alerta pendente", "Aprovada", "Em revisão", "Revisada", "Sem rascunho", "Sugerida"]);
  await page.keyboard.press("Escape");
  const nomes = await page.getByRole("button", { name: / de 12 itens$/ }).evaluateAll((els) => els.map((el) => el.getAttribute("aria-label").split(":")[0]));
  const ordem = ["aprovada", "em revisão", "revisada", "sem rascunho", "sugerida"];
  // Os cinco segmentos da barra vêm antes dos cinco itens da legenda.
  expect(nomes).toEqual([...ordem, ...ordem]);
  // A Revisão usa o mesmo menu.
  await page.getByRole("button", { name: "Abrir revisão" }).click();
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  const naRevisao = await page.getByRole("menuitemradio").allTextContents();
  expect(naRevisao.map((t) => t.replace(/\d+$/, ""))).toEqual(["Alerta pendente", "Aprovada", "Em revisão", "Revisada", "Sem rascunho", "Sugerida"]);
});

test("Fora de escopo: a barra do Dashboard continua só informativa", async ({ page }) => {
  await entrar(page);
  await irPara(page, "Dashboard");
  await expect(page.locator('[aria-label$=" tarefas"]').first()).toBeVisible();
  await expect(page.getByRole("button", { name: / de \d+ tarefas$/ })).toHaveCount(0);
  expect(await page.locator('[aria-label$=" tarefas"]').first().evaluate((el) => getComputedStyle(el).cursor)).not.toBe("pointer");
});
