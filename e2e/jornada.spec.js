import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// Jornada da fase C (PLAN.md, portão): base pela tela, RFP pela tela, progresso, revisão gravada,
// recarga da página e relatório de aceitação. API simulada: refazer com a API real depois da A1.

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PULSE = path.join(RAIZ, "base-sintetica", "pulse-beneficios");
const RFP = path.join(RAIZ, "base-sintetica", "rfps", "RFP-01-Rede-Varejo-Alfa.xlsx");
const API = "http://127.0.0.1:3100/api";

const arquivosDaBase = readdirSync(path.join(PULSE, "base"), { recursive: true })
  .filter((nome) => nome.endsWith(".md"))
  .map((nome) => path.join(PULSE, "base", nome));

async function entrar(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await page.getByRole("button", { name: "Entrar no Tendra.ai" }).click();
  await expect(page.getByRole("navigation", { name: "Workspace" })).toBeVisible({ timeout: 20_000 });
}

const menu = (page, nome) => page.getByRole("navigation", { name: "Workspace" }).getByText(nome, { exact: true }).click();

test("da base à resposta aprovada, mantida depois de recarregar", async ({ page, request }) => {
  await entrar(page);

  // 1. Base de conhecimento: os .md da base sintética pelo seletor de arquivos.
  await menu(page, "Base de conhecimento");
  const [seletorDaBase] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: "Subir documentos" }).first().click()]);
  await seletorDaBase.setFiles(arquivosDaBase);
  const resultado = page.getByRole("status").filter({ hasText: "Resultado do envio" });
  await expect(resultado).toContainText(`Carregados: ${arquivosDaBase.length}`);

  // 2. Nova RFP: outro formato é recusado na hora; a planilha cria a tarefa.
  await menu(page, "Tarefas");
  await page.getByRole("button", { name: "Nova RFP/RFI" }).click();
  const quadro = page.getByText("Selecionar a planilha de perguntas");
  let [seletor] = await Promise.all([page.waitForEvent("filechooser"), quadro.click()]);
  await seletor.setFiles(arquivosDaBase[0]);
  await expect(page.getByRole("alert")).toHaveText("Envie a RFP em formato .xlsx");
  [seletor] = await Promise.all([page.waitForEvent("filechooser"), quadro.click()]);
  await seletor.setFiles(RFP);
  await page.locator("#nt-company").fill("Rede Varejo Alfa");
  await page.locator("#nt-cnpj").fill("11222333000181");
  await page.locator("#nt-due").fill("2099-12-31");
  await page.locator("#nt-owner").selectOption({ label: "Marcelo Vieira" });
  await page.getByRole("button", { name: "Importar perguntas" }).click();

  // 3. Progresso até a tarefa ficar pronta; a planilha preenchida pode ser baixada.
  await expect(page.getByRole("heading", { level: 1, name: "RFP-01-Rede-Varejo-Alfa" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir revisão" })).toBeVisible({ timeout: 120_000 });
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Baixar planilha preenchida" }).click()]);
  expect(download.suggestedFilename()).toBe("RFP-01-Rede-Varejo-Alfa-preenchida.xlsx");

  const { tarefas } = await (await request.get(`${API}/tarefas`)).json();
  expect(tarefas).toHaveLength(1);
  const tarefa = tarefas[0];
  expect(tarefa.estado).toBe("pronta");
  const { itens } = await (await request.get(`${API}/tarefas/${tarefa.id}/itens`)).json();
  // Todos chegam como sugestões pendentes (cenário 33).
  expect(itens.every((i) => i.st === "sugerida" || i.st === "sem-rascunho")).toBe(true);
  const alvo = itens.find((i) => i.st === "sugerida" && i.alerts.length === 0);
  const codigo = `REQ-${String(alvo.numero).padStart(3, "0")}/${String(itens.length).padStart(3, "0")}`;

  // 4. Revisão como Aprovador: editar, aprovar e avaliar.
  await page.getByRole("button", { name: "Abrir revisão" }).click();
  await page.getByText(codigo, { exact: true }).first().click();
  await page.getByRole("button", { name: "Editar resposta" }).click();
  const resposta = page.getByRole("textbox", { name: "Resposta" });
  await resposta.fill((await resposta.inputValue()) + " Texto acrescentado na revisão.");
  await page.getByRole("button", { name: "Concluir edição" }).click();
  await page.getByRole("button", { name: "Aprovar resposta" }).click();
  await expect(page.getByText("Item aprovado", { exact: true })).toBeVisible();
  await page.getByText(codigo, { exact: true }).first().click();
  await page.getByRole("button", { name: "Negativo" }).click();
  await page.getByRole("combobox", { name: "Motivo" }).selectOption("Texto impreciso");
  await expect(page.getByText("Avaliação registrada", { exact: true })).toBeVisible();

  // 5. Recarregar a página: as ações continuam lá.
  await page.reload();
  await entrar(page);
  await menu(page, "Revisão");
  await page.getByText(codigo, { exact: true }).first().click();
  await expect(page.getByText(/Aprovado por Marcelo Vieira/)).toBeVisible();
  await expect(page.getByText("Editado", { exact: true })).toBeVisible();
  await expect(page.getByText("Texto acrescentado na revisão.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Negativo" })).toHaveAttribute("aria-pressed", "true");

  // 6. Relatório de aceitação confere com o que foi feito na tela.
  const { aceitacao } = await (await request.get(`${API}/tarefas/${tarefa.id}/aceitacao`)).json();
  expect(aceitacao.itens).toBe(itens.length);
  expect(aceitacao.aprovados).toBe(1);
  expect(aceitacao.aprovadosSemEdicao).toBe(0);
  expect(aceitacao.porcentagemMediaAlterada).toBeGreaterThan(0);
  expect(aceitacao.avaliacoes).toEqual({ positivas: 0, negativas: 1, motivos: { "Texto impreciso": 1 } });
  const { eventos } = await (await request.get(`${API}/tarefas/${tarefa.id}/eventos`)).json();
  expect(eventos.map((e) => [e.item, e.acao, e.pessoa])).toEqual([
    [alvo.id, "edicao", "Marcelo Vieira"],
    [alvo.id, "aprovacao", "Marcelo Vieira"],
    [alvo.id, "avaliacao", "Marcelo Vieira"]
  ]);
});
