import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { workspacePages } from "../lib/workspacePages";

const testApi = "http://localhost:8011";
const browserApi = "http://localhost:8010";
const surface = (page: Page) => page.locator(".adult-workspace");
const themeControl = (page: Page) => page.locator(".v2-topbar, .desk-topline").getByRole("combobox", { name: "Тема" });
const expectNoOverflow = async (page: Page) => {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
};
async function login(page: Page, username: string, password: string, child = false) {
  await page.route(`${browserApi}/**`, route => route.continue({ url: route.request().url().replace(browserApi, testApi) }));
  await page.goto("/app");
  if (child) await page.getByRole("button", { name: "Ребёнок", exact: true }).click();
  await page.getByLabel(child ? "Логин ребёнка" : "Логин", { exact: true }).fill(username);
  await page.getByLabel(child ? "PIN-код" : "Пароль", { exact: true }).fill(password);
  await page.getByRole("button", { name: child ? "Начать заниматься" : "Войти", exact: true }).click();
}

test("adult theme is shared with public pages and isolated from the child", async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await login(page, "parent", "Parent123!");
  await expect(surface(page)).toHaveAttribute("data-site-theme", "system");
  await expect(surface(page)).toHaveCSS("background-color", "rgb(11, 12, 13)");
  await themeControl(page).selectOption("light");
  await expect(surface(page)).toHaveCSS("background-color", "rgb(248, 247, 244)");
  await page.reload();
  await expect(themeControl(page)).toHaveValue("light");
  await themeControl(page).selectOption("dark");
  await expect(surface(page)).toHaveAttribute("data-site-theme", "dark");

  expect(await (await page.request.get("/privacy")).text()).toContain('data-site-theme="dark"');
  await page.goto("/privacy");
  await expect(page.locator(".legal-theme")).toHaveCSS("background-color", "rgb(11, 12, 13)");
  await page.goto("/");
  await expect(page.locator(".sl-page")).toHaveAttribute("data-landing-theme", "dark");

  await context.clearCookies({ name: /^(?!soyle-landing-theme$).+/ });
  await login(page, "alikhan", "1234", true);
  await expect(page.locator(".child-shell")).toBeVisible();
  await expect(surface(page)).toHaveCount(0);
  await expect(themeControl(page)).toHaveCount(0);
  const childBackground = await page.locator(".child-shell").evaluate(el => getComputedStyle(el).backgroundColor);
  await context.addCookies([{ name: "soyle-landing-theme", value: "light", url: "http://localhost:3003" }]);
  await page.reload();
  await expect(page.locator(".child-shell")).toHaveCSS("background-color", childBackground);
  await expectNoOverflow(page);
});

for (const role of ["parent", "specialist", "admin"] as const) {
  test(`${role} workspace uses the shared theme on nested routes`, async ({ page, context, request }, info) => {
    test.setTimeout(90_000);
    let username: string = role;
    let password = role === "admin" ? "Admin123!" : "Parent123!";
    let childId: number | undefined;
    if (role === "specialist") {
      username = `theme-desk-${info.project.name}-${Date.now()}`;
      password = "ThemeDemo123!";
      const bearer = { "X-Soyle-Auth-Mode": "bearer" };
      const register = await request.post(`${testApi}/api/auth/register`, { headers: bearer, data: { username, password, full_name: "Анна Соколова" } });
      expect(register.status()).toBe(201);
      const { user } = await register.json();
      const admin = await (await request.post(`${testApi}/api/auth/login`, { headers: bearer, data: { username: "admin", password: "Admin123!" } })).json();
      expect((await request.patch(`${testApi}/api/admin/users/${user.id}/role`, { headers: { Authorization: `Bearer ${admin.access_token}` }, data: { role: "specialist" } })).ok()).toBe(true);
      const parent = await (await request.post(`${testApi}/api/auth/login`, { headers: bearer, data: { username: "parent", password: "Parent123!" } })).json();
      const headers = { Authorization: `Bearer ${parent.access_token}` };
      const children = await (await request.get(`${testApi}/api/children`, { headers })).json();
      const selected = children[0].id as number;
      childId = selected;
      expect((await request.put(`${testApi}/api/children/${selected}/consent`, { headers, data: { privacy_accepted: true, specialist_sharing: true } })).ok()).toBe(true);
      expect((await request.post(`${testApi}/api/children/${selected}/specialists`, { headers, data: { username } })).ok()).toBe(true);
    }

    await context.addCookies([{ name: "soyle-landing-theme", value: "light", url: "http://localhost:3003" }]);
    await login(page, username, password);
    await expect(themeControl(page)).toHaveValue("light");
    await page.evaluate(() => document.fonts.ready);
    if (role === "parent") {
      await expect(page.locator(".workspace-overview")).toBeVisible();
      await expect(page.locator(".workspace-skeleton")).toHaveCount(0);
      await page.getByRole("button", { name: "Записать наблюдение" }).click();
      await expect(page).toHaveURL(/\/app\/parent\/observations/);
      const observation = page.locator(".skill-observation-grid article").first();
      const note = "На прогулке сам выбрал мяч.";
      await observation.locator("textarea").fill(note);
      await observation.locator("select").selectOption("independent");
      const saved = page.waitForResponse(response => response.request().method() === "PUT" && response.url().includes("/api/observations/"));
      await observation.getByRole("button").click();
      expect((await saved).ok()).toBe(true);
      await page.goto("/app/parent/overview");
      await expect(page.locator(".workspace-overview")).toContainText(note);
    } else await expect(page.locator(role === "admin" ? ".admin-review-item" : ".desk-roster li").first()).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: info.outputPath(`${role}-light.png`), animations: "disabled" });

    await themeControl(page).selectOption("dark");
    await expect(surface(page)).toHaveCSS("background-color", "rgb(11, 12, 13)");
    await page.screenshot({ path: info.outputPath(`${role}-dark.png`), animations: "disabled" });

    const menu = page.locator(role === "specialist" ? ".desk-menu" : ".v2-topbar .menu-button");
    if (await menu.isVisible()) {
      await expect(menu).toHaveCSS("color", "rgb(243, 242, 239)");
      await menu.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.screenshot({ path: info.outputPath(`${role}-drawer.png`), animations: "disabled" });
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(menu).toBeFocused();
    }

    const rail = page.locator(role === "specialist" ? ".desk-rail" : "#primary-navigation");
    const railToggle = rail.locator(".workspace-rail-toggle");
    if (await railToggle.isVisible()) {
      await railToggle.click();
      await expect(rail.locator(".soyle-logo--mark")).toBeVisible();
      await expect(rail).toHaveCSS("width", "76px");
      await railToggle.click();
      await expect(rail.locator(".soyle-logo--full")).toBeVisible();
    }

    for (const { slug: section } of workspacePages[role]) {
      const query = childId && section !== "children" && section !== "translations" ? `?child=${childId}` : "";
      await page.goto(`/app/${role}/${section}${query}`);
      await expect(themeControl(page)).toHaveValue("dark");
      await expectNoOverflow(page);
      if (role === "parent" && section === "guides") {
        await page.locator(".v2-guide-grid > button").first().click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toHaveCSS("background-color", "rgb(23, 24, 25)");
        await dialog.locator(".v2-guide-close").click();
        await expect(dialog).toHaveCount(0);
      }
      if (info.project.name === "desktop") {
        await page.waitForLoadState("networkidle");
        const audit = await new AxeBuilder({ page }).include(".adult-workspace").withRules(["color-contrast"]).analyze();
        expect(audit.violations.flatMap(problem => problem.nodes.map(node => node.failureSummary)), `${role}/${section}, dark`).toEqual([]);
        await themeControl(page).selectOption("light");
        await expect(surface(page)).toHaveAttribute("data-site-theme", "light");
        await page.reload();
        await expect(surface(page)).toHaveCSS("background-color", "rgb(248, 247, 244)");
        await expect(themeControl(page)).toHaveValue("light");
        await page.waitForLoadState("networkidle");
        const lightAudit = await new AxeBuilder({ page }).include(".adult-workspace").withRules(["color-contrast"]).analyze();
        expect(lightAudit.violations.flatMap(problem => problem.nodes.map(node => node.failureSummary)), `${role}/${section}, light`).toEqual([]);
        await themeControl(page).selectOption("dark");
      }
    }
  });
}
