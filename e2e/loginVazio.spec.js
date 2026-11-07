import { expect, test } from "@playwright/test";

// Tela de login sem e-mail nem senha preenchidos ao abrir, no modo local (API desligada) e no
// compartilhado (o backend responde 401 em /api/auth/me, como no ambiente publicado sem sessão).

async function abrirLogin(page, respostaDaSessao) {
  await page.route("**/api/**", (route) => {
    if (new URL(route.request().url()).pathname === "/api/auth/me") return route.fulfill(respostaDaSessao);
    return route.fulfill({ status: 503, json: { erro: "Offline" } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Entrar na Tendra.ai" })).toBeVisible();
}

test("modo local: e-mail e senha vazios, e o botão ainda leva ao Workspace", async ({ page }) => {
  await abrirLogin(page, { status: 503, json: { erro: "Offline" } });
  await expect(page.getByLabel("E-mail")).toHaveValue("");
  await expect(page.getByLabel("Senha")).toHaveValue("");
  await page.getByRole("button", { name: "Entrar na Tendra.ai" }).click();
  await expect(page.getByRole("navigation", { name: "Workspace" })).toBeVisible({ timeout: 20_000 });
});

test("modo compartilhado: e-mail e senha vazios", async ({ page }) => {
  await abrirLogin(page, { status: 401, json: { erro: "Sessão não encontrada." } });
  await expect(page.getByRole("note").filter({ hasText: /sintétic/i })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toHaveValue("");
  await expect(page.getByLabel("Senha")).toHaveValue("");
});
