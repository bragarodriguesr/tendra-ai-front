import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// Jornada da fase C (PLAN.md, portão): base pela tela, RFP pela tela, progresso, revisão gravada,
// recarga da página e relatório de aceitação; depois, alerta reconhecido e item revisado mantidos
// depois de recarregar (cenários 57 e 59), resposta manual num item sem rascunho (cenário 61) e
// exclusão da tarefa (cenário 60).
// API simulada; com TENDRA_E2E_API_REAL=1, a API real (custo).

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
  await page.locator("#nt-due").fill("31/12/2099");
  await page.locator("#nt-owner").selectOption({ label: "Marcelo Vieira" });
  const contato = page.getByRole("group", { name: "Contato 1" });
  await contato.getByLabel("Nome").fill("Ana Souza");
  await contato.getByLabel("E-mail").fill("ana@alfa.com.br");
  await page.getByRole("button", { name: "Importar perguntas" }).click();

  // 3. Progresso até a tarefa ficar pronta; a planilha preenchida pode ser baixada.
  await expect(page.getByRole("heading", { level: 1, name: "RFP-01-Rede-Varejo-Alfa" })).toBeVisible();
  // "Ver detalhes": empresa e contatos gravados na importação (cenários 63 e 64).
  await page.getByRole("button", { name: "Ver detalhes" }).click();
  const detalhes = page.getByRole("dialog", { name: "Detalhes da tarefa" });
  await expect(detalhes).toContainText("Rede Varejo Alfa");
  await expect(detalhes).toContainText("11.222.333/0001-81");
  await expect(detalhes).toContainText("Ana Souza");
  await expect(detalhes).toContainText("ana@alfa.com.br");
  await detalhes.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Abrir revisão" })).toBeVisible({ timeout: 120_000 });
  // O download fica só na Exportação (fase O, cenário O14).
  await expect(page.getByRole("button", { name: /^Baixar/ })).toHaveCount(0);
  await menu(page, "Exportação");
  // Revisão ainda não finalizada: o download pede confirmação; "Voltar para revisão" não baixa.
  const confirmacao = page.getByRole("alertdialog", { name: "A revisão ainda não foi finalizada." });
  await page.getByRole("button", { name: "Baixar RFP-01-Rede-Varejo-Alfa" }).click();
  await confirmacao.getByRole("button", { name: "Voltar para revisão" }).click();
  await expect(confirmacao).toBeHidden();
  await page.getByRole("button", { name: "Baixar RFP-01-Rede-Varejo-Alfa" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), confirmacao.getByRole("button", { name: "Baixar mesmo assim" }).click()]);
  await expect(confirmacao).toBeHidden();
  expect(download.suggestedFilename()).toBe("RFP-01-Rede-Varejo-Alfa-preenchida.xlsx");
  // Sem a tarefa pronta, nenhum box de conclusão (O6).
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await menu(page, "Em andamento");
  await page.getByRole("row", { name: "Abrir RFP-01-Rede-Varejo-Alfa" }).click();

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

  // 7. Reconhecer alerta e marcar como revisado: continuam depois de recarregar (cenários 57 e 59).
  const comAlerta = itens.find((i) => i.st === "sugerida" && i.alerts.length === 1 && ["old", "critical", "lowconf"].includes(i.alerts[0].t));
  const codigoComAlerta = `REQ-${String(comAlerta.numero).padStart(3, "0")}/${String(itens.length).padStart(3, "0")}`;
  await page.getByText(codigoComAlerta, { exact: true }).first().click();
  await page.getByRole("button", { name: "Reconhecer alerta" }).click();
  await expect(page.getByText("Alerta reconhecido", { exact: true })).toBeVisible();
  // Sem alerta pendente, o cartão se recolhe num resumo que abre o histórico.
  await expect(page.getByRole("button", { name: /Alerta tratado/ })).toBeVisible();
  await page.getByRole("button", { name: "Marcar como revisado" }).click();
  await expect(page.getByText("Item revisado", { exact: true })).toBeVisible();
  await page.reload();
  await entrar(page);
  await menu(page, "Revisão");
  await page.getByText(codigoComAlerta, { exact: true }).first().click();
  await page.getByRole("button", { name: /Alerta tratado/ }).click();
  await expect(page.getByText(/Reconhecido por Marcelo Vieira/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Marcar como revisado" })).toBeDisabled();
  const item = (await (await request.get(`${API}/tarefas/${tarefa.id}/itens`)).json()).itens.find((i) => i.id === comAlerta.id);
  expect(item).toMatchObject({ st: "revisada", rby: "Marcelo Vieira", alerts: [{ t: comAlerta.alerts[0].t, ack: { by: "Marcelo Vieira" } }] });

  // 7b. Item sem rascunho: a resposta escrita na tela fica gravada como resposta manual (cenário 61).
  const semRascunho = itens.find((i) => i.st === "sem-rascunho");
  const codigoSemRascunho = `REQ-${String(semRascunho.numero).padStart(3, "0")}/${String(itens.length).padStart(3, "0")}`;
  await page.getByText(codigoSemRascunho, { exact: true }).first().click();
  await page.getByRole("button", { name: "Editar resposta" }).click();
  await page.getByRole("textbox", { name: "Resposta" }).fill("Resposta escrita pela equipe, sem fonte na base.");
  await page.getByRole("button", { name: "Concluir edição" }).click();
  await expect(page.getByText("Resposta manual", { exact: true })).toBeVisible();
  await page.reload();
  await entrar(page);
  await menu(page, "Revisão");
  await page.getByText(codigoSemRascunho, { exact: true }).first().click();
  await expect(page.getByText("Resposta escrita pela equipe, sem fonte na base.")).toBeVisible();
  await expect(page.getByText(/Resposta manual, sem fonte na base · escrita por Marcelo Vieira/)).toBeVisible();
  // A resposta manual não vira alerta a reconhecer: o quadro fica como "Resposta sem fonte", com "Adicionar conhecimento", e o item pode ser revisado.
  await expect(page.getByText("Resposta sem fonte", { exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Ações da resposta sem fonte" }).getByRole("button", { name: "Adicionar conhecimento" })).toBeVisible();
  await expect(page.getByText("Fontes · Nenhuma fonte localizada")).toHaveCount(0);
  await expect(page.getByText("Resposta manual sem fonte", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Marcar como revisado" })).toBeEnabled();
  const manual = (await (await request.get(`${API}/tarefas/${tarefa.id}/itens`)).json()).itens.find((i) => i.id === semRascunho.id);
  expect(manual).toMatchObject({ st: "em-revisao", orig: "", alerts: [{ t: "manual", by: "Marcelo Vieira" }] });

  // 7c. "Revisar com IA" na resposta manual (cenário 65): desabilitado até 30 palavras; a revisão vai para o editor e pode ser desfeita.
  await page.getByRole("button", { name: "Editar resposta" }).click();
  const revisarComIa = page.getByRole("button", { name: "Revisar com IA" });
  await expect(revisarComIa).toBeDisabled();
  const editor = page.getByRole("textbox", { name: "Resposta" });
  const rascunho = "a equipe atende em português de segunda a sexta, com plantão para incidentes críticos, acompanhamento do chamado até a solução e relatório mensal dos atendimentos enviado ao gestor do contrato, com indicadores de prazo e de satisfação de cada mês.";
  await editor.fill(rascunho);
  await expect(revisarComIa).toBeEnabled();
  await revisarComIa.click();
  await expect(page.getByText("Texto revisado com IA", { exact: true })).toBeVisible();
  await expect(editor).toHaveValue("A" + rascunho.slice(1));
  await page.getByRole("button", { name: "Desfazer revisão" }).click();
  await expect(editor).toHaveValue(rascunho);
  await page.getByRole("button", { name: "Concluir edição" }).click();

  // 8. Excluir a tarefa pela tela Tarefas, com confirmação: some da lista e do banco (cenário 60).
  await menu(page, "Tarefas");
  await page.getByRole("button", { name: "Excluir RFP-01-Rede-Varejo-Alfa" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Excluir tarefa" }).click();
  await expect(page.getByText("Tarefa excluída", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "0 RFPs e RFIs em andamento" })).toBeVisible();
  expect((await (await request.get(`${API}/tarefas`)).json()).tarefas).toEqual([]);
  expect((await request.get(`${API}/tarefas/${tarefa.id}`)).status()).toBe(404);
});
