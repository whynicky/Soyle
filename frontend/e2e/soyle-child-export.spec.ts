import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const browserApi = "http://localhost:8010";
const testApi = "http://localhost:8011";

async function openDataControls(page: Page) {
  await page.route(`${browserApi}/**`, route => route.continue({ url: route.request().url().replace(browserApi, testApi) }));
  await page.goto("/app");
  await page.getByLabel("Логин", { exact: true }).fill("parent");
  await page.getByLabel("Пароль", { exact: true }).fill("Parent123!");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.locator(".workspace-overview")).toBeVisible();
  await page.goto("/app/parent/access");
  await expect(page.locator(".data-export-control")).toBeVisible();
}

test("the same child can be exported as a readable report and full JSON", async ({ page, context }, info) => {
  await openDataControls(page);

  const [raw] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Полная выгрузка (JSON)", exact: true }).click(),
  ]);
  const rawPath = info.outputPath("data.json");
  await raw.saveAs(rawPath);
  const data = JSON.parse(await readFile(rawPath, "utf8"));
  expect(raw.suggestedFilename()).toBe(`soyle-child-${data.child.id}.json`);
  expect(data).toHaveProperty("audit_events");
  expect(data).toHaveProperty("world_photos");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Скачать отчёт", exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`soyle-child-${data.child.id}-report.html`);
  const reportPath = info.outputPath("report.html");
  await download.saveAs(reportPath);
  const report = await context.newPage();
  await report.goto(pathToFileURL(reportPath).href);
  await expect(report.getByRole("heading", { level: 1 })).toHaveText(data.child.name);
  await expect(report.getByRole("heading", { name: "Что получилось в игре" })).toBeVisible();
  await expect(report.getByRole("heading", { name: "Что дальше по плану" })).toBeVisible();
  await expect(report.getByRole("heading", { name: "Наблюдения в жизни" })).toBeVisible();
  expect(await report.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(info.project.use.viewport!.width);
});

test("download can be retried and the report safely renders saved text and photos", async ({ page, context }, info) => {
  await openDataControls(page);
  let requests = 0;
  const note = 'Выбрал карточку «Вода».\n<img src=x onerror="document.title=1">';
  const date = "2026-11-06T12:00:00Z";
  const headers = {
    "Access-Control-Allow-Origin": new URL(page.url()).origin,
    "Access-Control-Allow-Credentials": "true",
  };
  await page.route(/\/api\/vocabulary\/\d+$/, route => route.fulfill({ headers, json: {
    words: [
      { label: "Одеяло", history: [{ outcome: "independent", created_at: date }] },
      { label: "Кубики", history: [{ outcome: "prompted", created_at: date }] },
    ],
  } }));
  await page.route(/\/api\/children\/\d+\/export$/, async route => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: { ...headers, "Access-Control-Allow-Headers": "Accept-Language" } });
      return;
    }
    requests++;
    if (requests === 1) {
      await route.fulfill({ status: 403, headers, json: { detail: "Access denied" } });
      return;
    }
    const id = Number(new URL(route.request().url()).pathname.split("/").at(-2));
    await route.fulfill({ headers, json: {
      child: { id, name: "Айлин & Алия", birth_date: "2020-05-12" },
      exported_at: date,
      sessions: [
        { exercise_title: "Послушать и выбрать", created_at: date, attempt_status: "completed",
          response_owner: "child", support_context: "independent", attempts_count: 5, correct_answers: 4 },
        { exercise_title: "Старая попытка", created_at: date, attempt_status: "completed",
          response_owner: "unknown", support_context: "unknown", attempts_count: 8, correct_answers: 8 },
        { exercise_title: "Показ взрослого", created_at: date, attempt_status: "completed",
          response_owner: "child", support_context: "caregiver_modelled", attempts_count: 6, correct_answers: 6 },
      ],
      word_observations: [{}],
      homework: [
        { title: "Попросить воду за обедом", instruction: "Предложите воду и сок.", created_at: date },
        { title: "Завершённое домашнее задание", created_at: date, completed_at: date, result: "minimal_prompt" },
      ],
      skill_observations: [{ observed_at: date, note, status: "independent" }],
      aac_history: [{ phrase: "Я хочу воду.", created_at: date }],
      world_photos: [{
        name: "Фото для проверки", created_at: date,
        image_data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=",
      }],
      consent: { camera_processing: 0, specialist_sharing: 1 },
    } });
  });
  const button = page.getByRole("button", { name: "Скачать отчёт", exact: true });
  await button.click();
  await expect(page.locator(".data-export-control").getByRole("alert")).toHaveText("Не удалось скачать файл. Попробуйте ещё раз.");
  await expect(button).toBeEnabled();
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  const reportPath = info.outputPath("example-report.html");
  await download.saveAs(reportPath);
  const report = await context.newPage();
  await report.goto(pathToFileURL(reportPath).href);
  await expect(report.getByRole("heading", { level: 1 })).toHaveText("Айлин & Алия");
  const results = report.locator('[aria-labelledby="results"]');
  await expect(results.getByText("Послушать и выбрать", { exact: true })).toBeVisible();
  await expect(results.getByText("Верно: 4 из 5", { exact: true })).toBeVisible();
  await expect(results.getByText("Старая попытка", { exact: true })).toHaveCount(0);
  await expect(results.getByText("Показ взрослого", { exact: true })).toHaveCount(0);
  await expect(results.locator(".word-summary").getByText("Одеяло", { exact: true })).toBeVisible();
  await expect(results.locator(".word-summary").getByText("Кубики", { exact: true })).toBeVisible();
  const plan = report.locator('[aria-labelledby="plan"]');
  await expect(plan.getByText("Попросить воду за обедом", { exact: true })).toBeVisible();
  await expect(plan.getByText("Завершённое домашнее задание", { exact: true })).toHaveCount(0);
  await expect(report.getByText("Старая попытка", { exact: true })).toBeHidden();
  await report.getByText("Подробный журнал заданий", { exact: true }).click();
  await expect(report.getByText("Старая попытка", { exact: true })).toBeVisible();
  await expect(report.locator("#observations + ul p")).toHaveText(note.replace("\n", " "));
  await expect(report.locator("script, img[onerror]")).toHaveCount(0);
  await report.getByText("Карточки, фотографии и разрешения", { exact: true }).click();
  await expect(report.getByText("Я хочу воду.", { exact: true })).toBeVisible();
  await expect(report.getByRole("img", { name: "Фото для проверки" })).toHaveJSProperty("naturalWidth", 1);
});
