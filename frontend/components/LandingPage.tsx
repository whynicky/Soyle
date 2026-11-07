"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowDown, ArrowRight, BookOpen, Check, ChevronDown, Clock3,
  ClipboardList, Download, History, LayoutGrid, LockKeyhole, MessageSquare, ShieldCheck, UserRound,
  Volume2, X,
} from "lucide-react";
import { t, useLocale, type Locale } from "@/lib/i18n";
import { landingThemes, type LandingTheme } from "@/lib/landingTheme";
import { LanguagePicker } from "./LanguagePicker";
import { BrandMark } from "./PublicBrandMark";
import { preloadThemeImage, PublicThemeToggle, usePublicTheme } from "./PublicTheme";
import "@/app/landing.css";

const scenery = {
  desktop: "soyle-sculpted-desktop",
  history: "soyle-heather-closeup",
  plan: "soyle-sculpted-plan",
} as const;

const heroSizes = "(max-width: 760px) 1040px, (max-width: 1200px) 1200px, 100vw";
const mobileScenery = "(max-width: 480px)";

type Scene = keyof typeof scenery | "hero" | "foreground" | "end";
type SceneTone = "day" | "night";

function isHeroLayer(scene: Scene) {
  return scene === "hero" || scene === "foreground";
}

function sceneVariant(scene: Scene, tone: SceneTone, mobile = false) {
  const sizes = mobile
    ? (isHeroLayer(scene) ? "488px" : "max(100vw, 480px)")
    : isHeroLayer(scene) ? heroSizes : scene === "end" ? "100vw"
      : `(max-width: 760px) calc(100vw - 40px), ${scene === "desktop" ? 1168 : 760}px`;
  if (scene === "hero" || scene === "foreground" || scene === "end") {
    const prefix = `/landing/scenery/${scene}-${tone}${mobile ? "-mobile" : ""}`;
    const widths = mobile ? [520, 1040, 1560] : [1280, 2400, 3840];
    return { src: `${prefix}-${widths[0]}.webp`, srcSet: widths.map(width => `${prefix}-${width}.webp ${width}w`).join(", "), sizes };
  }
  const file = scenery[scene] + (tone === "night" ? "-night" : "");
  const width = scene === "desktop" ? 1536 : 1080;
  return { src: `/landing/${file}.webp`, srcSet: `/landing/scenery/${file}-768.webp 768w, /landing/${file}.webp ${width}w`, sizes };
}

function ScenePhoto({ scene, theme, className = "" }: {
  scene: Scene;
  theme: LandingTheme;
  className?: string;
}) {
  const heroLayer = isHeroLayer(scene);
  const hasCrop = heroLayer || scene === "end";
  const tone = theme === "dark" ? "night" : "day";
  const image = sceneVariant(scene, tone);
  const night = sceneVariant(scene, "night");
  const mobile = hasCrop ? sceneVariant(scene, tone, true) : null;
  const mobileNight = theme === "system" && hasCrop ? sceneVariant(scene, "night", true) : null;

  return (
    <picture data-scene={scene} className={`sl-scene-photo ${className}`}>
      {mobileNight && (
        <source media={`${mobileScenery} and (prefers-color-scheme: dark)`} srcSet={mobileNight.srcSet} sizes={mobileNight.sizes} />
      )}
      {theme === "system" && (
        <source media="(prefers-color-scheme: dark)" srcSet={night.srcSet} sizes={night.sizes} />
      )}
      {mobile && <source media={mobileScenery} srcSet={mobile.srcSet} sizes={mobile.sizes} />}
      <img
        {...image}
        alt=""
        loading={heroLayer ? "eager" : "lazy"}
        fetchPriority={scene === "hero" ? "high" : heroLayer ? "auto" : "low"}
        decoding="async"
      />
    </picture>
  );
}

const choices = [
  { id: "water", label: "landing.showcase.water" },
  { id: "apple", label: "landing.showcase.apple" },
  { id: "play", label: "landing.showcase.play" },
] as const;

const previews = [
  { id: "lesson", icon: BookOpen },
  { id: "communication", icon: MessageSquare },
  { id: "history", icon: History },
  { id: "plan", icon: ClipboardList },
] as const;

const access = [
  { id: "permission", icon: LockKeyhole },
  { id: "camera", icon: ShieldCheck },
  { id: "export", icon: Download },
] as const;

const questions = ["audience", "adult", "cards", "specialist", "history", "therapy", "camera"] as const;


function Wordmark() {
  return (
    <Link className="sl-wordmark" href="/" aria-label={t("landing.copy036")}>
      <BrandMark size={28} />
      Söyle<span aria-hidden="true">.</span>
    </Link>
  );
}

function LandingHeader({ theme, onChange }: { theme: LandingTheme; onChange: (value: LandingTheme, origin: HTMLElement) => void }) {
  return (
    <header className="sl-header">
      <div className="sl-island">
        <Wordmark />
        <div className="sl-island-actions">
          <PublicThemeToggle theme={theme} onChange={onChange} />
          <Link className="sl-login" href="/app">{t("landing.copy044")} <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>
    </header>
  );
}

function ThemePicker({ theme, onChange }: { theme: LandingTheme; onChange: (value: LandingTheme, origin: HTMLElement) => void }) {
  return (
    <fieldset className="sl-theme-picker">
      <legend>{t("landing.theme.label")}</legend>
      <div className="sl-theme-options">
        {landingThemes.map((mode) => (
          <label key={mode}>
            <input
              className="sr-only"
              type="radio"
              name="soyle-landing-theme"
              checked={theme === mode}
              onChange={(event) => onChange(mode, event.currentTarget)}
            />
            <span>{t(`landing.theme.${mode}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function StartLink() {
  return (
    <Link className="sl-button sl-start" href="/app">
      {t("landing.showcase.start")} <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

function useCommunicationBoard(locale: Locale) {
  const [selected, setSelected] = useState<(typeof choices)[number]["id"]>("water");
  const [speaking, setSpeaking] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const playRequest = useRef(0);

  useEffect(() => {
    const player = audio.current;
    const stop = () => {
      playRequest.current++;
      player?.pause();
      setSpeaking(false);
      setAudioError(false);
    };
    window.addEventListener("soyle-locale-changing", stop);
    return () => {
      window.removeEventListener("soyle-locale-changing", stop);
      player?.pause();
    };
  }, []);

  function select(id: typeof selected) {
    playRequest.current++;
    audio.current?.pause();
    setSelected(id);
    setSpeaking(false);
    setAudioError(false);
  }

  async function speak() {
    const player = audio.current;
    if (!player) return;
    const request = ++playRequest.current;
    if (speaking) {
      player.pause();
      setSpeaking(false);
      return;
    }

    player.src = `/api/public/speech/${locale === "kk-KZ" ? "kk" : "ru"}/${selected}`;
    setAudioError(false);
    setSpeaking(true);
    try {
      await player.play();
    } catch {
      if (player === audio.current && request === playRequest.current) {
        setSpeaking(false);
        setAudioError(true);
      }
    }
  }

  const player = (
    <audio ref={audio} preload="none" onEnded={() => setSpeaking(false)} onError={() => {
        if (speaking) {
          setSpeaking(false);
          setAudioError(true);
        }
      }} />
  );
  return { selected, speaking, audioError, select, speak, player };
}

function DemoObject({ id }: { id: (typeof choices)[number]["id"] }) {
  return <Image className="sl-object" src={`/landing/soyle-object-${id}.webp`} width={72} height={72} alt="" unoptimized />;
}

function DemoHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="sl-demo-heading">
      <h3 className="sl-heading-4">{title}</h3>
      {description && <p className="sl-caption">{description}</p>}
    </div>
  );
}

function CommunicationBoard({ board }: { board: ReturnType<typeof useCommunicationBoard> }) {
  const { selected, speaking, audioError, select, speak } = board;
  return (
    <div className="sl-example-sheet sl-aac" id="communication">
      <DemoHeading title={t("landing.showcase.board")} description={t("landing.showcase.boardHint")} />
      <div className="sl-tool-grid sl-aac-grid">
        <div className="sl-work-card">
          <h4>{t("landing.demo.cardLibrary")}</h4>
          <div className="sl-object-options">
            {choices.map(({ id, label }) => (
              <button key={id} type="button" className="sl-object-choice" aria-pressed={selected === id} onClick={() => select(id)}>
                <DemoObject id={id} />
                {t(label)}
                {selected === id && <Check size={15} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
        <div className="sl-work-card sl-phrase-card">
          <h4>{t("landing.demo.composedPhrase")}</h4>
          <p className="sl-phrase"><span key={selected}>{t(`landing.aac.${selected}`)}</span></p>
          <button type="button" className="sl-speak" onClick={speak}>
            {speaking ? <X size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
            <span>{speaking ? t("landing.copy124") : t("landing.copy125")}</span>
          </button>
          <small className="sl-audio-error">{audioError && t("landing.copy126")}</small>
        </div>
      </div>
    </div>
  );
}

function WorkspaceWindow({ children, sidebar, className = "", cover = false, caption }: {
  children: ReactNode;
  sidebar?: ReactNode;
  caption?: string;
  className?: string;
  cover?: boolean;
}) {
  return (
    <div className={`sl-window sl-glass ${className}`}>
      {!cover && <div className="sl-window-bar">
        <div className="sl-window-brand">
          <BrandMark size={21} />
          Söyle
        </div>
        <span className="sl-window-caption">{caption ?? t("landing.copy116")}</span>
      </div>}
      <div className="sl-window-layout">
        {sidebar && <div className="sl-window-sidebar">{sidebar}</div>}
        {children}
      </div>
    </div>
  );
}

const exercise = [
  { answer: "apple", prompt: "landing.showcase.lessonPrompt" },
  { answer: "water", prompt: "landing.desktop.waterPrompt" },
  { answer: "play", prompt: "landing.desktop.ballPrompt" },
] as const;

function LessonPreview({ locale, active }: { locale: Locale; active: boolean }) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<(typeof choices)[number]["id"] | null>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const question = exercise[step];
  const source = `/audio/landing/lesson-${locale === "kk-KZ" ? "kk" : "ru"}-${question.answer}.mp3`;
  const correct = answer === question.answer;
  const complete = correct && step === exercise.length - 1;

  useEffect(() => {
    const player = audio.current;
    if (!active) player?.pause();
    return () => player?.pause();
  }, [active, source]);

  function playQuestion() {
    const player = audio.current;
    if (!player) return;
    setFailedSource(null);
    player.currentTime = 0;
    void player.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) setFailedSource(source);
    });
  }

  return (
    <div className="sl-example-sheet sl-exercise-sheet">
      <audio ref={audio} src={source} preload="none" />
      <div>
        <div className="sl-lesson-heading">
          <h3 className="sl-heading-4">{t("landing.showcase.lessonLabel")}</h3>
          <span className="sl-caption">{step + 1} / {exercise.length}</span>
        </div>
        <div className="sl-exercise-progress" aria-hidden="true">
          {exercise.map(({ answer }, index) => <i key={answer} data-current={index <= step} />)}
        </div>
      </div>
      <div className="sl-question">
        <div>
          <div className="sl-question-prompt">
            <h4>{t(question.prompt)}</h4>
            <button className="sl-speak" type="button" onClick={playQuestion}>
              <Volume2 size={16} aria-hidden="true" />
              {t("landing.demo.listenQuestion")}
            </button>
          </div>
          {failedSource === source && <p className="sl-lesson-audio-error" role="status">{t("landing.copy126")}</p>}
        </div>
        <div className="sl-object-options">
          {choices.map(({ id, label }) => (
            <button key={id} type="button" className="sl-object-choice" aria-pressed={answer === id} onClick={() => setAnswer(id)}>
              <DemoObject id={id} />
              {t(id === "play" ? "landing.desktop.ball" : label)}
              {answer === id && (correct ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />)}
            </button>
          ))}
        </div>
      </div>
      <div className="sl-lesson-footer">
        <p className="sl-lesson-feedback" aria-live="polite">
          {t(complete ? "landing.desktop.complete" : correct ? "landing.desktop.correct" : answer ? "landing.desktop.retry" : "landing.desktop.chooseAnswer")}
        </p>
        <button type="button" className="sl-lesson-next" disabled={!correct} onClick={() => {
          setStep(complete ? 0 : step + 1);
          setAnswer(null);
        }}>
          {t(complete ? "landing.desktop.restart" : "landing.desktop.nextQuestion")} <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

const observations = [
  { day: 24, title: "landing.desktop.drink", note: "landing.showcase.note" },
  { day: 22, title: "landing.desktop.listening", note: "landing.desktop.listeningNote" },
  { day: 19, title: "landing.desktop.playtime", note: "landing.desktop.playtimeNote" },
] as const;

function SelectedCopy({ items, selected }: {
  items: ReadonlyArray<{ note: Parameters<typeof t>[0] }>;
  selected: number;
}) {
  return (
    <div className="sl-selected-copy" aria-live="polite">
      {items.map(({ note }, index) => <p key={note} hidden={selected !== index}>{t(note)}</p>)}
    </div>
  );
}

function ObservationContent({ locale }: { locale: Locale }) {
  const [selected, setSelected] = useState(0);
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  const current = observations[selected];

  return (
    <>
      <div className="sl-work-card">
        <h4>{t("landing.demo.recent")}</h4>
        <ul className="sl-records">
          {observations.map(({ day, title }, index) => (
            <li key={day}>
              <button type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}>
                <span>{t(title)}</span>
                <time className="sl-record-date" dateTime={`2026-10-${day}`}>{date.format(Date.UTC(2026, 9, day))}</time>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="sl-work-card sl-observation-note">
        <span className="sl-demo-label"><MessageSquare size={16} aria-hidden="true" />{t("landing.showcase.noteLabel")}</span>
        <div className="sl-observation-title">
          {observations.map(({ title }, index) => <h4 key={title} hidden={selected !== index}>{t(title)}</h4>)}
        </div>
        <SelectedCopy items={observations} selected={selected} />
        <time className="sl-record-date" dateTime={`2026-10-${current.day}`}>{date.format(Date.UTC(2026, 9, current.day))}</time>
      </div>
    </>
  );
}

function HistoryPreview({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return (
    <div className="sl-example-sheet sl-history-sheet">
      {compact
        ? <p className="sl-sheet-meta"><span><History size={16} aria-hidden="true" />{t("landing.desktop.observations")}</span><span>{t("landing.copy116")}</span></p>
        : <DemoHeading title={t("landing.desktop.observations")} description={t("landing.demo.historyIntro")} />}
      <div className="sl-tool-grid sl-record-grid"><ObservationContent locale={locale} /></div>
    </div>
  );
}

const tasks = [
  { title: "landing.showcase.planTask", day: "landing.desktop.monday", note: "landing.showcase.planTip", icon: MessageSquare },
  { title: "landing.desktop.listenTask", day: "landing.desktop.wednesday", note: "landing.desktop.listenTip", icon: BookOpen },
  { title: "landing.desktop.phraseTask", day: "landing.desktop.friday", note: "landing.desktop.phraseTip", icon: ClipboardList },
] as const;

function TaskContent({ daily = false }: { daily?: boolean }) {
  const [selected, setSelected] = useState(0);

  return (
    <>
      <div className="sl-work-card">
        <h4>{t(daily ? "landing.demo.todayPlan" : "landing.demo.planList")}</h4>
        <ul className="sl-records sl-task-list">
          {tasks.map(({ title, day, icon: Icon }, index) => (
            <li key={title}>
              <button type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}>
                <Icon size={16} aria-hidden="true" />
                <span>{t(title)}</span>
                {!daily && <span className="sl-record-date">{t(day)}</span>}
                <ChevronDown size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="sl-work-card sl-task-note">
        <span className="sl-demo-label"><BookOpen size={16} aria-hidden="true" />{t("landing.demo.taskDetail")}</span>
        <div className="sl-observation-title">
          {tasks.map(({ title }, index) => <h4 key={title} hidden={selected !== index}>{t(title)}</h4>)}
        </div>
        <SelectedCopy items={tasks} selected={selected} />
      </div>
    </>
  );
}

function PlanPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="sl-example-sheet sl-plan-sheet">
      {compact
        ? <p className="sl-sheet-meta"><span><ClipboardList size={16} aria-hidden="true" />{t("landing.showcase.plan")}</span><span>{t("landing.copy116")}</span></p>
        : <DemoHeading title={t("landing.desktop.weekPlan")} description={t("landing.demo.planIntro")} />}
      <div className="sl-tool-grid sl-record-grid"><TaskContent /></div>
    </div>
  );
}

function PlatformCover({ onOpenLesson }: { onOpenLesson: () => void }) {
  return (
    <div className="sl-platform-cover">
      <div className="sl-platform-art" aria-hidden="true" />
      <div className="sl-platform-copy">
        <span className="sl-platform-mark"><BrandMark size={32} />Söyle</span>
        <h2>{t("landing.cover.title")}</h2>
        <p>{t("landing.cover.description")}</p>
        <a className="sl-lesson-next" href="#journey" onClick={onOpenLesson}>
          {t("landing.cover.action")}<ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

const introduction = ["opening", "roles", "daily"] as const;

function FaqItem({ id }: { id: (typeof questions)[number] }) {
  const answer = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  useEffect(() => () => animation.current?.cancel(), []);

  return (
    <details>
      <summary onClick={(event) => {
        const details = event.currentTarget.closest("details");
        const panel = answer.current;
        const nativeMotion = CSS.supports("interpolate-size: allow-keywords") && CSS.supports("selector(details::details-content)");
        if (!details || !panel?.animate || nativeMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        event.preventDefault();
        const open = !details.open || details.hasAttribute("data-closing");
        const height = details.open ? panel.getBoundingClientRect().height : 0;
        animation.current?.cancel();
        details.open = true;
        details.toggleAttribute("data-closing", !open);
        animation.current = panel.animate([
          { height: `${height}px` },
          { height: `${open ? panel.scrollHeight : 0}px` },
        ], { duration: 260, easing: "cubic-bezier(.22, 1, .36, 1)" });
        animation.current.onfinish = () => {
          details.open = open;
          details.removeAttribute("data-closing");
          animation.current = null;
        };
      }}>
        {t(`landing.showcase.faq.${id}.question`)}<ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div className="sl-faq-answer" ref={answer}><p className="sl-body">{t(`landing.showcase.faq.${id}.answer`)}</p></div>
    </details>
  );
}

function ProductIntro() {
  const locale = useLocale();
  const copy = useRef<HTMLDivElement>(null);
  const paragraphs = introduction.map((id) => t(`landing.story.${id}`).match(/\S+(?: +\S+){0,2}/g) ?? []);
  const phraseCount = paragraphs.reduce((total, phrases) => total + phrases.length, 0);

  useEffect(() => {
    const element = copy.current;
    if (!element) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = -1;

    const update = () => {
      frame = 0;
      if (motion.matches) {
        element.removeAttribute("data-progressive");
        element.style.removeProperty("--sl-intro-progress");
        previous = -1;
        return;
      }

      const bounds = element.getBoundingClientRect();
      const start = window.innerHeight * 0.82;
      const distance = bounds.height + window.innerHeight * 0.14;
      const progress = Math.max(0, Math.min(1, (start - bounds.top) / distance));
      if (progress === previous) return;
      previous = progress;
      element.style.setProperty("--sl-intro-progress", progress.toFixed(4));
      element.setAttribute("data-progressive", "");
    };

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, [locale]);

  let index = 0;
  return (
    <section className="sl-intro" aria-labelledby="sl-intro-title">
      <h2 className="sr-only" id="sl-intro-title">{t("landing.story.heading")}</h2>
      <div className="sl-intro-copy" ref={copy}>
        {paragraphs.map((phrases, paragraph) => (
          <p key={introduction[paragraph]}>
            {phrases.map((phrase, position) => {
              const delay = index++ * 250 / Math.max(1, phraseCount - 1);
              return (
                <span key={position} style={{ "--sl-phrase-delay": `${delay}%` } as CSSProperties}>
                  {phrase}{position < phrases.length - 1 ? " " : ""}
                </span>
              );
            })}
          </p>
        ))}
      </div>
    </section>
  );
}

const practiceSteps = ["profile", "choose", "together", "review"] as const;

const practiceDirections = [
  { title: "screen.skillLabel.ui3", icon: BookOpen },
  { title: "screen.skillLabel.ui6", icon: MessageSquare },
  { title: "screen.skillLabel.ui5", icon: ClipboardList },
] as const;

function PracticeStart({ locale, onOpenLesson }: { locale: Locale; onOpenLesson: () => void }) {
  const [selected, setSelected] = useState<(typeof practiceSteps)[number]>("profile");
  const session = observations[1];
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  const question = exercise[0];

  return (
    <section className="sl-practice sl-container" aria-labelledby="sl-practice-title" data-reveal>
      <h2 className="sl-heading-2" id="sl-practice-title">{t("landing.practice.heading")}</h2>
      <div className="sl-practice-layout">
        <ol className="sl-practice-steps" role="list">
          {practiceSteps.map((id, index) => (
            <li key={id} data-active={selected === id}>
              <button type="button" aria-pressed={selected === id} aria-controls="sl-practice-panels" onClick={() => setSelected(id)}>
                <span className="sl-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <strong>{t(`landing.practice.${id}.title`)}</strong>
              </button>
              {selected === id && <p className="sl-step-description">{t(`landing.practice.${id}.description`)}</p>}
            </li>
          ))}
        </ol>
        <div className="sl-practice-mobile-summary">
          {practiceSteps.map((id) => <p key={id} hidden={selected !== id}>{t(`landing.practice.${id}.description`)}</p>)}
        </div>
        <WorkspaceWindow className="sl-practice-sample" caption={t("landing.practice.demoData")}>
          <div className="sl-practice-fragments" id="sl-practice-panels">
            {practiceSteps.map((id) => {
              const inactive = selected !== id;
              return (
                <div key={id} className="sl-practice-fragment" data-stage={id} hidden={inactive} inert={inactive} aria-hidden={inactive || undefined}>
                  <h3>{t(`landing.practice.${id}.sample`)}</h3>
                  {id === "profile" && (
                    <div className="sl-practice-profile" data-practice-action="appear">
                      <span className="sl-practice-avatar" aria-hidden="true"><UserRound size={26} /></span>
                      <div>
                        <strong>{t("landing.demo.profileName")}</strong>
                        <p className="sl-practice-status"><Check size={15} aria-hidden="true" />{t("landing.practice.profileCreated")}</p>
                      </div>
                    </div>
                  )}
                  {id === "choose" && (
                    <>
                      <ul className="sl-practice-directions" aria-label={t("screen.ChildOnboarding.ui9")}>
                        {practiceDirections.map(({ title, icon: Icon }, index) => (
                          <li key={title} aria-current={index === 0 || undefined} data-practice-action={index === 0 ? "select" : undefined}>
                            <Icon size={17} aria-hidden="true" />
                            <span>{t(title)}</span>
                            {index === 0 && <Check size={16} aria-hidden="true" />}
                          </li>
                        ))}
                      </ul>
                      <div className="sl-practice-next">
                        <span className="sl-caption">{t("landing.demo.nextActivity")}</span>
                        <strong>{t("landing.desktop.listening")}</strong>
                      </div>
                    </>
                  )}
                  {id === "together" && (
                    <>
                      <h4 className="sl-practice-question">{t(question.prompt)}</h4>
                      <ul className="sl-object-options sl-practice-answers" aria-label={t("landing.desktop.chooseAnswer")}>
                        {choices.map(({ id: choice, label }) => (
                          <li key={choice} className="sl-object-choice" aria-current={choice === question.answer || undefined}
                            data-practice-action={choice === question.answer ? "select" : undefined}>
                            <DemoObject id={choice} />
                            {t(choice === "play" ? "landing.desktop.ball" : label)}
                            {choice === question.answer && <Check size={15} aria-hidden="true" />}
                          </li>
                        ))}
                      </ul>
                      <div className="sl-lesson-footer">
                        <p className="sl-lesson-feedback" data-practice-action="appear">{t("landing.desktop.correct")}</p>
                        <a className="sl-lesson-next" href="#journey" onClick={onOpenLesson}>
                          {t("landing.demo.openLesson")} <ArrowRight size={16} aria-hidden="true" />
                        </a>
                      </div>
                    </>
                  )}
                  {id === "review" && (
                    <>
                      <div className="sl-practice-session" data-practice-action="appear">
                        <span className="sl-practice-status"><Check size={15} aria-hidden="true" />{t("landing.practice.lessonDone")}</span>
                        <time className="sl-record-date" dateTime={`2026-10-${session.day}`}>{date.format(Date.UTC(2026, 9, session.day))}</time>
                        <strong>{t(session.title)}</strong>
                      </div>
                      <div className="sl-practice-observation">
                        <h4><MessageSquare size={16} aria-hidden="true" />{t("landing.showcase.noteLabel")}</h4>
                        <p>{t(session.note)}</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </WorkspaceWindow>
      </div>
    </section>
  );
}

export function LandingPage({ initialTheme }: { initialTheme: LandingTheme }) {
  const locale = useLocale();
  const board = useCommunicationBoard(locale);
  const [preview, setPreview] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const prepareTheme = useCallback((scheme: "light" | "dark") => {
    const mobile = window.matchMedia(mobileScenery).matches;
    const tone = scheme === "dark" ? "night" : "day";
    const visibleScenes = Array.from(root.current?.querySelectorAll<HTMLPictureElement>("[data-scene]") ?? [])
      .filter((picture) => {
        const rect = picture.getBoundingClientRect();
        return rect.bottom > -120 && rect.top < window.innerHeight + 120;
      });
    return Promise.all(visibleScenes.map((picture) => {
      const scene = picture.dataset.scene as Scene;
      const { src, srcSet, sizes } = sceneVariant(scene, tone, mobile && (isHeroLayer(scene) || scene === "end"));
      return preloadThemeImage(src, srcSet, sizes);
    }));
  }, []);
  const { theme, changeTheme } = usePublicTheme(initialTheme, prepareTheme);

  useEffect(() => {
    const page = root.current;
    if (!page || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      void prepareTheme(dark ? "light" : "dark");
    }, { rootMargin: "120px 0px" });
    page.querySelectorAll("[data-scene]").forEach((picture) => observer.observe(picture));
    return () => observer.disconnect();
  }, [prepareTheme, theme]);

  useEffect(() => {
    const hero = root.current?.querySelector<HTMLElement>(".sl-hero");
    if (!hero) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let depth = -1;
    let intro = true;
    const timer = setTimeout(() => { intro = false; }, 1450);
    const draw = () => {
      frame = 0;
      if (intro && window.scrollY > 12) {
        intro = false;
        hero.setAttribute("data-entry-skipped", "");
      }
      const next = motion.matches ? 0 : Math.max(0, Math.min(window.scrollY / 760, 1));
      if (next !== depth) {
        hero.style.setProperty("--sl-depth", String(next));
        depth = next;
      }
    };
    const update = () => { if (!frame) frame = requestAnimationFrame(draw); };
    draw();
    window.addEventListener("scroll", update, { passive: true });
    motion.addEventListener("change", update);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const page = root.current;
    if (!page || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        target.classList.add("sl-visible");
        observer.unobserve(target);
      });
    }, { threshold: 0.12 });

    page.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cover = root.current?.querySelector(".sl-platform-cover");
    if (!cover || !("IntersectionObserver" in window)) return;
    let inView = false;
    const update = () => cover.toggleAttribute("data-light-playing", inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(cover);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const last = previews.length - 1;
    const next = {
      ArrowLeft: preview === 0 ? last : preview - 1,
      ArrowRight: preview === last ? 0 : preview + 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setPreview(next);
    root.current?.querySelector<HTMLButtonElement>(`#sl-tab-${previews[next].id}`)?.focus();
  }

  const current = previews[preview];
  const links = [
    { href: "#journey", label: t("landing.showcase.navJourney") },
    { href: "#family", label: t("landing.showcase.navFamily") },
    { href: "#questions", label: t("landing.copy042") },
  ];

  return (
    <div className="sl-page" data-landing-theme={theme} ref={root}>
      {board.player}
      <div className="sr-only" role="status">
        {t(board.audioError ? "landing.copy126" : `landing.aac.${board.selected}`)}
      </div>
      <a className="sl-skip" href="#main-content">{t("landing.copy035")}</a>
      <LandingHeader theme={theme} onChange={changeTheme} />

      <main id="main-content" tabIndex={-1}>
        <section className="sl-hero" id="about">
          <div className="sl-hero-scene">
            <ScenePhoto scene="hero" theme={theme} className="sl-hero-photo" />
          </div>
          <div className="sl-container sl-hero-content">
            <div className="sl-hero-copy">
              <p className="sl-kicker">{t("landing.showcase.audience")}</p>
              <h1 className="sl-heading-1"><span>{t("landing.showcase.titleFirst")}</span>{" "}<span>{t("landing.showcase.titleSecond")}</span></h1>
              <p className="sl-body sl-hero-description">{t("landing.showcase.description")}</p>
              <div className="sl-hero-actions">
                <StartLink />
                <a className="sl-text-link" href="#journey">{t("landing.demo.openPreview")} <ArrowDown size={15} aria-hidden="true" /></a>
              </div>
            </div>

            <WorkspaceWindow
              className="sl-hero-window"
              cover
              sidebar={(
                <div className="sl-window-links" aria-hidden="true">
                  <p className="sl-sidebar-label">{t("landing.desktop.tab.history")}</p>
                  <span className="sl-window-current"><LayoutGrid size={17} /><span className="sl-rail-label">{t("landing.demo.overview")}</span></span>
                  <span><ClipboardList size={17} /><span className="sl-rail-label">{t("landing.showcase.plan")}</span></span>
                  <span><History size={17} /><span className="sl-rail-label">{t("landing.cover.history")}</span></span>
                  <span><MessageSquare size={17} /><span className="sl-rail-label">{t("nav.observations")}</span></span>
                </div>
              )}
            >
              <PlatformCover onOpenLesson={() => setPreview(0)} />
            </WorkspaceWindow>
          </div>
          <ScenePhoto scene="foreground" theme={theme} className="sl-hero-foreground" />
        </section>

        <ProductIntro />

        <section className="sl-journey sl-container" id="journey" aria-labelledby="sl-journey-title">
          <div className="sl-section-lead">
            <h2 className="sl-heading-2" id="sl-journey-title">{t("landing.showcase.journeyTitle")}</h2>
            <p className="sl-body">{t("landing.showcase.journeyIntro")}</p>
          </div>
          <div className="sl-preview" data-reveal>
            <div className="sl-tabs" role="tablist" aria-label={t("landing.desktop.sections")}>
              {previews.map(({ id, icon: Icon }, index) => (
                <button
                  key={id} id={`sl-tab-${id}`} type="button" role="tab"
                  aria-selected={preview === index} aria-controls={`sl-panel-${id}`}
                  tabIndex={preview === index ? 0 : -1}
                  onClick={() => setPreview(index)} onKeyDown={onTabKey}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span className="sl-desktop-copy">{t(`landing.desktop.tab.${id}`)}</span>
                  <span className="sl-mobile-copy">{t(`landing.mobile.tab.${id}`)}</span>
                </button>
              ))}
            </div>
            <div className="sl-desktop-scene">
              <ScenePhoto scene="desktop" theme={theme} />
              <WorkspaceWindow
                className="sl-desktop-window"
                sidebar={(
                  <div className="sl-window-links" role="group" aria-label={t("landing.desktop.sections")}>
                    {previews.map(({ id, icon: Icon }, index) => (
                      <button key={id} type="button" aria-pressed={preview === index} aria-label={t(`landing.desktop.tab.${id}`)} onClick={() => setPreview(index)}>
                        <Icon size={17} aria-hidden="true" /><span className="sl-rail-label">{t(`landing.mobile.tab.${id}`)}</span>
                      </button>
                    ))}
                  </div>
                )}
              >
                <div className="sl-desktop-body">
                  {previews.map(({ id }, index) => (
                    <div
                      className="sl-preview-panel"
                      key={id} id={`sl-panel-${id}`} role="tabpanel" aria-labelledby={`sl-tab-${id}`}
                      tabIndex={preview === index ? 0 : -1}
                      hidden={current.id !== id} inert={current.id !== id} aria-hidden={current.id !== id || undefined}
                    >
                      {id === "lesson" && <LessonPreview locale={locale} active={current.id === id} />}
                      {id === "communication" && <CommunicationBoard board={board} />}
                      {id === "history" && <HistoryPreview locale={locale} />}
                      {id === "plan" && <PlanPreview />}
                    </div>
                  ))}
                </div>
              </WorkspaceWindow>
            </div>
            <p className="sl-caption sl-preview-caption" aria-live="polite">{t(`landing.desktop.caption.${current.id}`)}</p>
          </div>
        </section>

        <PracticeStart locale={locale} onOpenLesson={() => setPreview(0)} />

        <section className="sl-family sl-container" id="family" aria-labelledby="sl-family-title">
          <div className="sl-section-lead">
            <h2 className="sl-heading-2" id="sl-family-title">{t("landing.showcase.familyTitle")}</h2>
            <p className="sl-body">{t("landing.showcase.familyIntro")}</p>
          </div>
          <div className="sl-family-grid">
            <article className="sl-family-card" data-reveal>
              <div className="sl-family-copy">
                <p className="sl-kicker">{t("landing.showcase.parent")}</p>
                <h3 className="sl-heading-5">{t("landing.showcase.parentTitle")}</h3>
                <p className="sl-body">{t("landing.showcase.parentDescription")}</p>
              </div>
              <div className="sl-family-visual">
                <ScenePhoto scene="history" theme={theme} />
                <div className="sl-family-panel sl-glass"><HistoryPreview locale={locale} compact /></div>
              </div>
            </article>
            <article className="sl-family-card sl-family-card-reverse" data-reveal>
              <div className="sl-family-copy">
                <p className="sl-kicker">{t("landing.showcase.specialist")}</p>
                <h3 className="sl-heading-5">{t("landing.showcase.specialistTitle")}</h3>
                <p className="sl-body">{t("landing.showcase.specialistDescription")}</p>
              </div>
              <div className="sl-family-visual sl-family-visual-plan">
                <ScenePhoto scene="plan" theme={theme} />
                <div className="sl-family-panel sl-glass"><PlanPreview compact /></div>
              </div>
            </article>
          </div>
        </section>

        <section className="sl-access sl-container" id="access" aria-labelledby="sl-access-title">
          <div className="sl-access-title">
            <h2 className="sl-heading-3" id="sl-access-title">{t("landing.showcase.accessTitle")}</h2>
            <p className="sl-body">{t("landing.showcase.accessIntro")}</p>
            <Link className="sl-text-link" href="/privacy">{t("landing.copy143")} <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <ul className="sl-access-list">
            {access.map(({ id, icon: Icon }) => (
              <li key={id}>
                <Icon size={19} aria-hidden="true" />
                <div>
                  <strong>{t(`landing.showcase.${id}Title`)}</strong>
                  <p>{t(`landing.showcase.${id}Description`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="sl-faq sl-container" id="questions" aria-labelledby="sl-faq-title">
          <div>
            <h2 className="sl-heading-2" id="sl-faq-title">{t("landing.showcase.faqTitle")}</h2>
            <p className="sl-body">{t("landing.showcase.faqIntro")}</p>
          </div>
          <div className="sl-faq-list">
            {questions.map((id) => <FaqItem key={id} id={id} />)}
          </div>
        </section>

      </main>

      <footer className="sl-closing">
        <ScenePhoto scene="end" theme={theme} className="sl-end-photo" />
        <section className="sl-end" aria-labelledby="sl-end-title">
          <div className="sl-container sl-end-layout">
            <div className="sl-end-copy">
              <h2 className="sl-heading-2" id="sl-end-title">{t("landing.showcase.endTitle")}</h2>
              <p className="sl-body">{t("landing.showcase.endDescription")}</p>
              <StartLink />
            </div>
          </div>
        </section>

        <div className="sl-footer">
          <div className="sl-container">
            <div className="sl-footer-main">
              <div className="sl-footer-brand">
                <Wordmark />
                <p className="sl-caption">{t("landing.showcase.footer")}</p>
              </div>
              <div>
                <strong>{t("landing.copy038")}</strong>
                {links.map(({ href, label }) => <a key={href} href={href}>{label}</a>)}
              </div>
              <div>
                <strong>{t("landing.copy142")}</strong>
                <Link href="/privacy">{t("landing.copy143")}</Link>
                <Link href="/terms">{t("landing.copy144")}</Link>
                <a href="mailto:hello@soyle.app">hello@soyle.app</a>
              </div>
            </div>
            <div className="sl-footer-bottom">
              <span>© {new Date().getFullYear()} Söyle</span>
              <div className="sl-footer-settings">
                <fieldset className="sl-footer-language">
                  <legend>{t("landing.theme.language")}</legend>
                  <LanguagePicker />
                </fieldset>
                <ThemePicker theme={theme} onChange={changeTheme} />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
