"use client";

import { t, useLocale, formatDate } from "@/lib/i18n";

import { useState } from "react";
import { api, type AdaptivePlan, type SpecialistAdvice } from "@/lib/api";

export const familyDecisionLabels = {
  get pending() { return t("recommendationDecision.ui1"); },
  get accepted() { return t("recommendationDecision.ui2"); },
  get declined() { return t("recommendationDecision.ui3"); },
  get needs_help() { return t("recommendationDecision.ui4"); },
};

const attemptLabels: Record<string, string> = {
  get completed() { return t("recommendationDecision.ui5"); }, get participated() { return t("recommendationDecision.ui6"); }, get break() { return t("recommendationDecision.ui7"); },
  get refused() { return t("recommendationDecision.ui8"); }, get technical_error() { return t("recommendationDecision.ui9"); },
};

export function RecommendationOutcome({ item }: { item: SpecialistAdvice }) {
  useLocale();
  const attempt = item.latest_attempt;
  const hasBreakdown = attempt?.attempt_status === "completed" && typeof attempt.independent_completions === "number" && typeof attempt.prompted_completions === "number";
  return <div className="recommendation-outcome">
    <p><strong>{familyDecisionLabels[item.family_decision]}</strong>{item.goal_title && <>  {t("recommendationDecision.ui10")} {item.goal_title}</>}</p>
    {item.family_note && <p>{t("recommendationDecision.ui11")} {item.family_note}</p>}
    {item.completed_at && <p>{t("recommendationDecision.ui12")}</p>}
    {attempt && <p>{t("recommendationDecision.ui13")} {attemptLabels[attempt.attempt_status] || t("recommendationDecision.ui14")} · {formatDate(attempt.created_at, {dateStyle: "short", timeStyle: "short"})}
      {attempt.attempt_status === "completed" && attempt.attempts_count ? t("recommendationDecision.answers", { correct: attempt.correct_answers ?? 0, total: attempt.attempts_count }) : ""}
      {hasBreakdown && t("recommendationDecision.breakdown", { independent: attempt.independent_completions ?? 0, prompted: attempt.prompted_completions ?? 0 })}
      {!hasBreakdown && attempt.prompt_level && ` · ${attempt.prompt_level === "independent" ? t("recommendationDecision.ui15") : t("recommendationDecision.ui16")}`}
    </p>}
  </div>;
}

export function RecommendationDecision({ childId, item, onChanged, onStartPlan }: {
  childId: number;
  item: SpecialistAdvice;
  onChanged: () => void;
  onStartPlan?: (plan: AdaptivePlan) => Promise<void>;
}) {
  useLocale();
  const [goal, setGoal] = useState(String(item.suitable_goals.find(goal => goal.id === item.goal_id)?.id || item.suitable_goals[0]?.id || ""));
  const [note, setNote] = useState(item.family_note);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const decide = async (decision: "accepted" | "declined" | "needs_help") => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      await api(`/api/children/${childId}/specialist-recommendations/${item.id}/decision`, {
        method: "PATCH", body: JSON.stringify({ decision, goal_id: goal ? Number(goal) : null, note }),
      });
      onChanged();
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("recommendationDecision.ui17")); }
    finally { setBusy(false); }
  };
  const start = async () => {
    if (!onStartPlan || busy) return;
    setBusy(true); setError("");
    try {
      const plan = await api<AdaptivePlan>(`/api/children/${childId}/specialist-recommendations/${item.id}/plan`, { method: "POST" });
      await onStartPlan(plan);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("recommendationDecision.ui18")); }
    finally { setBusy(false); }
  };
  return <div className="recommendation-decision">
    <RecommendationOutcome item={item}/>
    {!item.is_current ? <p>{t("recommendationDecision.ui19")}</p> : <>
      {item.exercise_id && !item.exercise_available && <p>{t("recommendationDecision.ui20")}</p>}
      {item.exercise_id && item.exercise_available && !item.suitable_goals.length && <p>{t("recommendationDecision.ui21")}</p>}
      {(item.family_decision !== "accepted" || !item.goal_available) && item.exercise_available && item.suitable_goals.length > 0 && <label>{t("recommendationDecision.ui22")}<select value={goal} disabled={busy} onChange={event => setGoal(event.target.value)}><option value="">{t("recommendationDecision.ui23")}</option>{item.suitable_goals.map(value => <option key={value.id} value={value.id}>{value.title}</option>)}</select></label>}
      <details><summary>{t("recommendationDecision.ui24")}</summary><label>{t("recommendationDecision.ui25")}<textarea value={note} disabled={busy} maxLength={1000} onChange={event => setNote(event.target.value)}/></label></details>
      <div className="cabinet-actions">
        {(item.family_decision !== "accepted" || (item.exercise_id && !item.goal_available)) && (!item.exercise_id || (item.exercise_available && item.suitable_goals.length > 0)) && <button className="primary-button" disabled={busy} onClick={() => void decide("accepted")}>{item.exercise_id ? t("recommendationDecision.ui26") : t("recommendationDecision.ui27")}</button>}
        {item.ready_for_plan && onStartPlan && <button className="primary-button" disabled={busy} onClick={() => void start()}>{t("recommendationDecision.ui28")}</button>}
        <button className="secondary-button" disabled={busy} onClick={() => void decide("needs_help")}>{t("recommendationDecision.ui29")}</button>
        <button className="secondary-button" disabled={busy} onClick={() => void decide("declined")}>{t("recommendationDecision.ui30")}</button>
      </div>
      {item.ready_for_plan && <p>{t("recommendationDecision.ui31")}</p>}
    </>}
    {busy && <p role="status">{t("recommendationDecision.ui32")}</p>}{error && <p role="alert">{error}</p>}
  </div>;
}
