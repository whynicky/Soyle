import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('family sections align and the mobile dock stays clear of content',async({page},info)=>{
  test.setTimeout(90000);
  await page.goto('/app');
  await page.getByRole('button',{name:'Ребёнок',exact:true}).click();
  await page.getByLabel('Логин ребёнка',{exact:true}).fill('alikhan');
  await page.getByLabel('PIN-код',{exact:true}).fill('1234');
  await page.getByRole('button',{name:'Начать заниматься',exact:true}).click();
  await expect(page.locator('.soyle-unified')).toBeVisible();
  const mobile=(page.viewportSize()?.width || 1440)<=760;
  const dock=page.locator('.family-bottom-nav');
  if(mobile){
    await expect(dock).toBeVisible();
    await expect(page.locator('.child-menu-toggle,.menu-button').filter({visible:true})).toHaveCount(0);
    await expect(dock.locator('button')).toHaveCount(4);
    const box=await dock.boundingBox();
    expect(box!.y+box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect((await new AxeBuilder({page}).include('.family-bottom-nav').analyze()).violations).toEqual([]);
  }else await expect(dock).toBeHidden();
  async function navigate(index:number){
    if(mobile)await dock.locator('button').nth(index).click();
    else {
      const menu=page.getByRole('button',{name:'Открыть меню',exact:true});
      if(await menu.isVisible())await menu.click();
      await page.locator('#primary-navigation nav button').nth(index).click();
    }
  }
  await navigate(1);
  await expect(page.locator('.exercise-card').first()).toBeVisible();
  const gamesTop=(await page.locator('.playroom-tabs').boundingBox())!.y;
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:`../output/mobile-family-games-${info.project.name}.png`,fullPage:true});
  await navigate(2);
  await expect(page.locator('.aac-free')).toBeVisible();
  const wordsTop=(await page.locator('.playroom-tabs').boundingBox())!.y;
  expect(Math.abs(wordsTop-gamesTop)).toBeLessThanOrEqual(3);
  await page.locator('.playroom-tabs button').nth(1).click();
  await expect(page.locator('.focused-world')).toBeVisible();
  const worldTop=(await page.locator('.playroom-tabs').boundingBox())!.y;
  expect(Math.abs(worldTop-gamesTop)).toBeLessThanOrEqual(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:`../output/mobile-family-world-${info.project.name}.png`,fullPage:true});
  await navigate(0);
  await expect(page.locator('.scenic-child-home')).toBeVisible();
  if(mobile){
    expect(await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight)).toBeLessThanOrEqual(200);
    const cards=page.locator('.home-activity-links > button');
    const first=await cards.nth(0).boundingBox(),second=await cards.nth(1).boundingBox();
    expect(second!.y).toBeGreaterThan(first!.y+first!.height);
    await cards.last().scrollIntoViewIfNeeded();
    const content=await cards.last().boundingBox();
    const dockBox=await dock.boundingBox();
    expect(content!.y+content!.height).toBeLessThanOrEqual(dockBox!.y);
  }
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:`../output/mobile-family-home-${info.project.name}.png`,fullPage:true});
});
