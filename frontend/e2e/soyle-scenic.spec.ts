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

for(const locale of ['ru','kk'] as const) test(`scenic home ${locale}`,async({page},info)=>{
 await login(page,'student',locale);
 const home=page.locator('.scenic-child-home');
 await expect(home.locator('.home-activity-links button')).toHaveCount(3);
 await expect(home.locator('.pet-button')).toBeVisible();
 expect((await home.locator('.pet-button').boundingBox())!.width).toBeGreaterThan(240);
 for(const img of await home.locator('.home-activity-links img').all()) await expect.poll(()=>img.evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:`../output/scenic-${locale}-${info.project.name}.png`,fullPage:true});
 if(info.project.name==='desktop') expect((await new AxeBuilder({page}).include('.scenic-child-home').analyze()).violations).toEqual([]);
 await home.locator('.home-activity-links button').nth(1).click();
 await expect(page.locator('.v2-stories')).toBeVisible();
});
