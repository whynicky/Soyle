import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('activities design and transient consent recovery',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (...args: Parameters<typeof start>) => {
      document.documentElement.dataset.libraryTransitions = String(Number(document.documentElement.dataset.libraryTransitions || '0') + 1);
      return start(...args);
    };
  });
  let consentCalls=0;
  await page.route('**/api/children/*/consent',async route=>{
    consentCalls++;
    if(consentCalls===1) return route.fulfill({status:502,body:'Bad Gateway'});
    return route.continue();
  });
  await page.goto('/app');
  await page.getByRole('button',{name:'Ребёнок',exact:true}).click();
  await page.getByLabel('Логин ребёнка',{exact:true}).fill('alikhan');
  await page.getByLabel('PIN-код',{exact:true}).fill('1234');
  await page.getByRole('button',{name:'Начать заниматься',exact:true}).click();
  await expect(page.locator('.soyle-unified')).toBeVisible();
  await expect.poll(()=>consentCalls).toBeGreaterThanOrEqual(2);
  await expect(page.getByText(/Не удалось проверить разрешения семьи/)).toHaveCount(0);
  const dock=page.locator('.family-bottom-nav');
  if(await dock.isVisible()) await dock.locator('button').nth(1).click();
  else {
    const menu=page.getByRole('button',{name:'Открыть меню',exact:true});
    if(await menu.isVisible()) await menu.click();
    await page.locator('#primary-navigation nav').getByRole('button',{name:'Занятия',exact:true}).click();
  }
  await expect(page.getByRole('heading',{name:'Во что поиграем?'})).toBeVisible();
  await expect(page.locator('.playroom-featured')).toHaveCount(0);
  await expect(page.locator('.exercise-card').first()).toBeVisible();
  await expect(page.locator('.exercise-library input,.exercise-library select,.exercise-library details')).toHaveCount(0);
  for (const image of await page.locator('.exercise-card-visual img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('complete',true);
    expect(await image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await image.evaluate(node => getComputedStyle(node).objectFit)).toBe('cover');
  }
  await page.evaluate(()=>window.scrollTo(0,0));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect((await new AxeBuilder({page}).include('.playroom-catalog').analyze()).violations).toEqual([]);
  await page.screenshot({path:`../output/playroom-${info.project.name}.png`,fullPage:true});
  await page.locator('.playroom-tabs').getByRole('button',{name:'Истории'}).click();
  await expect(page.locator('.focused-stories')).toBeVisible();
  await expect(page.locator('.v2-story-card').first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-library-transitions','1');
  await expect(page.locator('.focused-stories input,.focused-stories select')).toHaveCount(0);
  await expect(page.locator('.focused-stories .playroom-tabs button[aria-current=page]')).toHaveText('Истории');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect((await new AxeBuilder({page}).include('.focused-stories').analyze()).violations).toEqual([]);
  await page.screenshot({path:`../output/stories-room-${info.project.name}.png`,fullPage:true});
  await page.locator('.focused-stories .playroom-tabs').getByRole('button',{name:'Игры'}).click();
  await expect(page.locator('.exercise-library')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-library-transitions','2');
});
