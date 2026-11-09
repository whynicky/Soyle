"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, RefreshCw } from "lucide-react";
import { api, type Child, type Dashboard } from "@/lib/api";
import { shortDashes, t, useLocale, formatDate } from "@/lib/i18n";
import { RecordHistory } from "./RecordHistory";
import { P1ResultsSummary } from "./FamilyPractice";

type Metrics = { sessions: number; minutes: number; game_accuracy: number | null; attempts: number; correct: number; participations: number; breaks: number; refusals: number };
type Report = { child: Child; period: { days: number; start: string | null; end: string; current: Metrics; previous: Metrics | null; record_count: number; oldest_id: number; recent: Dashboard["recent"] } };
export function ParentProgress({ childId, onObservations }: { childId?: number; onObservations: () => void }) {
  const locale = useLocale();
  const [days, setDays] = useState<0|7|30>(7);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) { setLoading(Boolean(childId)); setError(''); setReport(null); } });
    if (!childId) return () => { active = false; };
    api<Report>(`/api/progress/${childId}?days=${days}`).then(value => { if (active) setReport(value); }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : t("errors.request")); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [childId, days, revision, locale]);
  const period = report?.period;
  const delta = period?.previous ? period.current.sessions - period.previous.sessions : null;
  const moduleNames = { motor:t("screen.ParentScreen.ui8"),sensory:t("screen.ParentScreen.ui9"),mixed:t("screen.ParentScreen.ui10") };
  const statuses = { completed:t("journey.completed"),participated:t("journey.participated"),break:t("journey.break"),refused:t("journey.refused"),technical_error:t("journey.technical") };
  return <div className="parent-progress-view progress-report-redesign page-enter">
    <header className="journey-heading"><Image className="report-heading-art" src="/app-illustrations/journey-progress.png" alt="" width={220} height={220} priority/><div><span className="kicker">{t("navigation.progress")}</span><h1>{t("journey.results")}{report?.child.name ? ` · ${report.child.name}` : ''}</h1><p>{t("journey.resultsHint")}</p></div><label>{t("journey.period")}<select value={days} onChange={event => setDays(Number(event.target.value) as 0|7|30)}><option value={7}>{t("journey.week")}</option><option value={30}>{t("journey.month")}</option><option value={0}>{t("journey.allTime")}</option></select></label></header>
    {loading && <p role="status">{t("common.wait")}</p>}
    {error && <div className="journey-error" role="alert"><p>{error}</p><button className="small-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={18}/>{t("ux.retry")}</button></div>}
    {period && <>
      <p className="journey-period-label">{period.start ? `${formatDate(period.start)} - ${formatDate(period.end)}` : t("journey.allTime")}</p>
      <section className="journey-metrics" aria-label={t("journey.period")}>
        <article><span>{t("journey.practiceCount")}</span><strong>{period.current.sessions}</strong><small>{delta === null ? t("journey.completedHint") : t("journey.comparison", {delta: delta > 0 ? `+${delta}` : delta, count:period.previous!.sessions})}</small></article>
        <article><span>{t("journey.practiceMinutes")}</span><strong>{period.current.minutes}</strong><small>{t("journey.timeHint")}</small></article>
        <article><span>{t("journey.gameAccuracy")}</span><strong>{period.current.game_accuracy === null ? '-' : `${period.current.game_accuracy}%`}</strong><small>{period.current.attempts ? t("journey.answerCount", {correct:period.current.correct,total:period.current.attempts}) : t("journey.noScored")}</small></article>
      </section>
      {!period.record_count && <section className="journey-empty"><Image src="/app-illustrations/journey-progress.png" alt="" width={180} height={180}/><div><h2>{t("journey.noPeriod")}</h2><p>{t("journey.noPeriodHint")}</p></div></section>}
      {period.record_count > 0 && <section className="journey-history"><h2>{t("journey.history")}</h2>
        <RecordHistory key={`${childId}-${locale}-${days}-${period.recent.map(row => row.id).join("-")}`}
          initial={period.recent} hasMore={period.record_count > period.recent.length}
          endpoint={`/api/children/${childId}/session-history?oldest=${period.oldest_id}`} wrap={(rows, count) => <><p>{t("journey.historyHint", {shown: count, total: period.record_count})}</p><ol>{rows}</ol></>}>
          {row => <li><div><strong>{shortDashes(row.exercise_title || moduleNames[row.module])}</strong><time dateTime={row.created_at}>{formatDate(row.created_at,{dateStyle:'medium',timeStyle:'short'})}</time></div>
            <span>{statuses[row.attempt_status || 'completed']}</span><span>{row.attempt_status === 'completed' && (row.attempts_count || 0) > 0 && row.correct_answers != null ? t("journey.answerCount", {correct:row.correct_answers,total:row.attempts_count!}) : '-'}</span></li>}
        </RecordHistory></section>}
    </>}
    <section className="journey-observations"><Image src="/app-illustrations/journey-family.png" alt="" width={160} height={160}/><div><span className="kicker">{t("journey.separate")}</span><h2>{t("journey.observations")}</h2><p>{t("journey.observationsHint")}</p><button className="small-button" onClick={onObservations}>{t("journey.openObservations")}<ArrowRight size={18}/></button></div></section>
    <details className="journey-details"><summary>{t("journey.allDetails")}</summary><P1ResultsSummary key={`${childId}-${locale}`} childId={childId}/></details>
  </div>;
}
