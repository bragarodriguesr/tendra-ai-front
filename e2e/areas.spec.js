import { expect, test } from "@playwright/test";

// Fase N (docs/mvp-resposta-rfp/spec/SPEC_FASE_N.md): Aprovador do Jurídico na Revisão, com a API
// respondida pelo próprio teste (cenários N1, N6, N8 a N11).
const TAREFA = {
  id: "8f0e7c62-1b5a-4c3e-9d2f-6a7b8c9d0e1f", estado: "pronta", motivo: null, arquivo: "RFP.xlsx",
  dados: { nome: "RFP das áreas", empresa: "Banco Horizonte", prazo: "2026-11-20" },
  total: 4, processadas: 4, comportamento: null, criadaEm: "2026-11-04T12:00:00.000Z", concluidaEm: "2026-11-04T12:01:00.000Z"
};
const item = (numero, area, q, st = "sugerida") => ({
  id: `r${numero}`, numero, aba: "RFP", linha: numero + 1, q, paras: [{ t: `Resposta ${numero}.`, s: [] }], srcs: [], alerts: [], st, orig: `Resposta ${numero}.`, area,
  ...(st === "aprovada" ? { by: "Carla Diretora", at: "2026-11-04T12:30:00.000Z" } : null)
});
const ITENS = [
  item(1, "Tecnologia", "Qual é o SLA de disponibilidade da plataforma?"),
  item(2, "Jurídico", "A empresa aceita multa por descumprimento contratual?"),
  item(3, "Geral", "Descreva a empresa em poucas linhas."),
  item(4, "Jurídico", "Qual o foro eleito para controvérsias?", "aprovada")
];

test("Aprovador do Jurídico: as da área primeiro, filtro Minha área, outra área bloqueada e troca de área", async ({ page }) => {
  const trocas = [];
  let itens = ITENS.map((i) => ({ ...i }));
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const caminho = url.pathname, metodo = route.request().method();
    if (caminho === "/api/auth/me") return route.fulfill({ json: { pessoa: { nome: "Antônio Carlos", papel: "Aprovador", areas: ["Jurídico"] }, organizacao: { nome: "Vereda Documental" } } });
    if (caminho === "/api/tarefas" && metodo === "GET") return route.fulfill({ json: { tarefas: [TAREFA] } });
    if (caminho === `/api/tarefas/${TAREFA.id}/itens`) return route.fulfill({ json: { itens } });
    const troca = /^\/api\/tarefas\/[^/]+\/itens\/(\d+)\/area$/.exec(caminho);
    if (troca && metodo === "PUT") {
      const { area } = route.request().postDataJSON();
      trocas.push({ numero: Number(troca[1]), area });
      itens = itens.map((i) => (i.numero === Number(troca[1]) ? { ...i, area } : i));
      return route.fulfill({ json: { item: itens.find((i) => i.numero === Number(troca[1])) } });
    }
    if (caminho === "/api/base/documentos") return route.fulfill({ json: { documentos: [{ id: 1, nome: "politica.md", titulo: "Política", tipo: "documento", atualizadoEm: "2026-10-01", ativo: true }] } });
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

  // N1: o menu do usuário mostra o papel e as áreas.
  await page.getByRole("button", { name: "Antônio Carlos" }).click();
  await expect(page.getByText("Aprovador · Jurídico", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  // N11: coluna "Área" nos detalhes da tarefa.
  await menu.getByText("Tarefas", { exact: true }).click();
  await page.getByText("RFP das áreas").first().click();
  await expect(page.getByText("Tecnologia", { exact: true }).first()).toBeVisible();

  // N8: na Revisão, as do Jurídico primeiro, e abre na primeira ainda não aprovada.
  await menu.getByText("Revisão", { exact: true }).click();
  const linhas = page.locator('[role="button"]').filter({ hasText: /REQ-\d{3}\/004/ });
  await expect(linhas.first()).toContainText("REQ-002/004");
  expect((await linhas.allInnerTexts()).map((t) => /REQ-(\d{3})/.exec(t)[1])).toEqual(["002", "004", "001", "003"]);
  await expect(page.getByRole("heading", { name: "A empresa aceita multa por descumprimento contratual?" })).toBeVisible();
  await expect(page.getByLabel("Área da pergunta")).toHaveValue("Jurídico");

  // N9: filtro "Minha área".
  await page.getByRole("button", { name: /Filtrar/ }).first().click();
  await page.getByText("Minha área", { exact: false }).first().click();
  await expect(linhas).toHaveCount(2);
  await page.getByRole("button", { name: /^Todos/ }).first().click();
  await expect(linhas).toHaveCount(4);

  // N6: pergunta de outra área, sem aprovar nem trocar a área, com o motivo.
  await linhas.filter({ hasText: "REQ-001/004" }).click();
  await expect(page.getByText("Só a área Tecnologia ou C-Level aprova esta resposta.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Aprovar resposta" })).toBeDisabled();
  await expect(page.getByLabel("Área da pergunta")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Marcar como revisado" })).toBeEnabled();

  // N10: troca a área de uma pergunta da própria área; depois não aprova mais.
  await linhas.filter({ hasText: "REQ-002/004" }).click();
  await expect(page.getByRole("button", { name: "Aprovar resposta" })).toBeEnabled();
  await page.getByLabel("Área da pergunta").selectOption("Comercial");
  await expect(page.getByText("Só a área Comercial ou C-Level aprova esta resposta.")).toBeVisible();
  expect(trocas).toEqual([{ numero: 2, area: "Comercial" }]);
  await expect(page.getByRole("button", { name: "Aprovar resposta" })).toBeDisabled();
});
