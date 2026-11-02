import { expect, test } from '@playwright/test';

test('child hears the pet and resumes a chosen exercise without a recommended plan', async ({ page, request }) => {
  const api = 'http://localhost:8011';
  const suffix = Date.now().toString();
  const family = await request.post(api + '/api/auth/register', {
    headers: { 'X-Soyle-Auth-Mode': 'bearer' },
    data: { username: 'family-' + suffix, password: 'HomeVoice123!', full_name: 'Родитель' },
  });
  expect(family.ok()).toBeTruthy();
  const headers = { Authorization: 'Bearer ' + (await family.json()).access_token };
  const child = await request.post(api + '/api/children', { headers, data: { name: 'Алихан', birth_date: '2021-01-01' } });
  const id = (await child.json()).id;
  expect((await request.put(api + '/api/children/' + id + '/consent', { headers, data: { privacy_accepted: true } })).ok()).toBeTruthy();
  expect((await request.post(api + '/api/children/' + id + '/student-account', {
    headers, data: { username: 'kid-' + suffix, pin: '1234' },
  })).ok()).toBeTruthy();
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const response = await route.fetch({ url: api + path, headers: { ...route.request().headers(), origin: 'http://localhost:3003' } });
    if (path === '/api/settings') return route.fulfill({ response, json: { ...await response.json(), language: 'ru', language_configured: true, sound_enabled: true } });
    return route.fulfill({ response });
  });
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.startsWith('blob:')) this.addEventListener('playing', () => {
        document.body.dataset.petAudioPlayed = 'true';
      }, { once: true });
      return play.call(this);
    };
  });
  await page.goto('/app');
  await page.getByRole('button', { name: 'Ребёнок', exact: true }).click();
  await page.getByLabel('Логин ребёнка', { exact: true }).fill('kid-' + suffix);
  await page.getByLabel('PIN-код', { exact: true }).fill('1234');
  await page.getByRole('button', { name: 'Начать заниматься', exact: true }).click();

  const spoken = page.waitForResponse(r => r.url().endsWith('/api/tts') && r.request().postDataJSON().profile === 'pet');
  await page.getByRole('button', { name: 'Включить голос' }).click();
  expect((await spoken).headers()['content-type']).toMatch(/^audio\//);
  await expect(page.locator('body')).toHaveAttribute('data-pet-audio-played', 'true');
  await page.getByRole('button', { name: 'Начать занятие', exact: true }).click();
  await page.getByRole('button', { name: /Я хочу.*Начать/ }).first().click();
  await expect(page.locator('.session-mode')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Выключить голос' })).toBeVisible();
  await page.getByRole('button', { name: 'Продолжить занятие', exact: true }).click();
  await expect(page.locator('.session-mode')).toContainText('Я хочу');
});
