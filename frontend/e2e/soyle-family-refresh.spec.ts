import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('new progress uses saved results and mobile profile remains reachable',async({page},info)=>{
  const dashboardResponse=page.waitForResponse(response=>/\/api\/dashboard\/\d+/.test(response.url())&&response.ok());
  await page.goto('/app');
  await page.getByRole('button',{name:'Ребёнок',exact:true}).click();
  await page.getByLabel('Логин ребёнка',{exact:true}).fill('alikhan');
  await page.getByLabel('PIN-код',{exact:true}).fill('1234');
  await page.getByRole('button',{name:'Начать заниматься',exact:true}).click();
  await expect(page.locator('.soyle-unified')).toBeVisible();
  const data=await (await dashboardResponse).json();
  const mobile=(page.viewportSize()?.width||1440)<=760;
  if(mobile){
    await expect(page.locator('.child-menu-toggle')).toBeHidden();
    await page.locator('.mobile-account-access .account-menu-trigger').click();
    await expect(page.locator('.mobile-account-access .account-menu-panel')).toBeVisible();
    await expect(page.locator('.mobile-account-access').getByRole('button',{name:'Настройки',exact:true})).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('.family-bottom-nav button').nth(3).click();
  }else {
    const menu=page.getByRole('button',{name:'Открыть меню',exact:true});
    if(await menu.isVisible())await menu.click();
    await page.locator('#primary-navigation nav button').nth(3).click();
  }
  const progress=page.locator('.child-progress-experience');
  await expect(progress).toBeVisible();
  await expect(progress.locator('.progress-totals dd').nth(0)).toHaveText(String(data.stars));
  await expect(progress.locator('.progress-totals dd').nth(1)).toHaveText(String(data.total_sessions));
  await expect(progress.locator('.progress-week')).toHaveCount(0);
  await expect(progress.locator('.pet-shop-card')).toHaveCount(5);
  await expect(progress.locator('.base-pet')).toContainText('Пингвин');
  await expect(progress.locator('.base-pet')).toContainText('Уже с тобой');
  await expect(progress.locator('.pet-shop-balance')).toHaveText(String(data.stars));
  await expect(progress.locator('.pet-shop-preview button')).toHaveCount(0);
  for(const img of await progress.locator('.pet-shop-portrait img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveJSProperty('complete',true);
    expect(await img.evaluate(node=>(node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect((await new AxeBuilder({page}).include('.child-progress-experience').analyze()).violations).toEqual([]);
  await page.screenshot({path:`../output/progress-redesign-${info.project.name}.png`,fullPage:true});
});
