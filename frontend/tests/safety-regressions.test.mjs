import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("authentication stays in HttpOnly cookies and unsafe requests send CSRF", async () => {
  const api = await readProjectFile("lib/api.ts");
  assert.doesNotMatch(api, /localStorage\.setItem\(["']soyle-token/);
  assert.match(api, /credentials:\s*["']include["']/);
  assert.match(api, /X-CSRF-Token/);
});

test("production API requests stay on the site origin so mobile browsers keep auth cookies", async () => {
  const [api, config, auth] = await Promise.all([
    readProjectFile("lib/api.ts"),
    readProjectFile("next.config.ts"),
    readProjectFile("components/AuthScreen.tsx"),
  ]);
  assert.match(api, /process\.env\.NODE_ENV === ["']production["'] \? ["']["']/);
  assert.match(config, /source: ["']\/api\/:path\*["'], destination: `\$\{apiOrigin\}\/api\/:path\*`/);
  assert.match(auth, /const currentUser = await api<User>\("\/api\/auth\/me"\);/);
});

test("successful empty API responses do not crash session recovery", async () => {
  const api = await readProjectFile("lib/api.ts");
  assert.match(api, /data && typeof data === ["']object["'] && ["']csrf_token["'] in data/);
});

test("TTS has a dedicated timeout longer than the ordinary API budget", async () => {
  const api = await readProjectFile("lib/api.ts");
  assert.match(api, /path === ["']\/api\/tts["'] \? 45_000 : 8_000/);
});

test("critical optimistic UI changes report failures and roll back", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  const notificationBlock = app.slice(app.indexOf("const markNotificationRead"), app.indexOf("const changeSettings"));
  const settingsBlock = app.slice(app.indexOf("const changeSettings"), app.indexOf("if (user.role === \"parent\" && childrenLoading"));
  assert.doesNotMatch(notificationBlock, /\.catch\(\(\) => null\)/);
  assert.ok(notificationBlock.includes('t("shell.template9"'));
  assert.match(settingsBlock, /setSettings\(persistedSettingsRef.current\)/);
  assert.ok(settingsBlock.includes('t("shell.template11"'));
});

test("offline copy does not claim an in-memory attempt is safely stored", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  assert.ok(app.includes('t("screen.AuthenticatedApp.ui66")'));
  const messages = JSON.parse(await readProjectFile("locales/ru-RU.json"));
  assert.match(messages["screen.AuthenticatedApp.ui66"], /Результат не сохранится автоматически и пропадёт при обновлении или закрытии страницы/);
});

test("frontend does not request blocked external fonts or unsupported image quality", async () => {
  const [styles, landing] = await Promise.all([
    readProjectFile("app/globals.css"),
    readProjectFile("components/LandingPage.tsx"),
  ]);
  assert.doesNotMatch(styles, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.doesNotMatch(landing, /quality=\{92\}/);
});

test("landing isolates its palette from the application theme", async () => {
  const [landing, styles] = await Promise.all([
    readProjectFile("components/LandingPage.tsx"),
    readProjectFile("app/landing.css"),
  ]);
  assert.match(landing, /className="sl-page"/);
  assert.doesNotMatch(landing, /document\.documentElement\.dataset\.theme\s*=/);
  assert.match(styles, /html:has\(> body > \.sl-page\[data-landing-theme="dark"\]\)\s*\{\s*color-scheme:\s*dark/);
  assert.match(styles, /\.sl-page\s*\{[^}]*background:\s*var\(--sl-paper\)/);
});

test("child AAC vocabulary is not persisted in browser storage", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  assert.doesNotMatch(app, /localStorage[^\n]*soyle-aac|soyle-aac[^\n]*localStorage/);
});

test("camera movement check stays local and cannot be completed by a timer", async () => {
  const [app, detector, packageJson] = await Promise.all([
    readProjectFile("components/SoyleApp.tsx"),
    readProjectFile("lib/motorDetection.ts"),
    readProjectFile("package.json"),
  ]);
  assert.match(app, /FaceLandmarker|@mediapipe|detectForVideo/);
  assert.match(packageJson, /@mediapipe\/tasks-vision/);
  assert.match(app, /local-face-movement-check/);
  assert.match(app, /checked=\{consent\.camera_processing\}/);
  assert.match(app, /navigator\.mediaDevices\?\.getUserMedia/);
  assert.doesNotMatch(app, /cameraEnabled=/);
  assert.ok(app.includes('t("screen.ParentScreen.ui92")'));
  const messages = JSON.parse(await readProjectFile("locales/ru-RU.json"));
  assert.match(messages["screen.ParentScreen.ui92"], /Кадры анализируются только в этом браузере/);
  assert.match(app, /media_sent_to_server:\s*false/);
  assert.match(app, /practice\.phase !== "matched"/);
  assert.ok(app.includes('t("screen.MotorGame.ui4")'));
  assert.match(detector, /changeFromBaseline/);
  assert.doesNotMatch(app, /storage\.googleapis|cdn\.jsdelivr|unpkg\.com/);
});

test("Russian and Kazakh use explicit dictionaries without DOM rewriting", async () => {
  const [i18n, landing] = await Promise.all([
    readProjectFile("lib/i18n.ts"),
    readProjectFile("components/LandingPage.tsx"),
  ]);
  assert.match(i18n, /supportedInterfaceLanguages[^=]*=\s*\["ru", "kk"\]/);
  assert.doesNotMatch(i18n, /MutationObserver|translateTree|createTreeWalker/);
  assert.doesNotMatch(landing, /nextLanguage|landing-language/);
});

test("service worker never caches API or private responses", async () => {
  const [worker, app] = await Promise.all([
    readProjectFile("public/sw.js"),
    readProjectFile("components/SoyleApp.tsx"),
  ]);
  assert.match(worker, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(worker, /headers\.has\("authorization"\)/);
  assert.match(worker, /private\|no-store/);
  assert.match(worker, /event\.request\.mode === "navigate"/);
  assert.doesNotMatch(worker, /"\/", "\/app"/);
  assert.match(app, /localDevelopmentHosts\.has\(window\.location\.hostname\)/);
  assert.match(app, /registration\.unregister\(\)/);
  assert.match(app, /cacheName\.startsWith\("soyle-"\)/);
});

test("security headers cover framing, MIME sniffing and browser capabilities", async () => {
  const config = await readProjectFile("next.config.ts");
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /X-Content-Type-Options/);
  assert.match(config, /Permissions-Policy/);
  assert.match(config, /object-src 'none'/);
  assert.match(config, /wasm-unsafe-eval/);
});

test("parent home avoids a fabricated daily quota and shows a bounded observation", async () => {
  const [app, overview, api] = await Promise.all([
    readProjectFile("components/SoyleApp.tsx"),
    readProjectFile("components/ParentCabinetOverview.tsx"),
    readProjectFile("lib/api.ts"),
  ]);
  assert.match(api, /week_activity:/);
  assert.match(overview, /days=7/);
  assert.match(overview, /week\.sessions/);
  assert.doesNotMatch(overview, /onStartSession|onResume|chooseExercise/);
  assert.doesNotMatch(app, /weekActivity\.map/);
  assert.doesNotMatch(app, /day\s*<\s*Math\.min\(dashboard\?\.week_sessions/);
});

test("child-facing copy does not require a streak or fixed daily quota", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  assert.doesNotMatch(app, /Серия:/);
  assert.doesNotMatch(app, /ПЛАН НА СЕГОДНЯ/);
  assert.doesNotMatch(app, /дней подряд/);
  assert.ok(app.includes('t("screen.SessionScreen.ui20")'));
});

test("public child navigation does not expose motor prototypes", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  const modulesBlock = app.slice(app.indexOf("const modules = ["), app.indexOf("const moduleImages"));
  assert.doesNotMatch(modulesBlock, /id:\s*["']motor["']/);
  assert.match(app, /<ExerciseLibrary items=\{exercises\.filter/);
  assert.match(await readProjectFile("lib/exerciseCovers.ts"), /exercise\.engine\?\.content\.exploration\?\.image\.media_ref/);
  assert.doesNotMatch(app, /<details className="child-more-games"/);
});

test("sensory practice always exposes break and refusal actions", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  assert.match(app, /sensory-stop-actions/);
  assert.match(app, /stopExercise\("break"\)/);
  assert.match(app, /stopExercise\("refused"\)/);
});

test("closed mobile navigation is inert and returns focus", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  assert.match(app, /inert=\{navigationHidden/);
  assert.match(app, /aria-hidden=\{navigationHidden/);
  assert.match(app, /menuButtonRef\.current\?\.focus/);
  assert.match(app, /event\.key === "Escape"/);
});

test("AAC prevents duplicate cards and exposes Stop as an immediate message", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  assert.match(app, /selected\.some\(\(item\) => item\.id === card\.id\)/);
  assert.match(app, /"Стоп"/);
  assert.match(app, /quickCards = \["Помоги", "Больно", "Стоп"/);
});

test("sensory stimuli come from the versioned exercise payload", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  const api = await readProjectFile("lib/api.ts");
  assert.match(app, /exercise\?\.engine\?\.content\.stimuli/);
  assert.match(api, /version_id: number/);
  assert.match(api, /matching_stimulus_key|completion_rule/);
});

test("P1 family screens keep observations separate and drafts review-gated", async () => {
  const [app, family, preview] = await Promise.all([
    readProjectFile("components/SoyleApp.tsx"),
    readProjectFile("components/FamilyPractice.tsx"),
    readProjectFile("components/P1ExerciseRunners.tsx"),
  ]);
  assert.match(app, /FunctionalSkillMap/);
  assert.match(app, /HomePracticeLibrary/);
  assert.match(await readFile(new URL("../components/ParentProgress.tsx", import.meta.url), "utf8"), /P1ResultsSummary/);
  const familyMessages = JSON.parse(await readProjectFile("locales/ru-RU.json"));
  assert.ok(family.includes('t("familyPractice.ui11")'));
  assert.ok(family.includes('t("familyPractice.ui39")'));
  assert.match(familyMessages["familyPractice.ui11"], /Это не тест и не расчёт речевого возраста/);
  assert.match(familyMessages["familyPractice.ui39"], /методической проверке/);
  assert.doesNotMatch(family, /процент развития речи/i);
  const messages = JSON.parse(await readProjectFile("locales/ru-RU.json"));
  assert.ok(preview.includes('t("runner.ui1")'));
  assert.ok(preview.includes('t("runner.ui3")'));
  assert.match(messages["runner.ui1"], /DRAFT · ТОЛЬКО ПРЕДПРОСМОТР/);
  assert.match(messages["runner.ui3"], /Результат не сохраняется/);
  assert.match(preview, /PublishedInstructionRunner/);
  assert.match(app, /mechanic === "tap_instruction"/);
});

test("guided AAC requires a scenario-valid message and an explicit final action", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  assert.match(app, /evaluateAACScenario/);
  assert.match(app, /!scenarioEvaluation\.complete/);
  assert.match(app, /scenarioEvaluation\.actionLabel/);
  assert.match(app, /Шаг 1 из 2|stepLabel/);
  assert.doesNotMatch(app, /Засчитывается любое понятное сообщение/);
});

test("P2.1 goals use a deterministic review-gated planner instead of AI", async () => {
  const [app, goals, api] = await Promise.all([
    readProjectFile("components/SoyleApp.tsx"),
    readProjectFile("components/GoalsAndPractice.tsx"),
    readProjectFile("lib/api.ts"),
  ]);
  assert.match(goals, /\/api\/adaptive-plans\/\$\{child\.id\}/);
  assert.doesNotMatch(app, /api<AIPlan>\(`\/api\/ai\/plan/);
  const messages = JSON.parse(await readProjectFile("locales/ru-RU.json"));
  for (const [key, expected] of [
    ["practice.ui25", /Локальная адаптация/], ["practice.ui26", /Без внешней AI API/],
    ["practice.ui28", /Домашние практические цели/], ["practice.ui38", /Черновики не используются/],
    ["practice.ui86", /Почему предложено/],
  ]) {
    assert.ok(goals.includes(`t("${key}")`));
    assert.match(messages[key], expected);
  }
  assert.doesNotMatch(goals, /речевой возраст|процент развития речи/i);
  assert.match(api, /goal_version: number/);
  assert.match(api, /difficulty_params: AdaptiveDifficultyParams/);
  assert.match(api, /assignment_reason: AdaptiveAssignmentReason/);
});

test("daily duration uses the reviewed rotating session plan and active sessions lock their original duration", async () => {
  const [app, dashboard] = await Promise.all([
    readProjectFile("components/SoyleApp.tsx"),
    readProjectFile("components/ProductExperience.tsx"),
  ]);
  assert.match(app, /\/api\/adaptive-plans\/\$\{child\.id\}/);
  assert.match(app, /adaptive_plan_id: plan.id/);
  assert.match(dashboard, /!currentSession && <div className="v2-minute-picker"/);
  assert.match(dashboard, /SESSION_EXERCISE_COUNTS\[dailyMinutes\]/);
});

test("adaptive analysis has no external model SDK or API key dependency", async () => {
  const [requirements, helper, launcher] = await Promise.all([
    readFile(new URL("../../backend/requirements.txt", import.meta.url), "utf8"),
    readFile(new URL("../../backend/app/ai_assistant.py", import.meta.url), "utf8"),
    readFile(new URL("../../start.sh", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(requirements, /^openai\b/im);
  assert.doesNotMatch(helper, /OpenAI|OPENAI_API_KEY|responses\.create|from openai/i);
  assert.doesNotMatch(launcher, /OPENAI_API_KEY|SOYLE_OPENAI_MODEL|import uvicorn, openai/);
  assert.match(helper, /local rule-based helper/i);
});

test("adaptive runner applies the planned option count instead of a numeric label alone", async () => {
  const app = await readProjectFile("components/SoyleApp.tsx");
  assert.match(app, /exercise\?\.adaptive\?\.difficulty_params\.difficulty_level/);
  assert.ok(app.includes('t("screen.SensoryGame.ui21")'));
  assert.match(app, /exercise\.adaptive\.assignment_reason\.messages\[0\]/);
});
