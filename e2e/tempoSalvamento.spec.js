import { expect, test } from "@playwright/test";
import { seedItems } from "../src/workspace/data.js";

const casos = [
  [null, "Salvamento automático"], [-1000, "Salvo agora"], [0, "Salvo agora"],
  [999, "Salvo agora"], [1000, "Salvo agora"], [2000, "Salvo agora"],
  [59000, "Salvo agora"], [59999, "Salvo agora"],
  [60000, "Salvo há 1 minuto"], [119000, "Salvo há 1 minuto"],
  [120000, "Salvo há 2 minutos"], [3599000, "Salvo há 59 minutos"],
  [3599999, "Salvo há 59 minutos"], [3600000, "Salvo há 1 hora"],
  [7199000, "Salvo há 1 hora"], [7200000, "Salvo há 2 horas"], [86400000, "Salvo há 24 horas"]
];
for (const [elapsed, expected] of casos) {
  test(`contrato: ${elapsed}ms → ${expected}`, async () => {
    const { formatarTempoSalvamento } = await import("../src/workspace/tempoSalvamento.js");
    const saved = elapsed === null ? 0 : 1_000_000;
    const now = saved + (elapsed ?? 0);
    expect(formatarTempoSalvamento(saved, now)).toBe(expected);
    expect(formatarTempoSalvamento(saved, now)).toBe(expected);
  });
}
test("contrato: ausências e relógio zero", async () => {
  const { formatarTempoSalvamento: format } = await import("../src/workspace/tempoSalvamento.js");
  for (const saved of [0, null, undefined]) expect(format(saved, 0)).toBe("Salvamento automático");
  expect(format(1000, 0)).toBe("Salvo agora");
});

const label = (page) => page.getByText(/^(Salvo agora|Salvo há \d+ (minutos?|horas?)|Salvamento automático)$/);

async function abrir(page, conectado = false) {
  const item = { ...seedItems()[0], numero: 1, tot: 1 };
  const fixture = { item, saves: 0, hold: false, release: null };
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url()).pathname;
    const json = (body, status = 200) => route.fulfill({ status, json: body });
    if (conectado && url === "/api/tarefas") return json({ tarefas: [{ id: "tempo", arquivo: "Teste de tempo", estado: "pronta", total: 1, processadas: 1, criadaEm: "2026-10-29T12:00:00Z", dados: { nome: "Teste de tempo" } }] });
    if (conectado && url === "/api/tarefas/tempo/itens") return json({ itens: [item] });
    if (conectado && url.endsWith("/avaliacoes")) return json({ avaliacoes: [] });
    if (conectado && url.endsWith("/texto")) {
      fixture.saves++;
      if (fixture.hold) {
        await new Promise((resolve) => { fixture.release = resolve; });
        return json({ erro: "Falha simulada" }, 500);
      }
      item.paras = [{ t: route.request().postDataJSON().texto, s: [1] }];
      item.st = "em-revisao";
      return json({ item });
    }
    return json({ erro: "Indisponível nesta fixture" }, 503);
  });
  await page.clock.install({ time: new Date("2026-10-29T12:00:00Z") });
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await page.getByRole("button", { name: "Entrar no Tendra.ai" }).click();
  await page.clock.runFor(8000);
  const nav = page.getByRole("navigation", { name: "Workspace" });
  await expect(nav).toBeVisible();
  await nav.getByText("Revisão", { exact: true }).click();
  await page.getByText(conectado ? "REQ-001/001" : "REQ-001/012", { exact: true }).first().click();
  await expect(label(page)).toHaveText("Salvamento automático");
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 100);
  return fixture;
}
async function editar(page, text) {
  const edit = page.getByRole("button", { name: "Editar resposta", exact: true });
  if (await edit.isVisible()) await edit.click();
  await page.getByRole("textbox", { name: "Resposta", exact: true }).fill(text);
}
async function avancar(page, ms) {
  const now = await page.evaluate(() => Date.now());
  await page.clock.setSystemTime(now + ms);
  await page.clock.runFor(5000);
}

test("US1: transições e retomada usam timestamps", async ({ page }) => {
  await abrir(page);
  await editar(page, "Resposta de teste.");
  await expect(label(page)).toHaveText("Salvo agora");
  await avancar(page, 60000);
  await expect(label(page)).toHaveText("Salvo há 1 minuto");
  await avancar(page, 3540000);
  await expect(label(page)).toHaveText("Salvo há 1 hora");
  await avancar(page, 3600000);
  await expect(label(page)).toHaveText("Salvo há 2 horas");
});

for (const conectado of [false, true]) {
  test(`US2: novo sucesso ${conectado ? "conectado" : "demo"} e referência transitória`, async ({ page }) => {
    const fixture = await abrir(page, conectado);
    await editar(page, "Primeira resposta.");
    if (conectado) {
      expect(fixture.saves).toBe(0);
      await expect(label(page)).toHaveText("Salvamento automático");
      await page.clock.runFor(799);
      expect(fixture.saves).toBe(0);
      await page.clock.runFor(1);
    }
    await expect(label(page)).toHaveText("Salvo agora");
    await avancar(page, 3600000);
    await expect(label(page)).toHaveText("Salvo há 1 hora");
    await page.clock.runFor(123);
    await editar(page, "Nova resposta entre ticks.");
    if (conectado) {
      await expect(label(page)).toHaveText("Salvo há 1 hora");
      await page.clock.runFor(800);
    }
    await expect(label(page)).toHaveText("Salvo agora");
    // Cada item tem o seu indicador: outro item, não editado, segue em "Salvamento automático";
    // voltar ao editado mostra o salvamento dele. O reload inicia uma sessão de estado nova.
    if (!conectado) {
      const editado = (await page.locator('[aria-current="true"]').filter({ hasText: /REQ-\d{3}\/012/ }).first().innerText()).match(/REQ-\d{3}\/012/)[0];
      const outro = editado === "REQ-002/012" ? "REQ-001/012" : "REQ-002/012";
      await page.getByText(outro, { exact: true }).first().click();
      await expect(label(page)).toHaveText("Salvamento automático");
      await page.getByText(editado, { exact: true }).first().click();
      await expect(label(page)).toHaveText("Salvo agora");
    }
    await page.reload();
    await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
    await page.getByRole("button", { name: "Entrar no Tendra.ai" }).click();
    await page.clock.runFor(8000);
    await page.getByRole("navigation", { name: "Workspace" }).getByText("Revisão", { exact: true }).click();
    await expect(label(page)).toHaveText("Salvamento automático");
  });
}

test("US2: pendência e falha não antecipam sucesso", async ({ page }) => {
  const fixture = await abrir(page, true);
  await editar(page, "Resposta salva.");
  await page.clock.runFor(800);
  await expect(label(page)).toHaveText("Salvo agora");
  await avancar(page, 120000);
  await expect(label(page)).toHaveText("Salvo há 2 minutos");
  fixture.hold = true;
  await editar(page, "Resposta cuja gravação falhará.");
  await page.clock.runFor(800);
  await expect.poll(() => fixture.release).not.toBeNull();
  await avancar(page, 60000);
  await expect(label(page)).toHaveText("Salvo há 3 minutos");
  fixture.release();
  await expect(page.getByText("Texto não gravado", { exact: true })).toBeVisible();
  await expect(label(page)).toHaveText("Salvo há 3 minutos");
});

for (const width of [360, 768, 1440]) {
  test(`US2: indicador e controles legíveis em ${width}px`, async ({ page }, testInfo) => {
    await abrir(page);
    await editar(page, "Resposta para validação visual.");
    await page.getByRole("button", { name: "Concluir edição", exact: true }).click();
    await page.setViewportSize({ width, height: 1000 });
    if (width < 900) await page.getByText("REQ-001/012", { exact: true }).first().click();
    for (const [unidade, ms, texto] of [["agora", 5000, "Salvo agora"], ["minutos", 120000, "Salvo há 2 minutos"], ["horas", 7200000, "Salvo há 2 horas"]]) {
      if (unidade === "agora") await page.clock.runFor(ms);
      else await avancar(page, ms);
      const indicador = label(page);
      await expect(indicador).toHaveText(texto);
      await indicador.scrollIntoViewIfNeeded();
      await expect(indicador).toBeVisible();
      const controls = indicador.locator("..").getByRole("button");
      const box = await indicador.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      for (const control of await controls.all()) {
        await expect(control).toBeVisible();
        const b = await control.boundingBox();
        expect(b.x >= box.x + box.width || box.x >= b.x + b.width || b.y >= box.y + box.height || box.y >= b.y + b.height).toBe(true);
      }
      await page.screenshot({ path: testInfo.outputPath(`${width}-${unidade}.png`) });
    }
  });
}
