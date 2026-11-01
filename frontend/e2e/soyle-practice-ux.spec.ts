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
async function section(page:Page, index:number) {
  const menu = page.getByRole('button',{name:/^(Открыть меню|Мәзірді ашу)$/});
  if(await menu.isVisible()) await menu.click();
  await page.locator('#primary-navigation nav button').nth(index).click();
}
for (const locale of ['ru','kk'] as const) {
  test(`child main paths ${locale}`,async({page},info)=>{
    await login(page,'student',locale);
    await expect(page.locator('.home-start-action')).toBeVisible();
    await expect(page.locator('.home-activity-links button')).toHaveCount(3);
    if (info.project.name === 'desktop' && locale === 'ru') {
      const audit = await new AxeBuilder({page}).include('.focused-child-home').analyze();
      expect(audit.violations).toEqual([]);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`../output/ux-home-${locale}-${info.project.name}.png`});
    await section(page,1);
    const catalog = page.locator('.focused-catalog');
    if (locale === 'kk') {
      await expect(catalog.locator('.empty-state')).toBeVisible();
    } else {
    await expect(catalog.locator('.exercise-card').first()).toBeVisible();
    const total = await catalog.locator('.exercise-card').count();
    await catalog.getByRole('searchbox').fill('zzznomatch');
    await expect(catalog.locator('.exercise-card')).toHaveCount(0);
    await catalog.locator('.section-heading button').click();
    await expect(catalog.locator('.exercise-card')).toHaveCount(total);
    await catalog.locator('select').first().selectOption('mixed');
    await expect(catalog.locator('.exercise-card:not(.mixed)')).toHaveCount(0);
    await catalog.locator('select').first().selectOption('all');
    await catalog.locator('select').nth(1).selectOption('short');
    await expect(catalog.locator('.exercise-card').first()).toBeVisible();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`../output/ux-catalog-${locale}-${info.project.name}.png`});
    await section(page,2);
    const board = page.locator('.aac-free .aac-board');
    await expect(board).toHaveAttribute('aria-busy','false');
    if (locale === 'kk' && await board.locator('.aac-card-main').count() === 0) {
      await expect(board.locator('.aac-empty')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
      await page.screenshot({path:`../output/ux-words-${locale}-${info.project.name}.png`});
      return;
    }
    await expect(board.locator('.aac-card-main').first()).toBeVisible();
    // Search reaches cards outside the current category, then recent selection can restore them.
    const search = board.getByRole('searchbox');
    await search.fill(locale === 'ru'?'Вода':'Су');
    await expect(board.locator('.aac-card-main').first()).toBeVisible();
    const label = await board.locator('.aac-card-main strong').first().innerText();
    await board.locator('.aac-card-main').first().click();
    await expect(page.locator('.aac-sentence button')).toHaveCount(1);
    await page.locator('.aac-composer-actions button').first().click();
    await expect(page.locator('.aac-sentence button')).toHaveCount(0);
    await page.locator('.primary-aac-tabs button').nth(1).click();
    await expect(board.locator('.aac-card-main strong').first()).toHaveText(label);
    await board.locator('.aac-card-main').first().click();
    await page.locator('.aac-quick').scrollIntoViewIfNeeded();
    await expect(page.locator('.aac-composer-top')).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`../output/ux-words-${locale}-${info.project.name}.png`});
  });
}
test('parent next step and plan are available',async({page},info)=>{
  await login(page,'parent','ru');
  await expect(page.locator('.parent-next-step')).toBeVisible();
  await expect(page.locator('.parent-next-actions .primary-button')).toBeEnabled();
  await page.screenshot({path:`../output/ux-parent-${info.project.name}.png`});
  await page.locator('.parent-next-actions .small-button').click();
  await expect(page.locator('#primary-navigation nav button[aria-current="page"]')).toHaveText('Прогресс');
});
