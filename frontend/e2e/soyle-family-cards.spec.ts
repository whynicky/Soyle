import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const API = "http://localhost:8011";
test.setTimeout(120_000);

async function csrf(page: Page) { return (await page.context().cookies()).find(cookie => cookie.name === "soyle_csrf")?.value || ""; }
async function photo(file: string) { return "data:image/webp;base64," + (await readFile(path.resolve("public/app-illustrations", file))).toString("base64"); }
const spoken = (page: Page) => page.evaluate(() => (window as typeof window & { __spoken?: string[] }).__spoken || []);

async function prepare(page: Page) {
  await page.addInitScript(() => {
    const state = window as typeof window & { __spoken?: string[] };
    state.__spoken = [];
    class Voice { text: string; onend: (() => void) | null = null; constructor(text: string) { this.text = text; } }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: Voice, configurable: true });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      cancel() {}, getVoices: () => [{ lang: "ru-RU", localService: true }],
      speak(voice: Voice) { state.__spoken?.push(voice.text); setTimeout(() => voice.onend?.(), 0); },
    } });
  });
  // Private names never go to the cloud voice: the device voice speaks them.
  await page.route("http://localhost:8010/**", route => new URL(route.request().url()).pathname === "/api/tts"
    ? route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
    : route.continue({ url: route.request().url().replace(":8010", ":8011") }));
}

async function seedFamily(page: Page) {
  expect((await page.request.post(`${API}/api/auth/login`, { data: { username: "parent", password: "Parent123!" } })).ok()).toBe(true);
  const child = (await (await page.request.get(`${API}/api/children`)).json())[0].id as number;
  // Projects share one database: start every run from an empty family.
  for (const card of await (await page.request.get(`${API}/api/world/${child}?kind=family`)).json()) {
    expect((await page.request.delete(`${API}/api/world/${child}/${card.id}`, { headers: { "X-CSRF-Token": await csrf(page) } })).status()).toBe(204);
  }
  const cards = [] as Array<{ id: number; relation: string; image_data: string }>;
  for (const [relation, name, file] of [["mama", "Айгуль", "aac-mother.webp"], ["papa", "", "aac-father.webp"]]) {
    const created = await page.request.post(`${API}/api/world/${child}`, { headers: { "X-CSRF-Token": await csrf(page) }, data: { kind: "family", relation, name, language: "ru", image_data: await photo(file) } });
    expect(created.status(), await created.text()).toBe(201);
    cards.push(await created.json());
  }
  return { child, cards };
}

test("parent manages «Моя семья» and the child meets and finds family by ear", async ({ page }, info) => {
  await prepare(page);
  const { child, cards } = await seedFamily(page);

  // Parent: ready module with relation slots, editing and the child preview.
  await page.goto("/app/parent/family");
  await expect(page.getByRole("heading", { name: "Моя семья", level: 1 })).toBeVisible();
  await expect(page.locator(".family-relation")).toHaveCount(6);
  const mama = page.locator(".family-relation").filter({ has: page.getByRole("heading", { name: "Мама" }) });
  await expect(mama.locator(".family-member")).toHaveCount(1);
  await mama.getByRole("button", { name: "Изменить: Айгуль" }).click();
  await page.getByLabel("Имя (необязательно)").fill("Айгерим");
  await expect(page.locator(".personal-editor-listen strong")).toHaveText("Мама");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(mama.locator(".family-member strong")).toHaveText("Айгерим");
  expect((await new AxeBuilder({ page }).include(".family-module").analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath("parent-family.png"), fullPage: true });
  await page.getByRole("button", { name: "Как видит ребёнок" }).click();
  await expect(page.locator(".family-tile")).toHaveCount(2);

  // Child: no management controls, only the learning module.
  await page.context().clearCookies();
  await page.goto("/app");
  await page.getByRole("button", { name: "Ребёнок", exact: true }).click();
  await page.getByLabel("Логин ребёнка", { exact: true }).fill("alikhan");
  await page.getByLabel("PIN-код", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Начать заниматься", exact: true }).click();
  await expect(page.locator(".child-room-home")).toBeVisible();
  const denied = await page.request.post(`${API}/api/world/${child}`, { headers: { "X-CSRF-Token": await csrf(page) }, data: { kind: "family", relation: "baba", image_data: await photo("aac-cat.webp") } });
  expect(denied.status()).toBe(403);
  const allLessons = page.getByRole("button", { name: /Все занятия/ });
  if (await allLessons.isVisible()) await allLessons.click();
  else await page.locator(".family-bottom-nav").getByRole("button", { name: "Занятия", exact: true }).click();
  await page.locator(".playroom-tabs").getByRole("button", { name: "Моя семья" }).click();
  await expect(page.locator(".family-tile")).toHaveCount(2);
  await expect(page.locator(".family-add, .family-member-actions, .personal-editor")).toHaveCount(0);
  await page.locator(".family-tile").filter({ hasText: "Папа" }).click();
  await expect.poll(() => spoken(page)).toContain("Папа");
  expect((await new AxeBuilder({ page }).include(".family-module").analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath("child-family.png"), fullPage: true });

  await page.getByRole("button", { name: /Знакомство/ }).click();
  await expect(page.locator(".family-meet-word strong")).toHaveText("Мама");
  await expect(page.locator(".family-meet-word span")).toHaveText("Айгерим");
  await page.getByRole("button", { name: "Ещё раз" }).click();
  await page.getByRole("button", { name: "Следующий" }).click();
  await expect(page.locator(".family-meet-word strong")).toHaveText("Папа");
  await page.getByRole("button", { name: "Найди на слух" }).click();

  // The existing «listen and choose» runner plays with the family photos.
  await expect(page.getByRole("heading", { name: "Моя семья: найди на слух" })).toBeVisible();
  await page.locator(".sensory-demo .primary-button").click();
  await expect(page.locator(".picture-options button")).toHaveCount(2);
  await expect(page.locator(".picture-options button").first()).toBeEnabled();
  const word = (await spoken(page)).filter(text => text === "Мама" || text === "Папа").at(-1);
  const target = cards.find(card => card.relation === (word === "Мама" ? "mama" : "papa"))!;
  const options = page.locator(".picture-options button");
  for (let index = 0; index < 2; index++) {
    if (await options.nth(index).locator("img").getAttribute("src") === target.image_data) { await options.nth(index).click(); break; }
  }
  await expect(page.locator(".answer-panel.good")).toBeVisible();
  const saved = page.waitForResponse(response => response.url().endsWith(`/api/world/${child}/results`));
  await page.getByRole("button", { name: /Перерыв/ }).click();
  // This e2e family keeps result history off: nothing is stored, and the child still returns to the module.
  expect((await saved).status()).toBe(403);
  await expect(page.locator(".family-learning")).toBeVisible();

  await page.context().clearCookies();
  await page.request.post(`${API}/api/auth/login`, { data: { username: "parent", password: "Parent123!" } });
  const stats = await (await page.request.get(`${API}/api/world/${child}?kind=family`)).json();
  expect(stats.find((card: { id: number }) => card.id === target.id).practice.rounds).toBe(0);
});
