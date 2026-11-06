import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

const labels = ['Primeiros passos', 'Dashboard', 'Tarefas', 'Revisão', 'Exportação', 'Histórico', 'Base de conhecimento'];
const nav = page => page.getByRole('navigation', { name: 'Workspace' });
const link = (page, label) => nav(page).getByRole('link', { name: new RegExp(`^${label}(?: \\(?\\d+\\)?)?$`) });
async function enter(page, { server = false, shared = false, documents = 0 } = {}) {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    const json = path === '/api/auth/me'
      ? shared ? { pessoa: { nome: 'Pessoa de teste', papel: 'Aprovador' }, organizacao: { nome: 'Organização sintética' } } : null
      : path === '/api/base/documentos' ? { documentos: Array.from({ length: documents }, (_, i) => ({ id: `doc${i}`, nome: `Documento ${i}`, titulo: `Documento ${i}`, ativo: true, atualizadoEm: '2026-10-29' })) }
      : path === '/api/tarefas' ? { tarefas: [] }
      : path === '/api/pessoas' ? { pessoas: [] }
      : path === '/api/usuarios' ? { usuarios: [] } : null;
    if ((!server && !shared) || json === null) return route.fulfill({ status: 404, json: { erro: 'Fixture sem servidor' } });
    return route.fulfill({ json });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  if (shared) await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  else {
    await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
    await page.getByRole('button', { name: 'Entrar no Tendra.ai' }).click();
  }
  if ((await page.viewportSize()).width < 900) await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await expect(nav(page)).toBeVisible();
}

// Fase O (PO8): Tarefas tem três subitens; aberto, o item pai abre Em andamento, que fica marcado.
const expandedLabels = ['Primeiros passos', 'Dashboard', 'Em andamento', 'Finalizadas', 'Arquivadas', 'Revisão', 'Exportação', 'Histórico', 'Base de conhecimento'];

test('US1: sete destinos, três subitens de Tarefas, seleção, contadores e alvos do DS', async ({ page }) => {
  await enter(page);
  await expect(nav(page).getByRole('link')).toHaveCount(10);
  await link(page, 'Tarefas').click();
  await expect(link(page, 'Em andamento')).toHaveAttribute('aria-current', 'page');
  await expect(link(page, 'Tarefas')).not.toHaveAttribute('aria-current', 'page');
  for (const label of expandedLabels) {
    const item = link(page, label);
    await expect(item).toBeVisible();
    expect((await item.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await item.click();
    await expect(item).toHaveAttribute('aria-current', 'page');
  }
  expect((await nav(page).getByRole('link').allTextContents()).map(text => text.trim())).toEqual(expect.arrayContaining(labels.filter(x => !['Tarefas', 'Revisão', 'Base de conhecimento'].includes(x))));
  await link(page, 'Tarefas').click();
  await page.getByRole('row', { name: /^Abrir / }).first().click();
  await expect(link(page, 'Em andamento')).toHaveAttribute('aria-current', 'page');
  await link(page, 'Tarefas').click();
  await page.getByRole('button', { name: 'Nova RFP/RFI', exact: true }).click();
  await expect(nav(page).locator('[aria-current="page"]')).toHaveCount(0);
});

test('US3: modal, foco e todas as formas de fechamento mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await enter(page);
  const dialog = page.getByRole('dialog', { name: 'Navegação do workspace' });
  await expect(dialog).toBeVisible();
  await expect(link(page, labels[0])).toBeFocused();
  for (const key of [...Array(12).fill('Tab'), ...Array(12).fill('Shift+Tab')]) {
    await page.keyboard.press(key);
    await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  const trigger = page.getByRole('button', { name: 'Abrir menu', exact: true });
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('button', { name: 'Fechar menu', exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(345, 300);
  await expect(dialog).toBeHidden();
  for (const label of labels) {
    await trigger.click();
    await link(page, label).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('main')).toBeFocused();
  }
});

test('US3: resize libera modal e preserva preferência desktop', async ({ page }) => {
  await enter(page);
  await page.getByRole('button', { name: 'Recolher menu', exact: true }).click();
  await page.setViewportSize({ width: 899, height: 720 });
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page.setViewportSize({ width: 900, height: 720 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Expandir menu', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(nav(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Abrir menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
});

test('US2: recolhimento, atalhos e dicas em portal', async ({ page }, testInfo) => {
  await enter(page);
  const before = await page.locator('main').boundingBox();
  await page.getByRole('button', { name: 'Recolher menu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Expandir menu', exact: true })).toBeVisible();
  await expect.poll(async () => (await page.locator('main').boundingBox()).x).toBeLessThan(before.x);
  for (const label of labels) {
    const item = link(page, label);
    await page.keyboard.press('Tab');
    await item.focus();
    await expect(page.getByRole('tooltip')).toContainText(label);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toBeHidden();
    await item.click();
    await expect(item).toHaveAttribute('aria-current', 'page');
  }
  await page.keyboard.press('Control+b');
  await expect(page.getByRole('button', { name: 'Recolher menu', exact: true })).toBeVisible();
  await page.keyboard.press('Meta+b');
  await expect(page.getByRole('button', { name: 'Expandir menu', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('sidebar-collapsed.png') });
  const item = link(page, 'Tarefas');
  await item.hover();
  await expect(page.getByRole('tooltip')).toContainText('Tarefas');
  expect((await page.getByRole('tooltip').boundingBox()).x).toBeGreaterThanOrEqual(64);
  // Sem contadores no menu (ajuste de 06/11/2026): o rótulo recolhido é só o nome.
  await expect(item).toHaveAttribute('aria-label', 'Tarefas');
  await item.click();
  await page.getByRole('button', { name: 'Nova RFP/RFI', exact: true }).click();
  await page.locator('#nt-company').focus();
  await page.keyboard.press('Control+b');
  await expect(page.getByRole('button', { name: 'Expandir menu', exact: true })).toBeVisible();
});

test('US4: demo aprova itens e mantém ação recolhida acessível', async ({ page }) => {
  await enter(page);
  // Sem contadores no menu (ajuste de 06/11/2026): só o nome.
  const review = link(page, 'Revisão');
  await expect(review).toHaveText('Revisão');
  await page.getByRole('button', { name: 'Aprovar todos os itens', exact: true }).click();
  await expect(page.getByText('Todos os itens aprovados e sem alerta pendente.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recolher menu', exact: true }).click();
  const action = page.getByRole('button', { name: 'Painel de demo: aprovar todos os itens', exact: true });
  await page.keyboard.press('Tab');
  await action.focus();
  await expect(page.getByRole('tooltip')).toContainText('Aprovar todos os itens');
  expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await action.click();
});

test('US4: servidor, base vazia e ambiente compartilhado', async ({ page }) => {
  await enter(page, { server: true, shared: true });
  await expect(page.getByRole('button', { name: 'Aprovar todos os itens', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-slot="sidebar-footer"]')).toContainText('Ambiente de testes');
  // Base vazia: o gradiente limão em movimento do "Revisar com IA"; parado com movimento reduzido.
  const style = () => link(page, 'Primeiros passos').evaluate(el => { const c = getComputedStyle(el); return { image: c.backgroundImage, animation: c.animationName }; });
  expect(await style()).toMatchObject({ image: expect.stringContaining('linear-gradient'), animation: 'none' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await style()).toMatchObject({ image: expect.stringContaining('linear-gradient'), animation: 'tdr-ai-flow' });
  await expect(link(page, 'Base de conhecimento')).toHaveText('Base de conhecimento');
});

for (const viewport of [{ width: 360, height: 640 }, { width: 768, height: 1024 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
  test(`DS: legibilidade e movimento reduzido ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await enter(page);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: testInfo.outputPath(`sidebar-${viewport.width}x${viewport.height}.png`) });
    expect(await nav(page).evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    for (const label of labels) {
      const item = link(page, label);
      await item.scrollIntoViewIfNeeded();
      await expect(item).toBeVisible();
      expect((await item.boundingBox()).height).toBeGreaterThanOrEqual(44);
    }
    const base = link(page, 'Base de conhecimento');
    expect(await base.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  });
}

test('DS: base grande e pouca altura preservam links e rodapé, sem contadores no menu', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 360 });
  await enter(page);
  await link(page, 'Base de conhecimento').scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Aprovar todos os itens', exact: true })).toBeVisible();
  await enter(page, { server: true, documents: 1000 });
  const base = link(page, 'Base de conhecimento');
  await base.scrollIntoViewIfNeeded();
  await expect(base).toHaveText('Base de conhecimento');
  expect(await base.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Recolher menu', exact: true }).click();
  await expect(link(page, 'Base de conhecimento')).toHaveAttribute('aria-label', 'Base de conhecimento');
});

test('Barra superior e saída continuam funcionando', async ({ page }) => {
  await enter(page);
  await page.getByRole('button', { name: /^Alertas/ }).click();
  await expect(page.getByRole('button', { name: 'Marcar como lidos' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Marcelo Vieira', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Usuário' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Tendra.ai — voltar ao site' }).click();
  await expect(nav(page)).toBeHidden();
  await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  await page.getByRole('button', { name: 'Entrar no Tendra.ai' }).click();
  await expect(nav(page)).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(nav(page)).toBeHidden();
  await page.keyboard.press('Control+b');
  await expect(nav(page)).toBeHidden();
});

test('Estrutura: marca no sidebar e controle na borda do conteúdo', async ({ page }) => {
  await enter(page);
  const sidebar = page.locator('[data-slot="sidebar"]');
  const brand = sidebar.getByRole('link', { name: 'Tendra.ai — voltar ao site' });
  await expect(brand).toBeVisible();
  const trigger = page.getByRole('button', { name: 'Recolher menu', exact: true });
  expect(await trigger.evaluate(el => el.closest('[data-slot="sidebar"]') === null)).toBe(true);
  expect((await sidebar.boundingBox()).y).toBe(0);
  expect(await sidebar.evaluate(el => getComputedStyle(el).borderRightWidth)).toBe('0px');
  expect((await trigger.boundingBox()).x).toBeGreaterThanOrEqual((await sidebar.boundingBox()).width);
  // Recolher não move o logo: o símbolo fica no mesmo lugar e tamanho, e só o nome some.
  const simbolo = brand.locator('svg').first();
  const antes = await simbolo.boundingBox();
  await trigger.click();
  await expect(brand).toBeVisible();
  await expect(brand.getByRole('img', { name: 'Tendra.ai', exact: true })).toBeVisible();
  await expect.poll(() => brand.getByText('Tendra', { exact: false }).evaluate(el => getComputedStyle(el).opacity)).toBe('0');
  expect(await simbolo.boundingBox()).toEqual(antes);
});

test('Tarefas colapsável: a seta abre e recolhe os subitens, e a escolha fica no navegador', async ({ page }) => {
  await enter(page);
  const recolher = page.getByRole('button', { name: 'Recolher Tarefas', exact: true });
  await expect(link(page, 'Em andamento')).toBeVisible();
  await expect(recolher).toHaveAttribute('aria-expanded', 'true');
  expect((await recolher.boundingBox()).height).toBeGreaterThanOrEqual(36);

  // Em Finalizadas, recolhido: os subitens somem e o pai fica marcado.
  await link(page, 'Finalizadas').click();
  await recolher.click();
  const mostrar = page.getByRole('button', { name: 'Mostrar Tarefas', exact: true });
  await expect(mostrar).toHaveAttribute('aria-expanded', 'false');
  await expect(link(page, 'Em andamento')).toHaveCount(0);
  await expect(link(page, 'Finalizadas')).toHaveCount(0);
  await expect(link(page, 'Tarefas')).toHaveAttribute('aria-current', 'page');

  // Clicar em Tarefas abre Em andamento, sem reabrir os subitens; a escolha sobrevive a recarregar.
  await link(page, 'Tarefas').click();
  await expect(page.getByRole('heading', { level: 1, name: /em andamento$/ })).toBeVisible();
  await expect(mostrar).toBeVisible();
  await enter(page);
  await expect(page.getByRole('button', { name: 'Mostrar Tarefas', exact: true })).toBeVisible();
  await expect(link(page, 'Em andamento')).toHaveCount(0);
  await page.getByRole('button', { name: 'Mostrar Tarefas', exact: true }).click();
  await expect(link(page, 'Em andamento')).toBeVisible();

  // Menu reduzido a ícones: sem a seta, como antes.
  await page.getByRole('button', { name: 'Recolher menu', exact: true }).click();
  await expect(page.getByRole('button', { name: /^(Recolher|Mostrar) Tarefas$/ })).toHaveCount(0);
});
