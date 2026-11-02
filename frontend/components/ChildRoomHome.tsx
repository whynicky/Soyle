"use client";

import { t, useLocale } from "@/lib/i18n";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { useEffect } from "react";
import type { Child, Dashboard, Exercise, LearningSession } from "@/lib/api";
import { stopCurrentSpeech } from "@/lib/speech";
import { ExercisePet } from "./pet/ExercisePet";

type Destination = 'stories' | 'games' | 'aac' | 'achievements' | 'profile' | 'settings' | 'learn' | 'my-world' | 'success';
type Props = { child?: Child; dashboard: Dashboard | null; exercises: Exercise[]; currentSession: LearningSession | null;
  busy: boolean; error: string; canSave: boolean; soundEnabled: boolean; onStart: () => void; onResume: () => void;
  onNavigate: (screen: Destination) => void; onExercise: (exercise: Exercise) => void };
export function ChildRoomHome({ child, currentSession, busy, error, canSave, onStart, onResume, onNavigate }: Props) {
  useLocale();
  useEffect(() => () => stopCurrentSpeech(), []);
  const nextExercise = currentSession?.exercises[currentSession.current_index];
  const actionLabel = currentSession && canSave ? t("ux.continueSession") : t("ux.startSession");
  function start() { if (currentSession && canSave) onResume(); else if (canSave) onStart(); else onNavigate('games'); }
  return <div className="child-room-home focused-child-home scenic-child-home">
    <section className="home-next-step" aria-labelledby="home-next-title">
      <div className="home-next-copy"><span className="home-greeting">{t("scenic.greeting",{name:child?.name || t("scenic.friend")})}</span><h1 id="home-next-title">{t(currentSession ? "scenic.continueTitle" : "scenic.lets")}<br/><span>{t(currentSession ? "scenic.continueAccent" : "scenic.play")}</span></h1>
        <div className="home-session-detail">{nextExercise ? <><span className="home-next-label">{t("scenic.nextLabel")}</span><strong>{nextExercise.title}</strong></> : <p>{t("ux.homeHint")}</p>}
        {currentSession && <div className="home-session-meter"><progress max={currentSession.exercises.length || 1} value={currentSession.current_index} aria-label={t("ux.sessionProgress",{done:currentSession.current_index,total:currentSession.exercises.length})}/><span>{t("ux.sessionProgress", {done:currentSession.current_index,total:currentSession.exercises.length})}</span></div>}</div>
        <button type="button" className="primary-button home-start-action" disabled={busy} onClick={start}><Play fill="currentColor" size={22}/>{busy ? t("child.wait") : actionLabel}<ArrowRight size={22}/></button>
        <span className="home-reassurance">{t("ux.pauseAnytime")}</span>
      </div>
      <div className="home-companion"><ExercisePet/></div>
    </section>
    {!canSave && <p className="room-notice" role="status">{t("child.askSave")}</p>}
    {error && <p className="room-notice" role="alert">{error}</p>}
    <section className="home-activities"><div className="home-activities-heading"><h2>{t("child.chooseActivity")}</h2><button onClick={() => onNavigate("games")}>{t("scenic.all")}<ArrowRight size={18}/></button></div><nav className="home-activity-links" aria-label={t("child.chooseActivity")}>{[
      {key:'games', title:t("navigation.exercises"), hint:t("ux.gamesHint"), destination:'games'},
      {key:'stories', title:t("nav.stories"), hint:t("ux.storiesHint"), destination:'stories'},
      {key:'words', title:t("navigation.communication"), hint:t("ux.wordsHint"), destination:'aac'},
    ].map(item => <button key={item.key} type="button" onClick={() => onNavigate(item.destination as Destination)}><Image src={`/app-illustrations/home-${item.key}.png`} alt="" width={480} height={320}/><span><strong>{item.title}</strong><small>{item.hint}</small></span><ArrowRight size={22}/></button>)}</nav></section>
  </div>;
}
