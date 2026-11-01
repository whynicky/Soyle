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
 expect((await home.locator('.pet-button').boundingBox())!.width).toBeGreaterThan(info.project.name === "desktop" ? 240 : 90);
 for(const img of await home.locator('.home-activity-links img').all()) await expect.poll(()=>img.evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight)).toBeTruthy();
 const box=await home.locator(".home-activities").boundingBox();
 expect(box!.y+box!.height).toBeLessThanOrEqual(await page.evaluate(()=>innerHeight));
 const pet=home.locator('.pet-button');
 const before=await pet.boundingBox();
 await pet.focus();await page.keyboard.press('ArrowLeft');
 await expect.poll(async()=> (await pet.boundingBox())!.x).toBeLessThan(before!.x-8);
 await page.keyboard.press('Home');
 if(info.project.name==='desktop'){
   await page.mouse.move(before!.x+before!.width/2,before!.y+before!.height/2);
   await page.mouse.down();await page.mouse.move(before!.x+before!.width/2-80,before!.y+before!.height/2-30,{steps:8});await page.mouse.up();
   await expect.poll(async()=> (await pet.boundingBox())!.x).toBeLessThan(before!.x-50);
   await pet.focus();await page.keyboard.press('Home');
 }
 await expect(home.locator('.home-listen')).toHaveCount(0);
 await expect(home.locator('.home-pet-bubble')).toHaveCount(0,{timeout:12000});
 await pet.focus();await page.keyboard.press('Enter');
 const bubble=home.locator('.exercise-pet .home-pet-bubble');
 await expect(bubble).toBeVisible();
 const bubbleBefore=await bubble.boundingBox();
 await pet.press('ArrowLeft');
 await expect.poll(async()=> (await bubble.boundingBox())!.x).toBeLessThan(bubbleBefore!.x-8);
 await page.keyboard.press('Home');
 await expect(bubble).toHaveCount(0,{timeout:12000});
 await pet.blur();
 await page.screenshot({path:`../output/scenic-${locale}-${info.project.name}.png`,fullPage:true});
 if(info.project.name==='desktop') expect((await new AxeBuilder({page}).include('.scenic-child-home').analyze()).violations).toEqual([]);
 await home.locator('.home-activity-links button').nth(1).click();
 await expect(page.locator('.v2-stories')).toBeVisible();
});
