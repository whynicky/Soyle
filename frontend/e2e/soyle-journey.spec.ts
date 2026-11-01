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
  test(`parent journey ${locale}`, async ({page}, info) => {
    await login(page,'parent',locale);
    await section(page,3);
    const progress=page.locator('.parent-progress-view');
    await expect(progress.locator('.journey-metrics article')).toHaveCount(3);
    for (const days of ['30','0','7']) {
      const response=page.waitForResponse(r => r.url().includes('/api/progress/') && r.url().includes(`days=${days}`));
      await progress.locator('select').selectOption(days);
      expect((await response).ok()).toBeTruthy();
      await expect(progress.locator('.journey-metrics article')).toHaveCount(3);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`../output/journey-progress-${locale}-${info.project.name}.png`,fullPage:true});
    if(locale==='ru' && info.project.name==='desktop') expect((await new AxeBuilder({page}).include('.parent-progress-view').analyze()).violations).toEqual([]);
    await section(page,0);
    await page.locator('.section-navigation button').nth(1).click();
    const cabinet=page.locator('.focused-parent-cabinet');
    await expect(cabinet.locator('.cabinet-destination-cards article')).toHaveCount(3);
    await expect(cabinet.locator('.cabinet-sections a')).toHaveCount(4);
    for(const img of await cabinet.locator('.cabinet-destination-cards img').all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(()=>img.evaluate((el: HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
    }
    await cabinet.scrollIntoViewIfNeeded();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    await page.screenshot({path:`../output/journey-cabinet-${locale}-${info.project.name}.png`,fullPage:true});
    if(locale==='ru' && info.project.name==='desktop') expect((await new AxeBuilder({page}).include('.cabinet-overview-focused').analyze()).violations).toEqual([]);
    await cabinet.locator('.cabinet-destination-cards button').first().click();
    await expect(cabinet.locator('.cabinet-destination-cards')).toBeHidden();
  });
}
