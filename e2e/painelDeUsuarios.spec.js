import { expect, test } from "@playwright/test";

/**
 * Painel de Usuários (docs/mvp-resposta-rfp/spec/SPEC_FASE_Q.md), com os dados de exemplo de
 * src/workspace/usuarios.js e a API desligada. No modo local, a pessoa padrão é Marcelo Vieira, Aprovador.
 */

async function entrar(page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 503, json: { erro: "Offline" } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await page.getByRole("button", { name: "Entrar na Tendra.ai" }).click();
}

const menu = (page) => page.getByRole("navigation", { name: "Workspace" });

async function abrirPainel(page) {
  if ((await page.viewportSize()).width < 900) await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await menu(page).getByText("Usuários", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Painel de Usuários" })).toBeVisible();
}

const linha = (page, nome) => page.getByRole("row").filter({ hasText: nome });
const nomes = async (page) => (await page.getByRole("row").filter({ has: page.locator("span") }).allInnerTexts())
  .map((t) => t.split("\n")[0]).filter((t) => !/^Pessoa/i.test(t));

test("Cenário Q1: menu Gestão de acessos só para o Aprovador, abaixo da Base de conhecimento", async ({ page }) => {
  await entrar(page);
  const textos = (await menu(page).innerText()).split("\n").map((t) => t.trim()).filter(Boolean);
  expect(textos.indexOf("Usuários")).toBeGreaterThan(textos.indexOf("Base de conhecimento"));
  await abrirPainel(page);
  await expect(page.getByText("Gestão de acessos", { exact: true }).first()).toBeVisible();
  // Trocar para Revisor: o menu some e a tela recusa o acesso.
  await page.getByRole("button", { name: /^Marcelo Vieira/ }).click();
  await page.getByRole("button", { name: "Trocar usuário" }).click();
  await expect(menu(page).getByText("Usuários", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Só o Aprovador gerencia usuários.", { exact: true })).toBeVisible();
});

test("Cenário Q2: lista com pessoa, papel, áreas, situação e ações", async ({ page }) => {
  await entrar(page);
  await abrirPainel(page);
  await expect(page.getByText("3 pessoas com acesso", { exact: true })).toBeVisible();
  const titulos = (await page.getByRole("columnheader").allInnerTexts()).map((t) => t.trim().toLowerCase());
  expect(titulos).toEqual(["pessoa", "papel", "áreas", "situação", "ações"]);
  expect(await nomes(page)).toEqual(["Carla Diretora", "Kadu Mendes", "Marcelo Vieira", "Paula Rocha"]);
  await expect(linha(page, "Kadu Mendes")).toContainText("Geral");
  await expect(linha(page, "Paula Rocha")).toContainText("Inativo");
  await expect(page.getByText("(você)")).toHaveCount(0);
});

test("Cenário Q2b: ordenação pelos títulos, menos Ações", async ({ page }) => {
  await entrar(page);
  await abrirPainel(page);
  const titulo = (nome) => page.getByRole("button", { name: new RegExp(`^Ordenar por ${nome}`) });
  await titulo("Papel").click();
  expect(await nomes(page)).toEqual(["Carla Diretora", "Marcelo Vieira", "Kadu Mendes", "Paula Rocha"]);
  await titulo("Papel").click();
  expect(await nomes(page)).toEqual(["Kadu Mendes", "Paula Rocha", "Carla Diretora", "Marcelo Vieira"]);
  await titulo("Papel").click();
  expect(await nomes(page)).toEqual(["Carla Diretora", "Kadu Mendes", "Marcelo Vieira", "Paula Rocha"]);
  await expect(page.getByRole("button", { name: /^Ordenar por Ações/ })).toHaveCount(0);
});

test("Cenários Q3 e Q4: formulário só depois do clique, recusas e usuário novo como Revisor, área Geral", async ({ page }) => {
  await entrar(page);
  await abrirPainel(page);
  await expect(page.getByLabel("Nome")).toHaveCount(0);
  await page.getByRole("button", { name: "Adicionar usuário" }).click();
  await expect(page.getByLabel("Nome")).toBeFocused();
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Informe o nome da pessoa.");
  await page.getByLabel("Nome").fill("Ana Souza");
  await page.getByLabel("E-mail da conta").fill("kadu.mendes@pulse.com.br");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Esta pessoa já está na lista.");
  await page.getByLabel("E-mail da conta").fill("ana.souza@pulse.com.br");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByLabel("Nome")).toHaveCount(0);
  await expect(linha(page, "Ana Souza")).toContainText("Geral");
  await expect(linha(page, "Ana Souza").getByLabel("Papel de Ana Souza")).toHaveValue("Revisor");
  await expect(page.getByText("4 pessoas com acesso", { exact: true })).toBeVisible();
  // Cancelar esconde o formulário.
  await page.getByRole("button", { name: "Adicionar usuário" }).click();
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByLabel("Nome")).toHaveCount(0);
});

test("Cenários Q5 e Q6: papel e áreas do Aprovador numa lista sobre as etiquetas", async ({ page }) => {
  await entrar(page);
  await abrirPainel(page);
  // Revisor: só a etiqueta Geral, sem o lápis.
  const lapis = (nome) => page.getByRole("button", { name: `Editar áreas de ${nome}` });
  await expect(lapis("Kadu Mendes")).toHaveCount(0);
  await linha(page, "Kadu Mendes").getByLabel("Papel de Kadu Mendes").selectOption("Aprovador");
  await expect(linha(page, "Kadu Mendes")).toContainText("Geral");
  await lapis("Kadu Mendes").click();
  const lista = page.getByRole("group", { name: "Áreas de Kadu Mendes" });
  await lista.getByText("Jurídico", { exact: true }).click();
  await lista.getByText("Comercial", { exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(lista).toHaveCount(0);
  await expect(linha(page, "Kadu Mendes")).toContainText("Jurídico");
  await expect(linha(page, "Kadu Mendes")).toContainText("Comercial");
  // C-Level não se combina com outras.
  await lapis("Kadu Mendes").click();
  await lista.getByText("C-Level", { exact: true }).click();
  await page.mouse.click(5, 5);
  await expect(lista).toHaveCount(0);
  await expect(linha(page, "Kadu Mendes")).toContainText("C-Level");
  await expect(linha(page, "Kadu Mendes")).not.toContainText("Jurídico");
  // Inativa: sem lápis. A própria linha (Marcelo Vieira) pode mudar as próprias áreas.
  await expect(lapis("Paula Rocha")).toHaveCount(0);
  await expect(lapis("Marcelo Vieira")).toBeVisible();
  // Aprovador → Revisor pede confirmação, remove as áreas e o lápis.
  await linha(page, "Kadu Mendes").getByLabel("Papel de Kadu Mendes").selectOption("Revisor");
  await expect(page.getByRole("alertdialog")).toContainText("Mudar Kadu Mendes para Revisor?");
  await page.getByRole("button", { name: "Mudar para Revisor" }).click();
  await expect(linha(page, "Kadu Mendes")).toContainText("Geral");
  await expect(lapis("Kadu Mendes")).toHaveCount(0);
});

test("Cenários Q7 e Q8: toggle do acesso e a própria linha protegida", async ({ page }) => {
  await entrar(page);
  await abrirPainel(page);
  const toggle = (nome) => linha(page, nome).getByRole("switch");
  await toggle("Kadu Mendes").click({ force: true });
  await expect(page.getByRole("alertdialog")).toContainText("Desativar o acesso de Kadu Mendes?");
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(toggle("Kadu Mendes")).toBeChecked();
  await toggle("Kadu Mendes").click({ force: true });
  await page.getByRole("button", { name: "Desativar acesso" }).click();
  await expect(toggle("Kadu Mendes")).not.toBeChecked();
  await expect(linha(page, "Kadu Mendes")).toContainText("Inativo");
  // Reativar não pede confirmação.
  await toggle("Paula Rocha").click({ force: true });
  await expect(toggle("Paula Rocha")).toBeChecked();
  await expect(linha(page, "Paula Rocha")).toContainText("Ativo");
  // Marcelo Vieira é quem está logado: papel e acesso desabilitados.
  await expect(toggle("Marcelo Vieira")).toBeDisabled();
  await expect(linha(page, "Marcelo Vieira").getByLabel("Papel de Marcelo Vieira")).toBeDisabled();
});

test("Cenário Q11: celular em cartões, sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  await abrirPainel(page);
  await expect(page.getByText("Carla Diretora", { exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveCount(0);
  const rolagemLateral = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(rolagemLateral).toBe(false);
});
