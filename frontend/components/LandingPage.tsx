"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowDown, ArrowRight, BookOpen, CalendarDays, Check, ChevronDown, Clock3,
  ClipboardList, Download, History, LayoutGrid, LockKeyhole, Menu, MessageSquare, ShieldCheck, UserRound,
  Volume2, X,
} from "lucide-react";
import { t, useLocale, type Locale } from "@/lib/i18n";
import { landingThemeCookie, landingThemes, type LandingTheme } from "@/lib/landingTheme";
import { LanguagePicker } from "./LanguagePicker";
import "@/app/landing.css";

const scenery = {
  hero: "soyle-sculpted-hero",
  desktop: "soyle-sculpted-desktop",
  history: "soyle-heather-closeup",
  plan: "soyle-sculpted-plan",
  end: "soyle-closing-valley",
} as const;

function ScenePhoto({ scene, className = "" }: { scene: keyof typeof scenery; className?: string }) {
  const file = scenery[scene];
  return (
    <div
      className={`sl-scene-photo ${className}`}
      aria-hidden="true"
      style={{
        "--sl-scene-day": `url("/landing/${file}.webp")`,
        "--sl-scene-night": `url("/landing/${file}-night.webp")`,
      } as CSSProperties}
    />
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

function BrandMark({ size }: { size: number }) {
  return (
    <svg className="sl-brand-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path fill="var(--sl-mark)" d="M32 5C17.64 5 6 15.52 6 28.5c0 6.82 3.22 12.97 8.38 17.27L10.9 56.2a2 2 0 0 0 2.53 2.5l12.24-6.78c2.05.39 4.17.58 6.33.58 14.36 0 26-10.52 26-24S46.36 5 32 5Z" />
      <path fill="none" stroke="var(--sl-mark-letter)" strokeLinecap="round" strokeWidth="6" d="M41.25 19.7c-2.3-2.12-5.4-3.2-9.02-3.2-5.52 0-9.23 2.65-9.23 6.52 0 3.6 2.94 5.31 9.34 6.7 6.01 1.31 8.66 3.16 8.66 6.72 0 4.12-3.98 7.06-9.85 7.06-4.14 0-7.52-1.27-9.9-3.74" />
      <circle cx="46.5" cy="13.5" r="4.5" fill="var(--sl-mark-dot)" />
    </svg>
  );
}

function Wordmark() {
  return (
    <Link className="sl-wordmark" href="/" aria-label={t("landing.copy036")}>
      <BrandMark size={28} />
      Söyle<span aria-hidden="true">.</span>
    </Link>
  );
}

function LandingHeader({ links }: { links: ReadonlyArray<{ href: string; label: string }> }) {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  return (
    <header
      className="sl-header"
      ref={header}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <div className="sl-island">
        <Wordmark />
        <nav className="sl-nav" aria-label={t("landing.copy037")}>
          {links.map(({ href, label }) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <Link className="sl-login" href="/app">{t("landing.copy044")} <ArrowRight size={14} aria-hidden="true" /></Link>
        <button
          className="sl-menu-toggle"
          type="button"
          ref={menuButton}
          aria-expanded={open}
          aria-controls="sl-mobile-navigation"
          aria-label={t(open ? "landing.nav.close" : "landing.nav.open")}
          onClick={() => setOpen(!open)}
        >
          <Menu size={20} className="sl-menu-open-icon" aria-hidden="true" />
          <X size={20} className="sl-menu-close-icon" aria-hidden="true" />
        </button>
      </div>
      <div id="sl-mobile-navigation" className="sl-mobile-menu" hidden={!open}>
        <nav aria-label={t("landing.copy037")}>
          {links.map(({ href, label }) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        </nav>
        <LanguagePicker compact />
      </div>
    </header>
  );
}

function ThemePicker({ theme, onChange }: { theme: LandingTheme; onChange: (value: LandingTheme) => void }) {
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
              onChange={() => onChange(mode)}
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

function WorkspaceWindow({ children, sidebar, className = "" }: {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
}) {
  return (
    <div className={`sl-window sl-glass ${className}`}>
      <div className="sl-window-bar">
        <div className="sl-window-brand">
          <BrandMark size={21} />
          Söyle
        </div>
        <span className="sl-window-caption">{t("landing.copy116")}</span>
      </div>
      <div className="sl-window-layout">
        <div className="sl-window-sidebar">{sidebar}</div>
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
      <div className="sl-lesson-heading">
        <h3 className="sl-heading-4">{t("landing.showcase.lessonLabel")}</h3>
        <span className="sl-caption">{step + 1} / {exercise.length}</span>
      </div>
      <div className="sl-exercise-progress" aria-hidden="true">
        {exercise.map(({ answer }, index) => <i key={answer} data-current={index <= step} />)}
      </div>
      <div className="sl-question">
        <div className="sl-question-prompt">
          <h4>{t(question.prompt)}</h4>
          <button className="sl-speak" type="button" onClick={playQuestion}>
            <Volume2 size={16} aria-hidden="true" />
            {t("landing.demo.listenQuestion")}
          </button>
        </div>
        {failedSource === source && <p className="sl-lesson-audio-error" role="status">{t("landing.copy126")}</p>}
        <div className="sl-object-options">
          {choices.map(({ id, label }) => (
            <button key={id} type="button" className="sl-object-choice" aria-pressed={answer === id} onClick={() => setAnswer(id)}>
              <DemoObject id={id} />
              {t(id === "play" ? "landing.desktop.ball" : label)}
              {answer === id && (correct ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />)}
            </button>
          ))}
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

function DemoProfile() {
  return (
    <div className="sl-profile">
      <span className="sl-profile-avatar" aria-hidden="true">А</span>
      <div><strong>{t("landing.demo.profileName")}</strong><span>{t("landing.demo.sampleProfile")}</span></div>
    </div>
  );
}

function ParentDashboard({ locale, onOpenLesson }: { locale: Locale; onOpenLesson: () => void }) {
  return (
    <div className="sl-parent-dashboard">
      <header className="sl-dashboard-heading">
        <div className="sl-demo-heading">
          <h2 className="sl-heading-4">
            <span className="sl-desktop-copy">{t("landing.demo.dashboard")}</span>
            <span className="sl-mobile-copy">{t("landing.demo.todayPractice")}</span>
          </h2>
        </div>
        <DemoProfile />
      </header>
      <div className="sl-dashboard-next">
        <span className="sl-next-icon"><CalendarDays size={19} aria-hidden="true" /></span>
        <div>
          <p className="sl-demo-label">{t("landing.demo.nextActivity")}</p>
          <strong>{t("landing.desktop.listening")}</strong>
          <span className="sl-next-duration"><Clock3 size={14} aria-hidden="true" />{t("landing.demo.practiceTime")}</span>
        </div>
        <a className="sl-lesson-next" href="#journey" onClick={onOpenLesson}>
          {t("landing.demo.openLesson")}<ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
      <div className="sl-dashboard-grid">
        <div className="sl-dashboard-column"><TaskContent daily /></div>
        <div className="sl-dashboard-column"><ObservationContent locale={locale} /></div>
      </div>
      <div className="sl-dashboard-observation">
        <span className="sl-demo-label"><MessageSquare size={16} aria-hidden="true" />{t("landing.showcase.noteLabel")}</span>
        <p>{t("landing.showcase.note")}</p>
      </div>
    </div>
  );
}

const introduction = ["opening", "roles", "daily"] as const;

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
    <section className="sl-intro sl-container" aria-labelledby="sl-intro-title">
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

const practiceSteps = [
  { id: "profile", icon: UserRound },
  { id: "choose", icon: ClipboardList },
  { id: "together", icon: BookOpen },
  { id: "review", icon: History },
] as const;

function PracticeStart() {
  const [selected, setSelected] = useState(0);

  return (
    <section className="sl-practice sl-container" aria-labelledby="sl-practice-title">
      <h2 className="sl-heading-2" id="sl-practice-title">{t("landing.practice.heading")}</h2>
      <div className="sl-practice-layout">
        <ol className="sl-practice-steps">
          {practiceSteps.map(({ id }, index) => (
            <li key={id}>
              <button type="button" aria-pressed={selected === index} aria-controls="sl-practice-sample" onClick={() => setSelected(index)}>
                <span className="sl-step-number" aria-hidden="true">{index + 1}</span>
                <span><strong>{t(`landing.practice.${id}.title`)}</strong><span>{t(`landing.practice.${id}.description`)}</span></span>
              </button>
            </li>
          ))}
        </ol>
        <div className="sl-practice-sample">
          <div className="sl-practice-toolbar">
            <span><BrandMark size={19} /> Söyle</span>
            <span>{t("landing.copy116")}</span>
          </div>
          <div className="sl-practice-fragments" id="sl-practice-sample" aria-live="polite">
            {practiceSteps.map(({ id, icon: Icon }, index) => (
              <div key={id} className="sl-practice-fragment" hidden={selected !== index}>
                <h3><Icon size={19} aria-hidden="true" />{t(`landing.practice.${id}.sample`)}</h3>
                {id === "profile" && <DemoProfile />}
                {id === "choose" && (
                  <ul className="sl-practice-plan">
                    {tasks.slice(0, 2).map(({ title, icon: TaskIcon }) => <li key={title}><TaskIcon size={16} aria-hidden="true" />{t(title)}</li>)}
                  </ul>
                )}
                {id === "together" && (
                  <div className="sl-practice-together">
                    <strong>{t("landing.desktop.listening")}</strong>
                    <span><Clock3 size={16} aria-hidden="true" />{t("landing.demo.practiceTime")}</span>
                  </div>
                )}
                {id === "review" && <p className="sl-practice-note">{t("landing.showcase.note")}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage({ initialTheme }: { initialTheme: LandingTheme }) {
  const [theme, setTheme] = useState(initialTheme);

  function changeTheme(next: LandingTheme) {
    setTheme(next);
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${landingThemeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  }

  const locale = useLocale();
  const board = useCommunicationBoard(locale);
  const [preview, setPreview] = useState(0);
  const root = useRef<HTMLDivElement>(null);

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
      <LandingHeader links={links} />

      <main id="main-content" tabIndex={-1}>
        <section className="sl-hero" id="about">
          <div className="sl-hero-scene">
            <ScenePhoto scene="hero" className="sl-hero-photo" />
          </div>
          <div className="sl-container sl-hero-content">
            <div className="sl-hero-copy">
              <p className="sl-kicker">{t("landing.showcase.audience")}</p>
              <h1 className="sl-heading-1">{t("landing.showcase.titleFirst")}<br />{t("landing.showcase.titleSecond")}</h1>
              <p className="sl-body sl-hero-description">{t("landing.showcase.description")}</p>
              <div className="sl-hero-actions">
                <StartLink />
                <a className="sl-text-link" href="#journey">{t("landing.demo.openPreview")} <ArrowDown size={15} aria-hidden="true" /></a>
              </div>
            </div>

            <WorkspaceWindow
              className="sl-hero-window"
              sidebar={(
                <div className="sl-window-links" aria-hidden="true">
                  <p className="sl-sidebar-label">{t("landing.desktop.tab.history")}</p>
                  <span className="sl-window-current"><LayoutGrid size={17} />{t("landing.demo.overview")}</span>
                  <span><ClipboardList size={17} />{t("landing.showcase.plan")}</span>
                  <span><History size={17} />{t("screen.ParentScreen.ui18")}</span>
                  <span><MessageSquare size={17} />{t("landing.desktop.observations")}</span>
                </div>
              )}
            >
              <ParentDashboard locale={locale} onOpenLesson={() => setPreview(0)} />
            </WorkspaceWindow>
          </div>
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
              <ScenePhoto scene="desktop" />
              <WorkspaceWindow
                className="sl-desktop-window"
                sidebar={(
                  <div className="sl-window-links" role="group" aria-label={t("landing.desktop.sections")}>
                    {previews.map(({ id, icon: Icon }, index) => (
                      <button key={id} type="button" aria-pressed={preview === index} onClick={() => setPreview(index)}>
                        <Icon size={17} aria-hidden="true" />{t(`landing.desktop.tab.${id}`)}
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
                      hidden={current.id !== id}
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

        <PracticeStart />

        <section className="sl-family sl-container" id="family" aria-labelledby="sl-family-title">
          <div className="sl-section-lead">
            <h2 className="sl-heading-2" id="sl-family-title">{t("landing.showcase.familyTitle")}</h2>
            <p className="sl-body">{t("landing.showcase.familyIntro")}</p>
          </div>
          <div className="sl-family-grid">
            <article className="sl-family-card">
              <div className="sl-family-copy">
                <p className="sl-kicker">{t("landing.showcase.parent")}</p>
                <h3 className="sl-heading-5">{t("landing.showcase.parentTitle")}</h3>
                <p className="sl-body">{t("landing.showcase.parentDescription")}</p>
              </div>
              <div className="sl-family-visual">
                <ScenePhoto scene="history" />
                <div className="sl-family-panel sl-glass"><HistoryPreview locale={locale} compact /></div>
              </div>
            </article>
            <article className="sl-family-card sl-family-card-reverse">
              <div className="sl-family-copy">
                <p className="sl-kicker">{t("landing.showcase.specialist")}</p>
                <h3 className="sl-heading-5">{t("landing.showcase.specialistTitle")}</h3>
                <p className="sl-body">{t("landing.showcase.specialistDescription")}</p>
              </div>
              <div className="sl-family-visual sl-family-visual-plan">
                <ScenePhoto scene="plan" />
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
            {questions.map((id) => (
              <details key={id}>
                <summary>{t(`landing.showcase.faq.${id}.question`)}<ChevronDown size={18} aria-hidden="true" /></summary>
                <p className="sl-body">{t(`landing.showcase.faq.${id}.answer`)}</p>
              </details>
            ))}
          </div>
        </section>

      </main>

      <footer className="sl-closing">
        <ScenePhoto scene="end" className="sl-end-photo" />
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
