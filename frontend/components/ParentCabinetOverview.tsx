"use client";

import { ArrowRight, ClipboardList, History, MessageSquareText, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, type AdaptivePlan, type Dashboard, type Exercise, type SpecialistAdvice } from "@/lib/api";
import { shortDashes, formatDate, t, useLocale } from "@/lib/i18n";
import { useRefreshOnReturn } from "@/lib/hooks/useRefreshOnReturn";
import type { SkillObservation } from "./FamilyPractice";
import { WorkspaceSkeleton } from "./WorkspaceSkeleton";

type Session = Dashboard["recent"][number] & { exercise_id: number | null; support_context: string };
type Progress = { recent: Session[]; period: { current: { sessions: number; minutes: number } } };
type Word = { label: string; history: { outcome: string; created_at: string }[] };
type HomeNote = { activity_title: string; note: string; observed_at: string };

function useOverviewData<T>(path: string, revision: number) {
  const [result, setResult] = useState<{ data: T | null; revision: number }>();
  useEffect(() => {
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setResult({ data: value, revision });
    }).catch(() => { if (!controller.signal.aborted) setResult({ data: null, revision }); });
    return () => controller.abort();
  }, [path, revision]);
  return { data: result?.data, failed: result?.revision === revision && result.data === null };
}

const moduleLabels = { motor: "screen.ParentScreen.ui8", sensory: "screen.ParentScreen.ui9", mixed: "screen.ParentScreen.ui10" } as const;
const statusLabels = { completed: "journey.completed", participated: "journey.participated", break: "journey.break", refused: "journey.refused", technical_error: "journey.technical" } as const;

export function ParentCabinetOverview({ childId, exercises, onRecord, onSpecialist, onResults, onPlan }: {
  childId: number; exercises: Exercise[]; onRecord: (category: string) => void; onSpecialist: () => void; onResults: () => void; onPlan: () => void;
}) {
  const locale = useLocale();
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(n => n + 1), []);
  useRefreshOnReturn(retry);
  const progress = useOverviewData<Progress>(`/api/progress/${childId}?days=7`, revision);
  const vocabulary = useOverviewData<{ words: Word[] }>(`/api/vocabulary/${childId}`, revision);
  const skills = useOverviewData<SkillObservation[]>(`/api/observations/${childId}`, revision);
  const home = useOverviewData<{ observations: HomeNote[] }>(`/api/home-activities/${childId}`, revision);
  const advice = useOverviewData<SpecialistAdvice[]>(`/api/children/${childId}/specialist-recommendations`, revision);
  const plans = useOverviewData<AdaptivePlan[]>(`/api/adaptive-plans/${childId}/history`, revision);
  const last = progress.data?.recent[0];
  const week = progress.data?.period.current;
  const title = last && (exercises.find(item => item.id === last.exercise_id)?.title || t(moduleLabels[last.module]));
  const word = vocabulary.data?.words.flatMap(item => item.history
    .filter(row => row.outcome === "independent" || row.outcome === "prompted")
    .map(row => ({ ...row, label: item.label })))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
  const scored = progress.data?.recent.find(row => row.attempt_status === "completed"
    && ["independent", "caregiver_supported"].includes(row.support_context)
    && (row.correct_answers ?? 0) > 0 && (row.attempts_count ?? 0) > 0);
  const notes = [
    ...(skills.data || []).map(item => ({ title: item.label, text: item.note, date: item.observed_at })),
    ...(home.data?.observations || []).map(item => ({ title: item.activity_title, text: item.note, date: item.observed_at })),
  ].filter(item => item.text?.trim() && item.date).sort((a, b) => Date.parse(b.date!) - Date.parse(a.date!));
  const plan = plans.data?.[0];
  const specialist = advice.data?.find(item => item.is_current && item.family_decision !== "declined");
  const failed = [progress, vocabulary, skills, home, advice, plans].some(source => source.failed);
  const shortDate = (date: string) => formatDate(date, { day: "numeric", month: "long", year: "numeric" }, locale);

  return <div className="workspace-overview">
    {failed && <div className="journey-error" role="alert"><p>{t("familyReview.loadError")}</p><button className="small-button" onClick={retry}>{t("ux.retry")}</button></div>}
    <section className="workspace-overview-card workspace-practice-card">
      <header><History size={20} strokeWidth={1.7} aria-hidden="true"/><h2>{t("familyReview.recentPractice")}</h2></header>
      {week && last ? <>
        <h3>{shortDashes(title ?? "")}</h3>
        <p>{shortDate(last.created_at)}{last.attempt_status && <> · {t(statusLabels[last.attempt_status])}</>}{last.duration_seconds > 0 && <> · {new Intl.NumberFormat(locale, { style: "unit", unit: last.duration_seconds < 60 ? "second" : "minute", unitDisplay: "short" }).format(last.duration_seconds < 60 ? last.duration_seconds : Math.round(last.duration_seconds / 60))}</>}</p>
        <p>{t("familyReview.week", { count: week.sessions, minutes: week.minutes })}</p>
      </> : progress.data ? <p>{t("familyReview.first")}</p> : !progress.failed && <WorkspaceSkeleton/>}
      {(word || scored) && <div className="workspace-overview-detail">
        <small>{t("familyReview.success")}</small>
        {word ? <><h3>«{word.label}»</h3><p>{t(word.outcome === "independent" ? "familyReview.independent" : "familyReview.prompted")}</p><small>{shortDate(word.created_at)}</small></>
          : scored && <><h3>{shortDashes(exercises.find(item => item.id === scored.exercise_id)?.title || t(moduleLabels[scored.module]))}</h3><p>{t("journey.answerCount", { correct: scored.correct_answers!, total: scored.attempts_count! })}</p><small>{shortDate(scored.created_at)}</small></>}
      </div>}
      <button type="button" className="small-button" onClick={onResults}>{t("familyReview.results")}<ArrowRight size={16}/></button>
    </section>
    <section className="workspace-overview-card">
      <header><MessageSquareText size={20} strokeWidth={1.7} aria-hidden="true"/><h2>{t("familyReview.observations")}</h2></header>
      {notes.length ? <ul className="workspace-overview-list">{notes.slice(0, 2).map((note, index) => <li key={`${note.date}-${index}`}><small>{note.title} · {shortDate(note.date!)}</small><p>{note.text}</p></li>)}</ul>
        : skills.data && home.data ? <p>{t("familyReview.noteHint")}</p> : !skills.failed && !home.failed && <WorkspaceSkeleton/>}
      <button type="button" className="primary-button" onClick={() => onRecord(word ? "object_comprehension" : "request_expression")}><Plus size={17}/>{t("familyReview.record")}</button>
    </section>
    <section className="workspace-overview-card">
      <header><ClipboardList size={20} strokeWidth={1.7} aria-hidden="true"/><h2>{t("familyReview.practicePlan")}</h2></header>
      {plan?.items.length ? <>
        <small>{shortDate(plan.created_at)} · {t("practice.duration", { minutes: plan.target_minutes })}</small>
        <ul className="workspace-overview-list">{plan.items.slice(0, 3).map(item => <li key={item.id}>{shortDashes(item.exercise_title)}</li>)}</ul>
      </> : plans.data ? <p>{t("familyReview.noPlan")}</p> : !plans.failed && <WorkspaceSkeleton/>}
      <button type="button" className="small-button" onClick={onPlan}>{t("familyReview.openPlan")}<ArrowRight size={16}/></button>
      {specialist && <div className="workspace-overview-detail"><h3>{t("familyReview.advice")}</h3><small>{specialist.specialist_name} · {shortDate(specialist.created_at)}</small><p>{specialist.comment}</p><button type="button" className="small-button" onClick={onSpecialist}>{t("journey.openSpecialist")}<ArrowRight size={16}/></button></div>}
    </section>
  </div>;
}
