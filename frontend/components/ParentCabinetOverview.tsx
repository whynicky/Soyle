"use client";

import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, type Dashboard, type Exercise, type SpecialistAdvice } from "@/lib/api";
import { formatDate, t, useLocale } from "@/lib/i18n";
import { useRefreshOnReturn } from "@/lib/hooks/useRefreshOnReturn";
import type { SkillObservation } from "./FamilyPractice";

type Session = Dashboard["recent"][number] & { exercise_id: number | null; support_context: string };
type Progress = { recent: Session[]; period: { current: { sessions: number; minutes: number } } };
type Word = { label: string; history: { outcome: string; created_at: string }[] };
type HomeNote = { activity_title: string; note: string; observed_at: string };

function useOverviewData<T>(path: string, revision: number) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) { setData(value); setFailed(false); }
    }).catch(() => { if (!controller.signal.aborted) { setData(null); setFailed(true); } });
    return () => controller.abort();
  }, [path, revision]);
  return { data, failed };
}

const moduleLabels = { motor: "screen.ParentScreen.ui8", sensory: "screen.ParentScreen.ui9", mixed: "screen.ParentScreen.ui10" } as const;
const statusLabels = { completed: "journey.completed", participated: "journey.participated", break: "journey.break", refused: "journey.refused", technical_error: "journey.technical" } as const;

export function ParentCabinetOverview({ childId, exercises, onRecord, onSpecialist, onResults }: {
  childId: number; exercises: Exercise[]; onRecord: (category: string) => void; onSpecialist: () => void; onResults: () => void;
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
  const note = notes[0];
  const specialist = advice.data?.find(item => item.is_current && item.family_decision !== "declined");
  const failed = [progress, vocabulary, skills, home, advice].some(source => source.failed);
  const shortDate = (date: string) => formatDate(date, { day: "numeric", month: "long", year: "numeric" }, locale);

  return <div className="cabinet-overview-focused">
    {failed && <div className="journey-error" role="alert"><p>{t("familyReview.loadError")}</p><button className="small-button" onClick={retry}>{t("ux.retry")}</button></div>}
    <section className="family-week">
      <div className="family-week-header"><h2>{t("familyReview.activity")}</h2><button type="button" className="small-button" onClick={onResults}>{t("familyReview.results")}<ArrowRight size={16}/></button></div>
      {week && last ? <>
        <p>{t("familyReview.week", { count: week.sessions, minutes: week.minutes })}</p>
        <h3>{title}</h3>
        <p>{t("familyReview.last")} · {shortDate(last.created_at)}{last.attempt_status && <> · {t(statusLabels[last.attempt_status])}</>}{last.duration_seconds > 0 && <> · {new Intl.NumberFormat(locale, { style: "unit", unit: last.duration_seconds < 60 ? "second" : "minute", unitDisplay: "short" }).format(last.duration_seconds < 60 ? last.duration_seconds : Math.round(last.duration_seconds / 60))}</>}</p>
      </> : progress.data ? <p>{t("familyReview.first")}</p> : !progress.failed && <p role="status">{t("common.wait")}</p>}
    </section>
    <div className="family-review-pair">
      <section><h2>{t("familyReview.success")}</h2>
        {word ? <><h3>«{word.label}»</h3><p>{t(word.outcome === "independent" ? "familyReview.independent" : "familyReview.prompted")}</p><small>{shortDate(word.created_at)}</small></>
          : scored ? <><h3>{exercises.find(item => item.id === scored.exercise_id)?.title || t(moduleLabels[scored.module])}</h3><p>{t("journey.answerCount", { correct: scored.correct_answers!, total: scored.attempts_count! })}</p><small>{shortDate(scored.created_at)}</small></>
          : progress.data && vocabulary.data ? <p>{t("familyReview.noSuccess")}</p> : !vocabulary.failed && !progress.failed && <p role="status">{t("common.wait")}</p>}
      </section>
      <section className="family-next">
        <h2>{t("familyReview.observations")}</h2>
        {note ? <><small>{note.title} · {shortDate(note.date!)}</small><p>{note.text}</p></> : skills.data && home.data && <p>{t("familyReview.noteHint")}</p>}
        <button type="button" className="small-button" onClick={() => onRecord(word ? "object_comprehension" : "request_expression")}>{t("familyReview.record")}<ArrowRight size={16}/></button>
      </section>
    </div>
    {specialist && <section className="family-entry"><h2>{t("familyReview.advice")}</h2><small>{specialist.specialist_name} · {shortDate(specialist.created_at)}</small><p>{specialist.comment}</p><button type="button" className="small-button" onClick={onSpecialist}>{t("journey.openSpecialist")}<ArrowRight size={16}/></button></section>}
  </div>;
}
