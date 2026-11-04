import {test,expect} from '@playwright/test';
test.use({storageState:{cookies:[],origins:[]}});

test('admin cabinet localizes role controls and keeps translation review explicit',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('soyle-language','kk-KZ'));
  await page.goto('/app');
  await page.getByLabel('Логин',{exact:true}).fill('admin');
  await page.getByLabel('Құпиясөз',{exact:true}).fill('Admin123!');
  await page.getByRole('button',{name:'Кіру',exact:true}).click();
  const openPage = async (slug: string) => {
    const menu = page.locator('.menu-button');
    if (await menu.isVisible()) await menu.click();
    await page.locator(`.workspace-nav a[href*="/admin/${slug}"]`).click();
  };
  await expect(page).toHaveURL(/\/app\/admin\/exercises/);
  await openPage('users');
  await expect(page.getByRole('heading', {level:1})).toHaveText('Пайдаланушылар');
  await page.reload();
  await expect(page.locator('.account-table select').first()).toContainText('Ата-ана');
  await openPage('audit');
  await page.goBack();
  await expect(page.locator('.account-table')).toBeVisible();
  await openPage('exercises');
  await expect(page.getByRole('heading',{name:'Тапсырмалар мен тексеру',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'+ Жаңа жоба',exact:true})).toBeVisible();
  await page.locator('.admin-home-review-item').first().getByRole('button').click();
  const preview = page.locator('.home-review-preview');
  await expect(preview).toContainText('маман бөлек тексеруі керек');
  await expect(preview.locator('.home-preview-grid')).toContainText('Заттарды қатар қойыңыз');
  await expect(preview.locator('.runner-finish button.primary-button')).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
