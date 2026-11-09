import { expect, test } from "@playwright/test";
import { ICON_PATHS } from "../src/ds/components/core/icon-paths.js";

// Fase S (docs/mvp-resposta-rfp/spec/SPEC_FASE_S.md): a área e as etiquetas do item na Revisão, com a
// API respondida pelo próprio teste (cenários S1 a S9).
const TAREFA = {
  id: "5d1c2b3a-4e5f-4a6b-8c7d-9e0f1a2b3c4d", estado: "pronta", motivo: null, arquivo: "RFP.xlsx",
  dados: { nome: "RFP das áreas", empresa: "Banco Horizonte", prazo: "2026-11-20" },
  total: 4, processadas: 4, comportamento: null, criadaEm: "2026-11-04T12:00:00.000Z", concluidaEm: "2026-11-04T12:01:00.000Z",
  situacao: "em_andamento", situacaoPor: null, situacaoEm: null
};
const item = (numero, area, q, extra = {}) => ({
  id: `r${numero}`, numero, aba: "RFP", linha: numero + 1, q, paras: [{ t: `Resposta ${numero}.`, s: [] }], srcs: [], alerts: [], st: "sugerida", orig: `Resposta ${numero}.`, area, ...extra
});
const ITENS = [
  // Editado: o texto mudou em relação à sugestão.
  item(1, "Jurídico", "A empresa aceita multa por descumprimento contratual?", { paras: [{ t: "Resposta editada.", s: [] }], orig: "Resposta original." }),
  // Resposta manual: sem sugestão e sem fonte.
  item(2, "Jurídico", "Qual o foro eleito para controvérsias?", { orig: "", alerts: [{ t: "manual" }], manualBy: "Kadu Mendes" }),
  item(3, "Tecnologia", "Qual é o SLA de disponibilidade da plataforma?"),
  item(4, "Jurídico", "A empresa tem seguro de responsabilidade civil?", { st: "aprovada", by: "Carla Diretora", at: "2026-11-04T12:30:00.000Z" })
];
const APROVADOR = { nome: "Antônio Carlos", papel: "Aprovador", areas: ["Jurídico"] };
const REVISOR = { nome: "Kadu Mendes", papel: "Revisor", areas: [] };

/**
 * Responde a API e entra no Workspace. `trocarArea` decide a resposta da troca de área (por padrão,
 * aceita e devolve o item com a área nova); devolve a lista das trocas pedidas.
 */
async function entrar(page, { pessoa = APROVADOR, tarefa = TAREFA, trocarArea } = {}) {
  const trocas = [];
  let itens = ITENS.map((i) => ({ ...i }));
  await page.route("**/api/**", async (route) => {
    const caminho = new URL(route.request().url()).pathname, metodo = route.request().method();
    if (caminho === "/api/auth/me") return route.fulfill({ json: { pessoa, organizacao: { nome: "Vereda Documental" } } });
    if (caminho === "/api/tarefas" && metodo === "GET") return route.fulfill({ json: { tarefas: [tarefa] } });
    if (caminho === `/api/tarefas/${tarefa.id}/itens`) return route.fulfill({ json: { itens } });
    const troca = /^\/api\/tarefas\/[^/]+\/itens\/(\d+)\/area$/.exec(caminho);
    if (troca && metodo === "PUT") {
      const numero = Number(troca[1]), { area } = route.request().postDataJSON();
      trocas.push({ numero, area });
      if (trocarArea) return trocarArea(route, { numero, area });
      itens = itens.map((i) => (i.numero === numero ? { ...i, area } : i));
      return route.fulfill({ json: { item: itens.find((i) => i.numero === numero) } });
    }
    if (caminho === "/api/base/documentos") return route.fulfill({ json: { documentos: [] } });
    if (caminho === "/api/pessoas") return route.fulfill({ json: { pessoas: [pessoa] } });
    if (caminho === "/api/usuarios") return route.fulfill({ json: { usuarios: [] } });
    if (caminho.endsWith("/eventos")) return route.fulfill({ json: { eventos: [] } });
    if (caminho.endsWith("/avaliacoes")) return route.fulfill({ json: { avaliacoes: [] } });
    return route.fulfill({ status: 404, json: { erro: "Sem resposta no teste." } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  // No celular, o menu lateral fica atrás do botão "Abrir menu".
  if ((await page.viewportSize()).width < 900) await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  const menu = page.getByRole("navigation", { name: "Workspace" });
  await expect(menu).toBeVisible({ timeout: 20_000 });
  return { menu, trocas };
}

const linha = (page, n) => page.locator('[role="button"]').filter({ hasText: `REQ-00${n}/004` });
async function abrirNaRevisao(page, menu, n) {
  await menu.getByText("Revisão", { exact: true }).click();
  await linha(page, n).click();
}
const lapis = (page) => page.getByRole("button", { name: "Alterar área" });
const lista = (page) => page.getByRole("listbox", { name: "Área da pergunta" });
/** O primeiro `d` do ícone, para reconhecer qual ícone está desenhado. */
const tracoDo = (nome) => /d="([^"]+)"/.exec(ICON_PATHS[nome])[1];
async function esperarIcone(locator, nome) {
  await expect.poll(async () => (await locator.locator("svg").first().innerHTML()).includes(tracoDo(nome))).toBe(true);
}

test("S1, S2 e S7 a S9 · Aprovador: área como texto, lápis só onde pode trocar e etiquetas sem lápis", async ({ page }) => {
  const { menu } = await entrar(page);

  // S1, S2 e S7: item editado da própria área, com o nome da área, o lápis e "Editado" com history.
  await abrirNaRevisao(page, menu, 1);
  await expect(page.getByLabel("Área: Jurídico")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Área da pergunta" })).toHaveCount(0);
  await expect(lapis(page)).toBeVisible();
  // Proposta A de 08/11/2026: botão com o texto e o lápis, contorno cinza e, com o mouse por cima, fundo preto (--brand-ink, #12140F).
  await expect(lapis(page)).toContainText("Alterar área");
  await esperarIcone(lapis(page), "pencil");
  await expect(lapis(page)).not.toHaveCSS("border-top-color", "rgb(18, 20, 15)");
  await expect(lapis(page)).not.toHaveCSS("background-color", "rgb(18, 20, 15)");
  await lapis(page).hover();
  await expect(lapis(page)).toHaveCSS("background-color", "rgb(18, 20, 15)");
  await page.mouse.move(0, 0);
  await expect(lapis(page)).not.toHaveCSS("background-color", "rgb(18, 20, 15)");
  const editado = page.getByText("Editado", { exact: true });
  await esperarIcone(editado, "history");

  // S8: resposta manual com file-text, na etiqueta e na linha "escrita por".
  await linha(page, 2).click();
  await esperarIcone(page.getByText("Resposta manual", { exact: true }), "file-text");
  await esperarIcone(page.getByText(/Resposta manual, sem fonte na base · escrita por Kadu Mendes/), "file-text");

  // S9: no cabeçalho do item, o único lápis é o de trocar a área.
  const cabecalho = page.getByLabel("Área: Jurídico").locator("xpath=ancestor::div[2]");
  await expect.poll(async () => (await cabecalho.innerHTML()).split(tracoDo("pencil")).length - 1).toBe(1);

  // S2: sem lápis na pergunta de outra área nem no item aprovado.
  await linha(page, 3).click();
  await expect(page.getByLabel("Área: Tecnologia")).toBeVisible();
  await expect(lapis(page)).toHaveCount(0);
  await linha(page, 4).click();
  await expect(page.getByLabel("Área: Jurídico")).toBeVisible();
  await expect(lapis(page)).toHaveCount(0);
});

test("S1 e S2 · Revisor: a mesma exibição da área, sem lápis", async ({ page }) => {
  const { menu } = await entrar(page, { pessoa: REVISOR });
  await abrirNaRevisao(page, menu, 1);
  await expect(page.getByLabel("Área: Jurídico")).toBeVisible();
  await expect(lapis(page)).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Área da pergunta" })).toHaveCount(0);
});

test("S2 · tarefa só para leitura: sem lápis", async ({ page }) => {
  const arquivada = { ...TAREFA, situacao: "arquivada", situacaoPor: "Carla Diretora", situacaoEm: "2026-11-05T15:00:00.000Z" };
  const { menu } = await entrar(page, { tarefa: arquivada });
  await menu.getByText("Arquivadas", { exact: true }).click();
  await page.getByText("RFP das áreas").first().click();
  await page.getByText("A empresa aceita multa por descumprimento contratual?").first().click();
  await expect(page.getByText(/arquivada por Carla Diretora/).first()).toBeVisible();
  await expect(page.getByLabel("Área: Jurídico")).toBeVisible();
  await expect(lapis(page)).toHaveCount(0);
});

test("S3 a S5 · abrir, fechar e trocar pelo mouse e pelo teclado", async ({ page }) => {
  const { menu, trocas } = await entrar(page);
  await abrirNaRevisao(page, menu, 1);

  // S3: a lista abre com as seis áreas, a atual marcada; Esc fecha e o foco volta ao lápis.
  await lapis(page).click();
  await expect(lapis(page)).toHaveAttribute("aria-expanded", "true");
  await expect(lista(page).getByRole("option")).toHaveText(["Produto", "Tecnologia", "Segurança e privacidade", "Comercial", "Jurídico", "Geral"]);
  await expect(lista(page).getByRole("option", { name: "Jurídico" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(lista(page)).toHaveCount(0);
  await expect(lapis(page)).toBeFocused();

  // S3: um clique fora fecha sem trocar.
  await lapis(page).click();
  await page.getByText("Itens", { exact: true }).first().click();
  await expect(lista(page)).toHaveCount(0);

  // S4: escolher a área atual só fecha a lista.
  await lapis(page).click();
  await lista(page).getByRole("option", { name: "Jurídico" }).click();
  await expect(lista(page)).toHaveCount(0);
  expect(trocas).toEqual([]);

  // S5: pelo teclado, Enter abre com o foco na atual, as setas percorrem e Enter escolhe.
  await lapis(page).focus();
  await page.keyboard.press("Enter");
  await expect(lista(page).getByRole("option", { name: "Jurídico" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(lista(page).getByRole("option", { name: "Geral" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(lista(page).getByRole("option", { name: "Produto" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(lista(page).getByRole("option", { name: "Jurídico" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");

  // S4: a pergunta passa para Comercial, com o aviso; Antônio deixa de aprovar e o lápis some.
  await expect(page.getByLabel("Área: Comercial")).toBeVisible();
  await expect(page.getByText("A pergunta passou para Comercial.").first()).toBeVisible();
  expect(trocas).toEqual([{ numero: 1, area: "Comercial" }]);
  await expect(lapis(page)).toHaveCount(0);
  await expect(page.getByText("Só a área Comercial ou C-Level aprova esta resposta.")).toBeVisible();
});

test("S4 · durante a gravação a lista não aceita outra escolha; a recusa mantém a área", async ({ page }) => {
  let liberar;
  const espera = new Promise((r) => { liberar = r; });
  const { menu, trocas } = await entrar(page, {
    trocarArea: async (route) => {
      await espera;
      return route.fulfill({ status: 409, json: { erro: "O item já foi aprovado e a área não muda mais." } });
    }
  });
  await abrirNaRevisao(page, menu, 1);
  await lapis(page).click();
  await lista(page).getByRole("option", { name: "Comercial" }).click();

  // Gravando: a lista fica ocupada e outra escolha é ignorada.
  await expect(lista(page)).toHaveAttribute("aria-busy", "true");
  await expect(lista(page).getByRole("option", { name: "Produto" })).toHaveAttribute("aria-disabled", "true");
  // `force`: o Playwright não clica no que está marcado como desabilitado; o clique precisa chegar para ser ignorado.
  await lista(page).getByRole("option", { name: "Produto" }).click({ force: true });
  liberar();

  // Recusa: a lista fecha, a área continua e o aviso traz o motivo.
  await expect(lista(page)).toHaveCount(0);
  await expect(page.getByText("O item já foi aprovado e a área não muda mais.").first()).toBeVisible();
  await expect(page.getByLabel("Área: Jurídico")).toBeVisible();
  expect(trocas).toEqual([{ numero: 1, area: "Comercial" }]);
});

test("S6 · celular: a lista cabe na tela, sem rolagem lateral", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const { menu } = await entrar(page);
  await abrirNaRevisao(page, menu, 1);
  await lapis(page).click();
  await expect(lista(page)).toBeVisible();
  const caixa = await lista(page).boundingBox();
  expect(caixa.x).toBeGreaterThanOrEqual(0);
  expect(caixa.x + caixa.width).toBeLessThanOrEqual(375);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test("SA1 · Painel de Usuários: lápis das áreas com contorno cinza e fundo preto com o mouse por cima", async ({ page }) => {
  // Modo local, com os dados de exemplo da fase Q e a API desligada (como em e2e/painelDeUsuarios.spec.js).
  await page.route("**/api/**", (route) => route.fulfill({ status: 503, json: { erro: "Offline" } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await page.getByRole("button", { name: "Entrar na Tendra.ai" }).click();
  await page.getByRole("navigation", { name: "Workspace" }).getByText("Usuários", { exact: true }).click();
  const lapisDasAreas = page.getByRole("button", { name: "Editar áreas de Marcelo Vieira" });
  await expect(lapisDasAreas).toBeVisible();

  // Sem o mouse: contorno visível (não transparente) e fundo não preto.
  await page.mouse.move(0, 0);
  await expect(lapisDasAreas).not.toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
  await expect(lapisDasAreas).not.toHaveCSS("background-color", "rgb(18, 20, 15)");

  // Com o mouse por cima: fundo preto; ao sair, volta.
  await lapisDasAreas.hover();
  await expect(lapisDasAreas).toHaveCSS("background-color", "rgb(18, 20, 15)");
  await page.mouse.move(0, 0);
  await expect(lapisDasAreas).not.toHaveCSS("background-color", "rgb(18, 20, 15)");

  // O lápis continua abrindo a lista de áreas.
  await lapisDasAreas.click();
  await expect(page.getByRole("group", { name: "Áreas de Marcelo Vieira" })).toBeVisible();
});
