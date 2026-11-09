"use client";

import Image from "next/image";
import { AccountLanguagePicker } from "./AccountLanguagePicker";
import { WorkspaceThemeChoice } from "./PublicTheme";
import { WorkspaceSkeleton } from "./WorkspaceSkeleton";
import { TranslationEditor } from "./TranslationEditor";
import { t, useLocale, formatDate } from "@/lib/i18n";

import { VocabularyProgress } from "./VocabularyProgress";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRefreshOnReturn } from "@/lib/hooks/useRefreshOnReturn";
import { RecordHistory } from "./RecordHistory";
import { GoalPracticeProgress } from "./GoalPracticeProgress";
import type { PracticeGoal } from "@/lib/api";
import { BrandLogo } from "@/components/BrandLogo";
import { Users, ArrowRight, Menu, X, Search, LogOut, ClipboardList, MessageSquare, Clock, RefreshCw, Link2, Copy, Check } from "lucide-react";
import { WorkspaceNavigation, WorkspaceRailToggle } from "./WorkspaceNavigation";
import { readWorkspacePage, workspaceHref, workspacePages, type WorkspacePage } from "@/lib/workspacePages";
import { api, type Child, type Exercise, type User, type SpecialistAdvice, type AdaptivePlan } from "@/lib/api";

import { RecommendationDecision, RecommendationOutcome, familyDecisionLabels } from "./RecommendationDecision";

type Observation = { id: number; result_type: string; prompt_level: string; context: string; note: string; created_at: string; specialist_name?: string };
type Workspace = {
  family_notes: { title: string; observed_at: string; result: string; note: string }[];
  practice_goals: PracticeGoal[];
  available_exercises: Exercise[];
  observations: Observation[];
  recommendations: SpecialistAdvice[];
  dashboard: { recent: Array<{ id: number; attempt_status: string; exercise_id?: number; exercise_title?: string | null; created_at: string }>; total_sessions: number };
};
const outcomeLabels = (): Record<string, string> => ({ completed: t("specialist.copy000"), participated: t("specialist.copy001"), independent: t("specialist.copy002"), with_help: t("specialist.copy003"), not_observed: t("specialist.copy004"), refused: t("specialist.copy005"), break: t("specialist.copy006"), technical_error: t("specialist.copy007") });

function promptLabel(level: string) {
  return ({ independent: t("specialist.copy043"), minimal: t("specialist.copy044"), full: t("specialist.copy045") } as Record<string, string>)[level];
}

const deskPages = workspacePages.specialist;
const readDeskRoute = () => ({
  page: readWorkspacePage("specialist"),
  childId: Number(new URLSearchParams(window.location.search).get("child")) || undefined,
});

export function SpecialistWorkspace({ user, onLogout }: { user: User; onLogout: () => void }) {
  const locale = useLocale();
  const [route, setRoute] = useState(readDeskRoute);
  const [children, setChildren] = useState<Child[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const main = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const closeMenuButton = useRef<HTMLButtonElement>(null);
  const rosterRequest = useRef<AbortController | null>(null);
  const refreshChildren = useCallback(async () => {
    rosterRequest.current?.abort();
    const controller = new AbortController();
    rosterRequest.current = controller;
    try {
      const items = await api<Child[]>("/api/children", { signal: controller.signal });
      if (!controller.signal.aborted) { setChildren(items); setError(""); }
    } catch (cause) {
      if (!controller.signal.aborted) { setChildren(null); setError(cause instanceof Error ? cause.message : t("errors.request")); }
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void refreshChildren(), 0);
    return () => { window.clearTimeout(timer); rosterRequest.current?.abort(); };
  }, [refreshChildren]);
  useRefreshOnReturn(refreshChildren);
  useEffect(() => {
    const sync = () => { setMenuOpen(false); setRoute(readDeskRoute()); };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const focus = requestAnimationFrame(() => closeMenuButton.current?.focus());
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMenuOpen(false);
      requestAnimationFrame(() => menu.current?.focus());
    };
    const desktop = window.matchMedia("(min-width: 1051px)");
    const reset = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener("keydown", escape);
    desktop.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(focus);
      document.removeEventListener("keydown", escape);
      desktop.removeEventListener("change", reset);
    };
  }, [menuOpen]);
  function closeMenu() {
    setMenuOpen(false);
    requestAnimationFrame(() => menu.current?.focus());
  }
  const child = route.childId ? children?.find(item => item.id === route.childId) : children?.length === 1 ? children[0] : undefined;
  const section = route.page.slug;
  const isChildPage = section !== "children" && section !== "translations";
  const needsSelection = isChildPage && !route.childId && !child;
  const rosterDestination = section === "children" ? deskPages[1] : route.page;
  const childId = route.childId || (isChildPage ? child?.id : undefined);
  useEffect(() => {
    const href = workspaceHref("specialist", route.page, childId);
    if (window.location.pathname + window.location.search !== href) window.history.replaceState(null, "", href + window.location.hash);
    document.title = t(route.page.label) + " · Söyle";
  }, [route.page, childId, locale]);
  const go = (page: WorkspacePage, id = child?.id) => {
    const href = workspaceHref("specialist", page, id);
    if (window.location.pathname + window.location.search !== href) window.history.pushState(null, "", href);
    setRoute({ page, childId: id });
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => main.current?.focus({ preventScroll: true }));
  };
  const open = (slug: string, id?: number) => go(deskPages.find(item => item.slug === slug)!, id);
  const visible = (children || []).filter(item => item.name.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
  return <div className={`clinician-desk${railCollapsed && !menuOpen ? " workspace-rail-collapsed" : ""}`}>
    <aside className={`desk-rail${menuOpen ? " open" : ""}`} id="desk-navigation" role={menuOpen ? "dialog" : undefined} aria-modal={menuOpen || undefined} aria-label={t("screen.AuthenticatedApp.ui49")} onKeyDown={e => {
      if (!menuOpen || e.key !== "Tab") return;
      const controls = [...e.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
      const destination = e.shiftKey ? controls.at(-1) : controls[0];
      if (e.target === (e.shiftKey ? controls[0] : controls.at(-1))) { e.preventDefault(); destination?.focus(); }
    }}>
      <div className="desk-brand"><a href={workspaceHref("specialist", deskPages[0])}><BrandLogo variant={railCollapsed && !menuOpen ? "mark" : "full"} size={31} /></a>
        <WorkspaceRailToggle collapsed={railCollapsed} onToggle={() => setRailCollapsed(value => !value)} controls="desk-navigation"/>
        <button type="button" ref={closeMenuButton} className="desk-close" onClick={closeMenu} aria-label={t("landing.copy045")}><X size={20}/></button>
      </div>
      <div className="desk-menu-content">
        <WorkspaceNavigation role="specialist" current={route.page} childId={child?.id} onOpen={go}/>
        <div className="desk-identity">
          <strong>{user.full_name}</strong>
          <small>{t("nav.specialist")}</small>
          <AccountLanguagePicker/>
          <button type="button" onClick={onLogout} title={t("common.logoutAccount")}><LogOut size={16}/><span>{t("common.logoutAccount")}</span></button>
        </div>
      </div>
    </aside>
    {menuOpen && <div className="desk-overlay" aria-hidden="true" onClick={closeMenu}/>}
    <main className="desk-main" tabIndex={-1} ref={main} inert={menuOpen || undefined}>
      <div className="desk-topline">
        <button type="button" className="desk-menu" ref={menu} aria-controls="desk-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={18}/>{t("screen.AuthenticatedApp.ui48")}</button>
        <span className="desk-mobile-logo"><BrandLogo variant="mark" size={25}/></span>
        <WorkspaceThemeChoice/>
      </div>
      <header className={section === "children" ? "desk-heading desk-roster-heading" : "desk-heading"}>
        <div><h1>{section === "children" ? t("desk.rosterTitle") : section === "profile" && child ? child.name : t(route.page.label)}</h1>
          {section === "children" && <p>{t("desk.rosterHint")}</p>}
          {section === "profile" && child && <p>{t("desk.profileHint")}</p>}
          {section === "history" && <p>{t("desk.historyHint")}</p>}
        </div>
        {section === "children" && <Image src="/app-illustrations/journey-support.png" alt="" width={180} height={135} priority/>}
      </header>
      {section === "translations" ? <div className="desk-translations"><TranslationEditor specialist/><TranslationEditor resource="aac" specialist/></div>
      : error ? <div className="cabinet-notice error" role="alert">{error}<button onClick={() => void refreshChildren()}>{t("ux.retry")}</button></div>
      : !children ? <WorkspaceSkeleton/>
      : !children.length ? <section className="desk-empty"><Users size={32}/><h2>{t("specialist.copy026")}</h2><p>{t("specialist.copy027")}</p><p>{t("specialist.copy028")} <strong>{user.username}</strong></p><button className="secondary-button" onClick={() => void refreshChildren()}><RefreshCw size={16}/>{t("specialist.copy029")}</button></section>
      : section === "children" || needsSelection ? <section className="desk-roster">
        <div className="desk-list-heading"><h2>{t(needsSelection ? "desk.chooseChild" : "desk.roster")} <small>{children.length}</small></h2>
          {children.length > 1 && <label className="desk-search"><Search size={17}/><input type="search" aria-label={t("desk.search")} placeholder={t("desk.search")} value={query} onChange={e => setQuery(e.target.value)}/></label>}
        </div>
        <ul>{visible.map(item => <li key={item.id}><a href={workspaceHref("specialist", rosterDestination, item.id)} onClick={e => {
          if (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey) return;
          e.preventDefault(); go(rosterDestination, item.id);
        }}>
          <span aria-hidden="true" className="desk-monogram">{item.name.slice(0, 1)}</span>
          <span className="desk-row-name"><strong>{item.name}</strong>{item.birth_date && <small>{t("desk.birth")} · {formatDate(item.birth_date)}</small>}</span>
          <span className="desk-row-open">{t(needsSelection ? "desk.select" : "desk.open")} <ArrowRight size={17}/></span>
        </a></li>)}</ul>
        {!visible.length && <p>{t("desk.noMatch")} <button onClick={() => setQuery("")}>{t("desk.clear")}</button></p>}
      </section> : !child ? <section className="desk-empty"><p>{t("desk.missingChild")}</p><button className="secondary-button" onClick={() => open("children")}>{t("desk.roster")}</button></section> : <>
        <div className="desk-child-context"><label htmlFor="desk-child">{t("specialist.copy035")}</label><select id="desk-child" value={child.id} onChange={e => go(route.page, Number(e.target.value))}>{children.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
        <ChildDesk key={child.id} selected={String(child.id)} section={section} open={open}/>
      </>}
    </main>
  </div>;
}

function ChildDesk({ selected, section, open }: { selected: string; section: string; open: (slug: string) => void }) {
  const locale = useLocale();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState("not_observed");
  const [prompt, setPrompt] = useState("independent");
  const [context, setContext] = useState("");
  const [note, setNote] = useState("");
  const [goal, setGoal] = useState("");
  const [exercise, setExercise] = useState("");
  const [recommendationGoal, setRecommendationGoal] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const workspaceRequest = useRef<AbortController | null>(null);
  const reload = useCallback(async (background = false) => {
    workspaceRequest.current?.abort();
    if (!selected) return;
    const controller = new AbortController();
    workspaceRequest.current = controller;
    if (!background) setWorkspace(null);
    setError("");
    try {
      const next = await api<Workspace>(`/api/specialist/children/${selected}`, {signal: controller.signal});
      if (!controller.signal.aborted) setWorkspace(next);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setWorkspace(null);
        setError(cause instanceof Error ? cause.message : t("specialist.copy012"));
      }
    }
  }, [selected]);
  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => { window.clearTimeout(timer); workspaceRequest.current?.abort(); };
  }, [reload, locale]);
  const refreshOnReturn = useCallback(() => reload(true), [reload]);
  useRefreshOnReturn(refreshOnReturn, Boolean(selected));
  const saveObservation = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api(`/api/specialist/children/${selected}/observations`, { method: "POST", body: JSON.stringify({ result_type: result, prompt_level: prompt, context, note, goal_id: goal ? Number(goal) : null }) });
      setContext(""); setNote(""); setNotice(t("specialist.copy013")); await reload(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("specialist.copy014")); setWorkspace(null); }
    finally { setSaving(false); }
  };
  const recommend = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api("/api/specialist/recommendations", { method: "POST", body: JSON.stringify({ child_id: Number(selected), suggested_skill: workspace?.available_exercises.find(item => item.id === Number(exercise))?.skill || "communication", goal_id: recommendationGoal ? Number(recommendationGoal) : null, exercise_id: exercise ? Number(exercise) : null, comment: recommendation }) });
      setRecommendation(""); setNotice(t("specialist.copy015")); await reload(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("specialist.copy016")); setWorkspace(null); }
    finally { setSaving(false); }
  };
  const withdrawRecommendation = async (id: number) => {
    if (saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api(`/api/specialist/recommendations/${id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected" }) });
      setNotice(t("specialist.copy017")); await reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("specialist.copy018")); }
    finally { setSaving(false); }
  };
  const observation = workspace?.observations[0];
  const advice = workspace?.recommendations.find(item => item.is_current);
  const familyResults: Record<string, string> = {
    ...outcomeLabels(), not_yet: t("familyPractice.ui2"), needs_review: t("familyPractice.ui5"), stopped: t("familyPractice.ui31"),
  };
  const activeGoals = workspace?.practice_goals.filter(item => item.status === "active") || [];
  return <div className="desk-record">
    {error && <div className="cabinet-notice error" role="alert">{error}<button className="secondary-button" onClick={() => void reload()}>{t("specialist.copy024")}</button></div>}
    {notice && <p className="cabinet-notice" role="status">{notice}</p>}
    {!workspace && !error && <p role="status">{t("specialist.copy036")}</p>}
    {workspace && <>
      {section === "profile" && <>
        <div className="desk-actions"><button className="primary-button" onClick={() => open("observations")}><ClipboardList size={17}/>{t("desk.newObservation")}</button><button className="secondary-button" onClick={() => open("recommendations")}>{t("desk.newAdvice")}</button></div>
        <div className="desk-summary">
          <section className="desk-goal"><h2>{t("desk.activeGoals")}</h2>
            {activeGoals.length ? <ul>{activeGoals.map(item => <li key={item.id}><strong>{item.title}</strong>{item.target_outcome && <p>{item.target_outcome}</p>}</li>)}</ul> : <p>{t("desk.noGoal")}</p>}
            <button className="desk-text-button" onClick={() => open("history")}>{t("specialist.copy011")}<ArrowRight size={16}/></button>
          </section>
          <section><h2>{t("desk.lastObservation")}</h2>{observation ? <><small>{formatDate(observation.created_at)} · {outcomeLabels()[observation.result_type]}</small><h3>{observation.context}</h3><p>{observation.note}</p></> : <p>{t("desk.noObservation")}</p>}</section>
          <section><h2>{t("desk.lastAdvice")}</h2>{advice ? <><small>{formatDate(advice.created_at)} · {familyDecisionLabels[advice.family_decision]}</small><p>{advice.comment}</p></> : <p>{t("desk.noAdvice")}</p>}</section>
        </div>
        <section className="cabinet-panel">
          <h2>{t("records.home")}</h2>
          {workspace.family_notes?.length ? workspace.family_notes.map((item, index) => <article className="cabinet-entry" key={index}>
            <small>{t("records.parentSource")} · <time dateTime={item.observed_at}>{formatDate(item.observed_at)}</time></small>
            <h3>{item.title}</h3><small>{familyResults[item.result]}</small>
            {item.note && <p>{item.note}</p>}
          </article>) : <p>{t("records.noHome")}</p>}
        </section>
      </>}
      {section === "observations" && <div className="desk-columns"><section className="cabinet-panel"><div className="cabinet-section-title"><ClipboardList size={22}/><div><h2>{t("specialist.copy037")}</h2><p>{t("specialist.copy038")}</p></div></div><form onSubmit={saveObservation}>
        <label>{t("specialist.copy046")}<input value={context} onChange={e => setContext(e.target.value)} minLength={3} maxLength={300} required placeholder={t("specialist.copy047")}/></label>
        <label>{t("specialist.copy048")}<textarea value={note} onChange={e => setNote(e.target.value)} minLength={3} maxLength={1000} required/></label>
        <div className="desk-field-pair">
        <label>{t("specialist.copy041")}<select value={result} onChange={e => { setResult(e.target.value); if (e.target.value === "independent") setPrompt("independent"); if (e.target.value === "with_help" && prompt === "independent") setPrompt("minimal"); }}>{Object.entries(outcomeLabels()).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>{t("specialist.copy042")}<select value={prompt} onChange={e => setPrompt(e.target.value)} disabled={result === "independent"}><option value="independent">{t("specialist.copy043")}</option><option value="minimal">{t("specialist.copy044")}</option><option value="full">{t("specialist.copy045")}</option></select></label>
        </div>
        <label>{t("specialist.copy039")}<select value={goal} onChange={e => setGoal(e.target.value)}><option value="">{t("specialist.copy040")}</option>{workspace.practice_goals.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <button className="primary-button" disabled={saving}>{saving ? t("common.saving") : t("specialist.copy049")}</button>
      </form></section><section className="cabinet-panel"><h2>{t("specialist.copy050")}</h2>{workspace.observations.length ? workspace.observations.map(item => <article className="cabinet-entry" key={item.id}><small>{formatDate(item.created_at, {dateStyle:"medium",timeStyle:"short"})}</small><h3>{outcomeLabels()[item.result_type]}</h3><p>{item.context}: {item.note}</p><small>{t("specialist.copy051")}{promptLabel(item.prompt_level)}</small></article>) : <div className="cabinet-empty-inline"><ClipboardList size={28}/><p>{t("specialist.copy054")}</p></div>}</section></div>}
      {section === "recommendations" && <div className="desk-columns"><section className="cabinet-panel"><div className="cabinet-section-title"><MessageSquare size={22}/><div><h2>{t("specialist.copy055")}</h2><p>{t("specialist.copy056")}</p></div></div><form onSubmit={recommend}>
        <label>{t("specialist.copy061")}<textarea value={recommendation} onChange={e => setRecommendation(e.target.value)} required minLength={3} maxLength={1000}/></label>
        <label>{t("specialist.copy057")}<select value={recommendationGoal} onChange={e => { setRecommendationGoal(e.target.value); setExercise(""); }}><option value="">{t("specialist.copy058")}</option>{workspace.practice_goals.filter(item => item.status === "active").map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label>{t("specialist.copy059")}<select value={exercise} onChange={e => setExercise(e.target.value)}><option value="">{t("specialist.copy060")}</option>{workspace.available_exercises.filter(item => !recommendationGoal || workspace.practice_goals.find(goal => goal.id === Number(recommendationGoal))?.linked_exercises.some(linked => linked.id === item.id)).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <button className="primary-button" disabled={saving}>{t("specialist.copy062")}</button>
      </form></section><section className="cabinet-panel"><h2>{t("specialist.copy063")}</h2>{workspace.recommendations.length ? workspace.recommendations.map(item => <article className="cabinet-entry" key={item.id}><h3>{item.exercise_title || t("specialist.copy064")}</h3><p>{item.comment}</p><RecommendationOutcome item={item}/>{item.is_current ? <button className="secondary-button" disabled={saving} onClick={() => void withdrawRecommendation(item.id)}>{t("specialist.copy065")}</button> : <small>{t("specialist.copy066")}</small>}</article>) : <div className="cabinet-empty-inline"><MessageSquare size={28}/><p>{t("specialist.copy067")}</p></div>}</section></div>}
      {section === "history" && <><section className="cabinet-panel"><h2>{t("specialist.copy068")}</h2>{workspace.practice_goals.length ? workspace.practice_goals.map(item => <article className="cabinet-entry" key={item.id}><h3>{item.title}</h3><p>{t("specialist.copy069")}{item.baseline}</p><small>{item.status === "active" ? t("specialist.copy070") : item.status === "completed" ? t("specialist.copy071") : t("specialist.copy072")}</small><GoalPracticeProgress progress={item.progress}/></article>) : <p>{t("specialist.copy073")}</p>}</section><section className="cabinet-panel"><div className="cabinet-section-title"><Clock size={22}/><div><h2>{t("specialist.copy074")}</h2><p>{workspace.dashboard.total_sessions} {t("specialist.copy075")}</p></div></div>{!workspace.dashboard.recent.length && <p>{t("desk.noSessions")}</p>}<RecordHistory
        key={locale + ":" + workspace.dashboard.recent.map(row => row.id).join("-")}
        initial={workspace.dashboard.recent} hasMore={workspace.dashboard.total_sessions > workspace.dashboard.recent.length}
        endpoint={`/api/children/${selected}/session-history`} onAccessLost={() => void reload()}>
        {item => <article className="cabinet-entry"><strong>{item.exercise_title || workspace.available_exercises.find(exercise => exercise.id === item.exercise_id)?.title || t("specialist.copy076")}</strong>
          <p>{formatDate(item.created_at, {dateStyle:"medium",timeStyle:"short"})} · {outcomeLabels()[item.attempt_status] || t("specialist.copy077")}</p></article>}
      </RecordHistory></section><VocabularyProgress key={selected} childId={Number(selected)} canEdit refreshKey={workspace.dashboard.total_sessions}/></>}
    </>}
  </div>;
}

export function FamilySpecialistAccess({ childId, enabled, onManagePermissions, onStartPlan }: { childId: number; enabled: boolean; onManagePermissions?: () => void; onStartPlan?: (plan: AdaptivePlan) => Promise<void> }) {
  useLocale();
  const [items, setItems] = useState<Array<{ id: number; full_name: string; username: string }>>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [recommendations, setRecommendations] = useState<SpecialistAdvice[]>([]);
  type Invitation = { id: number; status: string; expires_at: string; specialist_name?: string; specialist_username?: string };
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [createdInviteId, setCreatedInviteId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const [people, notes, advice, invites] = await Promise.all([api<typeof items>(`/api/children/${childId}/specialists`), api<Observation[]>(`/api/children/${childId}/specialist-observations`), api<typeof recommendations>(`/api/children/${childId}/specialist-recommendations`), api<Invitation[]>(`/api/children/${childId}/specialist-invitations`)]);
    setItems(people); setObservations(notes); setRecommendations(advice); setInvitations(invites);
  }, [childId]);
  useEffect(() => { let active = true; Promise.all([api<typeof items>(`/api/children/${childId}/specialists`), api<Observation[]>(`/api/children/${childId}/specialist-observations`), api<typeof recommendations>(`/api/children/${childId}/specialist-recommendations`), api<Invitation[]>(`/api/children/${childId}/specialist-invitations`)]).then(([people, notes, advice, invites]) => { if (active) { setItems(people); setObservations(notes); setRecommendations(advice); setInvitations(invites); } }).catch(cause => { if (active) setMessage(cause.message); }); return () => { active = false; }; }, [childId, enabled]);
  const createLink = async () => {
    setBusy(true); setMessage(""); setCopied(false); setInviteUrl("");
    try { const result = await api<{id: number; token: string}>(`/api/children/${childId}/specialist-invitations`, {method: "POST"}); setCreatedInviteId(result.id); setInviteUrl(`${window.location.origin}/app#invite=${result.token}`); await load(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : t("specialist.copy078")); }
    finally { setBusy(false); }
  };
  const refreshFamilyAccess = useCallback(() => load().catch(cause => setMessage(cause instanceof Error ? cause.message : t("specialist.copy079"))), [load]);
  useRefreshOnReturn(refreshFamilyAccess, enabled);
  const activeInviteUrl = enabled && invitations.some(item => item.id === createdInviteId && item.status === "open") ? inviteUrl : "";
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(activeInviteUrl); setCopied(true); }
    catch { setMessage(t("specialist.copy080")); }
  };
  const invitationAction = async (id: number, approve: boolean) => {
    setBusy(true); setMessage("");
    try { await api(`/api/children/${childId}/specialist-invitations/${id}${approve ? "/approve" : ""}`, {method: approve ? "POST" : "DELETE"}); setInviteUrl(""); await load(); setMessage(approve ? t("specialist.copy081") : t("specialist.copy082")); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : t("specialist.copy083")); }
    finally { setBusy(false); }
  };
  const grant = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await api(`/api/children/${childId}/specialists`, { method: "POST", body: JSON.stringify({ username }) }); setUsername(""); await load(); setMessage(t("specialist.copy084")); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : t("specialist.copy085")); }
    finally { setBusy(false); }
  };
  const revoke = async (id: number) => {
    setBusy(true); setMessage("");
    try { await api(`/api/children/${childId}/specialists/${id}`, { method: "DELETE" }); await load(); setMessage(t("specialist.copy086")); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : t("specialist.copy087")); }
    finally { setBusy(false); }
  };
  return <div className="specialist-access family-specialist-page">
    <section className="invite-create-panel"><div className="cabinet-section-title"><Link2 size={25}/><div><span className="kicker">{t("specialist.copy088")}</span><h2>{t("specialist.copy089")}</h2><p>{t("specialist.copy090")}</p></div></div>
      <ol className="invite-steps"><li><span>1</span>{t("specialist.copy091")}</li><li><span>2</span>{t("specialist.copy092")}</li><li><span>3</span>{t("specialist.copy093")}</li></ol>
      {!enabled && <div className="cabinet-notice"><p>{t("specialist.copy094")}</p>{onManagePermissions && <button className="secondary-button" onClick={onManagePermissions}>{t("specialist.copy095")}</button>}</div>}
      <button className="primary-button" disabled={!enabled || busy} onClick={createLink}><Link2 size={18}/>{busy ? t("common.wait") : activeInviteUrl ? t("specialist.copy096") : t("specialist.copy097")}</button>
      {activeInviteUrl && <div className="invite-link-result"><label>{t("specialist.copy098")}<input readOnly value={activeInviteUrl} onFocus={event => event.target.select()}/></label><button className="secondary-button" onClick={copyLink}>{copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? t("specialist.copy099") : t("specialist.copy100")}</button><p>{t("specialist.copy101")}</p></div>}
      {message && <p className="cabinet-notice" role="status">{message}</p>}
    </section>
    <section className="cabinet-panel"><div className="cabinet-panel-heading"><div><h2>{t("specialist.copy102")}</h2><p>{t("specialist.copy103")}</p></div><button className="secondary-button" disabled={busy} onClick={() => { void load().catch(cause => setMessage(cause.message)); }}><RefreshCw size={17}/> {t("specialist.copy104")}</button></div>
      {invitations.filter(item => ["open", "pending"].includes(item.status)).length ? invitations.filter(item => ["open", "pending"].includes(item.status)).map(item => <article className="invitation-request" key={item.id}><div><strong>{item.status === "pending" ? item.specialist_name : t("specialist.copy105")}</strong><p>{item.status === "pending" ? t("final.invitation", {username:item.specialist_username || ""}) : t("specialist.copy107")}</p><small>{t("specialist.copy108")}{formatDate(item.expires_at, {dateStyle:"short",timeStyle:"short"})}</small></div><div className="cabinet-actions">{item.status === "pending" && <button className="primary-button" disabled={busy || !enabled} onClick={() => invitationAction(item.id, true)}>{t("specialist.copy109")}</button>}<button className="secondary-button" disabled={busy} onClick={() => invitationAction(item.id, false)}>{item.status === "pending" ? t("specialist.copy110") : t("specialist.copy111")}</button></div></article>) : <p className="cabinet-empty-copy">{t("specialist.copy112")}</p>}
      <details className="known-specialist"><summary>{t("specialist.copy113")}</summary><form onSubmit={grant}><label>{t("specialist.copy114")}<input value={username} onChange={e => setUsername(e.target.value)} required minLength={3} maxLength={40} disabled={!enabled || busy}/></label><button className="secondary-button" disabled={!enabled || busy}>{t("specialist.copy115")}</button></form></details>
    </section>
    <section className="cabinet-panel"><h2>{t("specialist.copy116")}</h2>{items.length ? items.map(item => <div className="connected-specialist" key={item.id}><span className="cabinet-avatar">{item.full_name[0]}</span><div><strong>{item.full_name}</strong><small>@{item.username}</small></div><button className="secondary-button" disabled={busy} onClick={() => revoke(item.id)}>{t("specialist.copy117")}</button></div>) : <p className="cabinet-empty-copy">{t("specialist.copy118")}</p>}</section>
    <div className="desk-columns"><section className="cabinet-panel"><h2>{t("specialist.copy119")}</h2>{recommendations.length ? recommendations.map(item => <article className="cabinet-entry" key={item.id}><small>{item.specialist_name}</small><h3>{item.exercise_title || t("specialist.copy064")}</h3><p>{item.comment}</p><RecommendationDecision key={`${item.id}:${item.family_decision}`} childId={childId} item={item} onStartPlan={onStartPlan} onChanged={() => { void load().catch(cause => setMessage(cause.message)); }}/></article>) : <p>{t("specialist.copy120")}</p>}</section><section className="cabinet-panel"><h2>{t("specialist.copy121")}</h2>{observations.length ? observations.map(item => <article className="cabinet-entry" key={item.id}><small>{item.specialist_name} · <time dateTime={item.created_at}>{formatDate(item.created_at, {dateStyle:"medium",timeStyle:"short"})}</time></small>
        <p>{item.context}: {item.note}</p><small>{outcomeLabels()[item.result_type]} · {t("specialist.copy042")} — {promptLabel(item.prompt_level)}</small></article>) : <p>{t("specialist.copy122")}</p>}</section></div>
  </div>;
}

export function ParentAccountDeletion({ onDeleted }: { onDeleted: () => void }) {
  useLocale();
  const [open, setOpen] = useState(false), [password, setPassword] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const remove = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await api("/api/auth/account", { method: "DELETE", body: JSON.stringify({ password }) }); onDeleted(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("specialist.copy123")); }
    finally { setBusy(false); }
  };
  return <section className="data-control specialist-access"><h2>{t("specialist.copy124")}</h2><p>{t("specialist.copy125")}</p><button className="secondary-button" aria-expanded={open} onClick={() => setOpen(!open)}>{t("specialist.copy126")}</button>{open && <form onSubmit={remove}><label>{t("specialist.copy127")}<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required/></label>{error && <p role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? t("specialist.copy128") : t("specialist.copy129")}</button></form>}</section>;
}
