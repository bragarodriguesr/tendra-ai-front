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

// Modo compartilhado (etapa Q4 de plan/PLAN_FASE_Q.md): a API é respondida pelo teste, como em
// e2e/areas.spec.js. A lista vem de /api/gestao/usuarios; os dados de exemplo não aparecem.
const EU = { id: "11111111-1111-4111-8111-111111111111", nome: "Antônio Carlos", email: "antonio@vereda.test", papel: "Aprovador", areas: ["Jurídico"], ativo: true, propria: true };
const HOMONIMO = { id: "22222222-2222-4222-8222-222222222222", nome: "Antônio Carlos", email: "antonio.c@vereda.test", papel: "Aprovador", areas: [], ativo: true, propria: false };
const REVISORA = { id: "33333333-3333-4333-8333-333333333333", nome: "Beatriz Lima", email: "beatriz@vereda.test", papel: "Revisor", areas: [], ativo: true, propria: false };
// Áreas vindas da rota (DF7): sem Produto, para provar que a lista suspensa usa a resposta.
const AREAS_DA_ROTA = ["Tecnologia", "Comercial", "Jurídico", "C-Level"];

async function entrarNoPublicado(page, { falharLista = false } = {}) {
  const estado = { usuarios: [EU, HOMONIMO, REVISORA].map((u) => ({ ...u })), alteracoes: [], adicoes: [], falharPatch: false, falharLista };
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url()), caminho = url.pathname, metodo = route.request().method();
    if (caminho === "/api/auth/me") return route.fulfill({ json: { pessoa: { nome: EU.nome, papel: "Aprovador", areas: EU.areas }, organizacao: { nome: "Vereda Documental" } } });
    if (caminho === "/api/gestao/usuarios" && metodo === "GET") {
      if (estado.falharLista) return route.fulfill({ status: 503, json: { erro: "O serviço está fora do ar." } });
      return route.fulfill({ json: { usuarios: estado.usuarios, areasDoAprovador: AREAS_DA_ROTA } });
    }
    if (caminho === "/api/gestao/usuarios" && metodo === "POST") {
      const corpo = route.request().postDataJSON();
      estado.adicoes.push(corpo);
      if (corpo.email === "sem.conta@vereda.test") return route.fulfill({ status: 404, json: { erro: "Não há conta com este e-mail. Crie a conta no painel do Supabase (Authentication → Add user) e tente de novo." } });
      if (corpo.email === "outra@vereda.test") return route.fulfill({ status: 409, json: { erro: "Este e-mail não pode ser usado nesta organização." } });
      const novo = { id: "44444444-4444-4444-8444-444444444444", nome: corpo.nome.trim(), email: corpo.email, papel: "Revisor", areas: [], ativo: true, propria: false };
      estado.usuarios.push(novo);
      return route.fulfill({ status: 201, json: { usuario: novo } });
    }
    const patch = /^\/api\/gestao\/usuarios\/([^/]+)$/.exec(caminho);
    if (patch && metodo === "PATCH") {
      const mudanca = route.request().postDataJSON();
      estado.alteracoes.push({ id: patch[1], mudanca });
      if (estado.falharPatch) return route.fulfill({ status: 503, json: { erro: "O serviço está fora do ar." } });
      estado.usuarios = estado.usuarios.map((u) => (u.id === patch[1] ? { ...u, ...mudanca, ...(mudanca.papel === "Revisor" ? { areas: [] } : null) } : u));
      return route.fulfill({ json: { usuario: estado.usuarios.find((u) => u.id === patch[1]) } });
    }
    if (caminho === "/api/tarefas") return route.fulfill({ json: { tarefas: [] } });
    if (caminho === "/api/base/documentos") return route.fulfill({ json: { documentos: [{ id: 1, nome: "politica.md", titulo: "Política", tipo: "documento", atualizadoEm: "2026-10-01", ativo: true }] } });
    if (caminho === "/api/pessoas") return route.fulfill({ json: { pessoas: [{ nome: EU.nome, papel: "Aprovador", areas: EU.areas }] } });
    if (caminho === "/api/usuarios") return route.fulfill({ json: { usuarios: [] } });
    if (caminho === "/api/historico/tarefas") return route.fulfill({ json: { eventos: [] } });
    return route.fulfill({ status: 404, json: { erro: "Sem resposta no teste." } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await expect(menu(page)).toBeVisible({ timeout: 20_000 });
  await abrirPainel(page);
  return estado;
}

const linhaPorEmail = (page, email) => page.getByRole("row").filter({ hasText: email });

test("Publicado Q2 e Q8: lista da rota, sem dados de exemplo, e a própria linha pelo perfil da sessão", async ({ page }) => {
  await entrarNoPublicado(page);
  await expect(linhaPorEmail(page, REVISORA.email)).toBeVisible();
  await expect(page.getByText("Carla Diretora")).toHaveCount(0);
  await expect(page.getByText("Paula Rocha")).toHaveCount(0);
  await expect(page.getByText(/^Dados de exemplo/)).toHaveCount(0);
  await expect(page.getByText("3 pessoas com acesso", { exact: true })).toBeVisible();
  // Dois "Antônio Carlos": só a linha da sessão fica bloqueada (DF3).
  await expect(linhaPorEmail(page, EU.email).getByRole("switch")).toBeDisabled();
  await expect(linhaPorEmail(page, HOMONIMO.email).getByRole("switch")).toBeEnabled();
});

test("Publicado Q3, Q4 e Q13: adicionar pela rota, com as recusas do backend", async ({ page }) => {
  const estado = await entrarNoPublicado(page);
  await page.getByRole("button", { name: "Adicionar usuário" }).click();
  await page.getByLabel("Nome").fill("Sem Conta");
  await page.getByLabel("E-mail da conta").fill("sem.conta@vereda.test");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(/Não há conta com este e-mail/);
  await page.getByLabel("E-mail da conta").fill("outra@vereda.test");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Este e-mail não pode ser usado nesta organização.");
  await page.getByLabel("Nome").fill("Ana Souza");
  await page.getByLabel("E-mail da conta").fill("ana@vereda.test");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(linhaPorEmail(page, "ana@vereda.test")).toContainText("Geral");
  await expect(page.getByLabel("Nome")).toHaveCount(0);
  expect(estado.adicoes.map((a) => a.email)).toEqual(["sem.conta@vereda.test", "outra@vereda.test", "ana@vereda.test"]);
});

test("Publicado Q5, Q6 e Q7: papel, áreas da rota e acesso gravados pela rota", async ({ page }) => {
  const estado = await entrarNoPublicado(page);
  await linhaPorEmail(page, REVISORA.email).getByLabel("Papel de Beatriz Lima").selectOption("Aprovador");
  await expect(page.getByRole("button", { name: "Editar áreas de Beatriz Lima" })).toBeVisible();
  await page.getByRole("button", { name: "Editar áreas de Beatriz Lima" }).click();
  const lista = page.getByRole("group", { name: "Áreas de Beatriz Lima" });
  // A lista suspensa usa as áreas da rota (DF7).
  await expect(lista.getByText("Produto", { exact: true })).toHaveCount(0);
  await lista.getByText("Comercial", { exact: true }).click();
  await expect(linhaPorEmail(page, REVISORA.email)).toContainText("Comercial");
  await page.keyboard.press("Escape");
  await linhaPorEmail(page, HOMONIMO.email).getByRole("switch").click({ force: true });
  await page.getByRole("button", { name: "Desativar acesso" }).click();
  await expect(linhaPorEmail(page, HOMONIMO.email)).toContainText("Inativo");
  expect(estado.alteracoes).toEqual([
    { id: REVISORA.id, mudanca: { papel: "Aprovador" } },
    { id: REVISORA.id, mudanca: { areas: ["Comercial"] } },
    { id: HOMONIMO.id, mudanca: { ativo: false } }
  ]);
});

test("Publicado Q13: erro ao gravar não muda a linha; erro ao listar mostra a mensagem e tenta de novo", async ({ page }) => {
  const estado = await entrarNoPublicado(page, { falharLista: true });
  await expect(page.getByText("Não foi possível carregar os usuários.", { exact: true })).toBeVisible();
  estado.falharLista = false;
  await page.getByRole("button", { name: "Tentar de novo" }).click();
  await expect(linhaPorEmail(page, REVISORA.email)).toBeVisible();
  estado.falharPatch = true;
  await linhaPorEmail(page, REVISORA.email).getByLabel("Papel de Beatriz Lima").selectOption("Aprovador");
  // O aviso aparece na tela e na região lida pelos leitores de tela.
  await expect(page.getByText("Mudança não gravada").first()).toBeVisible();
  await expect(linhaPorEmail(page, REVISORA.email).getByLabel("Papel de Beatriz Lima")).toHaveValue("Revisor");
});
