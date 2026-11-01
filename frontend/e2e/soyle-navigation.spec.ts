import { expect, test, type Page } from '@playwright/test';

async function openSection(page: Page, name: string) {
  const menu = page.getByRole('button', {name: 'Открыть меню', exact: true});
  if (await menu.isVisible()) await menu.click();
  const nav = page.locator('#primary-navigation nav');
  await expect(nav.getByRole('button')).toHaveCount(4);
  await nav.getByRole('button', {name, exact: true}).click();
}

async function openAccount(page: Page) {
  const menu = page.getByRole('button', {name:/^(Открыть меню|Мәзірді ашу)$/});
  if (await menu.isVisible()) await menu.click();
  const avatar = page.locator('.sidebar-account').getByRole('button', {name:/^(Меню аккаунта|Аккаунт мәзірі)$/});
  await avatar.click();
  await expect(page.locator('.topbar .account-menu')).toHaveCount(0);
  await expect(avatar).toBeInViewport();
  return avatar;
}

for (const role of ['student', 'parent'] as const) {
  test(`${role}: four sections, nested pages and avatar account menu`, async ({page}, info) => {
    await page.goto('/app');
    if (role === 'student') await page.getByRole('button', {name:'Ребёнок', exact:true}).click();
    await page.getByLabel(role === 'student' ? 'Логин ребёнка' : 'Логин', {exact:true}).fill(role === 'student' ? 'alikhan' : 'parent');
    await page.getByLabel(role === 'student' ? 'PIN-код' : 'Пароль', {exact:true}).fill(role === 'student' ? '1234' : 'Parent123!');
    await page.getByRole('button', {name:role === 'student' ? 'Начать заниматься' : 'Войти', exact:true}).click();
    await expect(page.locator('.soyle-unified')).toBeVisible();
    await openAccount(page);
    await page.locator('.account-menu-panel button').nth(1).click();
    await page.locator('.settings-page, .child-settings-page').getByRole('button',{name:'Русский',exact:true}).click();
    await expect(page.locator('html')).toHaveAttribute('lang','ru-RU');
    await openSection(page, 'Занятия');
    const tabs = page.locator('.section-navigation');
    await tabs.getByRole('button', {name:role === 'student' ? 'Истории' : 'Гайды',exact:true}).click();
    await expect(page.locator('#primary-navigation nav button[aria-current="page"]')).toHaveText('Занятия');
    await expect(tabs.getByRole('button', {name:role === 'student' ? 'Истории' : 'Гайды',exact:true})).toHaveAttribute('aria-current','page');
    await openSection(page, 'Общение');
    await tabs.getByRole('button', {name:'Мой мир',exact:true}).click();
    await expect(page.locator('#primary-navigation nav button[aria-current="page"]')).toHaveText('Общение');
    await openSection(page, 'Прогресс');
    if (role === 'student') await expect(page.locator('.child-journey-skills')).toBeVisible();
    else await tabs.getByRole('button', {name:'Цели и практика',exact:true}).click();
    await expect(page.locator('#primary-navigation nav button[aria-current="page"]')).toHaveText('Прогресс');
    const avatar = await openAccount(page);
    await page.keyboard.press('Escape');
    await expect(avatar).toBeFocused();
    await expect(avatar).toHaveAttribute('aria-expanded','false');
    await avatar.click();
    await page.locator('.account-menu-panel').getByRole('button',{name:'Настройки',exact:true}).click();
    await expect(page.locator('.settings-page, .child-settings-page')).toBeVisible();
    await page.locator('.settings-page, .child-settings-page').getByRole('button',{name:'Қазақша',exact:true}).click();
    await expect(page.locator('html')).toHaveAttribute('lang','kk-KZ');
    await openAccount(page);
    await expect(page.locator('.account-menu-panel')).toBeVisible();
    await expect(page.locator('.account-menu-panel button')).toHaveCount(3);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({path:`../output/navigation-${role}-${info.project.name}.png`});
  });
}
