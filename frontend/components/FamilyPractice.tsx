"use client";

import { t, useLocale, formatDate } from "@/lib/i18n";

import { Check, ChevronDown, CircleAlert, ClipboardList, Home, LockKeyhole, Pause, Save, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type ObservationStatus = "not_observed" | "not_yet" | "with_help" | "independent" | "needs_review";
type SkillObservation = { category: string; label: string; status: ObservationStatus; note: string; observed_at: string | null; updated_at: string | null };
type HomeActivity = { id: number; title: string; objective: string; materials: string[]; adult_instructions: string[]; accepted_responses: string[]; prompts: string[]; stop_conditions: string[] };
type PendingActivity = { id: number; title: string; review_status: string; publication_status: string };
type HomeLibrary = { activities: HomeActivity[]; pending_review: PendingActivity[]; observations: Array<{ id: number; activity_id: number; activity_title: string; outcome: string; note: string; observed_at: string }>; notice: string };
type ResultsSummary = { gameplay_choices: number; gameplay_rounds: number; correct_gameplay_rounds: number; independent_completions: number; prompted_completions: number; prompts_used: number; refusals: number; breaks: number; technical_errors: number; real_life_observations: number; disclaimer: string };

const statusOptions: Array<{ value: ObservationStatus; label: string }> = [
  { value: "not_observed", get label() { return t("familyPractice.ui1"); } },
  { value: "not_yet", get label() { return t("familyPractice.ui2"); } },
  { value: "with_help", get label() { return t("familyPractice.ui3"); } },
  { value: "independent", get label() { return t("familyPractice.ui4"); } },
  { value: "needs_review", get label() { return t("familyPractice.ui5"); } },
];

export function FunctionalSkillMap({ childId }: { childId?: number }) {
  useLocale();
  const [items, setItems] = useState<SkillObservation[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!childId) return;
    api<SkillObservation[]>(`/api/observations/${childId}`).then((value) => { setItems(value); setNotes(Object.fromEntries(value.map((item) => [item.category, item.note]))); }).catch(() => setMessage(t("familyPractice.ui6")));
  }, [childId]);
  const save = async (item: SkillObservation, status = item.status) => {
    if (!childId || saving) return;
    setSaving(item.category); setMessage("");
    try {
      const updated = await api<SkillObservation>(`/api/observations/${childId}/${item.category}`, { method: "PUT", body: JSON.stringify({ status, note: notes[item.category] || "" }) });
      setItems((current) => current.map((entry) => entry.category === item.category ? updated : entry));
      setMessage(t("familyPractice.ui7"));
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : t("familyPractice.ui8")); }
    finally { setSaving(""); }
  };
  return <section className="admin-card functional-map">
    <div className="admin-card-head"><div><span className="kicker">{t("familyPractice.ui9")}</span><h3>{t("familyPractice.ui10")}</h3><p>{t("familyPractice.ui11")}</p></div><span className="period-pill"><ClipboardList size={15}/>  {t("familyPractice.ui12")}</span></div>
    <div className="skill-observation-grid">{items.map((item) => <article key={item.category}><label><strong>{item.label}</strong><span className={`observation-status ${item.status}`}>{statusOptions.find((option) => option.value === item.status)?.label}</span><span className="select-wrap"><select aria-label={t("familyPractice.status", { label: item.label })} value={item.status} onChange={(event) => { const status = event.target.value as ObservationStatus; setItems((current) => current.map((entry) => entry.category === item.category ? { ...entry, status } : entry)); }}><option value="not_observed">{t("familyPractice.ui1")}</option><option value="not_yet">{t("familyPractice.ui2")}</option><option value="with_help">{t("familyPractice.ui3")}</option><option value="independent">{t("familyPractice.ui4")}</option><option value="needs_review">{t("familyPractice.ui5")}</option></select><ChevronDown size={16}/></span></label><label className="observation-note"><span>{t("familyPractice.ui13")}</span><textarea value={notes[item.category] || ""} maxLength={500} onChange={(event) => setNotes((current) => ({ ...current, [item.category]: event.target.value }))} placeholder={t("familyPractice.ui14")}/></label><button type="button" className="small-button" disabled={saving === item.category} onClick={() => void save(item)}><Save size={15}/>{saving === item.category ? t("familyPractice.ui15") : t("familyPractice.ui16")}</button></article>)}</div>
    {message && <div className="family-inline-message" role="status"><Check size={16}/>{message}</div>}
  </section>;
}

export function HomePracticeLibrary({ childId }: { childId?: number }) {
  useLocale();
  const [library, setLibrary] = useState<HomeLibrary | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [form, setForm] = useState({ activity_id: 0, outcome: "independent", prompt_level: "independent", note: "" });
  const [message, setMessage] = useState("");
  const load = useCallback(() => { if (childId) api<HomeLibrary>(`/api/home-activities/${childId}`).then(setLibrary).catch(() => setMessage(t("familyPractice.ui17"))); }, [childId]);
  useEffect(load, [load]);
  const saveObservation = async (event: React.FormEvent) => {
    event.preventDefault();
    const activityId = form.activity_id || openId;
    if (!childId || !activityId) return;
    setMessage("");
    try { await api(`/api/home-activities/${childId}/observations`, { method: "POST", body: JSON.stringify({ ...form, activity_id: activityId }) }); setForm({ activity_id: 0, outcome: "independent", prompt_level: "independent", note: "" }); setOpenId(null); setMessage(t("familyPractice.ui18")); load(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : t("familyPractice.ui8")); }
  };
  return <section className="admin-card home-practice-library">
    <div className="admin-card-head"><div><span className="kicker">{t("familyPractice.ui19")}</span><h3>{t("familyPractice.ui20")}</h3><p>{t("familyPractice.ui21")}</p></div><span className="period-pill"><Home size={15}/>  {t("familyPractice.ui22")}</span></div>
    {library?.activities.length ? <div className="home-activity-list">{library.activities.map((activity) => <article key={activity.id} className={openId === activity.id ? "open" : ""}><button type="button" className="home-activity-toggle" aria-expanded={openId === activity.id} onClick={() => { const nextId = openId === activity.id ? null : activity.id; setOpenId(nextId); if (nextId) setForm({ activity_id: nextId, outcome: "independent", prompt_level: "independent", note: "" }); }}><span><strong>{activity.title}</strong><small>{activity.objective}</small></span><ChevronDown size={18}/></button>{openId === activity.id && <div className="home-activity-details"><DetailList title={t("familyPractice.ui23")} values={activity.materials}/><DetailList title={t("familyPractice.ui24")} values={activity.adult_instructions}/><DetailList title={t("familyPractice.ui25")} values={activity.accepted_responses}/><DetailList title={t("familyPractice.ui26")} values={activity.prompts}/><DetailList title={t("familyPractice.ui27")} values={activity.stop_conditions} stop/><form onSubmit={saveObservation}><h4>{t("familyPractice.ui28")}</h4><label>{t("familyPractice.ui29")}<select value={form.activity_id === activity.id ? form.outcome : "independent"} onChange={(event) => setForm({ ...form, activity_id: activity.id, outcome: event.target.value })}><option value="independent">{t("familyPractice.ui4")}</option><option value="with_help">{t("familyPractice.ui3")}</option><option value="refused">{t("familyPractice.ui30")}</option><option value="stopped">{t("familyPractice.ui31")}</option><option value="not_observed">{t("familyPractice.ui1")}</option></select></label><label>{t("familyPractice.ui32")}<select value={form.prompt_level} onChange={(event) => setForm({ ...form, activity_id: activity.id, prompt_level: event.target.value })}><option value="independent">{t("familyPractice.ui33")}</option><option value="minimal">{t("familyPractice.ui34")}</option><option value="full">{t("familyPractice.ui35")}</option></select></label><label>{t("familyPractice.ui36")}<textarea maxLength={500} value={form.activity_id === activity.id ? form.note : ""} onChange={(event) => setForm({ ...form, activity_id: activity.id, note: event.target.value })}/></label><button className="primary-button"><Save size={16}/>  {t("familyPractice.ui37")}</button></form></div>}</article>)}</div> : <div className="review-gated-library"><LockKeyhole size={28}/><div><strong>{t("familyPractice.ui38")}</strong><p>{t("familyPractice.ui39")}</p></div><div>{library?.pending_review.map((item) => <span key={item.id}><ShieldCheck size={14}/>{item.title}<small>DRAFT</small></span>)}</div></div>}
    {library?.observations.length ? <div className="real-life-history"><strong>{t("familyPractice.ui40")}</strong>{library.observations.slice(0, 5).map((item) => <span key={item.id}><b>{item.activity_title}</b><small>{({ independent: t("familyPractice.ui4"), with_help: t("familyPractice.ui3"), refused: t("familyPractice.ui30"), stopped: t("familyPractice.ui31"), not_observed: t("familyPractice.ui1") } as Record<string, string>)[item.outcome] || item.outcome} · {formatDate(item.observed_at)}</small></span>)}</div> : null}
    {message && <div className="family-inline-message" role="status"><Check size={16}/>{message}</div>}
  </section>;
}

function DetailList({ title, values, stop = false }: { title: string; values: string[]; stop?: boolean }) {
  useLocale();
  return <div className={stop ? "stop-conditions" : ""}><h4>{stop && <Pause size={15}/>} {title}</h4><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></div>;
}

export function P1ResultsSummary({ childId }: { childId?: number }) {
  useLocale();
  const [summary, setSummary] = useState<ResultsSummary | null>(null);
  useEffect(() => { if (childId) api<ResultsSummary>(`/api/results/${childId}/summary`).then(setSummary).catch(() => setSummary(null)); }, [childId]);
  if (!summary) return null;
  const rows = [
    [t("familyPractice.ui41"), summary.gameplay_choices],
    [t("familyPractice.ui42"), summary.independent_completions],
    [t("familyPractice.ui43"), summary.prompted_completions],
    [t("familyPractice.ui44"), summary.refusals],
    [t("familyPractice.ui45"), summary.breaks],
    [t("familyPractice.ui46"), summary.technical_errors],
    [t("familyPractice.ui47"), summary.real_life_observations],
  ] as const;
  return <section className="admin-card separated-results"><div className="admin-card-head"><div><span className="kicker">{t("familyPractice.ui48")}</span><h3>{t("familyPractice.ui49")}</h3><p>{summary.disclaimer}</p></div><CircleAlert size={24}/></div><div>{rows.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div></section>;
}
