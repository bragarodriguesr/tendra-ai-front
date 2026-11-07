import { expect, test } from "@playwright/test";

for (const failure of [false, true]) {
  test(`upload na revisão preserva resposta: ${failure ? "falha" : "sucesso"}`, async ({ page }, testInfo) => {
    await page.route("**/api/**", async (route) => {
      if (route.request().method() === "POST" && route.request().url().includes("/base/documentos")) {
        return route.fulfill(failure
          ? { status: 503, json: { erro: "Servidor indisponível para envio." } }
          : { json: { documentos: [], resumo: { carregados: ["nova-base.md"], atualizados: [], semMudanca: [], recusados: [], ignorados: [], avisos: [] } } });
      }
      return route.fulfill({ status: 503, json: { erro: "Offline" } });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
    await page.getByRole("button", { name: "Entrar na Tendra.ai" }).click();
    await page.getByRole("navigation", { name: "Workspace" }).getByText("Revisão", { exact: true }).click();
    await page.getByText("Onde os dados ficam hospedados e quais sub-processadores têm acesso?", { exact: true }).first().click();
    const actions = page.getByRole("group", { name: "Ações da resposta sem fonte" });
    await expect(page.getByText("Resposta sem fonte", { exact: true })).toBeVisible();
    await expect(page.getByText("Nenhuma fonte localizada", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Sem contexto", { exact: true })).toHaveCount(0);
    await expect(actions.getByRole("button", { name: "Adicionar conhecimento" })).toBeVisible();
    await actions.getByRole("button", { name: "Editar resposta", exact: true }).click();
    const answer = page.getByRole("textbox", { name: "Resposta", exact: true });
    await answer.fill("Texto em andamento que precisa ser preservado.");
    await expect(answer.locator("xpath=../..").getByRole("button", { name: "Adicionar conhecimento" })).toBeVisible();
    const [picker] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("button", { name: "Adicionar conhecimento" }).click()
    ]);
    await picker.setFiles({ name: "nova-base.md", mimeType: "text/markdown", buffer: Buffer.from("# Nova base") });
    await expect(page.getByText(failure ? "Servidor indisponível para envio." : "Carregados: 1", { exact: true }).first()).toBeVisible();
    await expect(answer).toHaveValue("Texto em andamento que precisa ser preservado.");
    await expect(page.getByRole("heading", { name: "Onde os dados ficam hospedados e quais sub-processadores têm acesso?" })).toBeVisible();
    if (!failure) await page.screenshot({ path: testInfo.outputPath("upload-revisao.png"), fullPage: true });
  });
}
