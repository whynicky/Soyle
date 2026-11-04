import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("specialist roster, child records and drafts follow the selected child", async ({ page }, info) => {
  const children = [
    { id: 3, name: "Алихан", birth_date: "2019-02-05" },
    { id: 7, name: "Амина", birth_date: "2020-11-09" },
  ];
  const observations = [{ id: 1, note: "Попросила воды без подсказки.", context: "За обедом", result_type: "independent", prompt_level: "independent", created_at: "2026-10-30" }];
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/me") return route.fulfill({ json: { id: 10, full_name: "Анна Соколова", role: "specialist" } });
    if (path === "/api/settings") return route.fulfill({ json: { language: "ru", language_configured: true } });
    if (path === "/api/children") return route.fulfill({ json: children });
    if (path === "/api/specialist/children/7/observations" && route.request().method() === "POST") {
      observations.unshift({ ...route.request().postDataJSON(), id: 2, created_at: "2026-11-04" });
      return route.fulfill({ status: 201, json: observations[0] });
    }
    if (path.startsWith("/api/specialist/children/")) {
      const amina = path.endsWith("/7");
      return route.fulfill({ json: {
        observations: amina ? observations : [], available_exercises: [], dashboard: { recent: [], total_sessions: 0 },
        recommendations: amina ? [{ id: 6, created_at: "2026-10-30", is_current: true, family_decision: "accepted", comment: "Предложите выбрать один из двух напитков." }] : [],
        practice_goals: amina ? [{ id: 4, title: "Самостоятельно попросить воду", status: "active", target_outcome: "Использовать слово или жест за обедом." }] : [],
      } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/app");
  const search = page.getByRole("searchbox");
  await expect(search).toBeVisible();
  await page.locator(".desk-roster-heading img").evaluate(image => (image as HTMLImageElement).decode());
  await page.screenshot({ path: info.outputPath("roster.png") });
  await search.fill("МИН");
  await expect(page.locator(".desk-roster li")).toHaveCount(1);
  await page.getByRole("link", { name: /Амина/ }).click();
  await expect(page).toHaveURL(/specialist\/profile\?child=7$/);
  await expect(page.getByRole("heading", { name: "Амина" })).toBeVisible();
  await expect(page.getByText("Самостоятельно попросить воду")).toBeVisible();
  await expect(page.getByText("Попросила воды без подсказки.")).toBeVisible();
  await expect(page.getByText("Предложите выбрать один из двух напитков.")).toBeVisible();
  await page.screenshot({ path: info.outputPath("profile.png") });
  const audit = await new AxeBuilder({ page }).include(".clinician-desk").analyze();
  expect(audit.violations.filter(item => ["critical", "serious"].includes(item.impact || "")).map(item => item.id)).toEqual([]);
  await page.getByRole("button", { name: "Записать наблюдение" }).click();
  await page.getByLabel("Ситуация").fill("На прогулке");
  await page.getByLabel("Наблюдаемые действия").fill("Попросила мяч.");
  await page.getByRole("button", { name: "Сохранить наблюдение" }).click();
  await expect(page.locator(".cabinet-entry").first()).toContainText("Попросила мяч.");
  await page.getByLabel("Ситуация").fill("Черновик");
  await page.locator("#desk-child").selectOption("3");
  await expect(page.getByLabel("Ситуация")).toHaveValue("");
  await expect(page.getByText("Попросила мяч.", { exact: false })).toHaveCount(0);
  await page.goBack();
  await page.reload();
  await expect(page.locator("#desk-child")).toHaveValue("7");
  await expect(page.locator(".cabinet-entry").first()).toContainText("Попросила мяч.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  if (await page.locator(".desk-menu").isVisible()) await page.locator(".desk-menu").click();
  await page.getByRole("link", { name: "Рекомендации", exact: true }).click();
  await expect(page.getByLabel("Как поддержать ребёнка")).toBeVisible();
  await page.goto("/app/specialist/observations");
  await expect(page.getByRole("heading", { name: /Выберите ребёнка/ })).toBeVisible();
  await page.getByRole("link", { name: /Алихан/ }).click();
  await expect(page).toHaveURL(/observations\?child=3$/);
  await expect(page.getByLabel("Ситуация")).toHaveValue("");
});
