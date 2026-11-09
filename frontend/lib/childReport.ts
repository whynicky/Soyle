import artwork from "@/assets/branding/soyle-artwork.json";
import type { Child, ChildConsent, Exercise } from "./api";
import { translate, type Locale, type MessageKey } from "./locale";
import { childReportStyles } from "./childReportStyles";

type Note = {
  note?: string;
  context?: string;
  observed_at?: string;
  created_at?: string;
  status?: string;
  outcome?: string;
  result_type?: string;
};
type Dated = { created_at: string };

export type ReportVocabulary = {
  words: Array<{ label: string; history: Array<Dated & { outcome: string }> }>;
};

export type ChildDataExport = {
  child: Pick<Child, "id" | "name" | "birth_date">;
  exported_at: string;
  sessions?: Array<Dated & {
    exercise_id?: number | null;
    exercise_title?: string | null;
    attempt_status?: string;
    duration_seconds?: number;
    response_owner?: string;
    support_context?: string;
    attempts_count?: number | null;
    correct_answers?: number | null;
  }>;
  skill_observations?: Note[];
  home_activity_observations?: Note[];
  specialist_observations?: Note[];
  practice_goals?: Array<Dated & { title: string; status?: string; observable_behavior?: string; target_outcome?: string; observations?: Note[] }>;
  goals?: Array<Dated & { title: string; status?: string; success_criterion?: string }>;
  homework?: Array<Dated & { title: string; instruction?: string; parent_note?: string; result?: string | null; completed_at?: string | null; due_date?: string | null }>;
  assigned_exercises?: Array<Dated & { exercise_id: number; note?: string; status?: string }>;
  word_observations?: unknown[];
  aac_history?: Array<Dated & { phrase: string }>;
  aac_custom_cards?: Array<Dated & { label: string; speech: string; image: string }>;
  world_photos?: Array<Dated & { name: string; image_data: string }>;
  consent?: Partial<Record<keyof ChildConsent, boolean | number | string | null>>;
};

const htmlCharacters: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
};
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => htmlCharacters[character]);

const sessionStatuses: Record<string, MessageKey> = {
  completed: "journey.completed", participated: "journey.participated", break: "journey.break",
  refused: "journey.refused", technical_error: "journey.technical",
};
const noteStatuses: Record<string, MessageKey> = {
  ...sessionStatuses,
  not_observed: "familyPractice.ui1", not_yet: "familyPractice.ui2", with_help: "familyPractice.ui3",
  independent: "familyPractice.ui4", needs_review: "familyPractice.ui5",
  refused: "familyPractice.ui30", stopped: "familyPractice.ui31",
  minimal_prompt: "familyPractice.ui3", full_prompt: "familyPractice.ui3", failed: "familyPractice.ui2",
};
const supportLabels = {
  independent: "childReport.withoutAdult",
  caregiver_supported: "childReport.withAdult",
  caregiver_modelled: "childReport.adultModelled",
} as const;

type Entry = { title: string; date?: string; description?: string; status?: string; image?: string };
const dateOrder = (value?: string) => Date.parse(value ?? "") || 0;
const newestEntries = (entries: Entry[]) => [...entries].sort((a, b) => dateOrder(b.date) - dateOrder(a.date));

export function renderChildReport(data: ChildDataExport, locale: Locale, exercises: readonly Pick<Exercise, "id" | "title">[], vocabulary?: ReportVocabulary) {
  const t = (key: MessageKey, values?: Record<string, string | number>) => translate(locale, key, values);
  const e = escapeHtml;
  const title = t("childReport.title");
  const exerciseTitles = new Map(exercises.map(exercise => [exercise.id, exercise.title]));
  const exerciseTitle = (id?: number | null) => exerciseTitles.get(id ?? 0) || t("childReport.exercise");
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
  const timestamps = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const number = new Intl.NumberFormat(locale);
  const minutes = new Intl.NumberFormat(locale, { style: "unit", unit: "minute" });
  const seconds = new Intl.NumberFormat(locale, { style: "unit", unit: "second" });
  const dateLabel = (value: string, format: Intl.DateTimeFormat) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : format.format(date);
  };
  const time = (value = "", format = timestamps) => {
    const label = dateLabel(value, format);
    return label ? `<time datetime="${e(value)}">${e(label)}</time>` : "";
  };
  const label = (values: Record<string, MessageKey>, status?: string) =>
    status && Object.hasOwn(values, status) ? t(values[status]) : "";
  const duration = (value?: number) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "";
    if (value < 60) return seconds.format(value);
    const remainder = value % 60;
    return [minutes.format(Math.floor(value / 60)), remainder ? seconds.format(remainder) : ""].filter(Boolean).join(" ");
  };
  const attempts = data.sessions ?? [];
  const sessions: Entry[] = attempts.map(row => ({
    title: row.exercise_title || exerciseTitle(row.exercise_id),
    date: row.created_at,
    status: [label(sessionStatuses, row.attempt_status), duration(row.duration_seconds)].filter(Boolean).join(" · "),
  }));
  const note = (title: string, row: Note): Entry => ({
    title, description: [row.context, row.note].filter(Boolean).join("\n"), date: row.observed_at || row.created_at,
    status: label(noteStatuses, row.status || row.outcome || row.result_type),
  });
  const observations: Entry[] = [
    ...(data.skill_observations ?? []).map(row => note(t("childReport.parentNote"), row)),
    ...(data.home_activity_observations ?? []).map(row => note(t("childReport.homeNote"), row)),
    ...(data.specialist_observations ?? []).map(row => note(t("childReport.specialistNote"), row)),
    ...(data.practice_goals ?? []).flatMap(goal => (goal.observations ?? []).map(row => note(goal.title, row))),
    ...(data.homework ?? []).filter(row => row.result || row.parent_note?.trim()).map(row => ({
      title: row.title, description: row.parent_note, date: row.completed_at || row.created_at, status: label(noteStatuses, row.result ?? undefined),
    })),
  ];
  const plan: Entry[] = [
    ...(data.practice_goals ?? []).filter(row => row.status === "active").map(row => ({
      title: row.title, status: t("childReport.activeGoal"), description: row.observable_behavior || row.target_outcome,
    })),
    ...(data.goals ?? []).filter(row => row.status === "active").map(row => ({
      title: row.title, status: t("childReport.activeGoal"), description: row.success_criterion,
    })),
    ...(data.homework ?? []).filter(row => !row.completed_at && !row.result).map(row => {
      const deadline = row.due_date ? dateLabel(row.due_date, dates) : "";
      return {
        title: row.title, description: row.instruction,
        status: [t("childReport.pendingHomework"), deadline && t("childReport.deadline", { date: deadline })].filter(Boolean).join(" · "),
      };
    }),
    ...(data.assigned_exercises ?? []).filter(row => row.status === "assigned").map(row => ({
      title: exerciseTitle(row.exercise_id), status: t("childReport.assigned"), description: row.note,
    })),
  ];
  const phrases = (data.aac_history ?? []).map(row => ({ title: row.phrase, date: row.created_at }));
  const cards = (data.aac_custom_cards ?? []).map(row => ({
    title: row.label, description: row.speech !== row.label ? row.speech : "", date: row.created_at, image: row.image,
  }));
  const photos = (data.world_photos ?? []).map(row => ({ title: row.name, date: row.created_at, image: row.image_data }));

  const renderEntry = (entry: Entry) => {
    const date = time(entry.date);
    const image = entry.image && /^data:image\/(png|jpeg|webp);base64,[a-z\d+/]+={0,2}$/i.test(entry.image)
      ? `<img src="${e(entry.image)}" alt="${e(entry.title)}" decoding="async">` : "";
    return `<li>${image}<div class="entry"><div><strong>${e(entry.title)}</strong>${
      entry.status ? `<small>${e(entry.status)}</small>` : ""
    }${entry.description ? `<p>${e(entry.description)}</p>` : ""}</div>${date}</div></li>`;
  };
  const section = (id: string, heading: MessageKey, entries: Entry[], empty?: MessageKey) => {
    if (!entries.length && !empty) return "";
    const newestFirst = newestEntries(entries);
    return `<section aria-labelledby="${id}"><h2 id="${id}">${e(t(heading))}</h2>${
      newestFirst.length ? `<ul class="${id === "photos" || id === "cards" ? "gallery" : "records"}">${newestFirst.map(renderEntry).join("")}</ul>`
        : empty ? `<p class="empty">${e(t(empty))}</p>` : ""
    }</section>`;
  };
  const withChild = attempts.filter(row => row.response_owner === "child"
    && (row.attempt_status === "completed" || row.attempt_status === "participated")
    && row.support_context && Object.hasOwn(supportLabels, row.support_context));
  const participation = Object.entries(supportLabels).map(([support, key]) => ({
    count: withChild.filter(row => row.support_context === support).length, label: t(key),
  }));
  const scored = new Map<string, Entry>();
  const recentAttempts = [...withChild].sort((a, b) => dateOrder(b.created_at) - dateOrder(a.created_at));
  for (const row of recentAttempts) {
    const title = row.exercise_title || exerciseTitles.get(row.exercise_id ?? 0);
    const total = row.attempts_count ?? 0;
    const correct = row.correct_answers;
    if (!title || scored.has(title) || row.attempt_status !== "completed" || row.support_context === "caregiver_modelled"
      || !Number.isInteger(total) || total <= 0 || correct == null || !Number.isInteger(correct) || correct < 0 || correct > total) continue;
    scored.set(title, {
      title, date: row.created_at, status: t("journey.answerCount", { correct: number.format(correct), total: number.format(total) }),
    });
    if (scored.size === 3) break;
  }
  const recentWords = (vocabulary?.words ?? []).flatMap(word => {
    const latest = word.history[0];
    return latest ? [{ ...latest, label: word.label }] : [];
  }).sort((a, b) => dateOrder(b.created_at) - dateOrder(a.created_at));
  const wordGroups = [
    ["independent", "familyPractice.ui4"], ["prompted", "childReport.withPrompt"], ["modelled", "childReport.adultModelled"],
  ] as const;
  const wordSummary = wordGroups.flatMap(([outcome, key]) => {
    const words = recentWords.filter(word => word.outcome === outcome).slice(0, 8);
    return words.length ? `<div><dt>${e(t(key))}</dt><dd>${e(words.map(word => word.label).join(", "))}</dd></div>` : [];
  });
  const latestNotes = newestEntries(observations);
  const extraNotes = latestNotes.slice(3);
  const appendix = (heading: MessageKey, body: string) => `<details class="appendix"><summary>${e(t(heading))}</summary>${body}</details>`;
  const consentLabels = [
    ["privacy_accepted", "screen.ParentScreen.ui89"], ["camera_processing", "screen.ParentScreen.ui91"],
    ["analytics_processing", "screen.ParentScreen.ui93"], ["specialist_sharing", "screen.ParentScreen.ui95"],
  ] as const;
  const permissions = consentLabels.flatMap(([key, message]) => {
    const value = data.consent?.[key];
    if (value == null) return [];
    return `<div><dt>${e(t(message))}</dt><dd>${e(t(value === true || value === 1 ? "childReport.allowed" : "childReport.disallowed"))}</dd></div>`;
  });
  const { mark, word, full } = artwork;
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${e(title)} · ${e(data.child.name)} · Söyle</title>
<style>${childReportStyles}</style>
</head>
<body><main>
<header>
  <svg class="brand" role="img" aria-label="Söyle" viewBox="0 0 ${full.width} ${full.height}" fill="currentColor" fill-rule="evenodd">
    <path d="${mark.path}" transform="${full.markTransform}"/><path d="${word.path}" transform="${full.wordTransform}"/>
  </svg>
  <p class="eyebrow">${e(title)}</p>
  <h1>${e(data.child.name)}</h1>
  <dl class="profile">
    <div><dt>${e(t("childReport.birthDate"))}</dt><dd>${time(data.child.birth_date, dates) || "—"}</dd></div>
    <div><dt>${e(t("childReport.generated"))}</dt><dd>${time(data.exported_at) || "—"}</dd></div>
  </dl>
</header>
<section aria-labelledby="results">
  <h2 id="results">${e(t("childReport.results"))}</h2>
  ${wordSummary.length ? `<div class="word-summary"><p>${e(t("childReport.wordsHint"))}</p><dl>${wordSummary.join("")}</dl></div>` : ""}
  ${!vocabulary && data.word_observations?.length ? `<p class="muted">${e(t("childReport.wordsUnavailable"))}</p>` : ""}
  ${scored.size ? `<h3>${e(t("childReport.recentResults"))}</h3><ul class="records">${[...scored.values()].map(renderEntry).join("")}</ul>` : ""}
  ${withChild.length ? `<dl class="participation">${participation.map(item => `<div><dt>${e(item.label)}</dt><dd>${number.format(item.count)}</dd></div>`).join("")}</dl>
    <p class="muted">${e(t("childReport.participationHint"))}</p>` : `<p class="muted">${e(t(attempts.length ? "childReport.noSupportData" : "childReport.noPractice"))}</p>`}
</section>
<section aria-labelledby="plan">
  <h2 id="plan">${e(t("childReport.plan"))}</h2>
  ${plan.length ? `<ul class="records">${plan.map(renderEntry).join("")}</ul>` : `<p>${e(t("childReport.noPlan"))}</p>`}
</section>
${section("observations", "familyPractice.ui47", latestNotes.slice(0, 3), "childReport.noObservations")}
<p class="muted observation-hint">${e(t("childReport.observationHint"))}</p>
${extraNotes.length ? appendix("childReport.moreObservations", `<ul class="records">${extraNotes.map(renderEntry).join("")}</ul>`) : ""}
${sessions.length ? appendix("childReport.practice", `<ul class="records">${newestEntries(sessions).map(renderEntry).join("")}</ul>`) : ""}
${phrases.length || cards.length || photos.length || permissions.length ? appendix("childReport.materials",
  section("phrases", "childReport.phrases", phrases)
  + section("cards", "childReport.cards", cards)
  + section("photos", "workspace.photos", photos)
  + (permissions.length ? `<section aria-labelledby="permissions"><h2 id="permissions">${e(t("screen.ParentScreen.ui87"))}</h2><dl class="permissions">${permissions.join("")}</dl></section>` : "")
) : ""}
<footer><p>${e(t("journey.observationsHint"))}</p><p class="print-hint">${e(t("childReport.printHint"))}</p></footer>
</main></body>
</html>`;
}
