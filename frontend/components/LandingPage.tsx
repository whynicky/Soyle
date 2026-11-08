"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowDown, ArrowRight, BookOpen, Check, ChevronDown, ChevronRight,
  ClipboardList, Download, History, LayoutGrid, LockKeyhole, MessageSquare, ShieldCheck,
  Volume2, X,
} from "lucide-react";
import { t, useLocale, type Locale } from "@/lib/i18n";
import { observeHeroDepth } from "@/lib/landingDepth";
import { landingThemes, type LandingTheme } from "@/lib/landingTheme";
import { LanguagePicker } from "./LanguagePicker";
import { BrandMark } from "./PublicBrandMark";
import { preloadThemeImage, PublicThemeToggle, usePublicTheme } from "./PublicTheme";
import "@/app/landing.css";

const scenery = {
  desktop: "soyle-sculpted-desktop",
  plan: "soyle-sculpted-plan",
  observation: "soyle-heather-closeup",
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
      : scene === "desktop" ? "(max-width: 760px) calc(100vw - 40px), 1168px"
        : "(max-width: 760px) calc(100vw - 40px), (max-width: 1232px) 55vw, 642px";
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

const heroChoices = [
  ...choices,
  { id: "rest", label: "landing.heroBoard.rest" },
  { id: "help", label: "landing.heroBoard.help" },
  { id: "more", label: "landing.heroBoard.more" },
] as const;

const previews = [
  { id: "communication", icon: MessageSquare },
  { id: "lesson", icon: BookOpen },
  { id: "history", icon: History },
  { id: "plan", icon: ClipboardList },
] as const;
const defaultPreview = previews.findIndex(({ id }) => id === "lesson");

const access = [
  { id: "permission", icon: LockKeyhole },
  { id: "camera", icon: ShieldCheck },
  { id: "export", icon: Download },
] as const;

const questions = ["price", "account", "devices", "specialist", "adult", "camera", "history"] as const;


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
          <LanguagePicker compact />
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
    <Link className="sl-button sl-start" href="/app?mode=register">
      {t("landing.showcase.start")} <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

type SpeechSource = "hero" | "preview";
type ChoiceId = (typeof choices)[number]["id"];
type HeroChoiceId = (typeof heroChoices)[number]["id"];

function useLandingSpeech(locale: Locale) {
  const [speakingFrom, setSpeakingFrom] = useState<SpeechSource | null>(null);
  const [errorFrom, setErrorFrom] = useState<SpeechSource | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const playRequest = useRef(0);

  const stop = useCallback(() => {
    playRequest.current++;
    audio.current?.pause();
    setSpeakingFrom(null);
    setErrorFrom(null);
  }, []);

  useEffect(() => {
    const player = audio.current;
    window.addEventListener("soyle-locale-changing", stop);
    return () => {
      window.removeEventListener("soyle-locale-changing", stop);
      player?.pause();
    };
  }, [stop]);

  async function speak(id: HeroChoiceId, from: SpeechSource) {
    const player = audio.current;
    if (!player) return;
    if (speakingFrom === from) {
      stop();
      return;
    }

    const request = ++playRequest.current;
    player.src = `/api/public/speech/${locale === "kk-KZ" ? "kk" : "ru"}/${id}`;
    setErrorFrom(null);
    setSpeakingFrom(from);
    try {
      await player.play();
    } catch {
      if (player === audio.current && request === playRequest.current) {
        setSpeakingFrom(null);
        setErrorFrom(from);
      }
    }
  }

  const player = (
    <audio ref={audio} preload="none" onEnded={() => setSpeakingFrom(null)} onError={() => {
      if (speakingFrom) {
        setErrorFrom(speakingFrom);
        setSpeakingFrom(null);
        }
      }} />
  );
  return { speakingFrom, errorFrom, stop, speak, player };
}

function DemoObject({ id }: { id: HeroChoiceId }) {
  return <Image className="sl-object" src={`/landing/soyle-object-${id}.webp`} width={144} height={144} alt="" unoptimized />;
}

function DemoHeading({ title }: { title: string }) {
  return (
    <div className="sl-demo-heading">
      <h3 className="sl-heading-4">{title}</h3>
    </div>
  );
}

function CommunicationBoard({ speech }: { speech: ReturnType<typeof useLandingSpeech> }) {
  const [selected, setSelected] = useState<ChoiceId>("water");
  const speaking = speech.speakingFrom === "preview";
  return (
    <div className="sl-example-sheet sl-aac" id="communication">
      <DemoHeading title={t("landing.showcase.board")} />
      <div className="sl-object-options" role="group" aria-label={t("landing.demo.cardLibrary")}>
        {choices.map(({ id, label }) => (
          <button key={id} type="button" className="sl-object-choice" aria-pressed={selected === id} onClick={() => {
            speech.stop();
            setSelected(id);
          }}>
            <DemoObject id={id} />
            {t(label)}
            {selected === id && <Check size={17} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="sl-phrase-bar">
        <p className="sl-phrase" aria-live="polite"><span key={selected}>{t(`landing.aac.${selected}`)}</span></p>
        <button type="button" className="sl-lesson-next" onClick={() => speech.speak(selected, "preview")}>
          {speaking ? <X size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
          {t(speaking ? "landing.copy124" : "landing.heroBoard.speak")}
        </button>
        {speech.errorFrom === "preview" && <small className="sl-audio-error" role="status">{t("landing.copy126")}</small>}
      </div>
    </div>
  );
}

function WorkspaceWindow({ children, sidebar, className = "", cover = false }: {
  children: ReactNode;
  sidebar?: ReactNode;
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
        <span className="sl-window-caption">{t("landing.demo.sampleData")}</span>
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

type DemoRecord = { title: string; meta: string; dateTime?: string; icon: ReactNode; detail: ReactNode };

function RecordPicker({ id, label, entries }: { id: string; label: string; entries: DemoRecord[] }) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="sl-record-grid">
      <div className="sl-record-list">
        <h4 id={`${id}-list-label`}>{label}</h4>
        <ul className="sl-records">
          {entries.map(({ title, meta, dateTime, icon }, index) => (
            <li key={title}>
              <button type="button" aria-pressed={selected === index} aria-controls={`${id}-detail-${index}`} onClick={() => setSelected(index)}>
                <span className="sl-record-icon">{icon}</span>
                <span className="sl-record-name">
                  <strong>{title}</strong>
                  {dateTime ? <time className="sl-record-date" dateTime={dateTime}>{meta}</time> : <span className="sl-record-date">{meta}</span>}
                </span>
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <select className="sl-record-select" aria-labelledby={`${id}-list-label`} value={selected} onChange={(event) => setSelected(Number(event.currentTarget.value))}>
          {entries.map(({ title, meta }, index) => <option key={title} value={index}>{title} · {meta}</option>)}
        </select>
      </div>
      <div className="sl-record-details" aria-live="polite">
        {entries.map(({ title, detail }, index) => (
          <article className="sl-record-detail" id={`${id}-detail-${index}`} key={title} hidden={selected !== index} aria-hidden={selected !== index || undefined}>
            {detail}
          </article>
        ))}
      </div>
    </div>
  );
}

function HistoryPreview({ locale }: { locale: Locale }) {
  const date = new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", timeZone: "UTC" });

  return (
    <div className="sl-example-sheet sl-history-sheet">
      <DemoHeading title={t("landing.desktop.observations")} />
      <RecordPicker id="sl-history" label={t("landing.demo.recent")} entries={observations.map(({ day, title, note }) => {
        const dateTime = `2026-10-${day}`;
        const meta = date.format(Date.UTC(2026, 9, day));
        return {
          title: t(title), meta, dateTime, icon: <History size={16} aria-hidden="true" />,
          detail: <>
            <div className="sl-record-detail-head">
              <time className="sl-record-date" dateTime={dateTime}>{meta}</time>
              <h4>{t(title)}</h4>
            </div>
            <div className="sl-record-section">
              <p className="sl-demo-label"><MessageSquare size={16} aria-hidden="true" />{t("landing.showcase.noteLabel")}</p>
              <p>{t(note)}</p>
            </div>
          </>,
        };
      })} />
    </div>
  );
}

const tasks = [
  { title: "landing.showcase.planTask", day: "landing.desktop.monday", note: "landing.showcase.planTip", instruction: "landing.demo.drinkAction", icon: MessageSquare },
  { title: "landing.desktop.listenTask", day: "landing.desktop.wednesday", note: "landing.desktop.listenTip", instruction: "landing.demo.listenAction", icon: BookOpen },
  { title: "landing.desktop.phraseTask", day: "landing.desktop.friday", note: "landing.desktop.phraseTip", instruction: "landing.demo.phraseAction", icon: ClipboardList },
] as const;

function PlanPreview() {
  return (
    <div className="sl-example-sheet sl-plan-sheet">
      <DemoHeading title={t("landing.desktop.weekPlan")} />
      <RecordPicker id="sl-plan" label={t("landing.demo.planList")} entries={tasks.map(({ title, day, note, instruction, icon: Icon }) => ({
        title: t(title), meta: t(day), icon: <Icon size={16} aria-hidden="true" />,
        detail: <>
          <div className="sl-record-detail-head">
            <p className="sl-record-date">{t(day)}</p>
            <h4>{t(title)}</h4>
          </div>
          <p>{t(instruction)}</p>
          <div className="sl-record-section">
            <p className="sl-demo-label"><BookOpen size={16} aria-hidden="true" />{t("landing.demo.adultTip")}</p>
            <p>{t(note)}</p>
          </div>
        </>,
      }))} />
    </div>
  );
}

function PlatformCover({ speech }: { speech: ReturnType<typeof useLandingSpeech> }) {
  const [selected, setSelected] = useState<HeroChoiceId>("water");
  const speaking = speech.speakingFrom === "hero";
  return (
    <div className="sl-platform-cover">
      <div className="sl-platform-art" aria-hidden="true" />
      <div className="sl-platform-copy">
        <div className="sl-hero-board">
          <div className="sl-hero-board-heading">
            <h2 id="sl-hero-board-title">{t("landing.heroBoard.pick")}</h2>
            <p role="status">{t(speech.errorFrom === "hero" ? "landing.copy126" : "landing.heroBoard.hint")}</p>
          </div>
          <div className="sl-hero-grid" role="group" aria-labelledby="sl-hero-board-title">
            {heroChoices.map(({ id, label }) => (
              <button className="sl-hero-choice" key={id} type="button" aria-pressed={selected === id} onClick={() => {
                if (selected === id) return;
                speech.stop();
                setSelected(id);
              }}>
                <DemoObject id={id} />
                {t(label)}
                <Check className="sl-hero-check" size={14} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="sl-hero-phrase">
            <div className="sl-hero-phrase-copy">
              <span>{t("landing.heroBoard.phrase")}</span>
              <p aria-live="polite" aria-atomic="true"><span key={selected}>{t(`landing.aac.${selected}`)}</span></p>
            </div>
            <button type="button" className="sl-lesson-next" onClick={() => speech.speak(selected, "hero")}>
              {speaking ? <X size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
              {t(speaking ? "landing.copy124" : "landing.heroBoard.speak")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

type PreviewId = (typeof previews)[number]["id"];
const previewFragment = (id: PreviewId) => `#sl-tab-${id}`;

const roles = ["child", "parent", "specialist"] as const;

function ProductRoles() {
  return (
    <section className="sl-roles sl-container" aria-labelledby="sl-roles-title">
      <h2 className="sl-heading-3" id="sl-roles-title">{t("landing.roles.heading")}</h2>
      <dl className="sl-explainer-list">
        {roles.map((id) => (
          <div key={id}><dt>{t(`landing.roles.${id}.title`)}</dt><dd>{t(`landing.roles.${id}.text`)}</dd></div>
        ))}
      </dl>
      <p className="sl-body">{t("landing.roles.scope")}</p>
    </section>
  );
}

function FamilyPractice({ theme, locale, onOpenDemo }: {
  theme: LandingTheme;
  locale: Locale;
  onOpenDemo: (id: PreviewId) => void;
}) {
  const { day, title, note } = observations[0];
  const date = new Intl.DateTimeFormat(locale, { month: "long", day: "numeric", timeZone: "UTC" });
  const demoProfile = `${t("landing.copy116")} · ${t("landing.demo.profileName")}`;

  return (
    <section className="sl-family sl-container" id="family" aria-labelledby="sl-family-title">
      <div className="sl-section-lead">
        <h2 className="sl-heading-2" id="sl-family-title">{t("landing.showcase.familyTitle")}</h2>
        <p className="sl-body">{t("landing.showcase.familyIntro")}</p>
      </div>
      <div className="sl-feature-list">
        <article className="sl-feature">
          <div className="sl-feature-copy">
            <h3 className="sl-heading-3">{t("landing.feature.planTitle")}</h3>
            <p className="sl-body">{t("landing.feature.planDescription")}</p>
          </div>
          <div className="sl-feature-scene sl-feature-plan">
            <ScenePhoto scene="plan" theme={theme} />
            <div className="sl-feature-panel">
              <div className="sl-feature-bar">
                <span><ClipboardList size={17} aria-hidden="true" />{t("landing.handoff.assign.label")}</span>
                <span>{demoProfile}</span>
              </div>
              <div className="sl-feature-content">
                <h4>{t("landing.handoff.task")}</h4>
                <div className="sl-feature-detail">
                  <p className="sl-feature-meta">{t("landing.demo.adultTip")}</p>
                  <p>{t("landing.handoff.instruction")}</p>
                </div>
                <a className="sl-lesson-next" href={previewFragment("plan")} onClick={() => onOpenDemo("plan")}>
                  {t("landing.desktop.tab.plan")} <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </article>

        <article className="sl-feature sl-feature-reverse">
          <div className="sl-feature-copy">
            <h3 className="sl-heading-3">{t("landing.feature.historyTitle")}</h3>
            <p className="sl-body">{t("landing.feature.historyDescription")}</p>
          </div>
          <div className="sl-feature-scene sl-feature-history">
            <ScenePhoto scene="observation" theme={theme} />
            <div className="sl-feature-panel">
              <div className="sl-feature-bar">
                <span><MessageSquare size={17} aria-hidden="true" />{t("landing.showcase.noteLabel")}</span>
                <span>{demoProfile}</span>
              </div>
              <div className="sl-feature-content">
                <div className="sl-feature-entry">
                  <time className="sl-feature-meta" dateTime={`2026-10-${day}`}>{date.format(Date.UTC(2026, 9, day))}</time>
                  <h4>{t(title)}</h4>
                </div>
                <div className="sl-feature-detail"><p>{t(note)}</p></div>
                <a className="sl-lesson-next" href={previewFragment("history")} onClick={() => onOpenDemo("history")}>
                  {t("landing.desktop.tab.history")} <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function Materials() {
  return (
    <section className="sl-materials sl-container" id="materials" aria-labelledby="sl-materials-title">
      <div>
        <p className="sl-kicker">{t("landing.materials.stage")}</p>
        <h2 className="sl-heading-3" id="sl-materials-title">{t("landing.materials.heading")}</h2>
      </div>
      <p className="sl-body">{t("landing.materials.review")}</p>
    </section>
  );
}

const startSteps = ["profile", "practice", "together"] as const;

function HowToStart() {
  return (
    <section className="sl-how-start sl-container" id="start" aria-labelledby="sl-how-start-title">
      <h2 className="sl-heading-3" id="sl-how-start-title">{t("landing.start.heading")}</h2>
      <ol className="sl-start-steps" role="list">
        {startSteps.map((step, index) => (
          <li key={step}>
            <span className="sl-step-number" aria-hidden="true">{index + 1}</span>
            <div>
              <h3>{t(`landing.start.${step}.title`)}</h3>
              <p className="sl-body">{t(`landing.start.${step}.text`)}</p>
            </div>
          </li>
        ))}
      </ol>
      <StartLink />
    </section>
  );
}

export function LandingPage({ initialTheme }: { initialTheme: LandingTheme }) {
  const locale = useLocale();
  const speech = useLandingSpeech(locale);
  const { stop: stopSpeech } = speech;
  const [preview, setPreview] = useState(defaultPreview);
  const root = useRef<HTMLDivElement>(null);
  const prepareTheme = useCallback((scheme: "light" | "dark") => {
    const mobile = window.matchMedia(mobileScenery).matches;
    const tone = scheme === "dark" ? "night" : "day";
    const visibleScenes = Array.from(root.current?.querySelectorAll<HTMLPictureElement>("[data-scene]") ?? [])
      .filter((picture) => {
        const rect = picture.getBoundingClientRect();
        return rect.bottom > -120 && rect.top < window.innerHeight + 120;
      });
    const scenes = new Set(visibleScenes.map((picture) => picture.dataset.scene as Scene));
    return Promise.all([...scenes].map((scene) => {
      const { src, srcSet, sizes } = sceneVariant(scene, tone, mobile && (isHeroLayer(scene) || scene === "end"));
      return preloadThemeImage(src, srcSet, sizes);
    }));
  }, []);
  const { theme, changeTheme } = usePublicTheme(initialTheme, prepareTheme);

  const switchPreview = useCallback((index: number) => {
    stopSpeech();
    setPreview(index);
  }, [stopSpeech]);

  useEffect(() => {
    const selectFromHash = () => {
      const { hash } = window.location;
      const index = previews.findIndex(({ id }) => previewFragment(id) === hash);
      if (index >= 0) switchPreview(index);
      else if (hash === "#communication") switchPreview(0);
      else if (hash === "#journey") switchPreview(defaultPreview);
    };
    const frame = requestAnimationFrame(selectFromHash);
    window.addEventListener("hashchange", selectFromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", selectFromHash);
    };
  }, [switchPreview]);

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
    if (hero) return observeHeroDepth(hero);
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
    switchPreview(next);
    root.current?.querySelector<HTMLButtonElement>(`#sl-tab-${previews[next].id}`)?.focus();
  }

  function openDemo(id: PreviewId) {
    switchPreview(previews.findIndex((item) => item.id === id));
  }

  const current = previews[preview];
  const links = [
    { href: "#journey", label: t("landing.showcase.navJourney") },
    { href: "#family", label: t("landing.showcase.navFamily") },
    { href: "#questions", label: t("landing.copy042") },
  ];

  return (
    <div className="sl-page" data-landing-theme={theme} ref={root}>
      {speech.player}
      <a className="sl-skip" href="#main-content">{t("landing.copy035")}</a>
      <LandingHeader theme={theme} onChange={changeTheme} />

      <main id="main-content" tabIndex={-1}>
        <section className="sl-hero" id="about">
          <div className="sl-hero-scene">
            <div className="sl-hero-landscape">
              <ScenePhoto scene="hero" theme={theme} className="sl-hero-photo" />
              <ScenePhoto scene="hero" theme={theme} className="sl-hero-hills" />
            </div>
          </div>
          <div className="sl-container sl-hero-content">
            <div className="sl-hero-copy">
              <p className="sl-kicker">{t("landing.showcase.audience")}</p>
              <h1 className="sl-heading-1"><span>{t("landing.showcase.titleFirst")}</span>{" "}<span>{t("landing.showcase.titleSecond")}</span></h1>
              <p className="sl-body sl-hero-description">{t("landing.showcase.description")}</p>
              <div className="sl-hero-actions">
                <StartLink />
                <a className="sl-text-link" href="#journey" onClick={() => openDemo("lesson")}>{t("landing.demo.openPreview")} <ArrowDown size={15} aria-hidden="true" /></a>
              </div>
            </div>

            <div className="sl-hero-platform">
              <WorkspaceWindow
                className="sl-hero-window"
                cover
                sidebar={(
                  <div className="sl-window-links" aria-hidden="true">
                    <p className="sl-sidebar-label">{t("landing.roles.child.title")}</p>
                    <span><LayoutGrid size={17} /><span className="sl-rail-label">{t("nav.home")}</span></span>
                    <span className="sl-window-current"><MessageSquare size={17} /><span className="sl-rail-label">{t("nav.words")}</span></span>
                    <span><BookOpen size={17} /><span className="sl-rail-label">{t("nav.lessons")}</span></span>
                  </div>
                )}
              >
                <PlatformCover speech={speech} />
              </WorkspaceWindow>
            </div>
          </div>
          <div className="sl-hero-foreground" aria-hidden="true">
            <div className="sl-hero-foreground-track">
              <ScenePhoto scene="foreground" theme={theme} className="sl-hero-plants" />
              <ScenePhoto scene="foreground" theme={theme} className="sl-hero-foreground-extension" />
            </div>
          </div>
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
                  onClick={() => switchPreview(index)} onKeyDown={onTabKey}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{t(`landing.desktop.tab.${id}`)}</span>
                </button>
              ))}
            </div>
            <div className="sl-scenario-copy" aria-live="polite">
              {previews.map(({ id }) => (
                <p key={id} className="sl-body" hidden={current.id !== id}>{t(`landing.story.${id}.text`)}</p>
              ))}
            </div>
            <div className="sl-desktop-scene">
              <ScenePhoto scene="desktop" theme={theme} />
              <WorkspaceWindow
                className="sl-desktop-window"
                sidebar={(
                  <div className="sl-window-links" role="group" aria-label={t("landing.desktop.sections")}>
                    {previews.map(({ id, icon: Icon }, index) => (
                      <button key={id} type="button" aria-pressed={preview === index} aria-label={t(`landing.mobile.tab.${id}`)} onClick={() => switchPreview(index)}>
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
                      {id === "communication" && <CommunicationBoard speech={speech} />}
                      {id === "history" && <HistoryPreview locale={locale} />}
                      {id === "plan" && <PlanPreview />}
                    </div>
                  ))}
                </div>
              </WorkspaceWindow>
            </div>
          </div>
        </section>

        <FamilyPractice theme={theme} locale={locale} onOpenDemo={openDemo} />
        <ProductRoles />
        <Materials />
        <HowToStart />

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
              <div className="sl-end-actions">
                <StartLink />
                <a className="sl-text-link" href="#journey" onClick={() => openDemo("lesson")}>
                  {t("landing.demo.openPreview")} <ArrowDown size={15} aria-hidden="true" />
                </a>
              </div>
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
