"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, ChevronDown, CircleHelp, Clock3,
  ClipboardList, Download, History, LayoutGrid, LockKeyhole, MessageSquare, ShieldCheck,
  Volume2, X,
} from "lucide-react";
import { t, useLocale, type Locale } from "@/lib/i18n";
import { LanguagePicker } from "./LanguagePicker";
import "@/app/landing.css";

const scenery = {
  hero: "/landing/soyle-sculpted-hero.webp",
  desktop: "/landing/soyle-sculpted-desktop.webp",
  history: "/landing/soyle-sculpted-history.webp",
  plan: "/landing/soyle-sculpted-plan.webp",
  end: "/landing/soyle-sculpted-invitation.webp",
} as const;
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

const questions = ["start", "cards", "camera", "history", "specialist", "therapy"] as const;

function Wordmark() {
  return (
    <Link className="sl-wordmark" href="/" aria-label={t("landing.copy036")}>
      <Image src="/landing/soyle-mark-plum.svg" width={28} height={28} alt="" />
      Söyle<span aria-hidden="true">.</span>
    </Link>
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
          <Image src="/landing/soyle-mark-plum.svg" width={21} height={21} alt="" />
          Söyle
        </div>
        <span>{t("landing.showcase.sample")}</span>
        <span className="sl-window-lights" aria-hidden="true"><i /><i /><i /></span>
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

function LessonPreview() {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<(typeof choices)[number]["id"] | null>(null);
  const question = exercise[step];
  const correct = answer === question.answer;
  const complete = correct && step === exercise.length - 1;

  return (
    <div className="sl-example-sheet sl-exercise-sheet">
      <DemoHeading title={t("landing.desktop.tab.lesson")} description={t("landing.demo.lessonIntro")} />
      <div className="sl-tool-grid sl-exercise-grid">
        <div className="sl-work-card sl-exercise-guide">
          <h4>{t("landing.showcase.lessonLabel")}</h4>
          <ol>
            {exercise.map(({ answer, prompt }, index) => (
              <li key={answer} aria-current={index === step ? "step" : undefined}>
                <span>{index < step ? <Check size={15} aria-hidden="true" /> : index + 1}</span>
                {t(prompt)}
              </li>
            ))}
          </ol>
        </div>
        <div className="sl-work-card sl-question">
          <div className="sl-sheet-meta">
            <span>{t("landing.demo.exerciseQuestion")}</span>
            <span>{step + 1} / {exercise.length}</span>
          </div>
          <div className="sl-exercise-progress" aria-hidden="true">
            {exercise.map(({ answer }, index) => <i key={answer} data-current={index <= step} />)}
          </div>
          <h4>{t(question.prompt)}</h4>
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

function ParentDashboard({ locale, onOpenLesson }: { locale: Locale; onOpenLesson: () => void }) {
  return (
    <div className="sl-parent-dashboard">
      <header className="sl-dashboard-heading">
        <div className="sl-demo-heading">
          <p className="sl-demo-label">{t("landing.desktop.tab.history")}</p>
          <h2 className="sl-heading-4">{t("landing.demo.dashboard")}</h2>
        </div>
        <div className="sl-profile">
          <span className="sl-profile-avatar" aria-hidden="true">А</span>
          <div><strong>{t("landing.demo.profileName")}</strong><span>{t("landing.demo.sampleProfile")}</span></div>
        </div>
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
    </div>
  );
}

export function LandingPage() {
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
    <div className="sl-page" ref={root}>
      {board.player}
      <div className="sr-only" role="status">
        {t(board.audioError ? "landing.copy126" : `landing.aac.${board.selected}`)}
      </div>
      <a className="sl-skip" href="#main-content">{t("landing.copy035")}</a>
      <header className="sl-header sl-container">
        <Wordmark />
        <nav className="sl-nav" aria-label={t("landing.copy037")}>
          {links.map(({ href, label }) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="sl-header-actions">
          <LanguagePicker compact />
          <Link className="sl-login" href="/app">{t("landing.copy044")} <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="sl-hero" id="about">
          <div className="sl-hero-scene">
            <Image className="sl-hero-photo" src={scenery.hero} alt="" fill loading="eager" fetchPriority="high" quality={75} sizes="100vw" />
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

        <section className="sl-intro sl-container" aria-labelledby="sl-intro-title">
          <p className="sl-kicker">{t("landing.copy038")}</p>
          <h2 className="sl-heading-3" id="sl-intro-title">{t("landing.showcase.introTitle")}</h2>
          <p className="sl-body">{t("landing.showcase.intro")}</p>
        </section>

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
                  <Icon size={16} aria-hidden="true" />{t(`landing.desktop.tab.${id}`)}
                </button>
              ))}
            </div>
            <div className="sl-desktop-scene">
              <Image className="sl-scene-photo" src={scenery.desktop} alt="" fill quality={75} sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1232px) calc(100vw - 64px), 1168px" />
              <WorkspaceWindow
                className="sl-desktop-window"
                sidebar={(
                  <div className="sl-window-links" role="group" aria-label={t("landing.desktop.sections")}>
                    <p className="sl-sidebar-label">{t("landing.desktop.sections")}</p>
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
                      {id === "lesson" && <LessonPreview />}
                      {id === "communication" && <CommunicationBoard board={board} />}
                      {id === "history" && <HistoryPreview locale={locale} />}
                      {id === "plan" && <PlanPreview />}
                    </div>
                  ))}
                </div>
              </WorkspaceWindow>
            </div>
            <div className="sl-preview-controls">
              <button type="button" aria-label={t("landing.showcase.previous")} onClick={() => setPreview((preview + previews.length - 1) % previews.length)}>
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <span className="sl-caption" aria-live="polite">{t(`landing.desktop.caption.${current.id}`)}</span>
              <button type="button" aria-label={t("landing.showcase.next")} onClick={() => setPreview((preview + 1) % previews.length)}>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

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
                <Image className="sl-scene-photo" src={scenery.history} alt="" fill quality={75} sizes="(max-width: 560px) calc(100vw - 40px), (max-width: 1232px) 56vw, 672px" />
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
                <Image className="sl-scene-photo" src={scenery.plan} alt="" fill quality={75} sizes="(max-width: 560px) calc(100vw - 40px), (max-width: 1232px) 56vw, 672px" />
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
            <p className="sl-kicker"><CircleHelp size={16} aria-hidden="true" /> FAQ</p>
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

        <section className="sl-end" aria-labelledby="sl-end-title">
          <Image className="sl-scene-photo sl-end-photo" src={scenery.end} alt="" fill quality={75} sizes="100vw" />
          <div className="sl-container sl-end-layout">
            <div className="sl-end-copy">
              <h2 className="sl-heading-2" id="sl-end-title">{t("landing.showcase.endTitle")}</h2>
              <p className="sl-body">{t("landing.showcase.endDescription")}</p>
              <StartLink />
            </div>
          </div>
        </section>
      </main>

      <footer className="sl-footer sl-container">
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
          <LanguagePicker />
        </div>
      </footer>
    </div>
  );
}
