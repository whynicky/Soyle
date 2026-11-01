"use client";

import { t, useLocale } from "@/lib/i18n";

import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  CircleEllipsis,
  Clock3,
  Heart,
  Home,
  ImageIcon,
  Lightbulb,
  MapPin,
  MessageCircle,
  MoreVertical,
  Pause,
  Play,
  Plus,
  Settings,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  UserRound,
  Users,
  Utensils,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import type { Child, Dashboard, Exercise, LearningSession, SkillProgress } from "@/lib/api";
import { SESSION_EXERCISE_COUNTS, exerciseCountLabel } from "@/lib/homePractice";

export type ProductDestination = "games" | "aac" | "progress" | "goals" | "parent" | "settings" | "profile" | "ai" | "achievements";

type SharedProps = {
  child?: Child;
  dashboard: Dashboard | null;
  exercises: Exercise[];
  onNavigate: (screen: ProductDestination) => void;
  onExercise: (exercise: Exercise) => void;
};

function percent(value: number | null | undefined) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function runExercise(exercise: Exercise | undefined, onExercise: (item: Exercise) => void, onNavigate: (screen: ProductDestination) => void) {
  if (exercise) onExercise(exercise);
  else onNavigate("games");
}

export function ParentDashboardExperience({
  child,
  dashboard,
  exercises,
  currentSession,
  activeSessionLoading,
  dailyMinutes,
  onMinutesChange,
  sessionLoading,
  sessionError,
  canSaveResults,
  onStartSession,
  onResume,
  onNavigate,
  onExercise,
  onProductScreen,
  childMode = false,
}: SharedProps & {
  currentSession: LearningSession | null;
  activeSessionLoading: boolean;
  dailyMinutes: 3 | 5 | 10;
  onMinutesChange: (minutes: 3 | 5 | 10) => void;
  sessionLoading: boolean;
  sessionError: string;
  canSaveResults: boolean;
  onStartSession: () => void;
  onResume: () => void;
  onProductScreen: (screen: "stories" | "world" | "skills" | "guides") => void;
  childMode?: boolean;
}) {
  useLocale();
  const recommended = (dashboard?.recommended_exercises || []).filter(item => exercises.some(exercise => exercise.id === item.id));
  const planCount = currentSession?.exercises.length || SESSION_EXERCISE_COUNTS[dailyMinutes];
  const completed = currentSession?.current_index || 0;
  const progress = currentSession ? percent((completed / Math.max(1, planCount)) * 100) : percent(dashboard?.overall);
  const primaryAction = currentSession ? onResume : onStartSession;

  return (
    <div className="v2-screen v2-dashboard page-enter">
      <div className="v2-dashboard-hero-grid">
        <section className="v2-goal-hero" aria-labelledby="v2-goal-title">
          <Image src="/app-illustrations/home-help-goal.webp" alt={t("product.ui1")} fill priority sizes="(max-width: 900px) 100vw, 58vw" />
          <div className="v2-hero-scrim" />
          <div className="v2-goal-copy">
            <span className="v2-kicker"><Target size={20}/> {childMode ? t("product.greeting", { name: child?.name || t("product.ui2") }) : t("product.ui3")}</span>
            <h1 id="v2-goal-title">{t("product.ui4")}<br/>{t("product.ui5")}</h1>
            <div className="v2-goal-progress" role="progressbar" aria-label={currentSession ? t("product.ui6") : t("product.ui7")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{ width: `${progress}%` }}/></div>
            <p>{currentSession ? t("product.steps", { completed, total: planCount }) : t("product.attempts", { count: dashboard?.completed_exercise_ids.length || 0 })}</p>
          </div>
        </section>

        <section className="v2-start-card" aria-labelledby="v2-start-title">
          <Image className="v2-start-art" src="/app-illustrations/practice-continue.webp" alt="" fill priority sizes="(max-width: 900px) 100vw, 36vw" />
          <span className="v2-start-scrim" aria-hidden="true" />
          <button className="v2-play-button" onClick={primaryAction} disabled={sessionLoading || activeSessionLoading || (Boolean(currentSession) && !canSaveResults)} aria-label={currentSession ? t("product.ui8") : t("product.ui9")}><Play fill="currentColor"/></button>
          <div>
            <span className="v2-kicker">{t("product.ui10")}</span>
            <h2 id="v2-start-title">{currentSession ? t("product.ui8") : t("product.ui9")}</h2>
            <p>{currentSession ? t("product.ui11") : t("product.minutes", { minutes: dailyMinutes, exercises: exerciseCountLabel(planCount) })}</p>
          </div>
          {!currentSession && <div className="v2-minute-picker" aria-label={t("product.ui12")}>{([3, 5, 10] as const).map((value) => <button key={value} aria-pressed={dailyMinutes === value} className={dailyMinutes === value ? "active" : ""} onClick={() => onMinutesChange(value)}>{value}</button>)}</div>}
          <button className="v2-round-next" onClick={primaryAction} disabled={sessionLoading || activeSessionLoading} aria-label={t("product.ui13")}><ArrowRight/></button>
        </section>
      </div>

      {sessionError && <div className="v2-inline-alert" role="alert">{sessionError}</div>}

      <nav className="v2-feature-grid" aria-label={t("product.ui14")}>
        <button className="v2-feature-card stories" onClick={() => onProductScreen("stories")}>
          <span className="v2-feature-icon"><BookOpen/></span><strong>{t("product.ui15")}</strong><small>{t("product.ui16")}</small><span className="v2-feature-art"><Image src="/app-illustrations/dashboard-stories.webp" alt="" fill sizes="(max-width: 760px) 100vw, 25vw"/></span><ChevronRight/>
        </button>
        <button className="v2-feature-card world" onClick={() => onProductScreen("world")}>
          <span className="v2-feature-icon"><ImageIcon/></span><strong>{t("product.ui17")}</strong><small>{t("product.ui18")}</small><span className="v2-feature-art"><Image src="/app-illustrations/dashboard-world.webp" alt="" fill sizes="(max-width: 760px) 100vw, 25vw"/></span><ChevronRight/>
        </button>
        <button className="v2-feature-card skills" onClick={() => onProductScreen("skills")}>
          <span className="v2-feature-icon"><BarChart3/></span><strong>{t("product.ui19")}</strong><small>{t("product.ui20")}</small><span className="v2-feature-art"><Image src="/app-illustrations/dashboard-skills.webp" alt="" fill sizes="(max-width: 760px) 100vw, 25vw"/></span><ChevronRight/>
        </button>
        <button className="v2-feature-card words" onClick={() => onNavigate("aac")}>
          <span className="v2-feature-icon"><MessageCircle/></span><strong>{t("product.ui21")}</strong><small>{t("product.ui22")}</small><span className="v2-feature-art"><Image src="/app-illustrations/dashboard-words.webp" alt="" fill sizes="(max-width: 760px) 100vw, 25vw"/></span><ChevronRight/>
        </button>
        {childMode ? <button className="v2-feature-card guides" onClick={() => onNavigate("achievements")}>
          <span className="v2-feature-icon"><Trophy/></span><strong>{t("product.ui23")}<br/>{t("product.ui24")}</strong><small>{t("product.ui25")}</small><span className="v2-feature-art"><Image src="/app-illustrations/dashboard-achievements.webp" alt="" fill sizes="(max-width: 760px) 100vw, 25vw"/></span><ChevronRight/>
        </button> : <button className="v2-feature-card guides" onClick={() => onProductScreen("guides")}>
          <span className="v2-feature-icon"><Users/></span><strong>{t("product.ui26")}<br/>{t("product.ui27")}</strong><small>{t("product.ui28")}</small><span className="v2-plant" aria-hidden="true"><i/><i/><i/></span><ChevronRight/>
        </button>}
      </nav>

      <div className="v2-dashboard-bottom">
        <section className="v2-practice-strip" aria-labelledby="v2-practice-title">
          <header><span className="v2-section-icon"><Lightbulb/></span><div><h2 id="v2-practice-title">{t("product.ui29")}</h2><p>{t("product.ui30")}</p></div><button onClick={() => onNavigate("games")} aria-label={t("product.ui31")}><ChevronRight/></button></header>
          <div className="v2-practice-items">
            {recommended.map((exercise, index) => {
              const fallbackImages = ["/aac-pictograms/water.png", "/aac-pictograms/apple.png", "/aac-pictograms/toy-car.png"];
              return <button key={exercise.id} onClick={() => onExercise(exercise)}><Image src={exercise.icon?.startsWith("/") ? exercise.icon : fallbackImages[index]} alt="" width={72} height={72}/><span><strong>{exercise.title}</strong><small><Clock3/>  {t("product.ui32")}</small></span><ChevronRight/></button>;
            })}
            {!recommended.length && <button onClick={() => onNavigate("games")}><span className="v2-empty-glyph"><Sparkles/></span><span><strong>{t("product.ui33")}</strong><small>{t("product.ui34")}</small></span><ChevronRight/></button>}
          </div>
        </section>

        <section className="v2-observation-card" aria-labelledby="v2-observation-title">
          <header><span className="v2-section-icon">{childMode ? <Trophy/> : <Users/>}</span><div><h2 id="v2-observation-title">{childMode ? t("product.ui35") : t("product.ui36")}</h2><p>{childMode ? t("product.ui37") : t("product.ui38")}</p></div></header>
          <button onClick={() => onNavigate(childMode ? "achievements" : dashboard?.total_sessions ? "progress" : "goals")}>
            <span className="v2-avatar-child">{childMode ? <Star/> : child?.name?.[0] || t("product.ui39")}</span>
            <span><strong>{childMode ? t("product.stars", { count: dashboard?.stars || 0 }) : dashboard?.total_sessions ? t("product.week", { count: dashboard.week_sessions }) : t("product.ui40")}</strong><small>{childMode ? t("product.ui41") : dashboard?.weakest_skill ? t("product.support", { skill: dashboard.weakest_skill.label.toLocaleLowerCase() }) : t("product.ui42")}</small></span>
            <ChevronRight/>
          </button>
        </section>
      </div>
    </div>
  );
}

const getSkillNodes = () => [
  { key: "speech_comprehension", title: t("product.ui43"), text: t("product.ui44"), icon: BookOpen, tone: "green" },
  { key: "communication", title: t("product.ui45"), text: t("product.ui46"), icon: MessageCircle, tone: "peach" },
  { key: "vocabulary", title: t("product.ui47"), text: t("product.ui48"), icon: Target, tone: "blue" },
  { key: "phrase_building", title: "AAC", text: t("product.ui49"), icon: ImageIcon, tone: "sky" },
  { key: "word_repetition", title: t("product.ui50"), text: t("product.ui51"), icon: Settings, tone: "lilac" },
  { key: "articulation", title: t("product.ui52"), text: t("product.ui53"), icon: Home, tone: "sand" },
] as const;

function skillValue(items: SkillProgress[] | undefined, key: string) {
  const item = items?.find((skill) => skill.skill === key);
  if (item?.value != null) return percent(item.value);
  return null;
}

export function SkillsExperience({ dashboard, onNavigate }: SharedProps) {
  useLocale();
  const skillNodes = getSkillNodes();
  return <div className="v2-screen v2-skills page-enter">
    <section className="v2-skills-hero"><Image src="/app-illustrations/skills-milestone-path.webp" alt={t("product.ui54")} fill priority sizes="(max-width: 900px) 100vw, 80vw"/><div className="v2-skills-copy"><h1>{t("product.ui19")}</h1><p>{t("product.ui55")}</p><span className="v2-kicker"><Target/>  {t("product.ui56")}</span><h2>{dashboard?.completed_exercise_ids.length || 0}  {t("product.ui57")}</h2><small>{t("product.ui58")}</small><div className="v2-goal-progress"><i style={{ width: `${percent(dashboard?.overall)}%` }}/></div></div></section>
    <section className="v2-skill-map" aria-label={t("product.ui59")}>
      <svg className="v2-map-path" viewBox="0 0 1200 380" preserveAspectRatio="none" aria-hidden="true"><path d="M70 210 C210 60 330 330 490 180 S790 60 930 210 S1090 330 1160 120"/></svg>
      {skillNodes.map((node, index) => { const Icon = node.icon; const value = skillValue(dashboard?.skill_progress, node.key); return <button key={node.key} className={`v2-skill-node ${node.tone} node-${index + 1}`} onClick={() => onNavigate("progress")}><span><Icon/></span><div><h3>{node.title}</h3><p>{node.text}</p><small className={value === null ? "support" : value > 70 ? "ready" : "learning"}>{value === null ? <CircleEllipsis/> : value > 70 ? <Check/> : <CircleEllipsis/>}{value === null ? t("product.ui60") : t("product.percent", { value })}</small></div><ChevronRight/></button>; })}
      <span className="v2-map-sun" aria-hidden="true"/><span className="v2-map-flag" aria-hidden="true">⚑</span>
    </section>
    <div className="v2-skill-bottom"><button onClick={() => onNavigate("progress")}><Users/><span><strong>{t("product.ui36")}</strong><small>{dashboard?.week_sessions ? t("product.weekSessions", { count: dashboard.week_sessions }) : t("product.ui61")}</small></span><ChevronRight/></button><button onClick={() => onNavigate("games")}><Lightbulb/><span><strong>{t("product.ui29")}</strong><small>{t("product.ui62")}</small></span><ChevronRight/></button></div>
  </div>;
}

const getGuideCards = () => [
  { key: "help", title: t("product.ui63"), text: t("product.ui64"), image: "/app-illustrations/guides-help-gesture.webp", categories: ["start", "communication", "aac"], steps: [t("product.ui65"), t("product.ui66"), t("product.ui67"), t("product.ui68")] },
  { key: "choice", title: t("product.ui69"), text: t("product.ui70"), image: "/app-illustrations/guide-offer-choice.webp", categories: ["start", "communication", "home"], steps: [t("product.ui71"), t("product.ui72"), t("product.ui73"), t("product.ui74")] },
  { key: "refusal", title: t("product.ui75"), text: t("product.ui76"), image: "/app-illustrations/guide-calm-refusal.webp", categories: ["start", "behavior", "communication"], steps: [t("product.ui77"), t("product.ui78"), t("product.ui79"), t("product.ui80")] },
  { key: "aac", title: t("product.ui81"), text: t("product.ui82"), image: "/app-illustrations/guide-aac-home.webp", categories: ["start", "aac", "home"], steps: [t("product.ui83"), t("product.ui84"), t("product.ui85"), t("product.ui86")] },
  { key: "steps", title: t("product.ui87"), text: t("product.ui88"), image: "/app-illustrations/guide-small-steps.webp", categories: ["start", "home", "behavior"], steps: [t("product.ui89"), t("product.ui90"), t("product.ui91"), t("product.ui92")] },
] as const;

export function GuidesExperience({ onNavigate }: SharedProps) {
  const locale = useLocale();
  const guideCards = getGuideCards();
  const [category, setCategory] = useState("start");
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const categories = [
    ["start", t("product.ui93"), Home], ["communication", t("product.ui94"), MessageCircle], ["aac", "AAC", ImageIcon], ["behavior", t("product.ui95"), Settings], ["home", t("product.ui96"), BookOpen],
  ] as const;
  const selectedGuide = guideCards.find((guide) => guide.key === openGuide);
  return <div className="v2-screen v2-guides page-enter">
    <header className="v2-page-heading"><h1>{t("product.ui97")}</h1><p>{t("product.ui98")}</p></header>
    <div className="v2-guide-tabs" role="tablist">{categories.map(([id, label, Icon]) => <button key={id} role="tab" aria-selected={category === id} className={category === id ? "active" : ""} onClick={() => setCategory(id)}><Icon/>{label}</button>)}</div>
    <section className="v2-guide-hero"><Image src={guideCards[0].image} alt={t("product.ui99")} fill priority sizes="(max-width: 900px) 100vw, 80vw"/><div className="v2-guide-hero-copy"><span><Star fill="currentColor"/>  {t("product.ui100")}</span><h2>{t("product.ui101")}<br/>{t("product.ui102")}</h2><p>{t("product.ui103")}</p><button onClick={() => setOpenGuide("help")}>{t("product.ui104")} <ArrowRight/></button></div></section>
    <section className="v2-guide-grid" aria-label={t("product.ui105")}>{guideCards.filter((guide) => guide.categories.some((item) => item === category) && guide.key !== "help").map((guide) => <button key={guide.key} onClick={() => setOpenGuide(guide.key)}><span><Image src={guide.image} alt="" fill sizes="(max-width: 760px) 100vw, 25vw"/></span><div><strong>{guide.title}</strong><small>{guide.text}</small></div><ChevronRight/></button>)}</section>
    {selectedGuide && <div className="v2-guide-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpenGuide(null); }}><article className="v2-guide-modal" role="dialog" aria-modal="true" aria-labelledby="v2-guide-modal-title"><button className="v2-guide-close" onClick={() => setOpenGuide(null)} aria-label={t("product.ui106")}>×</button><div className="v2-guide-modal-copy"><span className="v2-kicker">{t("product.ui107")}</span><h2 id="v2-guide-modal-title">{selectedGuide.title}</h2><p>{selectedGuide.text}</p>{locale === "kk-KZ" && <p role="status">{t("product.guideReview")}</p>}<ol>{selectedGuide.steps.map((step) => <li key={step}>{step}</li>)}</ol><button onClick={() => { setOpenGuide(null); onNavigate(selectedGuide.key === "steps" ? "progress" : selectedGuide.key === "aac" ? "aac" : "goals"); }}>{t("product.ui108")} <ArrowRight/></button></div></article></div>}
    <aside className="v2-guide-note"><BellRing/><div><strong>{t("product.ui109")}</strong><p>{t("product.ui110")}</p></div></aside>
  </div>;
}
