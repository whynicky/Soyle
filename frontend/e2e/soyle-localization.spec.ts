import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const kk = JSON.parse(readFileSync(new URL('../locales/kk-KZ.json', import.meta.url), 'utf8'));
test.use({storageState:{cookies:[],origins:[]}});

test('first use, Kazakh authentication, switching and reload preserve locale', async ({ page }) => {
  await page.goto('/app');
  const dialog = page.getByRole('dialog', {name:'Выберите язык / Тілді таңдаңыз'});
  await expect(dialog).toHaveCount(0);
  await page.locator(".sa-nav").getByRole("button", {name:"Қазақша",exact:true}).click();
  await expect(page.getByRole('heading',{name:'Аккаунтқа кіру',exact:true})).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang','kk-KZ');
  await page.reload();
  await expect(page.getByRole('heading',{name:'Аккаунтқа кіру',exact:true})).toBeVisible();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button',{name:'Русский',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Вход в аккаунт',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Қазақша',exact:true}).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({path:`../output/locale-auth-${test.info().project.name}.png`,fullPage:true});
});

test('parent preference is saved without changing other settings', async ({ page }) => {
  await page.goto('/app');
  await page.locator(".sa-nav, .sl-header").getByRole("button", { name: "Қазақша", exact: true }).click();
  await page.getByLabel('Логин',{exact:true}).fill('parent');
  await page.getByLabel('Құпиясөз',{exact:true}).fill('Parent123!');
  await page.getByRole('button',{name:'Кіру',exact:true}).click();
  await expect.poll(async () => page.evaluate(async () => (await (await fetch('/api/settings')).json()).language)).toBe('kk');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang','kk-KZ');
  const settings = await page.evaluate(async () => (await fetch('/api/settings')).json());
  expect(settings.theme).toBe('peach');
  expect(settings.sound_enabled).toBe(true);
  await page.context().clearCookies();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Аккаунтқа кіру',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Русский',exact:true}).click();
  await page.getByLabel('Логин',{exact:true}).fill('parent');
  await page.getByLabel('Пароль',{exact:true}).fill('Parent123!');
  await page.getByRole('button',{name:'Войти',exact:true}).click();
  await expect(page.locator('.parent-shell')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang','kk-KZ');

});


test('child settings switch both ways and keep saved progress', async ({ page }) => {
  await page.goto('/app');
  await page.getByRole('button',{name:'Ребёнок',exact:true}).click();
  await page.getByLabel('Логин ребёнка',{exact:true}).fill('alikhan');
  await page.getByLabel('PIN-код',{exact:true}).fill('1234');
  await page.getByRole('button',{name:'Начать заниматься',exact:true}).click();
  await expect(page.locator('.child-room-home')).toBeVisible();
  const before = await page.evaluate(async () => {
    const me = await (await fetch('/api/auth/me')).json();
    return (await fetch(`/api/dashboard/${me.child_id}`)).json();
  });
  const account = page.getByRole('button',{name:/^(Меню аккаунта|Аккаунт мәзірі)$/});
  if (!(await account.isVisible())) {
    await page.getByRole('button',{name:/^(Открыть меню|Мәзірді ашу)$/}).click();
  }
  await account.click();
  await page.locator('.account-menu-panel').getByRole('button',{name:/^(Настройки|Баптаулар)$/}).click();
  await page.getByRole('button',{name:'Қазақша',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Саған қалай ыңғайлы?'})).toBeVisible();
  await expect.poll(async () => page.evaluate(async () => (await (await fetch('/api/settings')).json()).language)).toBe('kk');
  await page.getByRole('button',{name:'Русский',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Как тебе удобнее?'})).toBeVisible();
  await expect.poll(async () => page.evaluate(async () => (await (await fetch('/api/settings')).json()).language)).toBe('ru');
  const after = await page.evaluate(async () => {
    const me = await (await fetch('/api/auth/me')).json();
    return (await fetch(`/api/dashboard/${me.child_id}`)).json();
  });
  expect(after.stars).toBe(before.stars);
  expect(after.total_sessions).toBe(before.total_sessions);
});


test('landing copy and AAC demonstration follow the selected language', async ({page}) => {
  await page.goto('/');
  await page.locator(".sa-nav, .sl-header").getByRole("button", { name: "Қазақша", exact: true }).click();
  await expect(page.getByRole('heading',{name:'Бала ойын жеткізудің түрлі жолын табады'})).toBeVisible();
  const overview = page.locator('.sl-hero-window');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(overview.getByText('Қарым-қатынас кеңістігі', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { selected: true })).toHaveAttribute('id', 'sl-tab-overview');
  await expect(overview.locator('button, a')).toHaveCount(0);
  expect(await page.locator('.sl-page audio').evaluateAll(players => players.every(player => (player as HTMLAudioElement).paused))).toBe(true);

  const panel = page.getByRole('tabpanel');
  await expect(panel.getByRole('heading', { name: 'Үйдегі жаттығу' })).toBeVisible();
  await expect(panel.locator('.sl-object-choice')).toHaveCount(0);
  const note = panel.locator('details');
  await note.locator('summary').click();
  await expect(note).not.toHaveAttribute('open');
  await note.locator('summary').click();
  await expect(note).toHaveAttribute('open', '');
  const startLesson = panel.getByRole('button', { name: 'Тапсырманы байқап көру' });
  await startLesson.click();
  await expect(page.getByRole('tab', { selected: true })).toHaveAttribute('id', 'sl-tab-overview');
  const lesson = panel.locator('.sl-exercise-sheet');
  await expect(lesson.getByRole('heading', { name: 'Алма қайда?' })).toBeVisible();
  const audio = page.waitForResponse(response => response.url().endsWith('/audio/landing/lesson-kk-apple.mp3'));
  await lesson.getByRole('button', { name: 'Сұрақты тыңдау' }).click();
  expect((await audio).ok()).toBe(true);
  await lesson.getByRole('button', { name: 'Алма', exact: true }).click();
  await lesson.locator('.sl-lesson-next').click();
  await expect(lesson.getByRole('heading', { name: 'Су қайда?' })).toBeVisible();

  await panel.getByRole('button', { name: 'Шолуға оралу' }).click();
  await expect(startLesson).toBeFocused();
  await panel.getByRole('button', { name: 'Қарым-қатынас карточкаларын байқап көру' }).click();
  const board = panel.locator('.sl-aac');
  await expect(board.locator('.sl-phrase')).toHaveText('Су ішкім келеді.');
  await board.getByRole('button',{name:'Алма',exact:true}).click();
  await expect(board.locator('.sl-phrase')).toHaveText('Алма жегім келеді.');
  const phraseRequest = page.waitForRequest(request => request.url().endsWith('/api/public/speech/kk/apple'));
  await board.getByRole('button', { name: 'Дыбыстау', exact: true }).click();
  await phraseRequest;
  await panel.getByRole('button', { name: 'Шолуға оралу' }).click();
  await expect(panel.getByRole('heading', { name: 'Үйдегі жаттығу' })).toBeVisible();
  await expect(panel.locator('.sl-object-choice')).toHaveCount(0);
  await page.locator('.sl-footer').getByRole('button',{name:'Русский',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Больше способов сказать важное'})).toBeVisible();
  const family = page.locator('#family');
  await expect(family.getByRole('heading', { name: 'Наблюдения под рукой' })).toBeVisible();
  await expect(family.getByText('Сегодня сама выбрала карточку «Вода».', { exact: true })).toBeVisible();
});


test('landing island stays compact and reloading from the demo returns to the hero', async ({ page }) => {
  await page.goto('/');
  await page.locator('.sl-header').getByRole('button', { name: 'Қазақша', exact: true }).click();
  const header = page.locator('.sl-header');
  const width = await page.evaluate(() => innerWidth);
  const bounds = await header.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThan(0);
  expect(bounds!.width).toBeLessThan(width);
  expect(bounds!.y).toBeGreaterThan(0);

  await expect(header.getByRole('link')).toHaveCount(2);
  await expect(header.getByRole('link', { name: 'Кіру' })).toHaveAttribute('href', '/app');
  await expect(header.locator('.public-theme-toggle')).toBeVisible();
  await expect(header.getByRole('navigation')).toHaveCount(0);
  await expect(page.locator('.sl-hero-actions').getByRole('link')).toHaveCount(1);
  await page.locator('.sl-footer').getByRole('link', { name: 'Қалай жұмыс істейді' }).click();
  await expect(page).toHaveURL(/#journey$/);
  await expect.poll(async () => {
    const target = await page.locator('#journey').boundingBox();
    const island = await header.boundingBox();
    return Boolean(target && island && target.y >= island.y + island.height && target.y < 160);
  }).toBe(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => [location.hash, scrollY])).toEqual(['', 0]);

  await page.goto('/?source=direct#journey');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page.reload();
  await expect.poll(() => page.evaluate(() => [location.search, location.hash, scrollY])).toEqual(['?source=direct', '', 0]);
});

test('landing follows the system theme and serves a saved theme without JavaScript', async ({ page, browser, baseURL }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const landing = page.locator('.sl-page');
  const heroPhoto = page.locator('.sl-hero-photo img');
  const demoTitle = page.locator('#sl-journey-title');
  const selectedTab = page.getByRole('tab', { selected: true });
  await expect(page.getByRole('radio', { name: 'Системная' })).toBeChecked();
  await expect(landing).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(heroPhoto).toHaveJSProperty('fetchPriority', 'high');
  await expect.poll(() => heroPhoto.evaluate(image => (image as HTMLImageElement).currentSrc)).toContain('/scenery/hero-night-');
  await expect(page.locator('.sl-end-photo img')).toHaveAttribute('loading', 'lazy');
  await expect(demoTitle).toHaveCSS('font-weight', '400');
  await expect(selectedTab).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.getByText('Светлая', { exact: true }).click();
  await expect(landing).toHaveCSS('background-color', 'rgb(250, 248, 245)');
  await expect.poll(() => heroPhoto.evaluate(image => (image as HTMLImageElement).currentSrc)).toContain('/scenery/hero-day-');
  await expect(demoTitle).toHaveCSS('font-weight', '400');

  const withoutJavaScript = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    colorScheme: 'dark',
    storageState: await page.context().storageState(),
  });
  try {
    const serverPage = await withoutJavaScript.newPage();
    await serverPage.goto('/');
    await expect(serverPage.locator('.sl-page')).toHaveAttribute('data-landing-theme', 'light');
    await expect(serverPage.locator('.sl-page')).toHaveCSS('background-color', 'rgb(250, 248, 245)');
    await expect(serverPage.getByRole('heading', { name: 'Попросить. Выбрать. Быть услышанным.' })).toBeVisible();
    await expect(serverPage.locator('.sl-hero-actions').getByRole('link', { name: 'Создать аккаунт' })).toHaveAttribute('href', '/app?mode=register');
  } finally {
    await withoutJavaScript.close();
  }
  await page.getByText('Системная', { exact: true }).click();
  await expect(landing).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(landing).toHaveCSS('background-color', 'rgb(250, 248, 245)');
});


test('landing theme reveal keeps the active demo and scroll and follows through to auth', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.addInitScript(() => localStorage.setItem('soyle-language', 'ru-RU'));
  await page.goto('/');
  await page.locator('#sl-tab-history').click();
  await expect(page.locator('#sl-tab-history')).toBeFocused();
  const position = await page.evaluate(() => scrollY);
  const themeControl = (await page.getByRole('button', { name: 'Включить тёмную тему' }).boundingBox())!;
  await page.mouse.click(themeControl.x + themeControl.width / 2, themeControl.y + themeControl.height / 2);
  await expect(page.locator('html')).toHaveAttribute('data-public-theme-transition', 'circle');
  await expect(page.locator('.sl-page')).toHaveAttribute('data-landing-theme', 'dark');
  await expect(page.locator('html')).not.toHaveAttribute('data-public-theme-transition', /.+/);
  await expect(page.locator('#sl-tab-history')).toBeFocused();
  await expect(page.locator('#sl-tab-history')).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => scrollY)).toBe(position);

  await page.locator('#start').getByRole('link', { name: 'Создать аккаунт' }).click();
  await expect(page).toHaveURL(/\/app\?mode=register$/);
  await expect(page.locator('.sa-page')).toHaveAttribute('data-entry-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'Регистрация родителя' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const login = page.getByLabel('Логин', { exact: true });
  const password = page.getByLabel('Пароль', { exact: true });
  await expect(password).toHaveAttribute('autocomplete', 'new-password');
  await login.fill('sample-parent');
  await password.fill('Sample1234!');
  await expect(password).toBeFocused();
  await page.getByRole('button', { name: 'Включить светлую тему' }).click();
  await expect(page.locator('.sa-page')).toHaveAttribute('data-entry-theme', 'light');
  await expect(page.locator('html')).not.toHaveAttribute('data-public-theme-transition', /.+/);
  await expect(page.getByRole('heading', { name: 'Регистрация родителя' })).toBeVisible();
  await expect(login).toHaveValue('sample-parent');
  await expect(password).toHaveValue('Sample1234!');
  await expect(password).toBeFocused();
  await page.getByRole('button', { name: 'Создать аккаунт', exact: true }).click();
  await expect(page.getByLabel('Ваше имя')).toHaveAccessibleDescription('Заполните это поле.');
  await expect(page.getByLabel('Ваше имя')).toBeFocused();
});


test('specialist forms and navigation switch languages without clearing entered observations', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('soyle-language','kk-KZ'));
  let language = 'kk';
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({json:{id:9001,username:'specialist-test',full_name:'Маман',role:'specialist',is_active:true,created_at:'2026-11-01'}});
    if (path === '/api/settings') {
      if (route.request().method() === 'PUT') language = route.request().postDataJSON().language;
      return route.fulfill({json:{language,language_configured:true,camera_enabled:false,sound_enabled:true,calm_mode:false,theme:'peach'}});
    }
    if (path === '/api/children') return route.fulfill({json:[{id:1,name:'Бала',parent_id:1,birth_date:'2020-01-01',avatar_color:'#fff',primary_module:'sensory'}]});
    if (path === '/api/specialist/children/1') return route.fulfill({json:{practice_goals:[],available_exercises:[],observations:[],recommendations:[],dashboard:{recent:[],total_sessions:0}}});
    return route.fulfill({json:[]});
  });
  await page.goto('/app?cabinet=specialist&section=observations');
  await expect(page.getByRole('button',{name:'Бақылауды сақтау',exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Байқалған әрекеттер',exact:true}).fill('Бала өздігінен су сұрады.');
  await page.getByRole('button',{name:'Русский',exact:true}).click();
  await expect(page.getByRole('button',{name:'Сохранить наблюдение',exact:true})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Наблюдаемые действия',exact:true})).toHaveValue('Бала өздігінен су сұрады.');
  await page.getByRole('button',{name:'Қазақша',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Байқалған әрекеттер',exact:true})).toHaveValue('Бала өздігінен су сұрады.');
});


test('Kazakh book preview displays translated scenes and requests matching speech', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('soyle-language','kk-KZ'));
  await page.route('**/api/tts',route => route.fulfill({status:503,json:{detail:'Дыбыс қолжетімсіз'}}));
  await page.goto('/app');
  await page.getByLabel('Логин',{exact:true}).fill('parent');
  await page.getByLabel('Құпиясөз',{exact:true}).fill('Parent123!');
  await page.getByRole('button',{name:'Кіру',exact:true}).click();
  await expect(page.locator('.parent-shell')).toBeVisible();
  await page.goto('/app?cabinet=parent&section=materials');
  await page.locator('summary').filter({hasText:kk['journey.previewStories']}).click();
  await page.getByRole('button',{name:'Ойындары бар кітапты ашу',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Сүйікті ойыншық',exact:true})).toBeVisible();
  const request=page.waitForRequest(request => request.url().endsWith('/api/tts') && request.method()==='POST');
  await page.getByRole('button',{name:'Кітапты ашу',exact:true}).click();
  const payload=(await request).postDataJSON();
  expect(payload.language).toBe('kk');
  expect(payload.text).toContain('Миша ойнағысы келеді.');
  await expect(page.getByText('Бөлмеден қонжықты тап',{exact:true}).first()).toBeVisible();
});


test('Kazakh picnic preview keeps translated choices and Kazakh narration', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('soyle-language','kk-KZ'));
  await page.route('**/api/tts',route => route.fulfill({status:503,json:{detail:'Дыбыс қолжетімсіз'}}));
  await page.goto('/app');
  await page.getByLabel('Логин',{exact:true}).fill('parent');
  await page.getByLabel('Құпиясөз',{exact:true}).fill('Parent123!');
  await page.getByRole('button',{name:'Кіру',exact:true}).click();
  await expect(page.locator('.parent-shell')).toBeVisible();
  const children=await (await page.request.get('http://localhost:8011/api/children')).json();
  const bookUrl=`http://localhost:8011/api/interactive-storybooks/${children[0].id}/picnic`;
  const saved=await (await page.request.get(bookUrl)).json();
  const csrf=(await page.context().cookies()).find(cookie=>cookie.name==='soyle_csrf')?.value || '';
  expect((await page.request.post(bookUrl+'/events',{headers:{'X-CSRF-Token':csrf},data:{version:saved.definition.version,expected_revision:saved.revision,scene_id:saved.definition.scenes[saved.state.scene_index].id,event_id:crypto.randomUUID(),action:'restart'}})).ok()).toBeTruthy();
  await page.goto('/app?cabinet=parent&section=materials');
  await page.locator('summary').filter({hasText:kk['journey.previewStories']}).click();
  await page.getByRole('button',{name:'Комиксті ашу',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Қонжыққа арналған пикник',exact:true})).toBeVisible();
  const request=page.waitForRequest(request => request.url().endsWith('/api/tts') && request.method()==='POST');
  await page.getByRole('button',{name:/^(Кітапты ашу|Оқуды жалғастыру)$/,exact:true}).click();
  const payload=(await request).postDataJSON();
  expect(payload.language).toBe('kk');
  expect(payload.text).toContain('Миша қонжықты пикникке шақырды.');
  await page.getByRole('button',{name:'Әрі қарай',exact:true}).click();
  await expect(page.getByRole('button',{name:'Кітап',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Кітап',exact:true}).click();
  await expect(page.getByText('Кітап алайық. Саябақта суреттерді бірге қараймыз.',{exact:true})).toBeVisible();
});


test('parent previews the Kazakh AAC library without saving a child result', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('soyle-language','kk-KZ'));
  let utterance:{text:string;language:string}|null=null;
  await page.route('**/api/tts',route => { utterance=route.request().postDataJSON(); return route.fulfill({status:503,json:{detail:'Дыбыс қолжетімсіз'}}); });
  await page.goto('/app');
  await page.getByLabel('Логин',{exact:true}).fill('parent');
  await page.getByLabel('Құпиясөз',{exact:true}).fill('Parent123!');
  await page.getByRole('button',{name:'Кіру',exact:true}).click();
  await expect(page.locator('.parent-shell')).toBeVisible();
  await page.goto('/app?cabinet=parent&section=materials');
  const menu = page.getByRole('button',{name:/^(Открыть меню|Мәзірді ашу)$/});
  if ((page.viewportSize()?.width || 1440) <= 760) { await expect(menu).toBeVisible(); await menu.click(); }
  await page.locator('#primary-navigation nav').getByRole('button',{name:kk['navigation.communication'],exact:true}).click();
  await expect(page.getByText(/Карточка аудармаларын алдын ала қарау/)).toBeVisible();
  await page.locator('.aac-card-main').filter({has:page.getByText('Қалаймын',{exact:true})}).click();
  await page.getByRole('button',{name:/^Тағы/}).first().click();
  await page.locator('#more-aac-categories').getByRole('button',{name:/Тағамдар/}).click();
  await page.locator('.aac-card-main').filter({has:page.getByText('Су',{exact:true})}).click();
  await expect(page.locator('.aac-composer-head strong')).toHaveText('Маған су керек.');
  await page.getByRole('button',{name:'Хабарламаны дыбыстау',exact:true}).click();
  await expect.poll(()=>utterance?.language).toBe('kk');
  expect(utterance!.text).toBe('Маған су керек.');
});


test('specialist reviews an AAC translation through the explicit approval control', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('soyle-language','kk-KZ'));
  let reviewed=false;
  const detail={source_card_id:12,source:{label:'Мама'},revision:1,status:'needs_review',payload:{label:'Ана',speech:'Ана.',concept_key:'mother'}};
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/auth/me')return route.fulfill({json:{id:9002,username:'reviewer-test',full_name:'Маман',role:'specialist',is_active:true,created_at:'2026-11-01'}});
    if(path==='/api/settings')return route.fulfill({json:{language:'kk',language_configured:true,camera_enabled:false,sound_enabled:true,calm_mode:false,theme:'peach'}});
    if(path==='/api/admin/aac-translations')return route.fulfill({json:[{source_card_id:12,title:'Мама',revision:1,status:'needs_review'}]});
    if(path==='/api/admin/aac-translations/12')return route.fulfill({json:detail});
    if(path==='/api/admin/aac-translations/12/approve') {
      expect(route.request().postDataJSON().revision).toBe(1);
      expect(route.request().postDataJSON().comment).toContain('Тест');
      reviewed=true;return route.fulfill({json:{...detail,revision:2,status:'approved'}});
    }
    return route.fulfill({json:[]});
  });
  await page.goto('/app/specialist/translations');
  const editor=page.locator('.settings-section').filter({has:page.getByRole('heading',{name:'AAC карточкаларының аудармалары',exact:true})});
  await editor.getByRole('combobox').selectOption('12');
  await editor.getByRole('textbox',{name:'Маманның пікірі',exact:true}).fill('Тест: жеке тексеруді модельдеу.');
  const approve=editor.getByRole('button',{name:'Аударманы мақұлдау',exact:true});
  await approve.click();
  await expect.poll(()=>reviewed).toBeTruthy();
  await expect(approve).toBeDisabled();
});


test('installation metadata follows locale without reloading',async({page})=>{
  await page.goto('/app');
  await page.locator(".sa-nav, .sl-header").getByRole("button", { name: "Қазақша", exact: true }).click();
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href','/localized-manifest?lang=kk-KZ');
  const manifest = await (await page.request.get('/localized-manifest?lang=kk-KZ')).json();
  expect(manifest.lang).toBe('kk-KZ');
  expect(manifest.name).toBe(kk['app.title']);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',kk['app.description']);
});

test('landing previews remain visible when switching languages with motion enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  // Reveal each animated section before switching languages.
  const elements = page.locator('[data-reveal]');
  const count = await elements.count();
  for (let i = 0; i < count; i++) {
    await elements.nth(i).scrollIntoViewIfNeeded();
    await expect(elements.nth(i)).toHaveClass(/sl-visible/);
  }

  await page.locator('#sl-tab-history').click();
  for (const [language, locale] of [['Қазақша', 'kk-KZ'], ['Русский', 'ru-RU']] as const) {
    await page.locator('.sl-footer').getByRole('button', { name: language, exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(elements).toHaveCount(count);
    await expect(page.locator('[data-reveal]:not(.sl-visible)')).toHaveCount(0);
    await expect(page.getByRole('tab', { selected: true })).toHaveAttribute('id', 'sl-tab-history');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  }

  const scene = page.locator('.sl-desktop-scene');
  const initialHeight = (await scene.boundingBox())?.height;
  const desktop = await scene.evaluate((element) => {
    const outer = element.getBoundingClientRect();
    const inner = element.querySelector('.sl-desktop-window')!.getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      widthShare: inner.width / outer.width,
      sceneRatio: outer.width / outer.height,
      windowRatio: inner.width / inner.height,
      marginDifference: Math.abs(inner.top - outer.top - (outer.bottom - inner.bottom)),
    };
  });
  if (desktop.viewport >= 1024) {
    expect(desktop.sceneRatio).toBeCloseTo(1.6);
    expect(desktop.widthShare).toBeCloseTo(.82);
    expect(desktop.windowRatio).toBeGreaterThanOrEqual(1.6);
    expect(desktop.windowRatio).toBeLessThanOrEqual(16 / 9);
    expect(desktop.marginDifference).toBeLessThan(2);
  } else if (desktop.viewport <= 480) {
    expect(desktop.windowRatio).toBeLessThan(1);
    await expect(scene.locator('.sl-window-sidebar')).toBeVisible();
  }
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  for (const tab of await tabs.all()) {
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    if (desktop.viewport > 760) expect((await scene.boundingBox())?.height).toBe(initialHeight);
  }

  await scene.locator('.sl-window-sidebar').getByRole('button', { name: 'Наблюдения', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Наблюдения' })).toHaveAttribute('aria-selected', 'true');
  const history = page.getByRole('tabpanel');
  if (desktop.viewport <= 760) await history.getByRole('combobox').selectOption({ index: 1 });
  else await history.getByRole('button', { name: /Слушай и находи/ }).click();
  await expect(history.locator('.sl-record-detail:not([hidden])')).toContainText('Нашёл яблоко');
  await page.getByRole('tab', { name: 'План занятий' }).click();
  const plan = page.getByRole('tabpanel');
  if (desktop.viewport <= 760) await plan.getByRole('combobox').selectOption({ index: 2 });
  else await plan.getByRole('button', { name: /Собрать просьбу из карточек/ }).click();
  await expect(plan.locator('.sl-record-detail:not([hidden])')).toContainText('Подсказка взрослому');
  await expect(plan.locator('.sl-record-detail:not([hidden])')).toContainText('Попробуйте вместе собрать просьбу из карточек.');

  const family = page.locator('#family');
  await expect(family.locator('.sl-feature-week li')).toHaveCount(7);
  await expect(family.locator('.sl-feature-week li[aria-current]')).toHaveCount(1);
  await expect(family.locator('.sl-feature-tasks li')).toHaveCount(2);
  await expect(family.locator('.sl-feature-stack h4')).toHaveText('Просьба за обедом');
  await expect(family.locator('.sl-feature-scene').getByRole('link')).toHaveCount(0);
  const planLink = family.getByRole('link', { name: 'Посмотреть план' });
  await planLink.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: 'План занятий' })).toHaveAttribute('aria-selected', 'true');
  const historyLink = family.getByRole('link', { name: 'Посмотреть историю' });
  await expect(historyLink).toHaveAttribute('href', '#sl-tab-history');
  await historyLink.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: 'Наблюдения' })).toHaveAttribute('aria-selected', 'true');
  await page.goto('/#sl-tab-plan');
  await expect(page.getByRole('tab', { selected: true })).toHaveAttribute('id', 'sl-tab-plan');
});
