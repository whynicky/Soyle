"use client";

import { t, useLocale, formatDate } from "@/lib/i18n";


import Image from "next/image";
import { ParentSpecialistAdvice } from "./ParentSpecialistAdvice";
import { ArrowRight, BookOpen, Check, ChevronRight, Lightbulb, MessageCircle, Settings, TrendingUp, UserRound } from "lucide-react";
import type { Child, Dashboard, LearningSession, Exercise, AdaptivePlan } from "@/lib/api";

type Destination = "parent" | "guides" | "progress" | "goals" | "world" | "aac" | "games" | "settings";

export function ParentOverview({ child, dashboard, activeSession, onStartSession, onResume, onNavigate, exercises, onExercise, onOpenSpecialist, onStartPlan, busy = false }:  { busy?: boolean; child?: Child; dashboard: Dashboard | null; activeSession: LearningSession | null; onStartSession: () => void; onResume: () => void; onNavigate: (screen: Destination) => void; exercises: Exercise[]; onExercise: (exercise: Exercise) => void; onOpenSpecialist: () => void; onStartPlan: (plan: AdaptivePlan) => Promise<void> }) {
  useLocale();
  return <div className="v2-screen v2-parent-overview page-enter">
    <section className="parent-next-step" aria-labelledby="parent-next-title">
      <div><span className="kicker">{t("ux.today")} · {child?.name || t("parentOverview.ui4")}</span><h1 id="parent-next-title">{activeSession && activeSession.status !== "completed" ? t("ux.continueSession") : t("ux.parentNext")}</h1>
        <p>{activeSession && activeSession.status !== "completed" ? t("ux.sessionProgress", {done:activeSession.current_index,total:activeSession.exercises.length}) : t("ux.parentNextHint")}</p>
        <div className="parent-next-actions"><button type="button" className="primary-button" disabled={busy} onClick={activeSession && activeSession.status !== "completed" ? onResume : onStartSession}>{busy ? t("common.wait") : activeSession && activeSession.status !== "completed" ? t("ux.continueSession") : t("ux.startSession")}<ArrowRight size={20}/></button><button type="button" className="small-button" onClick={() => onNavigate("goals")}>{t("ux.todayPlan")}</button></div>
        <p className="parent-last-session">{dashboard?.recent[0] ? t("ux.lastSession", {date:formatDate(dashboard.recent[0].created_at)}) : t("ux.firstSession")}</p>
      </div><Image src="/app-illustrations/parent-observation-hero.webp" alt="" width={360} height={260}/>
    </section>
    {child && <ParentSpecialistAdvice key={child.id} childId={child.id} exercises={exercises} onExercise={onExercise} onOpenSpecialist={onOpenSpecialist} onStartPlan={onStartPlan}/>}
    <div className="v2-parent-stat-row" aria-label={t("parentOverview.ui8")}>
      <div><span><TrendingUp/></span><strong>{dashboard?.week_sessions ?? 0}</strong><small>{t("landing.copy092")}</small></div>
      <div><span><Check/></span><strong>{dashboard?.completed_exercise_ids.length ?? 0}</strong><small>{t("landing.copy093")}</small></div>
      <div><span><MessageCircle/></span><strong>{dashboard?.total_sessions ?? 0}</strong><small>{t("parentOverview.ui9")}</small></div>
    </div>
    <section className="v2-parent-actions" aria-labelledby="parent-actions-title"><div className="v2-section-heading"><div><h2 id="parent-actions-title">{t("parentOverview.ui10")}</h2><p>{t("parentOverview.ui11")}</p></div></div><div>
      <button onClick={() => onNavigate("parent")}><span className="mint"><UserRound/></span><strong>{t("specialist.copy035")}</strong><small>{t("parentOverview.ui12")}</small><ChevronRight/></button>
      <button onClick={() => onNavigate("progress")}><span className="blue"><TrendingUp/></span><strong>{t("auth.history")}</strong><small>{t("parentOverview.ui13")}</small><ChevronRight/></button>
      <button onClick={() => onNavigate("guides")}><span className="peach"><BookOpen/></span><strong>{t("parentOverview.ui14")}</strong><small>{t("parentOverview.ui15")}</small><ChevronRight/></button>
      <button onClick={() => onNavigate("goals")}><span className="lilac"><Lightbulb/></span><strong>{t("landing.copy096")}</strong><small>{t("parentOverview.ui16")}</small><ChevronRight/></button>
    </div></section>
    <div className="v2-parent-tools"><strong>{t("parentOverview.ui17")}</strong><div><button onClick={() => onNavigate("world")}>{t("parentOverview.ui18")} <ArrowRight/></button><button onClick={() => onNavigate("aac")}>{t("parentOverview.ui19")} <ArrowRight/></button><button onClick={() => onNavigate("games")}>{t("parentOverview.ui20")} <ArrowRight/></button><button onClick={() => onNavigate("settings")}><Settings/> {t("nav.settings")}</button></div></div>
  </div>;
}
