import {test,expect} from '@playwright/test';
test.use({storageState:{cookies:[],origins:[]}});

test('admin cabinet localizes role controls and keeps translation review explicit',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('soyle-language','kk-KZ'));
  await page.goto('/app');
  await page.getByLabel('Логин',{exact:true}).fill('admin');
  await page.getByLabel('Құпиясөз',{exact:true}).fill('Admin123!');
  await page.getByRole('button',{name:'Кіру',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Әкімші панелі',exact:true})).toBeVisible();
  await expect(page.getByRole('tab',{name:'Пайдаланушылар',exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Пайдаланушылар',exact:true}).click();
  await expect(page.locator('.account-table select').first()).toContainText('Ата-ана');
  await page.getByRole('tab',{name:'Тапсырмалар',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Тапсырмалар мен тексеру',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'+ Жаңа жоба',exact:true})).toBeVisible();
  await page.locator('.admin-home-review-item').first().getByRole('button').click();
  const preview = page.locator('.home-review-preview');
  await expect(preview).toContainText('маман бөлек тексеруі керек');
  await expect(preview.locator('.home-preview-grid')).toContainText('Заттарды қатар қойыңыз');
  await expect(preview.locator('.runner-finish button.primary-button')).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
