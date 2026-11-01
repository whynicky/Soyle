import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const kk = JSON.parse(readFileSync(new URL('../locales/kk-KZ.json', import.meta.url), 'utf8'));

test.use({storageState:{cookies:[],origins:[]}});

test('Kazakh parent home, world, guides and goals display the selected locale', async ({page}, info) => {
  await page.addInitScript(() => localStorage.setItem('soyle-language', 'kk-KZ'));
  await page.goto('/app');
  await page.getByLabel('Логин', {exact:true}).fill('parent');
  await page.getByLabel('Құпиясөз', {exact:true}).fill('Parent123!');
  await page.getByRole('button', {name:'Кіру',exact:true}).click();
  await expect(page.locator('.v2-parent-overview')).toBeVisible();
  await expect(page.getByRole('heading', {name:kk['ux.parentNext'],exact:true})).toBeVisible();
  await page.getByRole('button', {name:'«Менің әлемім» фотосуреттері',exact:false}).click();
  await expect(page.getByRole('heading', {name:'Менің әлемім',exact:true})).toBeVisible();
  await expect(page.getByRole('button', {name:'Адамдар',exact:true})).toBeVisible();
  await expect(page.getByText('Бір ретте 4 фотосуретке дейін.', {exact:false})).toBeVisible();
  await page.goto('/app');
  await page.locator('.v2-parent-actions').getByRole('button', {name:'Ата-аналарға арналған нұсқаулықтар',exact:false}).click();
  await page.getByRole('button', {name:'Нұсқаулықты оқу',exact:false}).click();
  const guide = page.getByRole('dialog');
  await expect(guide).toContainText('Аударманы маман тексеруі қажет.');
  await expect(guide.locator('li')).toHaveCount(4);
  await expect(guide).toContainText('Сөзді қайталауды талап етпей');
  await page.getByRole('button', {name:'Нұсқаулықты жабу',exact:true}).click();
  await page.goto('/app');
  await page.locator('.v2-parent-actions').getByRole('button', {name:'Қысқа жаттығу мен жазбаларды баптау',exact:false}).click();
  await expect(page.getByRole('heading', {name:'Нақты мақсатқа бағытталған жаттығу',exact:true})).toBeVisible();
  await expect(page.getByRole('combobox', {name:'Дайын мақсат',exact:true}).locator('option').first()).toHaveText('5 таныс затты тану');
  await page.getByRole('textbox', {name:'Қазір не істей алады',exact:true}).fill('Бала таныс допты көрсетеді.');
  await expect(page.getByRole('textbox', {name:'Қазір не істей алады',exact:true})).toHaveValue('Бала таныс допты көрсетеді.');
  await expect(page.locator('.goals-practice-page')).not.toContainText('Домашние практические цели');
  await expect(page.getByText('Жоспарды дайындау', {exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({path:`../output/practice-kazakh-${info.project.name}.png`,fullPage:true});
});
