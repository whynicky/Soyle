"use client";

import { t, useLocale, getLocale, languageOf } from "@/lib/i18n";
import Image from "next/image";
import { ArrowRight, CircleX, Play, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Child, Dashboard, Exercise, LearningSession } from "@/lib/api";
import { speak, stopCurrentSpeech } from "@/lib/speech";
import { ExercisePet, usePetMessage } from "./pet/ExercisePet";

type Destination = 'stories' | 'games' | 'aac' | 'achievements' | 'profile' | 'settings' | 'learn' | 'my-world' | 'success';
type Props = { child?: Child; dashboard: Dashboard | null; exercises: Exercise[]; currentSession: LearningSession | null;
  busy: boolean; error: string; canSave: boolean; soundEnabled: boolean; onStart: () => void; onResume: () => void;
  onNavigate: (screen: Destination) => void; onExercise: (exercise: Exercise) => void };
export function ChildRoomHome({ child, dashboard, exercises, currentSession, busy, error, canSave, soundEnabled, onStart, onResume, onNavigate }: Props) {
  useLocale();
  const [message, setMessage] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const petMessage = usePetMessage();
  useEffect(() => () => stopCurrentSpeech(), []);
  const canStartPlan = (dashboard?.recommended_exercises || []).some(item => exercises.some(e => e.id === item.id));
  const nextExercise = currentSession?.exercises[currentSession.current_index];
  const actionLabel = currentSession && canSave ? t("ux.continueSession") : canSave && canStartPlan ? t("ux.startSession") : t("ux.chooseExercise");
  function start() { if (currentSession && canSave) onResume(); else if (canSave && canStartPlan) onStart(); else onNavigate('games'); }
  async function greet() {
    if (speaking) return;
    setSpeaking(true);
    try { if (!await speak(petMessage, .7, soundEnabled, languageOf(getLocale()), "pet")) setMessage(soundEnabled ? t("childRoomHome.ui1") : t("childRoomHome.ui2")); }
    finally { setSpeaking(false); }
  }
  return <div className="child-room-home focused-child-home scenic-child-home">
    <section className="home-next-step" aria-labelledby="home-next-title">
      <div className="home-next-copy"><span className="home-greeting">{t("scenic.greeting",{name:child?.name || t("scenic.friend")})}</span><h1 id="home-next-title">{t("scenic.lets")}<br/><span>{t("scenic.play")}</span></h1>
        <p>{nextExercise ? t("ux.nextExercise", {title: nextExercise.title}) : t("ux.homeHint")}</p>
        {currentSession && <p className="home-session-progress">{t("ux.sessionProgress", {done:currentSession.current_index,total:currentSession.exercises.length})}</p>}
        <button type="button" className="primary-button home-start-action" disabled={busy} onClick={start}><Play fill="currentColor" size={22}/>{busy ? t("child.wait") : actionLabel}<ArrowRight size={22}/></button>
        <span className="home-reassurance">{t("ux.pauseAnytime")}</span>
      </div>
      <div className="home-companion"><p className="home-pet-bubble">{petMessage}</p><ExercisePet/><button className="home-listen" type="button" disabled={speaking} onClick={() => void greet()}><Volume2 size={20}/>{speaking ? t("childRoomHome.ui6") : t("game.listen")}</button></div>
    </section>
    {!canSave && <p className="room-notice" role="status">{t("child.askSave")}</p>}
    {error && <p className="room-notice" role="alert">{error}</p>}
    <section className="home-activities"><div className="home-activities-heading"><h2>{t("child.chooseActivity")}</h2><button onClick={() => onNavigate("games")}>{t("scenic.all")}<ArrowRight size={18}/></button></div><nav className="home-activity-links" aria-label={t("child.chooseActivity")}>{[
      {key:'games', title:t("navigation.exercises"), hint:t("ux.gamesHint"), destination:'games'},
      {key:'stories', title:t("nav.stories"), hint:t("ux.storiesHint"), destination:'stories'},
      {key:'words', title:t("navigation.communication"), hint:t("ux.wordsHint"), destination:'aac'},
    ].map(item => <button key={item.key} type="button" onClick={() => onNavigate(item.destination as Destination)}><Image src={`/app-illustrations/home-${item.key}.png`} alt="" width={480} height={320}/><span><strong>{item.title}</strong><small>{item.hint}</small></span><ArrowRight size={22}/></button>)}</nav></section>
    {message && <p className="room-message" role="status">{message}<button type="button" onClick={() => setMessage('')} aria-label={t("child.closeMessage")}><CircleX size={22}/></button></p>}
  </div>;
}
