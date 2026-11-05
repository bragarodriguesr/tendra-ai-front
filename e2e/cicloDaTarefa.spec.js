import { expect, test } from "@playwright/test";

// Fase O (docs/mvp-resposta-rfp/spec/SPEC_FASE_O.md): ciclo de vida da tarefa, Exportação e Base,
// com a API respondida pelo próprio teste.
const id = (n) => `0f0e7c62-1b5a-4c3e-9d2f-6a7b8c9d0e${String(n).padStart(2, "0")}`;
const tarefa = (n, nome, empresa, extra = {}) => ({
  id: id(n), estado: "pronta", motivo: null, arquivo: `${nome}.xlsx`, dados: { nome, empresa, prazo: "2099-12-20", tipo: n === 2 ? "RFI" : "RFP" },
  total: 2, processadas: 2, comportamento: null, criadaEm: `2026-11-0${n}T12:00:00.000Z`, concluidaEm: `2026-11-0${n}T12:01:00.000Z`,
  situacao: "em_andamento", situacaoPor: null, situacaoEm: null, ...extra
});
const item = (numero, st) => ({
  id: `r${numero}`, numero, aba: "RFP", linha: numero + 1, q: `Pergunta ${numero}?`, paras: [{ t: `Resposta ${numero}.`, s: [] }], srcs: [], alerts: [], st, orig: `Resposta ${numero}.`, area: "Geral",
  ...(st === "aprovada" ? { by: "Carla Diretora", at: "2026-11-04T12:30:00.000Z" } : null)
});
const aprovados = [item(1, "aprovada"), item(2, "aprovada")];
const emRevisao = [item(1, "aprovada"), item(2, "sugerida")];

function servidor(page) {
  // Mais recente primeiro, como a rota: 4 (pronta), 3 (em revisão), 2 (finalizada), 1 (arquivada).
  const estado = {
    tarefas: [
      tarefa(4, "RFP Pronta", "Banco Horizonte"),
      tarefa(3, "RFP Em Revisão", "Rede Alfa"),
      tarefa(2, "RFI Entregue", "Pulse Benefícios", { situacao: "finalizada", situacaoPor: "Carla Diretora", situacaoEm: "2026-11-04T15:00:00.000Z" }),
      tarefa(1, "RFP Desistida", "Orbis Energia", { situacao: "arquivada", situacaoPor: "Carla Diretora", situacaoEm: "2026-11-03T15:00:00.000Z" })
    ],
    itens: { [id(4)]: aprovados, [id(3)]: emRevisao, [id(2)]: aprovados, [id(1)]: emRevisao },
    pedidos: []
  };
  const mudar = (n, situacao) => {
    estado.tarefas = estado.tarefas.map((t) => (t.id === n ? { ...t, situacao, situacaoPor: situacao === "em_andamento" ? null : "Carla Diretora", situacaoEm: situacao === "em_andamento" ? null : "2026-11-05T18:00:00.000Z" } : t));
    return estado.tarefas.find((t) => t.id === n);
  };
  return page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url()), caminho = url.pathname, metodo = route.request().method();
    if (caminho === "/api/auth/me") return route.fulfill({ json: { pessoa: { nome: "Carla Diretora", papel: "Aprovador", areas: ["C-Level"] }, organizacao: { nome: "Vereda Documental" } } });
    if (caminho === "/api/tarefas" && metodo === "GET") return route.fulfill({ json: { tarefas: estado.tarefas } });
    const acao = /^\/api\/tarefas\/([^/]+)\/(finalizar|arquivar|reativar)$/.exec(caminho);
    if (acao && metodo === "POST") {
      estado.pedidos.push(`${acao[2]} ${acao[1]}`);
      return route.fulfill({ json: { tarefa: mudar(acao[1], { finalizar: "finalizada", arquivar: "arquivada", reativar: "em_andamento" }[acao[2]]) } });
    }
    const itens = /^\/api\/tarefas\/([^/]+)\/itens$/.exec(caminho);
    if (itens) return route.fulfill({ json: { itens: estado.itens[itens[1]] } });
    if (/\/planilha$/.test(caminho)) {
      return route.fulfill({ body: "planilha", headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": 'attachment; filename="tarefa.xlsx"' } });
    }
    if (caminho === "/api/base/documentos") {
      return route.fulfill({ json: { documentos: [{ id: 1, nome: "politica-seguranca.md", titulo: "Política de Segurança da Informação", tipo: "documento", atualizadoEm: "2026-10-01", versao: "3.2", validade: "2027-10-01", vencido: false, ativo: true, enviadoPor: "Carla Diretora", carregadoEm: "2026-10-02T13:45:00.000Z" }] } });
    }
    if (caminho === "/api/pessoas") return route.fulfill({ json: { pessoas: [{ nome: "Carla Diretora", papel: "Aprovador", areas: ["C-Level"] }] } });
    if (caminho === "/api/usuarios") return route.fulfill({ json: { usuarios: [] } });
    if (caminho.endsWith("/eventos")) return route.fulfill({ json: { eventos: [] } });
    if (caminho.endsWith("/avaliacoes")) return route.fulfill({ json: { avaliacoes: [] } });
    return route.fulfill({ status: 404, json: { erro: "Sem resposta no teste." } });
  }).then(() => estado);
}

async function entrar(page) {
  const estado = await servidor(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await expect(page.getByRole("navigation", { name: "Workspace" })).toBeVisible({ timeout: 20_000 });
  return estado;
}
const menu = (page) => page.getByRole("navigation", { name: "Workspace" });
const link = (page, nome) => menu(page).getByRole("link", { name: new RegExp(`^${nome}(?: ?\\d+)?$`) });

test("O8 a O13 e O15: submenus, arquivar, só leitura, reativar e contadores", async ({ page }) => {
  const estado = await entrar(page);

  // O8, O15: contagens por situação; Revisão sem os itens das encerradas (1 sugerido na em revisão).
  await expect(link(page, "Em andamento")).toContainText("2");
  await expect(link(page, "Finalizadas")).toContainText("1");
  await expect(link(page, "Arquivadas")).toContainText("1");
  await expect(link(page, "Revisão")).toContainText("1");

  // O9: Em andamento sem o cartão de alertas, com Arquivar e Excluir.
  await link(page, "Tarefas").click();
  await expect(page.getByRole("heading", { level: 1, name: "2 RFPs e RFIs em andamento" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Alertas" })).toHaveCount(0);
  await expect(page.getByRole("row", { name: /^Abrir / })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Excluir RFP Em Revisão" })).toBeVisible();

  // O10: arquivar com confirmação; sai de Em andamento e vai para Arquivadas.
  await page.getByRole("button", { name: "Arquivar RFP Em Revisão" }).click();
  await page.getByRole("alertdialog", { name: "Arquivar “RFP Em Revisão”?" }).getByRole("button", { name: "Arquivar tarefa" }).click();
  await expect(page.getByText("RFP arquivada", { exact: true })).toBeVisible();
  expect(estado.pedidos).toEqual([`arquivar ${id(3)}`]);
  await expect(page.getByRole("heading", { level: 1, name: "1 RFPs e RFIs em andamento" })).toBeVisible();
  await expect(link(page, "Arquivadas")).toContainText("2");
  await expect(link(page, "Revisão")).toContainText("0");

  // O8, O13: Finalizadas sem Excluir, com quem finalizou e quando.
  await link(page, "Finalizadas").click();
  await expect(page.getByRole("heading", { level: 1, name: "1 RFPs e RFIs finalizadas" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Excluir / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Arquivar / })).toHaveCount(0);
  await expect(page.getByRole("row", { name: "Abrir RFI Entregue" })).toContainText("Carla Diretora");

  // O11: a finalizada abre só para leitura, sem download nos detalhes (O14) e sem reativar.
  await page.getByRole("row", { name: "Abrir RFI Entregue" }).click();
  await expect(page.getByText(/RFI finalizada por Carla Diretora em \d{2}\/\d{2}\/2026: só leitura\./)).toBeVisible();
  await expect(page.getByRole("button", { name: "Baixar planilha preenchida" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Reativar/ })).toHaveCount(0);
  await expect(link(page, "Finalizadas")).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Abrir revisão" }).click();
  await expect(page.getByRole("note").filter({ hasText: "só leitura" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar resposta" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Aprovar resposta" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Marcar como revisado" })).toHaveCount(0);

  // O12, O13: Arquivadas com Excluir; a arquivada reativa nos detalhes e volta a Em andamento.
  await link(page, "Arquivadas").click();
  await expect(page.getByRole("heading", { level: 1, name: "2 RFPs e RFIs arquivadas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Excluir RFP Desistida" })).toBeVisible();
  await page.getByRole("row", { name: "Abrir RFP Em Revisão" }).click();
  await expect(page.getByText(/RFP arquivada por Carla Diretora/)).toBeVisible();
  await page.getByRole("button", { name: "Reativar RFP" }).click();
  await expect(page.getByText("RFP reativada", { exact: true })).toBeVisible();
  expect(estado.pedidos).toEqual([`arquivar ${id(3)}`, `reativar ${id(3)}`]);
  await expect(page.getByRole("button", { name: "Reativar RFP" })).toHaveCount(0);
  await expect(link(page, "Em andamento")).toContainText("2");
  await expect(link(page, "Em andamento")).toHaveAttribute("aria-current", "page");
});

test("O4 a O7: Exportação com ordem, filtro, busca e o box de conclusão", async ({ page }) => {
  const estado = await entrar(page);
  await link(page, "Exportação").click();
  // O4: prontas, depois as demais em andamento, depois as encerradas; o título conta só as em andamento.
  await expect(page.getByRole("heading", { level: 1, name: "2 tarefas para baixar · 1 pronta" })).toBeVisible();
  const titulos = page.locator("main").getByText(/^(RFP|RFI) (Pronta|Em Revisão|Entregue|Desistida)$/);
  await expect(titulos).toHaveText(["RFP Pronta", "RFP Em Revisão", "RFI Entregue", "RFP Desistida"]);
  await expect(page.getByText("Finalizada por Carla Diretora · 04/11/2026")).toBeVisible();

  // O5: busca pela empresa ou pelo título, sem acentos; filtro por status; sem resultado.
  const busca = page.getByRole("textbox", { name: "Buscar tarefas" });
  await busca.fill("pulse");
  await expect(titulos).toHaveText(["RFI Entregue"]);
  await busca.fill("revisao");
  await expect(titulos).toHaveText(["RFP Em Revisão"]);
  await busca.fill("nada parecido");
  await expect(page.getByText("Nenhuma tarefa encontrada.")).toBeVisible();
  await busca.press("Escape");
  await expect(titulos).toHaveCount(4);
  await page.getByRole("button", { name: /Filtrar/ }).first().click();
  await page.getByRole("menuitemradio", { name: /Arquivada/ }).click();
  await expect(titulos).toHaveText(["RFP Desistida"]);
  await page.getByRole("button", { name: /^Todos/ }).first().click();
  await expect(titulos).toHaveCount(4);

  // O6: baixar a pronta abre o box; "Agora não" fecha sem mudar nada.
  const box = page.getByRole("alertdialog", { name: "RFP concluída. Parabéns pelo trabalho!" });
  const pronta = page.locator("main > div > div").filter({ hasText: "RFP Pronta" }).last();
  await Promise.all([page.waitForEvent("download"), pronta.getByRole("button", { name: "Baixar planilha preenchida" }).click()]);
  await expect(box).toBeVisible();
  await box.getByRole("button", { name: "Agora não" }).click();
  await expect(box).toBeHidden();
  expect(estado.pedidos).toEqual([]);

  // O7: finalizar; o cartão vai para o fim com o selo, e o título deixa de contá-la.
  await Promise.all([page.waitForEvent("download"), pronta.getByRole("button", { name: "Baixar planilha preenchida" }).click()]);
  await box.getByRole("button", { name: "Finalizar RFP" }).click();
  await expect(page.getByText("RFP finalizada", { exact: true })).toBeVisible();
  expect(estado.pedidos).toEqual([`finalizar ${id(4)}`]);
  await expect(page.getByRole("heading", { level: 1, name: "1 tarefa para baixar · 0 prontas" })).toBeVisible();
  await expect(titulos).toHaveText(["RFP Em Revisão", "RFP Pronta", "RFI Entregue", "RFP Desistida"]);
  await expect(page.getByText("Finalizada por Carla Diretora · 05/11/2026")).toBeVisible();
  await expect(link(page, "Finalizadas")).toContainText("2");

  // A em revisão não abre o box (O6): o download pede a confirmação de sempre.
  await page.locator("main > div > div").filter({ hasText: "RFP Em Revisão" }).last().getByRole("button", { name: "Baixar planilha preenchida" }).click();
  await expect(page.getByRole("alertdialog", { name: "A revisão ainda não foi finalizada." })).toBeVisible();
});

test("O1 a O3: Base com Dica, tabela enxuta e detalhes do documento", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await entrar(page);
  await link(page, "Base de conhecimento").click();
  await expect(page.getByText("Política de Segurança da Informação").first()).toBeVisible();
  await expect(page.getByText(/Aceita arquivos/)).toHaveCount(0);

  // O2: Documento, Validade, Idade, Status e Ações, sem rolagem lateral a 1.024 px.
  for (const coluna of ["Tipo", "Atualizado", "Enviado por"]) await expect(page.locator("main").getByText(coluna, { exact: true })).toHaveCount(0);
  for (const coluna of ["Documento", "Validade", "Idade", "Status", "Ações"]) await expect(page.locator("main").getByText(coluna, { exact: true })).toBeVisible();
  const tabela = page.locator("main").getByText("Documento", { exact: true }).locator("xpath=../..");
  expect(await tabela.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // O1: a Dica em blocos, num painel lateral que fecha pelo Esc.
  await page.getByRole("button", { name: "Dica" }).click();
  const dica = page.getByRole("dialog", { name: "Como preparar os arquivos" });
  for (const bloco of ["Formatos aceitos", "Cabeçalho", "Datas", "Como a base trata os arquivos"]) await expect(dica.getByRole("region", { name: bloco })).toBeVisible();
  await expect(dica).toContainText("atualizado_em");
  await page.keyboard.press("Escape");
  await expect(dica).toBeHidden();

  // O3: os detalhes completos do documento, sem ações que o mudem.
  await page.getByRole("button", { name: "Ver detalhes de Política de Segurança da Informação" }).click();
  const detalhes = page.getByRole("dialog", { name: "Detalhes do documento" });
  for (const texto of ["politica-seguranca.md", "Documento", "3.2", "01/10/2026", "01/10/2027", "Carla Diretora", "Pronto"]) await expect(detalhes).toContainText(texto);
  await expect(detalhes).toContainText(/02\/10\/2026 \d{2}:45/);
  await expect(detalhes.getByRole("switch")).toHaveCount(0);
  await detalhes.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(detalhes).toBeHidden();

  // Celular: o painel ocupa a tela, e o cartão também tem "Ver detalhes".
  await page.setViewportSize({ width: 375, height: 760 });
  await page.getByRole("button", { name: "Ver detalhes de Política de Segurança da Informação" }).click();
  const largura = (await detalhes.boundingBox()).width;
  expect(largura).toBeGreaterThanOrEqual(374);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
