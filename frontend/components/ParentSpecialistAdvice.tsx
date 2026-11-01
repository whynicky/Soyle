"use client";

import { t, useLocale, formatDate } from "@/lib/i18n";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, MessageCircle, RefreshCw } from "lucide-react";
import { api, type AdaptivePlan, type Exercise, type SpecialistAdvice } from "@/lib/api";
import { useRefreshOnReturn } from "@/lib/hooks/useRefreshOnReturn";
import { RecommendationDecision } from "./RecommendationDecision";

type Advice = SpecialistAdvice;

export function ParentSpecialistAdvice({ childId, exercises, onExercise, onOpenSpecialist, onStartPlan }: { childId: number; exercises: Exercise[]; onExercise: (exercise: Exercise) => void; onOpenSpecialist: () => void; onStartPlan: (plan: AdaptivePlan) => Promise<void> }) {
  const locale = useLocale();
  const [state, setState] = useState<{loading: boolean; items: Advice[]; error: string}>({loading: true, items: [], error: ""});
  const [revision, setRevision] = useState(0);
  const refreshOnReturn = useCallback(() => setRevision(value => value + 1), []);
  useRefreshOnReturn(refreshOnReturn);
  useEffect(() => {
    const controller = new AbortController();
    api<Advice[]>(`/api/children/${childId}/specialist-recommendations`, {signal: controller.signal})
      .then(items => { if (!controller.signal.aborted) setState({loading: false, items: items.filter(item => item.is_current), error: ""}); })
      .catch(cause => { if (!controller.signal.aborted) setState({loading: false, items: [], error: cause instanceof Error ? cause.message : t("parentAdvice.ui1")}); });
    return () => controller.abort();
  }, [childId, revision, locale]);
  const latest = state.items.find(item => item.ready_for_plan) || state.items.find(item => item.family_decision === "pending") || state.items[0];
  const exercise = latest?.exercise_available ? exercises.find(item => item.id === latest.exercise_id) : undefined;
  return <section className="parent-specialist-advice" aria-labelledby="specialist-advice-title" aria-busy={state.loading}>
    <div className="advice-heading"><span className="advice-mark"><MessageCircle size={24}/></span><div><span className="kicker">{t("parentAdvice.ui2")}</span><h2 id="specialist-advice-title">{latest ? t("parentAdvice.ui3") : t("parentAdvice.ui4")}</h2></div></div>
    {state.loading ? <p role="status">{t("parentAdvice.ui5")}</p> : state.error ? <div><p role="alert">{state.error}</p><button className="secondary-button" onClick={() => {setState({loading: true, items: [], error: ""}); setRevision(value => value + 1);}}><RefreshCw size={17}/>  {t("parentAdvice.ui6")}</button></div> : latest ? <>
      <div className="advice-meta"><strong>{latest.specialist_name}</strong><span>{t("parentAdvice.ui7")} {formatDate(latest.created_at, {day: "numeric", month: "long"})}</span></div>
      <p className="advice-text">{latest.comment}</p>
      {latest.exercise_id && <p className="advice-exercise">{t("parentAdvice.ui8")} <strong>{latest.exercise_title || t("parentAdvice.ui9")}</strong>{!exercise && <span>{t("parentAdvice.ui10")}</span>}</p>}
      <RecommendationDecision key={`${latest.id}:${latest.family_decision}`} childId={childId} item={latest} onChanged={() => setRevision(value => value + 1)} onStartPlan={onStartPlan}/>
      <div className="cabinet-actions">{exercise && <button className="secondary-button" onClick={() => onExercise(exercise)}>{t("parentAdvice.ui11")} <ArrowRight size={18}/></button>}<button className="secondary-button" onClick={onOpenSpecialist}>{t("parentAdvice.ui12")} <ArrowRight size={18}/></button></div>
      <p className="advice-caption">{t("parentAdvice.ui13")}</p>
    </> : <div className="advice-empty"><p>{t("parentAdvice.ui14")}</p><button className="secondary-button" onClick={onOpenSpecialist}>{t("parentAdvice.ui15")} <ArrowRight size={18}/></button></div>}
  </section>;
}
