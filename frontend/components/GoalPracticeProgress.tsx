"use client";

import type { GoalProgress } from "@/lib/api";
import { t, useLocale } from "@/lib/i18n";

export function GoalPracticeProgress({ progress }: { progress?: GoalProgress }) {
  useLocale();
  if (!progress) return null;
  return <div className="goal-practice-progress">
    <strong>{t("practice.progress.window", { days: progress.window_days })}</strong>
    {progress.rounds ? <>
      <p>{t("practice.progress.sessions", { sessions: progress.completed_sessions, rounds: progress.rounds })}</p>
      <p>{t("practice.progress.answers", { independent: progress.independent, prompted: progress.prompted, unanswered: progress.without_child_answer })}</p>
      <p>{t("practice.progress.rate", { rate: progress.independent_rate ?? "-" })}</p>
    </> : <p>{t("practice.progress.empty")}</p>}
    {(progress.breaks > 0 || progress.refusals > 0 || progress.technical_errors > 0) && <p>{t("practice.progress.excluded", { breaks: progress.breaks, refusals: progress.refusals, errors: progress.technical_errors })}</p>}
    {progress.participations > 0 && <p>{t("practice.progress.participations", { count: progress.participations })}</p>}
    <p>{t("practice.progress.home", { count: progress.home_observations, independent: progress.home_independent })}</p>
    <small>{t("practice.progress.note")}</small>
  </div>;
}
