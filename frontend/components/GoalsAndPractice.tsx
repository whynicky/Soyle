"use client";

import { shortDashes, t, useLocale, formatDate, getLocale } from "@/lib/i18n";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, CircleAlert, ClipboardPlus, History, Pause, Play, Save, ShieldCheck, Sparkles, Target } from "lucide-react";
import { RecordHistory } from "./RecordHistory";
import { GoalPracticeProgress } from "./GoalPracticeProgress";
import { useRefreshOnReturn } from "@/lib/hooks/useRefreshOnReturn";
import { api, type AdaptivePlan, type Child, type Exercise, type PracticeGoal, type PracticeGoalTemplate } from "@/lib/api";

type HelpLevel = "independent" | "minimal" | "full";
type Preference = "neutral" | "preferred" | "avoid";

const getHelpLabels = (): Record<HelpLevel, string> => ({
  independent: t("practice.ui1"),
  minimal: t("practice.ui2"),
  full: t("practice.ui3"),
});

const getResultLabels = () => ({
  not_observed: t("practice.ui4"),
  independent: t("practice.ui5"),
  with_help: t("practice.ui6"),
  refused: t("practice.ui7"),
  break: t("practice.ui8"),
  technical_error: t("practice.ui9"),
} as const);

export function GoalsAndPractice({ child, targetMinutes, onStartPlan, onPracticeChanged }: {
  child?: Child;
  targetMinutes: 3 | 5 | 10;
  onStartPlan: (plan: AdaptivePlan) => Promise<void>;
  onPracticeChanged: () => void;
}) {
  const locale = useLocale();
  const helpLabels = getHelpLabels();
  const resultLabels = getResultLabels();
  const [templates, setTemplates] = useState<PracticeGoalTemplate[]>([]);
  const [goals, setGoals] = useState<PracticeGoal[]>([]);
  const [history, setHistory] = useState<AdaptivePlan[]>([]);
  const [preferences, setPreferences] = useState<Record<number, Preference>>({});
  const [preferenceNote, setPreferenceNote] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [baseline, setBaseline] = useState("");
  const [helpLevel, setHelpLevel] = useState<HelpLevel>("full");
  const planId = useRef<number | null>(null);
  const loadRevision = useRef(0);
  const preferencesDirty = useRef(false);
  const [plan, setPlan] = useState<AdaptivePlan | null>(null);
  const [openGoal, setOpenGoal] = useState<number | null>(null);
  const [observation, setObservation] = useState({ result_type: "independent", prompt_level: "independent", note: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const childId = child?.id;

  const load = useCallback(() => {
    if (!childId) return Promise.resolve();
    const revision = ++loadRevision.current;
    return Promise.all([
        api<PracticeGoalTemplate[]>("/api/practice-goal-templates"),
        api<PracticeGoal[]>(`/api/practice-goals/${childId}`),
        api<AdaptivePlan[]>(`/api/adaptive-plans/${childId}/history`),
        api<{ preferred_exercise_ids: number[]; avoided_exercise_ids: number[]; note: string }>(`/api/practice-preferences/${childId}`),
        planId.current ? api<AdaptivePlan>(`/api/adaptive-plans/${childId}/${planId.current}`) : Promise.resolve(null),
      ]).then(([nextTemplates, nextGoals, nextHistory, storedPreferences, localizedPlan]) => {
      if (getLocale() !== locale || revision !== loadRevision.current) return;
      setPlan(localizedPlan);
      setTemplates(nextTemplates);
      setGoals(nextGoals);
      setHistory(nextHistory);
      if (!preferencesDirty.current) {
        setPreferenceNote(storedPreferences.note || "");
        setPreferences(Object.fromEntries([
          ...storedPreferences.preferred_exercise_ids.map((id) => [id, "preferred" as const]),
          ...storedPreferences.avoided_exercise_ids.map((id) => [id, "avoid" as const]),
        ]));
      }
      setSelectedTemplate((current) => {
        if (current) return current;
        setHelpLevel(nextTemplates[0]?.default_help_level || "full");
        return nextTemplates[0]?.template_key || "";
      });
    }).catch((cause: unknown) => {
      if (getLocale() !== locale || revision !== loadRevision.current) return;
      setMessage(cause instanceof Error ? cause.message : t("practice.ui10"));
    });
  }, [childId, locale]);

  useEffect(() => { void load(); }, [load]);
  useRefreshOnReturn(load, Boolean(childId));
  const currentTemplate = templates.find((item) => item.template_key === selectedTemplate);

  const linkedExercises = useMemo(() => {
    const byId = new Map<number, PracticeGoal["linked_exercises"][number]>();
    goals.forEach((goal) => goal.linked_exercises.forEach((exercise) => byId.set(exercise.id, exercise)));
    return [...byId.values()];
  }, [goals]);

  const addGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!child || !selectedTemplate || loading) return;
    setLoading(true); setMessage("");
    try {
      await api("/api/practice-goals", {
        method: "POST",
        body: JSON.stringify({ child_id: child.id, template_key: selectedTemplate, baseline, help_level: helpLevel }),
      });
      setBaseline("");
      setMessage(t("practice.ui11"));
      await load();
      planId.current = null;
      setPlan(null);
      onPracticeChanged();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : t("practice.ui12")); }
    finally { setLoading(false); }
  };

  const changeGoalStatus = async (goal: PracticeGoal, status: PracticeGoal["status"]) => {
    if (!child || loading) return;
    setLoading(true); setMessage("");
    try {
      await api(`/api/practice-goals/${goal.id}`, {
        method: "PATCH",
        body: JSON.stringify({ child_id: child.id, expected_version: goal.version, status }),
      });
      setMessage(t("practice.ui13"));
      await load();
      planId.current = null;
      setPlan(null);
      onPracticeChanged();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : t("practice.ui14")); }
    finally { setLoading(false); }
  };

  const addObservation = async (event: React.FormEvent, goal: PracticeGoal) => {
    event.preventDefault();
    if (!child || loading) return;
    setLoading(true); setMessage("");
    try {
      await api(`/api/practice-goals/${goal.id}/observations`, {
        method: "POST",
        body: JSON.stringify({ child_id: child.id, ...observation }),
      });
      setObservation({ result_type: "independent", prompt_level: "independent", note: "" });
      setMessage(t("practice.ui15"));
      await load();
      planId.current = null;
      setPlan(null);
      onPracticeChanged();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : t("practice.ui16")); }
    finally { setLoading(false); }
  };

  const savePreferenceList = async () => {
    if (!child || loading) return;
    setLoading(true); setMessage("");
    try {
      await api(`/api/practice-preferences/${child.id}`, {
        method: "PUT",
        body: JSON.stringify({
          preferred_exercise_ids: Object.entries(preferences).filter(([, value]) => value === "preferred").map(([id]) => Number(id)),
          avoided_exercise_ids: Object.entries(preferences).filter(([, value]) => value === "avoid").map(([id]) => Number(id)),
          note: preferenceNote,
        }),
      });
      preferencesDirty.current = false;
      setMessage(t("practice.ui17"));
      planId.current = null;
      setPlan(null);
      onPracticeChanged();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : t("practice.ui18")); }
    finally { setLoading(false); }
  };

  const preparePlan = async () => {
    if (!child || loading) return;
    setLoading(true); setMessage("");
    try {
      const requestedLocale = getLocale();
      let next = await api<AdaptivePlan>(`/api/adaptive-plans/${child.id}`, {
        method: "POST", body: JSON.stringify({ target_minutes: targetMinutes }),
      });
      if (getLocale() !== requestedLocale) next = await api<AdaptivePlan>(`/api/adaptive-plans/${child.id}/${next.id}`);
      planId.current = next.id;
      setPlan(next);
      setHistory((current) => [next, ...current.filter((item) => item.id !== next.id)]);
      if (!next.items.length) setMessage(next.notices[0]?.message || t("practice.ui19"));
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : t("practice.ui20")); }
    finally { setLoading(false); }
  };

  const startPlan = async () => {
    if (!plan || !plan.items.length || plan.items.some(item => item.translation_available === false) || loading) return;
    setLoading(true); setMessage("");
    try { await onStartPlan(plan); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : t("practice.ui21")); setLoading(false); }
  };

  return <div className="page-enter goals-practice-page">
    <section className="goals-hero">
      <div><span className="kicker">{t("practice.ui22")}</span><h1>{t("practice.ui23")}</h1><p>{t("practice.ui24")}</p></div>
      <div className="goals-hero-note"><ShieldCheck size={24}/><strong>{t("practice.ui25")}</strong><span>{t("practice.ui26")}</span></div>
    </section>

    {message && <div className="family-inline-message goals-message" role="status"><CircleAlert size={17}/>{message}</div>}

    <div className="goals-main-grid">
      <section className="goals-column" aria-labelledby="current-goals-title">
        <div className="section-heading compact"><div><span className="kicker">{t("practice.ui27")}</span><h2 id="current-goals-title">{t("practice.ui28")}</h2></div><span className="period-pill"><Target size={15}/>{goals.filter((goal) => goal.status === "active").length}  {t("practice.ui29")}</span></div>
        {goals.length ? <div className="practice-goal-list">{goals.map((goal) => <article key={goal.id} className={`practice-goal-card ${goal.status}`}>
          <button type="button" className="practice-goal-toggle" aria-expanded={openGoal === goal.id} onClick={() => setOpenGoal(openGoal === goal.id ? null : goal.id)}>
            <span><small>{goal.status === "active" ? t("practice.ui30") : goal.status === "paused" ? t("practice.ui31") : t("practice.ui32")}  {t("practice.ui33")} {goal.version}</small><strong>{shortDashes(goal.title)}</strong><p>{shortDashes(goal.observable_behavior)}</p></span><ChevronDown size={20}/>
          </button>
          <GoalPracticeProgress progress={goal.progress}/>
          {openGoal === goal.id && <div className="practice-goal-details">
            <dl><div><dt>{t("practice.ui34")}</dt><dd>{goal.baseline}</dd></div><div><dt>{t("practice.ui35")}</dt><dd>{shortDashes(goal.target_outcome)}</dd></div><div><dt>{t("practice.ui36")}</dt><dd>{helpLabels[goal.help_level]}</dd></div></dl>
            <div className="linked-exercises"><strong>{t("practice.ui37")}</strong>{goal.linked_exercises.length ? goal.linked_exercises.map((exercise) => <span key={exercise.id}><Check size={14}/>{shortDashes(exercise.title)}<small>v{exercise.exercise_version}</small></span>) : <p><CircleAlert size={16}/>  {t("practice.ui38")}</p>}</div>
            <div className="goal-status-actions"><button type="button" className="small-button" disabled={loading || goal.status === "active"} onClick={() => void changeGoalStatus(goal, "active")}>{t("practice.ui39")}</button><button type="button" className="small-button" disabled={loading || goal.status === "paused"} onClick={() => void changeGoalStatus(goal, "paused")}><Pause size={14}/>  {t("practice.ui40")}</button><button type="button" className="small-button" disabled={loading || goal.status === "completed"} onClick={() => void changeGoalStatus(goal, "completed")}><Check size={14}/>  {t("practice.ui41")}</button></div>
            <form className="goal-observation-form" onSubmit={(event) => void addObservation(event, goal)}><h3>{t("practice.ui42")}</h3><label>{t("practice.ui43")}<select value={observation.result_type} onChange={(event) => setObservation({...observation, result_type: event.target.value})}>{Object.entries(resultLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>{t("practice.ui44")}<select value={observation.prompt_level} onChange={(event) => setObservation({...observation, prompt_level: event.target.value})}><option value="independent">{t("practice.ui1")}</option><option value="minimal">{t("practice.ui2")}</option><option value="full">{t("practice.ui45")}</option></select></label><label className="wide">{t("practice.ui46")}<textarea value={observation.note} maxLength={600} onChange={(event) => setObservation({...observation, note: event.target.value})} placeholder={t("practice.ui47")}/></label><button className="primary-button" disabled={loading}><Save size={16}/>  {t("practice.ui48")}</button></form>
            {goal.observations.length ? <div className="goal-observation-history"><strong>{t("practice.ui49")}</strong><RecordHistory
              key={locale + ":" + goal.observations.slice(0, 3).map(item => item.id).join("-")}
              initial={goal.observations.slice(0, 3)} hasMore={goal.observations.length > 3}
              endpoint={`/api/children/${childId}/goals/${goal.id}/observations`}>
              {item => <span><b>{resultLabels[item.result_type]}</b><small>{formatDate(item.observed_at)} · {t("practice.ui50")} {item.goal_version}{item.note ? ` · ${item.note}` : ""}</small></span>}
            </RecordHistory></div> : null}
          </div>}
        </article>)}</div> : <div className="empty-state large"><Target size={30}/><strong>{t("practice.ui51")}</strong><span>{t("practice.ui52")}</span></div>}
      </section>

      <aside className="goal-builder" aria-labelledby="goal-builder-title">
        <span className="goal-builder-icon"><ClipboardPlus size={24}/></span><span className="kicker">{t("practice.ui53")}</span><h2 id="goal-builder-title">{t("practice.ui54")}</h2><p>{t("practice.ui55")}</p>
        <form onSubmit={addGoal}><label>{t("practice.ui56")}<select value={selectedTemplate} onChange={(event) => { const key = event.target.value; setSelectedTemplate(key); setHelpLevel(templates.find((item) => item.template_key === key)?.default_help_level || "full"); }} required>{templates.map((item) => <option key={item.template_key} value={item.template_key}>{item.title}</option>)}</select></label>{currentTemplate && <div className="template-preview"><strong>{currentTemplate.observable_behavior}</strong><span>{currentTemplate.target_outcome}</span><small>{currentTemplate.available_exercise_count ? t("practice.available", { count: currentTemplate.available_exercise_count }) : t("practice.ui57")}</small><small>{t("practice.ui58")} {currentTemplate.accepted_responses.join(", ")}</small></div>}<label>{t("practice.ui59")}<textarea required minLength={2} maxLength={600} value={baseline} onChange={(event) => setBaseline(event.target.value)} placeholder={currentTemplate?.baseline_prompt || t("practice.ui60")}/></label><label>{t("practice.ui61")}<select value={helpLevel} onChange={(event) => setHelpLevel(event.target.value as HelpLevel)}>{Object.entries(helpLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="primary-button" disabled={loading || !selectedTemplate}>{loading ? t("practice.ui62") : t("practice.ui63")}</button></form>
      </aside>
    </div>

    {linkedExercises.length ? <section className="practice-preferences-card"><div className="admin-card-head"><div><span className="kicker">{t("practice.ui64")}</span><h2>{t("practice.ui65")}</h2><p>{t("practice.ui66")}</p></div></div><div className="preference-list">{linkedExercises.map((exercise) => <label key={exercise.id}><span><strong>{shortDashes(exercise.title)}</strong><small>{t("practice.ui67")} {exercise.exercise_version}</small></span><select aria-label={t("practice.preference", { title: exercise.title })} value={preferences[exercise.id] || "neutral"} onChange={(event) => { preferencesDirty.current = true; setPreferences({...preferences, [exercise.id]: event.target.value as Preference}); }}><option value="neutral">{t("practice.ui68")}</option><option value="preferred">{t("practice.ui69")}</option><option value="avoid">{t("practice.ui70")}</option></select></label>)}</div><label className="preference-note">{t("practice.ui71")}<textarea value={preferenceNote} maxLength={600} onChange={(event) => { preferencesDirty.current = true; setPreferenceNote(event.target.value); }} placeholder={t("practice.ui72")}/></label><button type="button" className="secondary-button" disabled={loading} onClick={() => void savePreferenceList()}><Save size={16}/>  {t("practice.ui73")}</button></section> : null}

    <section className="adaptive-plan-card" aria-labelledby="adaptive-plan-title">
      <div className="adaptive-plan-head"><div><span className="kicker">{t("practice.duration", { minutes: targetMinutes })}</span><h2 id="adaptive-plan-title">{t("practice.ui76")}</h2><p>{t("practice.ui77")}</p></div><button type="button" className="primary-button" disabled={loading} onClick={() => void preparePlan()}><Sparkles size={17}/>{loading ? t("practice.ui78") : t("practice.ui79")}</button></div>
      {plan && <div className="prepared-plan"><p className="plan-summary">{shortDashes(plan.summary)}</p>{plan.items.map((item, index) => <article key={item.id}><span className="plan-number">{index + 1}</span><div><small>{item.module === "sensory" ? t("practice.ui80") : t("practice.ui81")}  {t("practice.ui82")} {item.exercise_version}</small><h3>{shortDashes(item.exercise_title)}</h3><p>{shortDashes(item.instruction)}</p><div className="difficulty-chips"><span>{item.difficulty_params.option_count ? t("practice.options", { count: item.difficulty_params.option_count }) : item.module === "sensory" ? t("practice.ui83") : t("practice.ui84")}</span><span>{item.difficulty_params.round_count}  {t("practice.ui85")}</span></div><details><summary>{t("practice.ui86")}</summary><ul>{item.assignment_reason.messages.map((reason) => <li key={reason}>{reason}</li>)}</ul></details></div></article>)}{plan.notices.map((notice, index) => <div className="plan-notice" key={`${notice.goal_id}-${index}`}><CircleAlert size={17}/><span>{notice.goal_title && <strong>{notice.goal_title}: </strong>}{shortDashes(notice.message)}</span></div>)}{plan.items.length ? <button type="button" className="primary-button plan-start" disabled={loading || plan.items.some(item => item.translation_available === false)} onClick={() => void startPlan()}><Play size={18} fill="currentColor"/>  {t("practice.ui87")}</button> : null}</div>}
    </section>

    <section className="plan-history-card"><div><History size={22}/><span><strong>{t("practice.ui88")}</strong><small>{t("practice.ui89")}</small></span></div>{history.length ? <div>{history.slice(0, 5).map((item) => <span key={item.id}><b>{formatDate(item.created_at)} · {item.items.length}  {t("practice.ui90")}</b><small>{item.status === "started" ? t("practice.ui91") : t("practice.ui92")}  {t("practice.ui93")} {item.rules_version}</small></span>)}</div> : <p>{t("practice.ui94")}</p>}</section>
  </div>;
}

export function exerciseFromPlanItem(item: AdaptivePlan["items"][number], catalogue: Exercise[]): Exercise | undefined {
  return catalogue.find((exercise) => exercise.id === item.exercise_id);
}
