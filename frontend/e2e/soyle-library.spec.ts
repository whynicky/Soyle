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

for(const locale of ['ru','kk'] as const) {
 test(`story catalog ${locale}`,async({page},info)=>{
   await login(page,'student',locale);
   await section(page,1);
   await page.locator('.section-navigation button').nth(1).click();
   const catalog=page.locator('.focused-stories');
   if(locale==='kk') {
     await expect(catalog.locator('.library-empty')).toBeVisible();
     expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
     await page.screenshot({path:`../output/library-stories-${locale}-${info.project.name}.png`,fullPage:true});
     return;
   }
   await expect(catalog.locator('.v2-story-card').first()).toBeVisible();
   await expect(catalog.getByRole('searchbox')).toHaveCount(0);
   await expect(catalog.locator('select')).toHaveCount(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
   if(info.project.name==='desktop') expect((await new AxeBuilder({page}).include('.focused-stories').analyze()).violations).toEqual([]);
   await page.screenshot({path:`../output/library-stories-${locale}-${info.project.name}.png`,fullPage:true});
   await catalog.locator('.v2-story-card').first().click();
   await expect(page.locator('.sb-welcome,.cinema-player,.book-experience,.interactive-book,.v2-story-player,.book-reader,.book-player').first()).toBeVisible();
 });
 test(`world photos ${locale}`,async({page},info)=>{
   await login(page,'parent',locale);
   await section(page,2);
   await page.locator('.section-navigation button').nth(1).click();
   const world=page.locator('.focused-world');
   await expect(world.locator('.library-heading')).toBeVisible();
   await expect(world.locator('#world-upload')).toBeHidden();
   await world.locator('.library-heading button').click();
   await expect(world.locator('#world-upload')).toBeVisible();
   const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=120;c.height=120;const ctx=c.getContext('2d')!;ctx.fillStyle=`hsl(${Math.random()*360},60%,70%)`;ctx.fillRect(0,0,120,120);return c.toDataURL().split(',')[1];});
   await world.locator('input[type=file]').setInputFiles({name:'test-photo.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
   const preview=world.locator('.v2-photo-upload-preview');
   await expect(preview).toHaveCount(1);
   const name=`Test ${locale} ${info.project.name} ${Date.now()}`;
   await preview.locator('input').fill(name);
   await preview.locator('select').selectOption('toys');
   await world.locator('.v2-photo-upload-review button[type=submit]').click();
   const photo=world.locator('.v2-photo-card').filter({hasText:name});
   await expect(photo).toBeVisible();
   await world.locator('.library-heading button').click();
   await world.getByRole('searchbox').fill('zzzz-no-match');
   await expect(world.locator('.world-empty')).toBeVisible();
   await world.locator('.world-empty button').click();
   await expect(photo).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
   if(info.project.name==='desktop') expect((await new AxeBuilder({page}).include('.focused-world').analyze()).violations).toEqual([]);
   await page.screenshot({path:`../output/library-world-${locale}-${info.project.name}.png`,fullPage:true});
   page.once('dialog',dialog=>dialog.accept());
   await photo.locator('.v2-photo-actions button').last().click();
   await expect(photo).toHaveCount(0);
 });
}

test('story retry, resume and reading states',async({page},info)=>{
  await login(page,'student','ru');
  let failed=true;
  await page.route('**/api/stories/*',async route=>{
    if(failed){await route.fulfill({status:503,json:{detail:'Временная ошибка'}});return;}
    const base={title:'История',summary:'Короткая история о дружбе',cover:'/app-illustrations/library-stories.png',category:'Дружба',scene_count:3,scenes:[],completed_at:null};
    await route.fulfill({json:[{...base,key:'new',title:'Новая история',scene_index:0},{...base,key:'started',title:'Начатая история',scene_index:1,in_progress:true},{...base,key:'finished',title:'Прочитанная история',scene_index:3,completed_at:'2026-11-01'}]});
  });
  await section(page,1);await page.locator('.section-navigation button').nth(1).click();
  const catalog=page.locator('.focused-stories');
  await expect(catalog.getByRole('alert')).toContainText('Временная ошибка');
  failed=false;
  await catalog.getByRole('alert').getByRole('button').click();
  await expect(catalog.locator('.v2-story-card')).toHaveCount(3);
  await expect(catalog.locator('.story-resume')).toContainText('Начатая история');
  for(const state of ['new','started','completed']){
    await expect(catalog.locator(`.v2-story-card .story-state-${state}`)).toBeVisible();
  }
  if(info.project.name==='desktop') expect((await new AxeBuilder({page}).include('.focused-stories').analyze()).violations).toEqual([]);
  await page.screenshot({path:`../output/library-resume-${info.project.name}.png`,fullPage:true});
});
