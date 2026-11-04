import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const API = "http://localhost:8011";
test("family invitation requires confirmation, workspaces stay navigable and revocation works", async ({ page, request }, info) => {
  test.setTimeout(90_000);
  const suffix = `${info.project.name}-${Date.now()}`;
  const password = "PrivacyTest123!";
  const register = async (username: string) => {
    const response = await request.post(`${API}/api/auth/register`, { headers: { "X-Soyle-Auth-Mode": "bearer" }, data: { username, password, full_name: username } });
    expect(response.status()).toBe(201);
    const body = await response.json();
    return { user: body.user, auth: { Authorization: `Bearer ${body.access_token}` } };
  };
  const parent = await register(`family-${suffix}`), specialist = await register(`spec-${suffix}`);
  const adminLogin = await request.post(`${API}/api/auth/login`, { headers: { "X-Soyle-Auth-Mode": "bearer" }, data: { username: "admin", password: "Admin123!" } });
  const admin = { Authorization: `Bearer ${(await adminLogin.json()).access_token}` };
  expect((await request.patch(`${API}/api/admin/users/${specialist.user.id}/role`, { headers: admin, data: { role: "specialist" } })).status()).toBe(200);
  const response = await request.post(`${API}/api/children`, { headers: parent.auth, data: { name: "Тестовый профиль", birth_date: "2020-01-01" } });
  expect(response.status()).toBe(201);
  const child = (await response.json()).id;
  const otherResponse = await request.post(`${API}/api/children`, {headers: parent.auth, data: {name: "Второй профиль", birth_date: "2021-01-01"}});
  expect(otherResponse.status()).toBe(201);
  const otherChild = (await otherResponse.json()).id;
  await request.put(`${API}/api/children/${child}/consent`, { headers: parent.auth, data: { privacy_accepted: true } });
  await page.route("http://localhost:8010/**", route => route.continue({ url: route.request().url().replace(":8010", ":8011") }));
  const login = async (username: string) => {
    await page.goto("/app");
    await page.getByLabel("Логин", { exact: true }).fill(username);
    await page.getByLabel("Пароль", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Войти", exact: true }).click();
  };
  const openFamilyPage = async (name: string) => {
    const menu = page.locator(".menu-button");
    if (await menu.isVisible()) await menu.click();
    await page.locator(".workspace-nav").getByRole("link", { name, exact: true }).click();
  };
  await login(parent.user.username);
  await expect(page.locator(".cabinet-overview-focused")).toBeVisible();
  await page.getByRole("combobox", {name: "Профиль ребёнка", exact: true}).selectOption(String(otherChild));
  await page.reload();
  await expect(page.getByRole("combobox", {name: "Профиль ребёнка", exact: true})).toHaveValue(String(otherChild));
  let releaseConsent!: () => void;
  const consentGate = new Promise<void>(resolve => { releaseConsent = resolve; });
  await page.route(`http://localhost:8010/api/children/${child}/consent`, async route => {
    if (route.request().method() === "GET") await consentGate;
    await route.continue({ url: route.request().url().replace(":8010", ":8011") });
  });
  await page.getByRole("combobox", {name: "Профиль ребёнка", exact: true}).selectOption(String(child));
  await openFamilyPage("Доступ и данные ребёнка");
  await expect(page.getByRole("button", { name: "Сохранить разрешения" })).toBeDisabled();
  releaseConsent();
  await expect(page.getByRole("checkbox", { name: /Сохранение программы и результатов/ })).toBeChecked();
  await page.getByRole("checkbox", { name: /Доступ выбранного специалиста/ }).check();
  await page.getByRole("button", { name: "Сохранить разрешения" }).click();
  await expect(page.getByText("Настройки приватности сохранены")).toBeVisible();
  await openFamilyPage("Специалист");
  await page.getByRole("button", { name: "Создать ссылку-приглашение" }).click();
  const inviteUrl = await page.getByLabel("Ссылка для специалиста").inputValue();
  expect(inviteUrl).toContain("/app#invite=");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Копировать ссылку" }).click();
  await expect(page.getByRole("button", { name: "Скопировано" })).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  // A second browser context has an independent specialist cookie session.
  const context = await page.context().browser()!.newContext({ viewport: page.viewportSize()! });
  await context.addInitScript(() => localStorage.setItem("soyle-language", "ru-RU"));
  const specPage = await context.newPage();
  await specPage.route("http://localhost:8010/**", route => route.continue({ url: route.request().url().replace(":8010", ":8011") }));
  await specPage.goto(inviteUrl);
  await expect(specPage.getByRole("heading", { name: "Присоединиться как специалист" })).toBeVisible();
  await specPage.getByLabel("Логин", { exact: true }).fill(specialist.user.username);
  await specPage.getByLabel("Пароль", { exact: true }).fill(password);
  await specPage.getByRole("button", { name: "Войти", exact: true }).click();
  await specPage.getByRole("button", { name: "Отправить запрос родителю" }).click();
  await expect(specPage.getByRole("heading", { name: "Запрос отправлен родителю" })).toBeVisible();
  await expect(specPage.getByRole("heading", { name: "Нет доступных профилей" })).toBeVisible();
  await specPage.getByRole("button", { name: "Перейти в кабинет" }).click();
  await page.getByRole("button", { name: "Обновить запросы" }).click();
  await expect(page.locator(".invitation-request")).toContainText(specialist.user.username);
  await page.getByRole("button", { name: "Подтвердить доступ", exact: true }).click();
  await expect(page.getByRole("button", { name: "Отозвать доступ", exact: true })).toBeVisible();
  await specPage.getByRole("button", { name: "Обновить список детей" }).click();
  const openSpecialistPage = async (name: string) => {
    const menu = specPage.locator(".desk-menu");
    if (await menu.isVisible()) await menu.click();
    await specPage.locator(".desk-rail").getByRole("link", {name, exact: true}).click();
  };
  const goal = await request.post(API + "/api/practice-goals", {headers: parent.auth, data: {
    child_id: child, template_key: "recognise-five-objects", baseline: "Узнаёт чашку", help_level: "minimal",
  }});
  expect(goal.ok()).toBeTruthy();
  const goalId = (await goal.json()).id;
  for (let i = 1; i <= 4; i++) {
    const recorded = await request.post(`${API}/api/practice-goals/${goalId}/observations`, {headers: parent.auth, data: {
      child_id: child, result_type: "independent", note: "Домашнее наблюдение " + i,
    }});
    expect(recorded.ok()).toBeTruthy();
  }
  for (let i = 0; i < 21; i++) {
    const session = await request.post(API + "/api/sessions", {headers: parent.auth, data: {
      event_id: crypto.randomUUID(), child_id: child, exercise_id: 7, module: "sensory", score: 0,
      duration_seconds: 5, actor_role: "parent", response_owner: "child", support_context: "independent",
      attempt_status: "break", attempts_count: 0, correct_answers: 0,
    }});
    expect(session.ok()).toBeTruthy();
  }
  await specPage.locator(".desk-roster a").filter({hasText: "Тестовый профиль"}).click();
  await expect(specPage.getByText("Домашнее наблюдение 4", {exact: true})).toBeVisible();
  await expect(specPage.getByText(/Со слов родителя/).first()).toBeVisible();
  await specPage.getByRole("button", {name: "Записать наблюдение"}).click();
  await expect(specPage.getByRole("heading", { name: "Наблюдение вне игры" })).toBeVisible();
  await specPage.getByLabel("Что наблюдалось").selectOption("with_help");
  await specPage.getByLabel("Уровень помощи").selectOption("minimal");
  await specPage.getByLabel("Ситуация").fill("Игра с другой игрушкой дома");
  await specPage.getByLabel("Наблюдаемые действия").fill("Выбрал игрушку после указательного жеста");
  await specPage.getByRole("button", { name: "Сохранить наблюдение", exact: true }).click();
  await expect(specPage.getByText("Наблюдение сохранено отдельно от игровых результатов.")).toBeVisible();
  await expect(specPage.getByText("Игра с другой игрушкой дома: Выбрал игрушку после указательного жеста")).toBeVisible();
  const specAxe = await new AxeBuilder({ page: specPage }).analyze();
  expect(specAxe.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  expect(await specPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await specPage.screenshot({ path: info.outputPath("specialist-workspace.png"), fullPage: true });
  await openSpecialistPage("Рекомендации");
  await specPage.getByLabel("Упражнение", {exact: false}).selectOption({index: 1});
  await specPage.getByLabel("Как поддержать ребёнка").fill("Начните с выбора знакомого предмета, спокойно дождитесь ответа ребёнка.");
  await specPage.getByRole("button", {name: "Сохранить рекомендацию", exact: true}).click();
  await expect(specPage.getByText("Рекомендация сохранена. Семья сама выбирает, когда заниматься.")).toBeVisible();
  await page.goto("/app");
  const advice = page.locator(".cabinet-overview-focused .family-entry");
  await expect(advice).toContainText("Начните с выбора знакомого предмета");
  await expect(advice).toContainText(specialist.user.full_name);
  await advice.getByRole("button").click();
  await page.reload();
  await expect(page).toHaveURL(/\/app\/parent\/specialist/);
  await expect(page.getByText("Игра с другой игрушкой дома: Выбрал игрушку после указательного жеста")).toBeVisible();
  const savedNote = page.locator(".cabinet-entry").filter({hasText: "Выбрал игрушку после указательного жеста"});
  await expect(savedNote).toContainText("Небольшая подсказка");
  await expect(savedNote.locator("time")).toHaveAttribute("datetime", /T/);
  await page.goto(`/app/parent/goals?child=${child}`);
  await page.locator(".practice-goal-toggle").click();
  const history = page.locator(".goal-observation-history");
  await expect(history).not.toContainText("Домашнее наблюдение 1");
  await history.getByRole("button", {name: "Показать ещё"}).click();
  await expect(history).toContainText("Домашнее наблюдение 1");
  await expect(history.getByRole("button")).toHaveCount(0);
  await page.goto(`/app/parent/progress?child=${child}`);
  const sessions = page.locator(".journey-history");
  await expect(sessions.locator("li")).toHaveCount(20);
  await expect(sessions.locator("li strong").first()).toHaveText("Домашние животные");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await sessions.getByRole("button", {name: "Показать ещё"}).click();
  await expect(sessions.locator("li")).toHaveCount(21);
  await openSpecialistPage("Цели и история");
  const attempts = specPage.locator("section.cabinet-panel").filter({has: specPage.getByRole("heading", {name:"История игровых попыток"})});
  await expect(attempts.locator("article")).toHaveCount(5);
  await attempts.getByRole("button", {name: "Показать ещё"}).click();
  await expect(attempts.locator("article")).toHaveCount(15);
  for (const name of ["Обзор", "Наблюдения", "Доступ и данные ребёнка", "Специалист"]) {
    await openFamilyPage(name);
    const audit = await new AxeBuilder({page}).analyze();
    expect(audit.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
  for (const name of ["Рекомендации", "Цели и история", "Дети", "Наблюдения"]) {
    await openSpecialistPage(name);
    const audit = await new AxeBuilder({page: specPage}).analyze();
    expect(audit.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
  }
  await page.getByRole("button", { name: "Отозвать доступ", exact: true }).click();
  await expect(page.getByText("Доступ специалиста отозван.")).toBeVisible();
  await specPage.reload();
  await expect(specPage.getByRole("heading", { name: "Нет доступных профилей" })).toBeVisible();
  await page.goto("/app");
  await expect(page.locator(".cabinet-overview-focused")).toBeVisible();
  await expect(page.locator(".cabinet-overview-focused")).not.toContainText("Начните с выбора знакомого предмета");
  await context.close();
});

test("privacy shows MVP gaps without fictional contact details", async ({ page }) => {
  await page.route("http://localhost:8010/**", route => route.continue({ url: route.request().url().replace(":8010", ":8011") }));
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Приватность в Söyle" })).toBeVisible();
  await expect(page.getByText("Пока не определено", { exact: true })).toHaveCount(7);
  await expect(page.getByRole("link", { name: "hello@soyle.app" })).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ["serious", "critical"].includes(item.impact || ""))).toEqual([]);
});
