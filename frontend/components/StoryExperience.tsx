"use client";
import { t, useLocale, getLocale, languageOf } from "@/lib/i18n";

import Image from "next/image";
import { LessonLibraryHero } from "./LessonLibraryHero";
import { ArrowLeft, BookOpen, Check, ChevronRight, Play, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Story } from "@/lib/api";
import { StorybookExperience } from "./storybook/StorybookExperience";
import { CinematicStorybookExperience } from "./storybook/cinematic/CinematicStorybookExperience";
import { speak, stopCurrentSpeech } from "@/lib/speech";
import { InteractiveBook } from "./storybook/book/InteractiveBook";

export function StoryExperience({ childId, calmMode = false, onGames }: { childId?: number; calmMode?: boolean; onGames: () => void }) {
  const locale = useLocale();
  const [stories, setStories] = useState<Story[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const active = stories.find((story) => story.key === activeKey);

  useEffect(() => {
    if (!childId || activeKey) return;
    let current = true;
    queueMicrotask(() => { if (current) { setLoading(true); setError(""); } });
    api<Story[]>(`/api/stories/${childId}`)
      .then((items) => { if (current) setStories(items); })
      .catch((cause) => { if (current) setError(cause instanceof Error ? cause.message : t("storyList.copy001")); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; stopCurrentSpeech(); };
  }, [childId, activeKey, locale, revision]);

  const narrate = async (text: string) => {
    if (!await speak(text, .70, true, languageOf(getLocale()))) setFeedback(t("storyList.copy002"));
  };

  const selectAnswer = async (answerKey: string) => {
    if (!active || !childId || saving || active.scene_index >= active.scene_count) return;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const result = await api<{ correct: boolean; hint: string; scene_index: number; completed: boolean }>(
        `/api/stories/${childId}/${active.key}/answer`,
        { method: "POST", body: JSON.stringify({ scene_index: active.scene_index, answer_key: answerKey }) },
      );
      if (!result.correct) { setFeedback(result.hint); return; }
      stopCurrentSpeech();
      setStories((items) => items.map((story) => story.key === active.key
        ? { ...story, scene_index: result.scene_index, completed_at: result.completed ? story.completed_at || new Date().toISOString() : story.completed_at }
        : story));
      setFeedback(result.completed ? t("storyList.copy003") : t("storyList.copy004"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("storyList.copy005"));
    } finally { setSaving(false); }
  };

  const restart = async () => {
    if (!active || !childId || saving) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/stories/${childId}/${active.key}/restart`, { method: "POST" });
      setStories((items) => items.map((story) => story.key === active.key ? { ...story, scene_index: 0 } : story));
      setFeedback("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("storyList.copy006")); }
    finally { setSaving(false); }
  };

  if (!childId) return <div className="v2-screen v2-story-status" role="status">{t("storyList.copy007")}</div>;
  if (loading) return <div className="v2-screen v2-story-status" role="status">{t("storyList.copy008")}</div>;

  if (active?.engine === "storybook") return <StorybookExperience embedded key={childId} childId={childId} calmMode={calmMode} onExit={() => setActiveKey(null)} onSpeak={text => speak(text,.70,true,languageOf(getLocale()))} onStopSpeech={stopCurrentSpeech}/>;
  if (active?.engine === "cinematic_story") return <CinematicStorybookExperience embedded key={childId} childId={childId} calmMode={calmMode} onExit={() => setActiveKey(null)}/>;
  if (active?.engine === "interactive_book") return <InteractiveBook embedded childId={childId} storyKey={active.key} calmMode={calmMode} onExit={() => setActiveKey(null)}/>;


  if (active) {
    const scene = active.scenes[active.scene_index];
    return <div className="v2-screen v2-story-player page-enter">
      <header className="v2-story-player-header"><button onClick={() => { stopCurrentSpeech(); setActiveKey(null); setFeedback(""); }}><ArrowLeft/> {t("storyList.copy011")}</button><div><span>{t("storyList.copy012")}</span><h1>{active.title}</h1></div><strong>{Math.min(active.scene_index + 1, active.scene_count)} / {active.scene_count}</strong></header>
      {error && <p className="v2-inline-alert" role="alert">{error}</p>}
      {scene ? <>
        <div className="v2-story-scene" key={`${active.key}-${active.scene_index}`}><Image src={scene.image} alt={scene.alt} fill priority sizes="(max-width: 760px) 100vw, 75vw"/></div>
        <div className="v2-story-reader"><div><p>{scene.text}</p><button type="button" onClick={() => narrate(scene.text)} aria-label={t("storyList.copy013")}><Volume2/> {t("storyList.copy014")}</button></div><h2>{scene.prompt}</h2><div className="v2-story-choices">{scene.choices.map((choice) => <button key={choice.key} disabled={saving} onClick={() => void selectAnswer(choice.key)}><Image src={choice.image} alt="" width={86} height={86}/><strong>{choice.label}</strong><ChevronRight/></button>)}</div>{feedback && <p className="v2-story-feedback" role="status">{feedback}</p>}</div>
      </> : <div className="v2-story-end"><Check size={54}/><h2>{t("storyList.copy015")}</h2><p>{t("storyList.copy016")}</p><div><button onClick={() => setActiveKey(null)}>{t("storyList.copy017")}<ChevronRight/></button><button onClick={() => void restart()} disabled={saving}><RotateCcw/> {t("storyList.copy018")}</button></div></div>}
    </div>;
  }

  const storyStatus = (story: Story) => story.in_progress || (story.scene_index > 0 && story.scene_index < story.scene_count) ? "started" : story.completed_at || story.scene_index >= story.scene_count ? "completed" : "new";
  const featured = stories.find(story => storyStatus(story) === "started");
  const openStory = (story: Story) => { stopCurrentSpeech(); setActiveKey(story.key); window.scrollTo({top:0,behavior:"instant"}); setFeedback(""); setError(""); };

  return <div className="v2-screen v2-stories focused-stories playroom-catalog story-room-catalog page-enter">
    <LessonLibraryHero section="stories" onOpen={section => { if (section === "games") onGames(); }}/>
    {error && <div className="v2-inline-alert" role="alert"><p>{error}</p><button className="small-button" onClick={() => setRevision(value => value + 1)}>{t("ux.retry")}</button></div>}
    {featured && <section className="story-resume playroom-resume"><Image src={featured.cover} alt="" width={180} height={140}/><div><span>{t("storyList.copy022")}</span><h2>{featured.title}</h2><div className="playroom-progress-row"><progress value={featured.scene_index} max={Math.max(1,featured.scene_count)} aria-label={t("library.readingStatus")}/><span>{featured.progress_label || t("storyList.progress", {done:featured.scene_index,total:featured.scene_count})}</span></div></div><button className="primary-button" onClick={() => openStory(featured)}><Play size={18}/>{t("storyList.copy027")}</button></section>}
    <section aria-labelledby="v2-all-stories"><div className="library-results-heading"><h2 id="v2-all-stories">{t("library.catalog")}</h2><span role="status">{t("library.found",{count:stories.length})}</span></div>
      {stories.length ? <div className="v2-story-grid">{stories.map(story => <button key={story.key} className="v2-story-card" onClick={() => openStory(story)}><span className="v2-story-cover"><Image src={story.cover} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"/></span><span className="v2-story-body"><span className={`story-state story-state-${storyStatus(story)}`}>{t(`library.card.${storyStatus(story)}`)}</span><strong>{story.title}</strong><small>{story.summary}</small><small>{story.category} · {story.progress_label || t("storyList.progress", {done:story.scene_index,total:story.scene_count})}</small><span className="story-card-action">{t(storyStatus(story) === "started" ? "storyList.copy027" : "library.openStory")}<ChevronRight size={20}/></span></span></button>)}</div> : !error && <div className="library-empty"><BookOpen size={32}/><h3>{t("storyList.copy009")}</h3><p>{t("storyList.copy010")}</p></div>}

    </section>
  </div>;
}
