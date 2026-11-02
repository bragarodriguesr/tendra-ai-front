import { expect, test } from "@playwright/test";

/**
 * Busca de perguntas na Revisão e nos detalhes da tarefa (docs/mvp-resposta-rfp/spec/SPEC_FASE_L.md):
 * com a API desligada, as duas telas mostram os 12 itens de exemplo de src/workspace/data.js.
 */

async function abrirRevisao(page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 503, json: { erro: "Offline" } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await page.getByRole("button", { name: "Entrar no Tendra.ai" }).click();
  // No celular, o menu lateral fica atrás do botão "Abrir menu".
  if ((await page.viewportSize()).width < 900) await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page.getByRole("navigation", { name: "Workspace" }).getByText("Revisão", { exact: true }).click();
  await expect(page.getByText("12 de 12", { exact: true })).toBeVisible();
}

const campo = (page) => page.getByRole("textbox", { name: "Buscar perguntas" });
const contagem = (page, texto) => expect(page.getByText(texto, { exact: true })).toBeVisible();
const linha = (page, codigo) => page.getByText(codigo, { exact: true });

test("Cenário B1: barra de busca entre o nome da tarefa e o filtro", async ({ page }) => {
  await abrirRevisao(page);
  const busca = campo(page);
  await expect(busca).toBeVisible();
  await expect(busca).toHaveAttribute("placeholder", "Buscar por palavras ou código");
  const caixaDoNome = await page.getByText("Questionário de segurança — Banco Meridian", { exact: true }).first().boundingBox();
  const caixaDaBusca = await busca.boundingBox();
  const caixaDoFiltro = await page.getByRole("button", { name: /^Todos/ }).boundingBox();
  expect(caixaDaBusca.y).toBeGreaterThan(caixaDoNome.y);
  expect(caixaDaBusca.y).toBeLessThan(caixaDoFiltro.y);
});

test("Cenário B2: uma palavra, sem diferenciar maiúsculas, acentos e com trecho de palavra", async ({ page }) => {
  await abrirRevisao(page);
  await campo(page).fill("CRIPTOGRAF");
  await contagem(page, "1 de 12");
  await expect(linha(page, "REQ-001/012")).toBeVisible();
  await campo(page).fill("trafego");
  await contagem(page, "1 de 12");
  await expect(linha(page, "REQ-002/012")).toBeVisible();
});

test("Cenário B3: busca no texto completo, inclusive depois do corte da lista", async ({ page }) => {
  await abrirRevisao(page);
  await campo(page).fill("contratuais");
  await contagem(page, "1 de 12");
  await expect(linha(page, "REQ-005/012")).toBeVisible();
  // A linha mostra o texto cortado, sem a palavra buscada.
  await expect(page.getByText("A empresa assume responsabilidade civil por vazamentos e multas co…", { exact: true })).toBeVisible();
});

test("Cenário B4: busca pelo código do item", async ({ page }) => {
  await abrirRevisao(page);
  await campo(page).fill("req-007");
  await contagem(page, "1 de 12");
  await expect(linha(page, "REQ-007/012")).toBeVisible();
});

test("Cenário B5: várias palavras, em qualquer ordem, com espaços repetidos", async ({ page }) => {
  await abrirRevisao(page);
  await campo(page).fill("empresa seguro");
  await contagem(page, "1 de 12");
  await expect(linha(page, "REQ-012/012")).toBeVisible();
  await campo(page).fill("  seguro    empresa ");
  await contagem(page, "1 de 12");
  await expect(linha(page, "REQ-012/012")).toBeVisible();
});

test("Cenário B6: busca junto com o filtro, sem mudar os números do filtro", async ({ page }) => {
  await abrirRevisao(page);
  await page.getByRole("button", { name: /Filtrar/ }).click();
  await page.getByRole("menuitemradio", { name: /Aprovada/ }).click();
  await contagem(page, "2 de 12");
  await campo(page).fill("logs");
  await contagem(page, "1 de 12");
  await expect(linha(page, "REQ-010/012")).toBeVisible();
  await campo(page).fill("criptograf");
  await contagem(page, "0 de 12");
  await page.getByRole("button", { name: /^Todos/ }).click();
  await expect(campo(page)).toHaveValue("criptograf");
  await contagem(page, "1 de 12");
  await expect(page.getByRole("button", { name: /^Todos/ })).toContainText("12");
});

test("Cenário B7: nenhuma pergunta encontrada", async ({ page }) => {
  await abrirRevisao(page);
  await campo(page).fill("dados xyzinexistente");
  await contagem(page, "0 de 12");
  await expect(page.getByText("Nenhuma pergunta encontrada.", { exact: true })).toBeVisible();
  await expect(page.getByText("Confira as palavras ou limpe a busca.", { exact: true })).toBeVisible();
});

test("Cenário B8: apagar, Esc e busca só com espaços", async ({ page }) => {
  await abrirRevisao(page);
  await campo(page).fill("criptograf");
  await contagem(page, "1 de 12");
  await campo(page).fill("");
  await contagem(page, "12 de 12");
  await campo(page).fill("criptograf");
  await campo(page).press("Escape");
  await expect(campo(page)).toHaveValue("");
  await contagem(page, "12 de 12");
  await campo(page).fill("   ");
  await contagem(page, "12 de 12");
});

test("Cenário B9: item aberto e navegação não mudam com a busca", async ({ page }) => {
  await abrirRevisao(page);
  const titulo = page.getByRole("heading", { name: "Quais são o RPO e o RTO do ambiente de produção?" });
  await expect(titulo).toBeVisible();
  await campo(page).fill("criptograf");
  await contagem(page, "1 de 12");
  await expect(titulo).toBeVisible();
  await page.getByRole("button", { name: "Próximo item" }).click();
  await expect(page.getByRole("heading", { name: "A empresa assume responsabilidade civil por vazamentos e multas contratuais?" })).toBeVisible();
  await linha(page, "REQ-001/012").click();
  await expect(page.getByRole("heading", { name: "Os dados de clientes em repouso são criptografados?" })).toBeVisible();
});

test("Cenário B10: a busca começa vazia em outra tarefa", async ({ page }) => {
  await abrirRevisao(page);
  await campo(page).fill("criptograf");
  await page.getByRole("navigation", { name: "Workspace" }).getByText("Tarefas", { exact: true }).click();
  await page.getByRole("row", { name: "Abrir Questionário de privacidade" }).click();
  await page.getByRole("button", { name: "Abrir revisão" }).click();
  await expect(page.getByText("Questionário de privacidade — Nimbus Telecom", { exact: true }).first()).toBeVisible();
  await expect(campo(page)).toHaveValue("");
});

test("Cenário B11: celular, sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirRevisao(page);
  await campo(page).fill("criptograf");
  await contagem(page, "1 de 12");
  await campo(page).fill("xyzinexistente");
  await expect(page.getByText("Nenhuma pergunta encontrada.", { exact: true })).toBeVisible();
  const rolagemLateral = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(rolagemLateral).toBe(false);
});

test("Cenário B12: digitar não faz requisições ao backend", async ({ page }) => {
  await abrirRevisao(page);
  const requisicoes = [];
  page.on("request", (pedido) => { if (pedido.url().includes("/api/")) requisicoes.push(pedido.url()); });
  await campo(page).pressSequentially("dados criptograf", { delay: 20 });
  await campo(page).fill("");
  await campo(page).fill("logs");
  await campo(page).press("Escape");
  await page.waitForTimeout(500);
  expect(requisicoes).toEqual([]);
});

// Detalhes da tarefa (cenários B13 a B17): a tarefa de exemplo "Questionário de segurança — Banco Meridian".

async function abrirDetalhes(page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 503, json: { erro: "Offline" } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await page.getByRole("button", { name: "Entrar no Tendra.ai" }).click();
  if ((await page.viewportSize()).width < 900) await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page.getByRole("navigation", { name: "Workspace" }).getByText("Tarefas", { exact: true }).click();
  // No computador a lista de tarefas é uma tabela; no celular, cartões clicáveis.
  const naTabela = page.getByRole("row", { name: "Abrir Questionário de segurança" }).first();
  const noCartao = page.getByRole("button", { name: /^Questionário de segurança Banco Meridian/ });
  await ((await page.viewportSize()).width < 900 ? noCartao : naTabela).click();
  await expect(page.getByRole("heading", { name: "Questionário de segurança — Banco Meridian" })).toBeVisible();
}

const filtroTodos = (page) => page.getByRole("button", { name: /^Todos/ });

test("Cenário B13: barra de busca à esquerda e filtro à direita, na mesma linha", async ({ page }) => {
  await abrirDetalhes(page);
  const busca = campo(page);
  await expect(busca).toHaveAttribute("placeholder", "Buscar por palavras ou código");
  const caixaDaBusca = await busca.boundingBox();
  const caixaDoTodos = await filtroTodos(page).boundingBox();
  expect(Math.abs(caixaDaBusca.y + caixaDaBusca.height / 2 - (caixaDoTodos.y + caixaDoTodos.height / 2))).toBeLessThan(6);
  expect(caixaDaBusca.x + caixaDaBusca.width).toBeLessThan(caixaDoTodos.x);
});

test("Cenário B14: tabela filtrada pela busca, sem mudar os números", async ({ page }) => {
  await abrirDetalhes(page);
  await campo(page).fill("LOGS");
  await expect(linha(page, "REQ-010/012")).toBeVisible();
  await expect(linha(page, "REQ-001/012")).toHaveCount(0);
  await expect(filtroTodos(page)).toContainText("12");
  await expect(page.getByText("itens aprovados", { exact: true })).toBeVisible();
  await campo(page).press("Escape");
  await expect(campo(page)).toHaveValue("");
  await expect(linha(page, "REQ-001/012")).toBeVisible();
});

test("Cenário B15: nenhuma pergunta encontrada, nos detalhes", async ({ page }) => {
  await abrirDetalhes(page);
  await campo(page).fill("xyzinexistente");
  await expect(page.getByText("Nenhuma pergunta encontrada.", { exact: true })).toBeVisible();
  await expect(page.getByText("Confira as palavras ou limpe a busca.", { exact: true })).toBeVisible();
});

test("Cenário B16: mesma busca nos detalhes e na Revisão", async ({ page }) => {
  await abrirDetalhes(page);
  await campo(page).fill("logs");
  await linha(page, "REQ-010/012").click();
  await expect(page.getByRole("heading", { name: "Por quanto tempo os logs de auditoria são retidos?" })).toBeVisible();
  await expect(campo(page)).toHaveValue("logs");
  await contagem(page, "1 de 12");
  // Na Revisão, outra busca; de volta aos detalhes da mesma tarefa, ela continua aplicada.
  await campo(page).fill("criptograf");
  await page.getByRole("navigation", { name: "Workspace" }).getByText("Tarefas", { exact: true }).click();
  await page.getByRole("row", { name: "Abrir Questionário de segurança" }).first().click();
  await expect(campo(page)).toHaveValue("criptograf");
  await expect(linha(page, "REQ-001/012")).toBeVisible();
  await expect(linha(page, "REQ-010/012")).toHaveCount(0);
  // "Abrir revisão" também mantém a busca.
  await page.getByRole("button", { name: "Abrir revisão" }).click();
  await expect(campo(page)).toHaveValue("criptograf");
  await contagem(page, "1 de 12");
});

test("Cenário B17: detalhes no celular, busca acima do filtro e sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirDetalhes(page);
  const caixaDaBusca = await campo(page).boundingBox();
  const caixaDoFiltro = await page.getByRole("button", { name: /Filtrar/ }).boundingBox();
  expect(caixaDaBusca.y + caixaDaBusca.height).toBeLessThan(caixaDoFiltro.y + 1);
  await campo(page).fill("logs");
  await expect(linha(page, "REQ-010/012")).toBeVisible();
  await campo(page).fill("xyzinexistente");
  await expect(page.getByText("Nenhuma pergunta encontrada.", { exact: true })).toBeVisible();
  const rolagemLateral = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(rolagemLateral).toBe(false);
});

test("Cenário B12: digitar nos detalhes também não faz requisições ao backend", async ({ page }) => {
  await abrirDetalhes(page);
  const requisicoes = [];
  page.on("request", (pedido) => { if (pedido.url().includes("/api/")) requisicoes.push(pedido.url()); });
  await campo(page).pressSequentially("dados criptograf", { delay: 20 });
  await campo(page).press("Escape");
  await page.waitForTimeout(500);
  expect(requisicoes).toEqual([]);
});
