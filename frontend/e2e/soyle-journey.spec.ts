import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function login(page: Page, role: 'student'|'parent', locale: 'ru'|'kk') {
  await page.route('**/api/settings', async route => {
    const response = await route.fetch();
    const data = await response.json();
    await route.fulfill({response, json:{...data,language:locale,language_configured:true}});
  });
  await page.goto('/app');
  if (role === 'student') await page.getByRole('button',{name:'Ребёнок',exact:true}).click();
  await page.getByLabel(role === 'student' ? 'Логин ребёнка':'Логин',{exact:true}).fill(role === 'student'?'alikhan':'parent');
  await page.getByLabel(role === 'student' ? 'PIN-код':'Пароль',{exact:true}).fill(role === 'student'?'1234':'Parent123!');
  await page.getByRole('button',{name:role === 'student'?'Начать заниматься':'Войти',exact:true}).click();
  await expect(page.locator('.soyle-unified')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang',locale === 'ru'?'ru-RU':'kk-KZ');
}
for (const locale of ['ru','kk'] as const) {
  test(`parent journey ${locale}`, async ({page}, info) => {
    await login(page,'parent',locale);
    await expect(page.locator('.parent-next-step, .v2-global-search')).toHaveCount(0);
    await expect(page.locator('#primary-navigation nav')).not.toContainText(/Занятия|Сабақтар/);
    await expect(page.locator('.family-week')).not.toContainText(/Выбрать упражнение|Жаттығуды таңдау/);
    const cabinet=page.locator('.focused-parent-cabinet');
    await expect(cabinet.locator('.family-week')).toBeVisible();
    await expect(cabinet.locator('.family-review-pair section')).toHaveCount(2);
    await expect(cabinet.locator('.cabinet-sections')).toHaveCount(0);
    await expect(page).toHaveURL(/\/app\/parent\/overview/);
    await expect(cabinet.locator('.family-week [role="status"]')).toHaveCount(0);
    await expect(cabinet.locator('.family-review-pair [role="status"]')).toHaveCount(0);
    await expect(cabinet.locator('.cabinet-overview-focused [role="alert"]')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`../output/journey-cabinet-${locale}-${info.project.name}.png`,fullPage:!info.project.name.startsWith("mobile")});
    if(locale==='ru' && info.project.name==='desktop') expect((await new AxeBuilder({page}).include('.cabinet-overview-focused').analyze()).violations).toEqual([]);
    await cabinet.locator('.family-next button').click();
    const field = cabinet.locator('.functional-map select:focus');
    await expect(field).toBeVisible();
    const entry = cabinet.locator('.functional-map article').filter({ has: page.locator('select:focus') });
    const heading = await entry.locator('strong').innerText();
    const form = cabinet.locator('.functional-map article').filter({ has: page.getByText(heading, { exact: true }) });
    const note = `Playwright · ${info.project.name} · ${locale}`;
    await field.selectOption('with_help');
    await form.locator('textarea').fill(note);
    const saved = page.waitForResponse(response => response.url().includes('/api/observations/') && response.request().method() === 'PUT');
    await form.getByRole('button').click();
    expect((await saved).ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/app\/parent\/observations/);
    const menu = page.locator('.menu-button');
    if (await menu.isVisible()) await menu.click();
    await page.locator('.workspace-nav a[href*="/parent/overview"]').click();
    await expect(cabinet.locator('.family-next')).toContainText(note);
    await cabinet.locator('.family-week-header button').click();
    const progress=page.locator('.parent-progress-view');
    await expect(progress.locator('.journey-metrics article')).toHaveCount(3);
    for (const days of ['30','0','7']) {
      const response=page.waitForResponse(r => r.url().includes('/api/progress/') && r.url().includes(`days=${days}`));
      await progress.locator('select').selectOption(days);
      expect((await response).ok()).toBeTruthy();
      await expect(progress.locator('.journey-metrics article')).toHaveCount(3);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`../output/journey-progress-${locale}-${info.project.name}.png`,fullPage:!info.project.name.startsWith("mobile")});
    if(locale==='ru' && info.project.name==='desktop') expect((await new AxeBuilder({page}).include('.parent-progress-view').analyze()).violations).toEqual([]);
  });
}
