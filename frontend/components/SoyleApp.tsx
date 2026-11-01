"use client";
import { TranslationEditor } from "./TranslationEditor";
import { LanguagePicker } from "./LanguagePicker";

import { ExercisePetProvider, ExercisePet, useExercisePet } from "./pet/ExercisePet";
import { usePetPreferences } from "./pet/usePetPreferences";
import { PetSettings } from "./pet/PetSettings";
import { useRefreshOnReturn } from "@/lib/hooks/useRefreshOnReturn";
import { ChildSettingToggle } from "./ChildSettingToggle";
import { ChildRoomHome } from "./ChildRoomHome";
import { StarReward, StarVault } from "./StarReward";
import { savedReward } from "@/lib/rewards";
import { ExplorationExercise } from "./ExplorationExercise";
import { VocabularyProgress } from "./VocabularyProgress";
import { ObservationExercise } from "./ObservationExercise";
import { speak, stopCurrentSpeech } from "@/lib/speech";
import { nextPetPhrase } from "@/lib/pet";

import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Apple,
  Activity,
  Angry,
  Armchair,
  Backpack,
  Banana,
  Baby,
  Bird,
  BarChart3,
  BedDouble,
  Bed,
  Building2,
  BookOpen,
  Bell,
  Blocks,
  Bot,
  Bug,
  Camera,
  Car,
  Cat,
  Check,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleX,
  CircleUserRound,
  Clock3,
  CircleHelp,
  Coffee,
  Contact,
  CookingPot,
  Croissant,
  CupSoda,
  CreditCard,
  Dog,
  Drum,
  Ear,
  Eye,
  EyeOff,
  Fish,
  Flame,
  Frown,
  FerrisWheel,
  Gamepad2,
  GlassWater,
  Glasses,
  Hand,
  HandHeart,
  HandHelping,
  Heart,
  HeartPulse,
  Home,
  House,
  ImageIcon,
  KeyRound,
  LampDesk,
  Laugh,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  PanelLeftClose,
  MapPin,
  Meh,
  MessageCircle,
  Milk,
  Mic2,
  Parentheses,
  Pause,
  Paintbrush,
  PackageOpen,
  PersonStanding,
  Play,
  Plus,
  RotateCcw,
  School,
  ShoppingCart,
  Search,
  Settings,
  Shirt,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Snowflake,
  Soup,
  Sparkles,
  Star,
  TableProperties,
  Target,
  Timer,
  ThermometerSnowflake,
  ThermometerSun,
  Toilet,
  Puzzle,
  Rabbit,
  Snail,
  Trees,
  TrendingUp,
  Trophy,
  Turtle,
  Utensils,
  Users,
  UserRound,
  UserRoundCheck,
  Volleyball,
  Undo2,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { api, ApiError, AACCard, AIAnswer, type AdaptivePlan, AppSettings, Child, ChildConsent, clearLegacyAuth, Dashboard, Exercise, LearningSession, NotificationsData, Role, SkillProgress, User } from "@/lib/api";
import { compressPhoto } from "@/lib/imageUpload";
import { composeAACMessage } from "@/lib/aacGrammar";
import { canAddAACScenarioCard, evaluateAACScenario, scenarioCardLabel } from "@/lib/aacScenarioRuntime";
import { t, formatDate, getLocale, languageOf, normalizeLocale, setLocale, supportedInterfaceLanguages, useLocale } from "@/lib/i18n";
import { exerciseCountLabel, SESSION_EXERCISE_COUNTS } from "@/lib/homePractice";
import { nextIncompleteExerciseIndex, reconcileActiveSession, summarizeSessionResults } from "@/lib/sessionRuntime";
import { categoriesToScores, evaluateMotorMovement, mergeBaseline, targetForSequenceStep, type BlendshapeScores } from "@/lib/motorDetection";
import { newAnswerEvidence, withSupport, withResponse, responseOutcome } from "@/lib/answerEvidence";
import { chooseRoundMedia, createChoiceRound, resolveDifficulty, shuffleWithRandom as shuffled } from "@/lib/exerciseRuntime";
import { PracticeLength } from "@/components/PracticeLength";
import { VariedExerciseRunner } from "@/components/VariedExerciseRunner";
import { variedMechanics, type VariedMechanic } from "@/lib/variedRuntime";
import { PublishedInstructionRunner, type DraftExerciseVersion } from "@/components/P1ExerciseRunners";
import { ContentReviewWorkspace, HomeActivityReviewPreview, type ContentReviewWorkspaceData, type HomeActivityDraft } from "@/components/ContentReviewWorkspace";
import { FunctionalSkillMap, HomePracticeLibrary } from "@/components/FamilyPractice";
import { GoalsAndPractice } from "@/components/GoalsAndPractice";
import { AdminShell, ChildShell, ExerciseFocusShell, ParentShell } from "@/components/AppShells";
import { AchievementsExperience } from "@/components/AchievementsExperience";
import { ParentOverview } from "@/components/ParentOverview";
import { InteractiveBook } from "./storybook/book/InteractiveBook";
import { StoryExperience } from "@/components/StoryExperience";
import { WorldExperience } from "@/components/WorldExperience";
import {
  GuidesExperience,
} from "@/components/ProductExperience";

import { AccountMenu, SectionNavigation, familyNavigation, familySection } from "./AppNavigation";

import { ParentProgress } from "./ParentProgress";
import { ParentCabinetOverview } from "./ParentCabinetOverview";

type Screen = "learn" | "my-world" | "success" | "comic-preview" | "story-preview" | "home" | "stories" | "world" | "skills" | "achievements" | "guides" | "games" | "session" | "exercise-complete" | "motor" | "sensory" | "mixed" | "aac" | "ai" | "progress" | "goals" | "parent" | "profile" | "settings" | "more" | "admin";
type ModuleName = "motor" | "sensory" | "mixed";
type GameMeasurement = { attempts_count?: number; correct_answers?: number; prompts_used?: number; gameplay_choices?: number; independent_completions?: number; prompted_completions?: number; attempt_status?: "completed" | "participated" | "refused" | "break" | "technical_error"; independence?: number; prompt_level?: "independent" | "minimal" | "full"; response_ms?: number; communication_initiatives?: number };
type ExerciseCompletion = { refused?: boolean; title: string; message: string; nextExercise: Exercise | null; sessionMode: boolean; sessionFinished: boolean };
type ParentPracticeMode = "adult_preview" | "child_practice";
type SessionSaveResult = { awarded_stars: number; score: number; duration_seconds: number; attempt_status: GameMeasurement["attempt_status"]; created_at: string; preview?: boolean };
const defaultSettings: AppSettings = { camera_enabled: false, sound_enabled: true, calm_mode: false, theme: "peach", language: "ru" };

const modules = [
  {
    id: "sensory" as const,
    get title() { return t("module.sensory.title"); },
    get eyebrow() { return t("module.sensory.eyebrow"); },
    get description() { return t("module.sensory.description"); },
    accent: "blue",
    progress: 0,
    get time() { return t("module.sensory.time"); },
  },
  {
    id: "mixed" as const,
    get title() { return t("module.mixed.title"); },
    get eyebrow() { return t("module.mixed.eyebrow"); },
    get description() { return t("module.mixed.description"); },
    accent: "mint",
    progress: 0,
    get time() { return t("module.mixed.time"); },
  },
];
function BrandIcon({ size = 26 }: { size?: number }) {
  return <BrandLogo variant="icon" width={size} decorative />;
}

function ModuleGlyph({ module, size = 30 }: { module: ModuleName; size?: number }) {
  const Icon = module === "motor" ? Mic2 : module === "sensory" ? Ear : MessageCircle;
  return <span className={`module-glyph ${module}`} aria-hidden="true"><Icon size={size} strokeWidth={1.8}/><i/></span>;
}

import { SpecialistWorkspace, FamilySpecialistAccess, ParentAccountDeletion } from "./SpecialistWorkspace";
import { CabinetNavigation, useCabinetSection } from "./CabinetNavigation";
import { SpecialistInvitation } from "./SpecialistInvitation";
import { AdminContentQueue } from "./AdminContentQueue";

export function SoyleApp() {
  useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authActionError, setAuthActionError] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  useEffect(() => {
    const read = () => setInvitationToken(new URLSearchParams(window.location.hash.slice(1)).get("invite") || "");
    read(); window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    clearLegacyAuth();
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    api<User>("/api/auth/me", { signal: controller.signal })
      .then((currentUser) => { if (active) setUser(currentUser); })
      .catch(() => undefined)
      .finally(() => { window.clearTimeout(timeout); if (active) setAuthLoading(false); });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const localDevelopmentHosts = new Set(["localhost", "127.0.0.1"]);
    if (process.env.NODE_ENV !== "production" || localDevelopmentHosts.has(window.location.hostname)) {
      const removeStaleLocalWorker = async () => {
        const hadController = Boolean(navigator.serviceWorker.controller);
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter((cacheName) => cacheName.startsWith("soyle-"))
              .map((cacheName) => caches.delete(cacheName)),
          );
        }

        const reloadGuard = "soyle-local-worker-cleared-v1";
        if (hadController && !window.sessionStorage.getItem(reloadGuard)) {
          window.sessionStorage.setItem(reloadGuard, "1");
          window.location.reload();
        }
      };

      void removeStaleLocalWorker().catch(() => undefined);
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => undefined);
  }, []);

  if (authLoading) return <div className="auth-loading"><div className="brand-mark"><BrandIcon /></div><span>{t("screen.SoyleApp.ui1")}</span></div>;
  const logout = async () => {
    stopCurrentSpeech();
    setAuthActionError("");
    try {
      await api("/api/auth/logout", { method: "POST" });
      clearLegacyAuth();
      setUser(null);
    } catch (cause) {
      setAuthActionError(cause instanceof Error ? t("shell.template1", { v0: cause.message }) : t("screen.SoyleApp.ui2"));
    }
  };
  const invitation = invitationToken ? <SpecialistInvitation token={invitationToken} user={user} onClose={() => { setInvitationToken(""); window.history.replaceState(null, "", window.location.pathname + window.location.search); }}/> : null;
  if (!user) return <>{invitation}<AuthScreen onAuthenticated={setUser} /></>;
  if (user.role === "specialist") return <>{invitation}<SpecialistWorkspace user={user} onLogout={logout}/>{authActionError && <p role="alert">{authActionError}</p>}</>;
  return <>{invitation}<AuthenticatedApp user={user} onLogout={logout} externalError={authActionError} onDismissExternalError={() => setAuthActionError("")} /></>;
}

function AuthenticatedApp({ user, onLogout, externalError, onDismissExternalError }: { user: User; onLogout: () => void; externalError: string; onDismissExternalError: () => void }) {
  const [screen, setScreen] = useState<Screen>(() => user.role === "admin" ? "admin" : user.role === "parent" && new URLSearchParams(window.location.search).get("cabinet") === "parent" ? "parent" : "home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [childNavigationCollapsed, setChildNavigationCollapsed] = useState(false);
  const [compactNavigation, setCompactNavigation] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarCloseRef = useRef<HTMLButtonElement>(null);
  const sidebarBrandRef = useRef<HTMLButtonElement>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(() => user.child_id || (user.role === "parent" ? Number(new URLSearchParams(window.location.search).get("child")) || null : null));
  useEffect(() => {
    if (user.role !== "parent") return;
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      setScreen(params.get("cabinet") === "parent" ? "parent" : "home");
      const childId = Number(params.get("child"));
      if (childId > 0) setSelectedChildId(childId);
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [user.role]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [sessionExerciseActive, setSessionExerciseActive] = useState(false);
  const [activeSessionLoading, setActiveSessionLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [exerciseCompletion, setExerciseCompletion] = useState<ExerciseCompletion | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState<3 | 5 | 10>(5);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [notifications, setNotifications] = useState<NotificationsData>({ unread: 0, items: [] });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [reward, setReward] = useState<{ stars: number; nonce: string; total: number; childId: number } | null>(null);
  const celebratedEvents = useRef(new Set<string>());
  const dismissReward = useCallback(() => setReward(null), []);
  const gameStartedAtRef = useRef(0);
  const variedStopRef = useRef<((status: "break" | "refused") => Promise<void>) | null>(null);
  const pendingAttemptRef = useRef<{ key: string; body: string } | null>(null);
  const savingAttemptRef = useRef(false);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [childrenError, setChildrenError] = useState("");
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const settingsRef = useRef<AppSettings>(defaultSettings);
  const persistedSettingsRef = useRef<AppSettings>(defaultSettings);
  const settingsSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const settingsSaveVersionRef = useRef(0);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [consent, setConsent] = useState<ChildConsent | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [parentPracticeMode, setParentPracticeMode] = useState<ParentPracticeMode>("adult_preview");
  const [focusStopping, setFocusStopping] = useState(false);
  const interfaceLocale = useLocale();

  useEffect(() => {
    if (user.role !== "student" || screen !== "more") return;
    const mobile = window.matchMedia("(max-width: 760px)");
    const leaveMobileMore = () => { if (!mobile.matches) setScreen("home"); };
    mobile.addEventListener("change", leaveMobileMore);
    const timer = window.setTimeout(leaveMobileMore, 0);
    return () => { window.clearTimeout(timer); mobile.removeEventListener("change", leaveMobileMore); };
  }, [screen, user.role]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.calm = settings.calm_mode ? "true" : "false";
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    const updateConnection = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) setSessionError((current) => current.includes(t("screen.AuthenticatedApp.ui1")) ? t("screen.AuthenticatedApp.ui2") : current);
    };
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1050px)");
    const update = () => setCompactNavigation(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const childRail = user.role === "student" && childNavigationCollapsed && !compactNavigation;
  const sidebarIsDialog = compactNavigation;
  const navigationHidden = sidebarIsDialog && !sidebarOpen;
  useEffect(() => {
    if (!sidebarIsDialog || !sidebarOpen) return;
    sidebarCloseRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
      if (event.key === "Tab") {
        const controls = Array.from(document.querySelectorAll<HTMLButtonElement>('#primary-navigation button:not([disabled])')).filter(button => button.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sidebarIsDialog, sidebarOpen]);
  const loadChildren = useCallback(() => {
    if (!["parent", "student"].includes(user.role)) { setChildrenLoading(false); return; }
    setChildrenLoading(true);
    setChildrenError("");
    api<Child[]>("/api/children")
      .then((items) => { setChildren(items); setSelectedChildId((current) => items.some(item => item.id === current) ? current : items[0]?.id || null); })
      .catch((cause) => { setChildrenError(cause instanceof Error ? cause.message : t("screen.AuthenticatedApp.ui3")); })
      .finally(() => setChildrenLoading(false));
  }, [user.role]);
  useEffect(() => {
    const timer = window.setTimeout(loadChildren, 0);
    return () => window.clearTimeout(timer);
  }, [loadChildren]);
  useEffect(() => {
    const requestVersion = settingsSaveVersionRef.current;
    api<AppSettings>("/api/settings").then(async (value) => {
      if (requestVersion !== settingsSaveVersionRef.current) return;
      const language = value.language_configured === false ? languageOf(getLocale()) : (supportedInterfaceLanguages.includes(value.language) ? value.language : "ru");
      const resolved = { ...value, language };
      if (value.language_configured === false && localStorage.getItem("soyle-language")) await api<AppSettings>("/api/settings", { method: "PUT", body: JSON.stringify(resolved) });
      if (requestVersion !== settingsSaveVersionRef.current) return;
      settingsRef.current = resolved;
      persistedSettingsRef.current = resolved;
      setSettings(resolved);
      setLocale(language, value.language_configured !== false || Boolean(localStorage.getItem("soyle-language")));
      if (value.language_configured) window.dispatchEvent(new Event("soyle-profile-locale"));
    }).catch((cause) => {
      setSettings({ ...defaultSettings, language: languageOf(getLocale()) });
      setRequestError(cause instanceof Error ? t("shell.template2", { v0: cause.message }) : t("screen.AuthenticatedApp.ui4"));
    });
  }, []);
  const loadNotifications = useCallback(() => {
    if (user.role === "parent") api<NotificationsData>("/api/notifications").then(setNotifications).catch((cause) => {
      setRequestError(cause instanceof Error ? t("shell.template3", { v0: cause.message }) : t("screen.AuthenticatedApp.ui5"));
    });
  }, [user.role]);
  useEffect(loadNotifications, [loadNotifications]);

  const familyRole = user.role === "student" || user.role === "parent";
  const navigation: { id: Screen; label: string; icon: typeof Home }[] = familyRole
    ? familyNavigation(user.role)
    : [{ id: "admin", label: t("nav.admin"), icon: LayoutDashboard }];

  const child = children.find((item) => item.id === selectedChildId) || children[0];
  const petPreferences = usePetPreferences(["student", "parent"].includes(user.role) ? child?.id : undefined);

  useEffect(() => {
    const path = ["parent", "student"].includes(user.role) && selectedChildId
      ? `/api/exercises?child_id=${selectedChildId}`
      : "/api/exercises";
    let active = true;
    api<Exercise[]>(path).then(value => { if (active) setExercises(value); }).catch((cause) => {
      if (!active) return;
      setExercises([]);
      setRequestError(cause instanceof Error ? t("shell.template4", { v0: cause.message }) : t("screen.AuthenticatedApp.ui6"));
    });
    return () => { active = false; };
  }, [selectedChildId, user.role, catalogRevision, interfaceLocale]);

  useEffect(() => {
    if (!child?.id || !["parent", "student"].includes(user.role)) {
      queueMicrotask(() => setConsent(null));
      return;
    }
    let active = true;
    api<ChildConsent>(`/api/children/${child.id}/consent`).then(value => { if (active) setConsent(value); }).catch((cause) => {
      if (!active) return;
      setConsent(null);
      setRequestError(cause instanceof Error ? t("shell.template5", { v0: cause.message }) : t("screen.AuthenticatedApp.ui7"));
    });
    return () => { active = false; };
  }, [child?.id, user.role, catalogRevision]);

  useEffect(() => {
    if (!child?.id) { queueMicrotask(() => setActiveSessionLoading(false)); return; }
    let cancelled = false;
    api<LearningSession | null>(`/api/children/${child.id}/active-session`).then((session) => {
      if (cancelled) return;
      setActiveSession(current => reconcileActiveSession(current, session, child.id, ["session", "exercise-complete"].includes(screen)));
      if (session && session.status !== "completed") setDailyMinutes(session.target_minutes);
    }).catch((cause) => {
      if (cancelled) return;
      setRequestError(cause instanceof Error ? t("shell.template6", { v0: cause.message }) : t("screen.AuthenticatedApp.ui8"));
    }).finally(() => { if (!cancelled) setActiveSessionLoading(false); });
    return () => { cancelled = true; };
  }, [child?.id, screen, catalogRevision]);

  const refreshDashboard = useCallback(() => {
    if (child?.id) api<Dashboard>(`/api/dashboard/${child.id}`).then(setDashboard).catch((cause) => {
      setRequestError(cause instanceof Error ? t("shell.template7", { v0: cause.message }) : t("screen.AuthenticatedApp.ui9"));
    });
  }, [child]);
  useEffect(refreshDashboard, [refreshDashboard]);
  const refreshPracticeOnReturn = useCallback(() => {
    setCatalogRevision(value => value + 1);
    refreshDashboard();
    loadNotifications();
  }, [refreshDashboard, loadNotifications]);
  useRefreshOnReturn(refreshPracticeOnReturn, Boolean(child?.id) && ["parent", "student"].includes(user.role));

  const saveSession = async (exerciseId: number, module: ModuleName, score: number, details: Record<string, unknown>, measurement: GameMeasurement = {}) => {
    if (!child || !exerciseId) return;
    setSessionError("");
    const startedAt = gameStartedAtRef.current || Date.now();
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    if (user.role === "parent" && parentPracticeMode === "adult_preview") {
      const currentIndex = exercises.findIndex((item) => item.id === exerciseId);
      const nextExercise = currentIndex >= 0 ? exercises[currentIndex + 1] || null : null;
      const previewResult: SessionSaveResult = {
        awarded_stars: 0,
        score,
        duration_seconds: durationSeconds,
        attempt_status: measurement.attempt_status || "completed",
        created_at: new Date().toISOString(),
        preview: true,
      };
      setExerciseCompletion({
        title: t("screen.AuthenticatedApp.ui10"),
        message: t("screen.AuthenticatedApp.ui11"),
        nextExercise,
        sessionMode: false,
        sessionFinished: false,
      });
      setScreen("exercise-complete");
      return previewResult;
    }
    if (!consent?.privacy_accepted) {
      setSessionError(user.role === "parent" ? t("screen.AuthenticatedApp.ui12") : t("screen.AuthenticatedApp.ui13"));
      return null;
    }
    if (!navigator.onLine) {
      setSessionError(t("screen.AuthenticatedApp.ui14"));
      return null;
    }
    const sequenceIndex = sessionExerciseActive ? activeSession?.exercises.findIndex((item) => item.id === exerciseId) : undefined;
    const supportContext = user.role === "student"
      ? "independent"
      : measurement.prompt_level === "full"
        ? "caregiver_modelled"
        : measurement.prompt_level === "minimal"
          ? "caregiver_supported"
          : "independent";
    if (savingAttemptRef.current) return null;
    const attemptKey = `${child.id}:${exerciseId}:${gameStartedAtRef.current}:${measurement.attempt_status || "completed"}`;
    if (pendingAttemptRef.current?.key !== attemptKey) {
      pendingAttemptRef.current = { key: attemptKey, body: JSON.stringify({ child_id: child.id, exercise_id: exerciseId, module, score, duration_seconds: durationSeconds, details, ...measurement, event_id: crypto.randomUUID(), actor_role: user.role, response_owner: "child", support_context: supportContext, learning_session_id: sessionExerciseActive ? activeSession?.id || null : null, sequence_index: sequenceIndex !== undefined && sequenceIndex >= 0 ? sequenceIndex : null }) };
    }
    savingAttemptRef.current = true;
    const result = await api<SessionSaveResult>("/api/sessions", { method: "POST", body: pendingAttemptRef.current.body }).catch(async (cause) => {
      if (cause instanceof ApiError && cause.status === 409 && sessionExerciseActive && activeSession) {
        if (["refused", "break"].includes(measurement.attempt_status || "")) {
          await api(`/api/learning-sessions/${activeSession.id}/pause`, { method: "PATCH", body: JSON.stringify({ paused: true }) }).catch(() => null);
        }
        const refreshed = await api<LearningSession>(`/api/learning-sessions/${activeSession.id}`).catch(() => null);
        if (refreshed) { setActiveSession(refreshed); setSessionExerciseActive(false); setScreen("session"); }
        setSessionError(`${cause.message}. ${refreshed ? t("screen.AuthenticatedApp.ui15") : t("screen.AuthenticatedApp.ui16")}`);
        return null;
      }
      setSessionError(t("shell.template8", { v0: cause instanceof Error ? cause.message : t("screen.AuthenticatedApp.ui17") }));
      return null;
    }).finally(() => { savingAttemptRef.current = false; });
    if (result) {
      const eventId = pendingAttemptRef.current ? JSON.parse(pendingAttemptRef.current.body).event_id as string : "";
      const stars = savedReward(result, eventId, celebratedEvents.current);
      if (stars > 0) setReward({ stars, nonce: eventId, total: (dashboard?.stars || 0) + stars, childId: child.id });
      gameStartedAtRef.current = Date.now();
      refreshDashboard();
      loadNotifications();
      if (sessionExerciseActive && activeSession && sequenceIndex !== undefined && sequenceIndex >= 0) {
        const advancesSession = ["completed", "participated", "refused"].includes(result.attempt_status || "completed");
        const updatedResults = [...(activeSession.results || []), { exercise_id: exerciseId, score: result.score, duration_seconds: result.duration_seconds, attempt_status: result.attempt_status, created_at: result.created_at }];
        const exerciseIds = activeSession.exercises.map((exercise) => exercise.id);
        const nextIndex = advancesSession ? nextIncompleteExerciseIndex(updatedResults, exerciseIds) : activeSession.current_index;
        const updatedSession = { ...activeSession, current_index: nextIndex, status: nextIndex >= activeSession.exercises.length ? "completed" as const : ["refused", "break", "technical_error"].includes(result.attempt_status || "") ? "paused" as const : "in_progress" as const, results: updatedResults };
        setActiveSession(updatedSession);
        if (!advancesSession) return result;
        setExerciseCompletion({
          refused: result.attempt_status === "refused",
          title: result.attempt_status === "refused" ? t("screen.AuthenticatedApp.ui18") : t("screen.AuthenticatedApp.ui19"),
          message: result.attempt_status === "refused" ? t("screen.AuthenticatedApp.ui20") : t("screen.AuthenticatedApp.ui21"),
          nextExercise: updatedSession.exercises[nextIndex] || null,
          sessionMode: true,
          sessionFinished: nextIndex >= updatedSession.exercises.length,
        });
        setScreen("exercise-complete");
      } else if (["completed", "participated", "refused"].includes(result.attempt_status || "completed")) {
        const currentIndex = exercises.findIndex((item) => item.id === exerciseId);
        const nextExercise = currentIndex >= 0 ? exercises[currentIndex + 1] || null : null;
        setExerciseCompletion({
          refused: result.attempt_status === "refused",
          title: result.attempt_status === "refused" ? t("screen.AuthenticatedApp.ui18") : t("screen.AuthenticatedApp.ui22"),
          message: result.attempt_status === "refused" ? t("screen.AuthenticatedApp.ui23") : t("screen.AuthenticatedApp.ui24"),
          nextExercise,
          sessionMode: false,
          sessionFinished: false,
        });
        setScreen("exercise-complete");
      }
    }
    return result;
  };

  const startDailySession = async () => {
    if (!child || sessionLoading) return;
    if (user.role === "parent") setParentPracticeMode("child_practice");
    setSessionLoading(true); setSessionError("");
    try {
      if (!consent?.privacy_accepted) throw new Error(user.role === "parent" ? t("screen.AuthenticatedApp.ui25") : t("screen.AuthenticatedApp.ui26"));
      const existing = await api<LearningSession | null>(`/api/children/${child.id}/active-session`);
      if (existing) {
        setActiveSession(existing);
        setScreen("session");
        return;
      }
      const plan = await api<AdaptivePlan>(`/api/adaptive-plans/${child.id}`, { method: "POST", body: JSON.stringify({ target_minutes: dailyMinutes }) });
      if (!plan.items.length) throw new Error(plan.notices[0]?.message || t("screen.AuthenticatedApp.ui27"));
      const created = await api<LearningSession>("/api/learning-sessions", { method: "POST", body: JSON.stringify({ child_id: child.id, exercise_ids: plan.items.map((item) => item.exercise_id), target_minutes: plan.target_minutes, adaptive_plan_id: plan.id }) });
      setActiveSession({ ...created, results: [] });
      setScreen("session");
    } catch (cause) {
      setSessionError(cause instanceof Error ? cause.message : t("screen.AuthenticatedApp.ui28"));
    } finally { setSessionLoading(false); }
  };

  const startPreparedPlan = async (plan: AdaptivePlan) => {
    if (!child || !plan.items.length) throw new Error(t("screen.AuthenticatedApp.ui29"));
    if (!consent?.privacy_accepted) throw new Error(t("screen.AuthenticatedApp.ui30"));
    if (user.role === "parent") setParentPracticeMode("child_practice");
    const existing = await api<LearningSession | null>(`/api/children/${child.id}/active-session`);
    if (existing) {
      if (existing.adaptive_plan_id !== plan.id) throw new Error(t("screen.AuthenticatedApp.ui31"));
      setActiveSession(existing);
      setScreen("session");
      return;
    }
    const created = await api<LearningSession>("/api/learning-sessions", {
      method: "POST",
      body: JSON.stringify({ child_id: child.id, exercise_ids: plan.items.map((item) => item.exercise_id), target_minutes: plan.target_minutes, adaptive_plan_id: plan.id }),
    });
    setActiveSession({ ...created, results: [] });
    setScreen("session");
  };

  const continueSession = async () => {
    if (!activeSession || sessionLoading) return;
    setSessionLoading(true); setSessionError("");
    setScreen("session");
    try {
      if (activeSession.status === "paused") await api(`/api/learning-sessions/${activeSession.id}/pause`, { method: "PATCH", body: JSON.stringify({ paused: false }) });
      const refreshed = await api<LearningSession>(`/api/learning-sessions/${activeSession.id}`);
      setActiveSession(refreshed);
      if (refreshed.status === "completed" || refreshed.current_index >= refreshed.exercises.length) return;
      if (refreshed.status === "paused") throw new Error(t("screen.AuthenticatedApp.ui32"));
      const exercise = refreshed.exercises[refreshed.current_index];
      setSessionExerciseActive(true);
      setSelectedExercise(exercise);
      gameStartedAtRef.current = Date.now();
      setScreen(exercise.module);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setSessionError(cause instanceof Error ? cause.message : t("screen.AuthenticatedApp.ui33"));
    } finally { setSessionLoading(false); }
  };

  const pauseSession = async () => {
    if (sessionLoading) return;
    if (!activeSession || activeSession.status === "completed") { setActiveSession(null); setScreen("home"); return; }
    setSessionLoading(true); setSessionError("");
    try {
      const value = await api<{ status: "paused" }>(`/api/learning-sessions/${activeSession.id}/pause`, { method: "PATCH", body: JSON.stringify({ paused: true }) });
      setActiveSession({ ...activeSession, status: value.status });
      setScreen("home");
    } catch (cause) {
      setSessionError(cause instanceof Error ? cause.message : t("screen.AuthenticatedApp.ui34"));
    } finally { setSessionLoading(false); }
  };

  const resumeSession = async () => {
    if (!activeSession || !child || sessionLoading) return;
    setSessionLoading(true); setSessionError("");
    if (user.role === "parent") setParentPracticeMode("child_practice");
    try {
      if (activeSession.status === "paused") await api(`/api/learning-sessions/${activeSession.id}/pause`, { method: "PATCH", body: JSON.stringify({ paused: false }) });
      const refreshed = await api<LearningSession | null>(`/api/children/${child.id}/active-session`);
      if (!refreshed) {
        setActiveSession(null);
        setSessionError(t("screen.AuthenticatedApp.ui35"));
        return;
      }
      setActiveSession(refreshed);
      setScreen("session");
    } catch (cause) {
      setSessionError(cause instanceof Error ? cause.message : t("screen.AuthenticatedApp.ui36"));
    } finally {
      setSessionLoading(false);
    }
  };

  const markNotificationRead = async (id: number) => {
    if (notifications.items.find((item) => item.id === id)?.is_read) return;
    setRequestError("");
    try {
      await api(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((current) => ({ unread: Math.max(0, current.unread - (current.items.find((item) => item.id === id && !item.is_read) ? 1 : 0)), items: current.items.map((item) => item.id === id ? { ...item, is_read: true } : item) }));
    } catch (cause) {
      setRequestError(cause instanceof Error ? t("shell.template9", { v0: cause.message }) : t("screen.AuthenticatedApp.ui37"));
    }
  };
  const markAllNotificationsRead = async () => {
    setRequestError("");
    try {
      await api("/api/notifications/actions/read-all", { method: "PATCH" });
      setNotifications((current) => ({ unread: 0, items: current.items.map((item) => ({ ...item, is_read: true })) }));
    } catch (cause) {
      setRequestError(cause instanceof Error ? t("shell.template10", { v0: cause.message }) : t("screen.AuthenticatedApp.ui38"));
    }
  };

  const changeSettings = (next: AppSettings) => {
    const version = ++settingsSaveVersionRef.current;
    settingsRef.current = next;
    setSettings(next);
    setLocale(next.language);
    setSettingsSaving(true);
    setRequestError("");
    settingsSaveQueueRef.current = settingsSaveQueueRef.current.then(async () => {
      try {
        const saved = await api<AppSettings>("/api/settings", { method: "PUT", body: JSON.stringify(next) });
        persistedSettingsRef.current = saved;
        if (version === settingsSaveVersionRef.current) {
          settingsRef.current = saved;
          setSettings(saved);
        }
      } catch (cause) {
        if (version === settingsSaveVersionRef.current) {
          settingsRef.current = persistedSettingsRef.current;
          setSettings(persistedSettingsRef.current);
          setLocale(persistedSettingsRef.current.language);
          setRequestError(cause instanceof Error ? t("shell.template11", { v0: cause.message }) : t("screen.AuthenticatedApp.ui39"));
        }
      } finally {
        if (version === settingsSaveVersionRef.current) setSettingsSaving(false);
      }
    });
  };

  useEffect(() => {
    const selected = () => changeSettings({ ...settingsRef.current, language: languageOf(getLocale()) });
    window.addEventListener("soyle-language-selected", selected);
    return () => window.removeEventListener("soyle-language-selected", selected);
  });

  if (user.role === "parent" && childrenLoading) return <div className="auth-loading"><div className="brand-mark"><BrandIcon /></div><span>{t("screen.AuthenticatedApp.ui40")}</span></div>;
  if (["parent", "student"].includes(user.role) && childrenError) return <div className="auth-loading" role="alert"><ShieldAlert size={30}/><span>{childrenError}</span><button className="primary-button" onClick={loadChildren}>{t("screen.AuthenticatedApp.ui41")}</button></div>;
  if (user.role === "parent" && !children.length) return <ChildOnboarding user={user} onCreated={(newChild) => { setChildren([newChild]); setSelectedChildId(newChild.id); }} onLogout={onLogout} />;

  const openScreen = (next: Screen, cabinetSection = "overview") => {
    if (user.role === "parent") {
      const url = new URL(window.location.href);
      if (next === "parent") { url.searchParams.set("cabinet", "parent"); url.searchParams.set("section", cabinetSection); }
      else if (!["story-preview", "comic-preview"].includes(next)) { url.searchParams.delete("cabinet"); url.searchParams.delete("section"); }
      window.history.pushState(null, "", url);
      if (next === "parent" && screen === "parent") window.dispatchEvent(new PopStateEvent("popstate"));
    }
    setSessionError("");
    setExerciseCompletion(null);
    if (["motor", "sensory", "mixed"].includes(next)) {
      setSessionExerciseActive(false);
      gameStartedAtRef.current = Date.now();
      setSelectedExercise(exercises.find((item) => item.module === next) || null);
    }
    setScreen(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitGlobalSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = globalSearch.trim().toLocaleLowerCase("ru");
    if (!query) return;
    if (/истор|сюжет|оқиға|ертегі/.test(query)) openScreen("stories");
    else if (/фото|мир|люд|мест|вещ|әлем|адам|орын|зат/.test(query)) openScreen("world");
    else if (/навык|прогресс|карт|дағды|ілгері/.test(query)) openScreen("skills");
    else if (/гайд|родител|совет|помощ|нұсқаулық|ата-ана|кеңес|көмек/.test(query)) openScreen("guides");
    else if (/слово|aac|общен|сказать|сөз|қарым|айту/.test(query)) openScreen("aac");
    else openScreen("games");
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const openExercise = (exercise: Exercise) => {
    setSessionError("");
    setExerciseCompletion(null);
    setSessionExerciseActive(false);
    setSelectedExercise(exercise);
    gameStartedAtRef.current = Date.now();
    setScreen(exercise.module);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const continueAfterExercise = () => {
    if (!exerciseCompletion) return;
    if (exerciseCompletion.sessionMode) {
      if (exerciseCompletion.sessionFinished || !exerciseCompletion.nextExercise) {
        setExerciseCompletion(null);
        setScreen("session");
        return;
      }
      setExerciseCompletion(null);
      void continueSession();
      return;
    }
    if (exerciseCompletion.nextExercise) {
      setSelectedExercise(exerciseCompletion.nextExercise);
      setSessionExerciseActive(false);
      gameStartedAtRef.current = Date.now();
      setExerciseCompletion(null);
      setScreen(exerciseCompletion.nextExercise.module);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      openScreen("games");
    }
  };

  const exerciseBack = () => sessionExerciseActive && activeSession ? setScreen("session") : openScreen("games");
  const activeExerciseContent = <>
    {screen === "motor" && <MotorGame exercises={exercises.filter((item) => item.module === "motor")} initialExercise={selectedExercise} cameraConsentGranted={Boolean(consent?.privacy_accepted && consent?.camera_processing && settings.camera_enabled)} canManageConsent={user.role === "parent"} onOpenConsent={() => openScreen("parent")} onBack={exerciseBack} onComplete={(score, exerciseId, measurement, details) => saveSession(exerciseId, "motor", score, details || { source: "manual" }, measurement)} />}
    {screen === "sensory" && selectedExercise?.engine?.mechanic === "scene_search" && <ExplorationExercise key={`${selectedExercise.id}-${selectedExercise.engine.version_id}`} content={selectedExercise.engine.content} childId={child?.id} exerciseId={selectedExercise.id} previewVersionId={user.role==='parent'&&parentPracticeMode==='adult_preview'?selectedExercise.engine.version_id:undefined} learningSessionId={sessionExerciseActive?activeSession?.id:undefined} plannedLevel={selectedExercise.adaptive?.difficulty_params.difficulty_level} defaultRounds={selectedExercise.adaptive?.difficulty_params.round_count} soundEnabled={settings.sound_enabled} showStopControls={!(user.role==='student'||parentPracticeMode==='child_practice')} onSpeak={(text,rate)=>speak(text,rate,settings.sound_enabled,selectedExercise?.engine?.language || "ru", "exercise", selectedExercise?.engine?.version_id)} onBack={exerciseBack} onComplete={(measurement,details)=>saveSession(selectedExercise.id,'sensory',0,details,measurement)} stopRef={variedStopRef}/>}
    {screen === "sensory" && selectedExercise?.engine && variedMechanics.includes(selectedExercise.engine.mechanic) && <div className="page-enter game-page"><GameHeader title={selectedExercise.title} subtitle={selectedExercise.instruction} step={t("game.picture")} onBack={exerciseBack}/><VariedExerciseRunner stopRef={variedStopRef} key={`${selectedExercise.id}-${selectedExercise.engine.version_id}`} mechanic={selectedExercise.engine.mechanic as VariedMechanic} content={selectedExercise.engine.content} defaultRounds={selectedExercise.adaptive?.difficulty_params.round_count} soundEnabled={settings.sound_enabled} onSpeak={(text, rate) => speak(text, rate, settings.sound_enabled, selectedExercise?.engine?.language || "ru", "exercise", selectedExercise?.engine?.version_id)} onBack={exerciseBack} onComplete={(measurement, details) => saveSession(selectedExercise.id, "sensory", 0, details, measurement)}/></div>}
    {screen === "sensory" && selectedExercise?.engine?.mechanic === "tap_instruction" ? <div className="page-enter game-page"><GameHeader title={selectedExercise.title} subtitle={t("game.oneStep")} step={t("screen.AuthenticatedApp.ui42")} onBack={exerciseBack}/><PublishedInstructionRunner scenarios={selectedExercise.engine.content.scenarios || []} roundChoices={selectedExercise.engine.content.round_choices} defaultRounds={selectedExercise.adaptive?.difficulty_params.round_count || selectedExercise.engine.content.default_rounds} soundEnabled={settings.sound_enabled} onSpeak={(text, rate) => speak(text, rate, settings.sound_enabled, selectedExercise?.engine?.language || "ru", "exercise", selectedExercise?.engine?.version_id)} onBack={exerciseBack} onComplete={(measurement, details) => saveSession(selectedExercise.id, "sensory", 0, details, measurement)}/></div> : null}
    {screen === "sensory" && selectedExercise?.engine?.mechanic !== "tap_instruction" && selectedExercise?.engine?.mechanic !== "scene_search" && !variedMechanics.includes(selectedExercise?.engine?.mechanic || "") && <SensoryGame key={selectedExercise?.id || "sensory"} exercise={selectedExercise?.module === "sensory" ? selectedExercise : exercises.find((item) => item.module === "sensory")} soundEnabled={settings.sound_enabled} onBack={exerciseBack} onComplete={(score, exerciseId, measurement, details) => saveSession(exerciseId, "sensory", score, details || {}, measurement)} />}
    {screen === "mixed" && selectedExercise?.engine?.content.presentation === "picture_description" && <div className="page-enter game-page"><GameHeader title={selectedExercise.title} subtitle={t("game.describe")} step={t("game.description")} onBack={exerciseBack}/><ObservationExercise language={selectedExercise.engine.language || "ru"} stopRef={variedStopRef} key={`${selectedExercise.id}-${selectedExercise.engine.version_id}`} content={selectedExercise.engine.content} defaultRounds={selectedExercise.adaptive?.difficulty_params.round_count} soundEnabled={settings.sound_enabled} onSpeak={(text, rate) => speak(text, rate, settings.sound_enabled, selectedExercise?.engine?.language || "ru", "exercise", selectedExercise?.engine?.version_id)} onBack={exerciseBack} onComplete={(measurement, details) => saveSession(selectedExercise.id, "mixed", 0, details, measurement)}/></div>}
    {screen === "mixed" && selectedExercise?.engine?.content.presentation !== "picture_description" && <PhraseGame key={selectedExercise?.id || "mixed"} childId={child?.id} canManage={user.role === "parent"} exercise={selectedExercise?.module === "mixed" ? selectedExercise : exercises.find((item) => item.module === "mixed")} soundEnabled={settings.sound_enabled} onBack={exerciseBack} onComplete={(score, phrase, exerciseId, measurement) => saveSession(exerciseId, "mixed", score, { phrase }, measurement)} />}
  </>;
  const isChildExerciseFocus = ["motor", "sensory", "mixed"].includes(screen) && (user.role === "student" || (user.role === "parent" && parentPracticeMode === "child_practice"));
  const focusExercise = selectedExercise || exercises.find((item) => item.module === screen);
  const stopFocusedExercise = async (status: "break" | "refused") => {
    if (focusStopping) return;
    if (focusExercise?.engine && (variedMechanics.includes(focusExercise.engine.mechanic) || focusExercise.engine.mechanic === "scene_search" || focusExercise.engine.content.presentation === "picture_description") && variedStopRef.current) {
      setFocusStopping(true);
      try { await variedStopRef.current(status); } finally { setFocusStopping(false); }
      return;
    }
    if (!focusExercise || !["motor", "sensory", "mixed"].includes(focusExercise.module)) {
      exerciseBack();
      return;
    }
    setFocusStopping(true);
    try {
      const result = await saveSession(focusExercise.id, focusExercise.module, 0, { source: "exercise_focus_shell", reason: "child_choice" }, { attempts_count: 0, correct_answers: 0, prompts_used: 0, attempt_status: status });
      if (result && status === "break") exerciseBack();
    } finally {
      setFocusStopping(false);
    }
  };

  if (screen === "comic-preview" && user.role === "parent") {
    return <InteractiveBook childId={child?.id} storyKey="picnic" onExit={() => openScreen("parent")} calmMode={settings.calm_mode}/>;
  }
  if (screen === "story-preview" && user.role === "parent") {
    return <InteractiveBook childId={child?.id} onExit={() => openScreen("parent")} calmMode={settings.calm_mode}/>;
  }

  if (isChildExerciseFocus) {
    const progress = sessionExerciseActive && activeSession
      ? t("shell.template12", { v0: Math.min(activeSession.current_index + 1, activeSession.exercises.length), v1: activeSession.exercises.length })
      : t("screen.AuthenticatedApp.ui43");
    return <ExercisePetProvider key={`${child?.id}:${focusExercise?.id}`} preferences={{ ...petPreferences.value, visible: petPreferences.ready && petPreferences.value.visible }} soundEnabled={settings.sound_enabled} calmMode={settings.calm_mode}><ExerciseFocusShell
      instruction={focusExercise?.engine?.content.presentation === "picture_description" ? t("screen.AuthenticatedApp.ui44") : focusExercise?.instruction?.split(/(?<=[.!?])\s+/)[0]}
      title={focusExercise?.title || t("screen.AuthenticatedApp.ui45")}
      progress={progress}
      soundEnabled={settings.sound_enabled}
      stopping={focusStopping}
      onBack={exerciseBack}
      onToggleSound={() => changeSettings({ ...settingsRef.current, sound_enabled: !settingsRef.current.sound_enabled })}
      onBreak={() => void stopFocusedExercise("break")}
      onRefuse={() => void stopFocusedExercise("refused")}
    >
      {!isOnline && <div className="offline-banner" role="status"><CircleAlert size={18}/><span><strong>{t("screen.AuthenticatedApp.ui46")}</strong>  {t("screen.AuthenticatedApp.ui47")}</span></div>}
      {externalError && <div className="game-error global-request-error" role="alert"><ShieldAlert size={18}/><span>{externalError}</span><button type="button" className="small-button" onClick={onDismissExternalError}>{t("common.close")}</button></div>}
      {requestError && <div className="game-error global-request-error" role="alert"><ShieldAlert size={18}/><span>{requestError}</span><button type="button" className="small-button" onClick={() => setRequestError("")}>{t("common.close")}</button></div>}
      {sessionError && <div className="game-error" role="alert"><ShieldAlert size={18}/><span>{sessionError}</span></div>}
      {activeExerciseContent}
    </ExerciseFocusShell></ExercisePetProvider>;
  }

  const AppRoleShell = user.role === "student" ? ChildShell : user.role === "admin" ? AdminShell : ParentShell;

  return (
    <AppRoleShell home={user.role === "student" && screen === "home"} navigationCollapsed={childNavigationCollapsed}>
      {user.role === "student" && compactNavigation && navigationHidden && <button ref={menuButtonRef} type="button" className="child-menu-toggle" onClick={() => { setSidebarOpen(true); }} aria-label={t("landing.copy046")} aria-expanded={false} aria-controls="primary-navigation"><Menu size={23}/><span>{t("screen.AuthenticatedApp.ui48")}</span></button>}
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <aside id="primary-navigation" className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-label={t("screen.AuthenticatedApp.ui49")} role={sidebarIsDialog && sidebarOpen ? "dialog" : undefined} aria-modal={sidebarIsDialog && sidebarOpen ? true : undefined} aria-hidden={navigationHidden ? true : undefined} inert={navigationHidden ? true : undefined}>
        <button ref={sidebarBrandRef} type="button" className="brand" onClick={() => childRail ? setChildNavigationCollapsed(false) : openScreen("home")} aria-label={childRail ? t("screen.AuthenticatedApp.ui50") : t("screen.AuthenticatedApp.ui51")} title={childRail ? t("screen.AuthenticatedApp.ui52") : undefined} aria-expanded={childRail ? false : undefined} aria-controls={childRail ? "primary-navigation" : undefined}>
          <BrandLogo variant={user.role === "student" && childNavigationCollapsed && !compactNavigation ? "vertical" : "compact"} width={user.role === "student" && childNavigationCollapsed && !compactNavigation ? 72 : 170} decorative />
        </button>
        {!childRail && <button ref={sidebarCloseRef} type="button" className="sidebar-close" onClick={user.role === "student" && !compactNavigation ? () => { setChildNavigationCollapsed(true); window.requestAnimationFrame(() => sidebarBrandRef.current?.focus()); } : closeSidebar} aria-label={user.role === "student" && !compactNavigation ? t("screen.AuthenticatedApp.ui53") : t("landing.copy045")} aria-expanded={user.role === "student" && !compactNavigation ? true : undefined} aria-controls="primary-navigation">{user.role === "student" && !compactNavigation ? <PanelLeftClose/> : <X/>}</button>}
        <nav aria-label={t("screen.AuthenticatedApp.ui54")}>
          {navigation.map((item) => {
            const active = familyRole ? familySection(screen, user.role) === item.id : screen === item.id;
            const Icon = item.icon;
            return (
              <button key={item.id} aria-current={active ? "page" : undefined} className={`${active ? "active " : ""}${item.id === "more" ? "mobile-more-link" : ""}`} onClick={() => openScreen(item.id)}>
                <Icon size={20} strokeWidth={2} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="note-spark">{user.role === "student" ? "‖" : "✦"}</span>
          <strong>{user.role === "student" ? t("screen.AuthenticatedApp.ui55") : t("auth.history")}</strong>
          <span>{user.role === "student" ? t("screen.AuthenticatedApp.ui56") : t("shell.template13", { v0: dashboard?.week_sessions || 0 })}</span>
        </div>
        <div className="sidebar-account">
          <AccountMenu key={String(sidebarOpen)} name={user.full_name} onExpand={() => setChildNavigationCollapsed(false)} onOpen={next => { openScreen(next); if (sidebarIsDialog) window.requestAnimationFrame(() => menuButtonRef.current?.focus()); }} onLogout={onLogout}/>
        </div>
      </aside>

      {sidebarOpen && sidebarIsDialog && <button className="overlay" onClick={closeSidebar} aria-label={t("landing.copy045")} />}

      <main className="main" inert={sidebarIsDialog && sidebarOpen ? true : undefined}>
        <header className="topbar v2-topbar">
          {user.role !== "student" && <button ref={menuButtonRef} className="menu-button" onClick={() => setSidebarOpen(true)} aria-label={t("landing.copy046")} aria-expanded={sidebarOpen} aria-controls="primary-navigation"><Menu /></button>}
          <div className="mobile-logo"><BrandLogo variant="compact" width={116} /></div>
          {user.role === "parent" && <form className="v2-global-search" role="search" onSubmit={submitGlobalSearch}><Search/><input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder={t("screen.AuthenticatedApp.ui57")} aria-label={t("screen.AuthenticatedApp.ui58")}/><button aria-label={t("screen.AuthenticatedApp.ui59")}><ArrowRight/></button></form>}
          <div className="top-actions v2-top-actions">
            {user.role === "parent" && <div className="notification-wrap"><button className="notification-button" onClick={() => setNotificationsOpen((value) => !value)} aria-label={t("nav.notifications")}><Bell size={19}/>{notifications.unread > 0 && <i>{notifications.unread}</i>}</button>{notificationsOpen && <div className="notification-panel"><div className="notification-head"><div><span className="kicker">{t("screen.AuthenticatedApp.ui60")}</span><strong>{t("screen.AuthenticatedApp.ui61")}</strong></div>{notifications.unread > 0 && <button onClick={markAllNotificationsRead}>{t("screen.AuthenticatedApp.ui62")}</button>}</div><div className="notification-list">{notifications.items.length ? notifications.items.map((item) => <button key={item.id} className={item.is_read ? "read" : "unread"} onClick={() => markNotificationRead(item.id)}><span className="notification-symbol"><Trophy size={18}/></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{formatDate(item.created_at, {day: "numeric", month: "long"})}</small></div>{!item.is_read && <i/>}</button>) : <div className="notification-empty"><Bell size={24}/><strong>{t("screen.AuthenticatedApp.ui63")}</strong><span>{t("screen.AuthenticatedApp.ui64")}</span></div>}</div></div>}</div>}
            {user.role === "parent" && <span className="v2-top-divider"/>}
            {user.role === "parent" && <span className="v2-user-greeting"><span>{t("screen.AuthenticatedApp.ui65")}</span><strong>{user.full_name.split(" ")[0]}!</strong></span>}
            {user.role === "student" && <StarVault total={dashboard?.stars || 0} onOpen={() => openScreen("achievements")}/>}
          </div>
        </header>

        {!isOnline && <div className="offline-banner" role="status"><CircleAlert size={18}/><span><strong>{t("screen.AuthenticatedApp.ui46")}</strong>  {t("screen.AuthenticatedApp.ui66")}</span></div>}
        {externalError && <div className="game-error global-request-error" role="alert"><ShieldAlert size={18}/><span>{externalError}</span><button type="button" className="small-button" onClick={onDismissExternalError}>{t("common.close")}</button></div>}
        {requestError && <div className="game-error global-request-error" role="alert"><ShieldAlert size={18}/><span>{requestError}</span><button type="button" className="small-button" onClick={() => setRequestError("")}>{t("common.close")}</button></div>}

        <div className="page">
          {familyRole && <SectionNavigation screen={screen} role={user.role} onOpen={openScreen}/>}

          {screen === "home" && <ExercisePetProvider presentation="home" key={`home-${child?.id}`} preferences={{ ...petPreferences.value, visible: user.role === "student" && petPreferences.ready && petPreferences.value.visible }} soundEnabled={settings.sound_enabled} calmMode={settings.calm_mode}><HomeScreen onStartPlan={startPreparedPlan} onOpenSpecialist={() => openScreen("parent", "specialist")} onOpen={openScreen} onExercise={exercise => { if (user.role === "parent") setParentPracticeMode("adult_preview"); openExercise(exercise); }} onStartSession={startDailySession} onResume={resumeSession} onPauseSession={pauseSession} soundEnabled={settings.sound_enabled} activeSession={activeSession} activeSessionLoading={activeSessionLoading} dailyMinutes={dailyMinutes} onMinutesChange={setDailyMinutes} sessionLoading={sessionLoading} sessionError={sessionError} child={child} dashboard={dashboard} consent={consent} userRole={user.role} exercises={exercises} /></ExercisePetProvider>}
          {screen === "stories" && user.role === "student" && <StoryExperience childId={child?.id} calmMode={settings.calm_mode}/>}
          {(screen === "world" || screen === "my-world") && ["student", "parent"].includes(user.role) && <WorldExperience key={child?.id} childId={child?.id} canManage={user.role === "parent"} onWords={() => openScreen("aac")} onSpeak={(text) => speak(text, .82, true)}/>}

          {["success", "achievements", "progress", "skills"].includes(screen) && user.role === "student" && <AchievementsExperience childId={child?.id} dashboard={dashboard} onStories={() => openScreen("stories")} onGames={() => openScreen("games")}/>}
          {screen === "guides" && user.role === "parent" && <GuidesExperience child={child} dashboard={dashboard} exercises={exercises} onNavigate={openScreen} onExercise={openExercise}/>}
          {(screen === "games" || screen === "learn") && <GamesScreen onOpen={openScreen} onExercise={openExercise} dashboard={dashboard} exercises={exercises} childMode={user.role === "student"} parentPracticeMode={user.role === "parent" ? parentPracticeMode : undefined} onParentPracticeModeChange={setParentPracticeMode} />}
          {screen === "session" && sessionError && <div className="v2-inline-alert" role="alert">{sessionError}</div>}
          {screen === "session" && activeSession && <SessionScreen session={activeSession} busy={sessionLoading} onContinue={continueSession} onPause={pauseSession} onFinish={() => { setActiveSession(null); refreshDashboard(); setScreen("home"); }} />}
          {screen === "exercise-complete" && exerciseCompletion && <ExercisePetProvider key={`complete-${child?.id}-${selectedExercise?.id}`} preferences={{ ...petPreferences.value, visible: petPreferences.ready && petPreferences.value.visible && !exerciseCompletion.refused && (user.role === "student" || parentPracticeMode === "child_practice") }} soundEnabled={settings.sound_enabled} calmMode={settings.calm_mode} initialEvent="complete"><div className="pet-completion"><ExercisePet/></div><ExerciseCompletionScreen completion={exerciseCompletion} onContinue={continueAfterExercise} onFinish={() => { if (exerciseCompletion.refused) { if (exerciseCompletion.sessionMode) void pauseSession(); else openScreen("home"); } else openScreen(exerciseCompletion.sessionMode ? "session" : "games"); }} /></ExercisePetProvider>}
          {user.role === "parent" && parentPracticeMode === "adult_preview" && ["motor", "sensory", "mixed"].includes(screen) && <div className="adult-preview-banner" role="status"><Eye size={19}/><div><strong>{t("cinema.copy054")}</strong><span>{t("screen.AuthenticatedApp.ui67")}</span></div><button type="button" onClick={() => setParentPracticeMode("child_practice")}>{t("screen.AuthenticatedApp.ui68")}</button></div>}
          {sessionError && ["motor", "sensory", "mixed"].includes(screen) && <div className="game-error" role="alert"><ShieldAlert size={18}/><span>{sessionError}</span></div>}
          {activeExerciseContent}
          {screen === "aac" && <PhraseGame key="free-aac" childId={child?.id} canManage={user.role === "parent"} freeMode soundEnabled={settings.sound_enabled} onBack={() => openScreen("home")} />}
          {screen === "ai" && user.role === "parent" && <AIParentScreen child={child} />}
          {screen === "progress" && user.role !== "student" && <ParentProgress key={child?.id} childId={child?.id} onStartPractice={() => openScreen("games")} onObservations={() => openScreen("parent", "practice")} />}
          {screen === "goals" && user.role === "parent" && <GoalsAndPractice key={child?.id} child={child} targetMinutes={dailyMinutes} onStartPlan={startPreparedPlan} onPracticeChanged={() => { setExercises([]); setCatalogRevision(value => value + 1); refreshDashboard(); }}/>}
          {screen === "parent" && <ParentScreen key={child?.id} child={child} childProfiles={children} onSelectChild={setSelectedChildId} onDeleted={(id) => { const remaining = children.filter((item) => item.id !== id); setChildren(remaining); setSelectedChildId(remaining[0]?.id || null); setScreen("home"); }} dashboard={dashboard} onConsentChange={setConsent} onNavigate={openScreen} onStartPlan={startPreparedPlan} />}
          {screen === "more" && user.role === "student" && <ChildMoreScreen onOpen={openScreen}/>}
          {screen === "more" && user.role === "parent" && <ParentMoreScreen onOpen={openScreen}/>}
          {screen === "profile" && user.role === "parent" && <ParentAccountDeletion onDeleted={onLogout}/>}
          {screen === "profile" && <ProfileScreen user={user} child={child} dashboard={dashboard} settings={settings} onOpen={openScreen} onLogout={onLogout}/>}
          {screen === "admin" && <AdminScreen />}
          {screen === "settings" && <SettingsScreen petPreferences={petPreferences} role={user.role} settings={settings} saving={settingsSaving} onChange={changeSettings} onLogout={onLogout} onOpenParent={() => openScreen("parent")} />}
        </div>
      </main>
      {reward && reward.childId === child?.id && <StarReward key={reward.nonce} stars={reward.stars} total={Math.max(reward.total, dashboard?.stars || 0)} calmMode={settings.calm_mode} onDone={dismissReward}/>}
    </AppRoleShell>
  );
}

function ChildOnboarding({ user, onCreated, onLogout }: { user: User; onCreated: (child: Child) => void; onLogout: () => void }) {
  useLocale();
  const [name, setName] = useState(""); const [birthDate, setBirthDate] = useState(""); const [module, setModule] = useState<ModuleName>("mixed"); const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); try { const child = await api<Child>("/api/children", { method: "POST", body: JSON.stringify({ name, birth_date: birthDate, primary_module: module, avatar_color: "#f07d68" }) }); onCreated(child); } catch (cause) { setError(cause instanceof Error ? cause.message : t("screen.ChildOnboarding.ui1")); } };
  return <div className="onboarding-page"><div className="onboarding-card"><div className="brand"><BrandLogo variant="vertical" width={150} /><span>{t("screen.ChildOnboarding.ui2")}</span></div><span className="kicker">{t("screen.ChildOnboarding.ui3")} {user.full_name.toUpperCase()}</span><h1>{t("screen.ChildOnboarding.ui4")}</h1><p>{t("screen.ChildOnboarding.ui5")}</p><form onSubmit={submit}><label>{t("screen.ChildOnboarding.ui6")}<input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("screen.ChildOnboarding.ui7")} required minLength={2}/></label><label>{t("screen.ChildOnboarding.ui8")}<input type="date" max={new Date().toISOString().slice(0,10)} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required/></label><label>{t("screen.ChildOnboarding.ui9")}<select value={module} onChange={(e) => setModule(e.target.value as ModuleName)}><option value="sensory">{t("screen.ChildOnboarding.ui10")}</option><option value="mixed">{t("screen.ChildOnboarding.ui11")}</option></select></label>{error && <div className="auth-error">{error}</div>}<button className="primary-button">{t("screen.ChildOnboarding.ui12")} <ChevronRight size={18}/></button></form><button className="auth-switch" onClick={onLogout}>{t("screen.ChildOnboarding.ui13")}</button></div></div>;
}

function roleLabel(role: Role) {
  return { admin: t("screen.roleLabel.ui1"), parent: t("screen.roleLabel.ui2"), student: t("screen.roleLabel.ui3"), specialist: t("screen.roleLabel.ui4") }[role];
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  useLocale();
  const [mode, setMode] = useState<"login" | "register" | "student">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const endpoint = mode === "student" ? "student-login" : mode === "login" ? "login" : "register";
      const payload = mode === "student" ? { username, pin: password } : mode === "login" ? { username, password } : { username, password, full_name: name };
      await api<{ user: User }>(`/api/auth/${endpoint}`, {
        method: "POST", body: JSON.stringify(payload),
      });
      const currentUser = await api<User>("/api/auth/me");
      clearLegacyAuth(); onAuthenticated(currentUser);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t("errors.auth");
      setError(message === t("screen.AuthScreen.ui1")
        ? t("screen.AuthScreen.ui2")
        : message);
    }
    finally { setLoading(false); }
  };

  const heading = mode === "student" ? t("auth.child") : mode === "login" ? t("auth.login") : t("auth.register");
  const switchMode = (next: "login" | "register" | "student") => { setMode(next); setUsername(""); setPassword(""); setError(""); setShowPassword(false); };
  return <div className="auth-page">
    <div className="auth-visual">
      <div className="auth-brand"><BrandLogo variant="primary" width={270} priority /></div>
      <div className="auth-copy"><span className="pill"><ShieldCheck size={15}/> {t("auth.calmPractice")}</span><h1>{t("auth.helpChild")}<br/><em>{t("auth.communicate")}</em></h1><p>{t("auth.description")}</p><div className="auth-benefits"><span><Check/> {t("auth.steps")}</span><span><Check/> {t("auth.history")}</span><span><Check/> {t("auth.separate")}</span></div></div>
      <div className="auth-orbs"><i><Bot/></i><i><ModuleGlyph module="sensory"/></i><i><ModuleGlyph module="mixed"/></i></div>
    </div>
    <div className="auth-form-wrap"><LanguagePicker compact /><Link href="/" className="auth-back-home"><ArrowLeft size={17}/> {t("nav.homeLink")}</Link><form className="auth-card" autoComplete="off" onSubmit={submit}>
      <div className="auth-card-brand"><BrandLogo variant="primary" width={230} priority /></div>
      <div className="auth-role-tabs" aria-label={t("auth.type")}><button type="button" className={mode !== "student" ? "active" : ""} onClick={() => switchMode("login")}><UserRoundCheck size={18}/> {t("auth.adult")}</button><button type="button" className={mode === "student" ? "active" : ""} onClick={() => switchMode("student")}><Backpack size={18}/> {t("auth.kid")}</button></div>
      <span className="kicker">{mode === "register" ? t("auth.new") : t("auth.welcome")}</span><h2>{heading}</h2><p>{mode === "student" ? t("auth.childHelp") : mode === "login" ? t("auth.loginHelp") : t("auth.registerHelp")}</p>
      {mode === "register" && <label>{t("auth.yourName")}<input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.exampleName")} autoComplete="name" required minLength={2}/></label>}
      <label>{mode === "student" ? t("auth.childLogin") : t("common.login")}<span className="auth-input"><UserRound size={17}/><input type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} data-1p-ignore data-lpignore="true" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9_.-]/g, ""))} placeholder={mode === "student" ? t("auth.parentLogin") : t("auth.latin")} pattern={"[A-Za-z0-9_.\\-]+"} required minLength={3}/></span>{mode === "register" && <small>{t("auth.loginRequirements")}</small>}</label>
      <label>{mode === "student" ? t("auth.pin") : t("auth.password")}<span className="auth-input"><KeyRound size={17}/><input type={showPassword ? "text" : "password"} autoComplete="new-password" data-1p-ignore data-lpignore="true" inputMode={mode === "student" ? "numeric" : undefined} value={password} onChange={(e) => setPassword(mode === "student" ? e.target.value.replace(/\D/g, "") : e.target.value)} placeholder={mode === "student" ? t("auth.pinLength") : t("auth.enterPassword")} required minLength={mode === "register" ? 8 : mode === "student" ? 4 : 1} maxLength={mode === "student" ? 12 : undefined}/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span>{mode === "register" && <small>{t("auth.passwordLength")}</small>}</label>
      {error && <div className="auth-error" role="alert"><CircleHelp size={17}/><span>{error}</span></div>}
      <button className="primary-button auth-submit" disabled={loading}>{loading ? t("common.wait") : mode === "register" ? t("auth.create") : mode === "student" ? t("auth.begin") : t("auth.signIn")}<ChevronRight size={18}/></button>
      {mode !== "student" && <div className="auth-secondary">{mode === "login" ? t("auth.first") : t("auth.already")}<button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")}>{mode === "login" ? t("auth.createParent") : t("auth.signIn")}</button></div>}
      {mode === "student" && <div className="student-help"><ShieldCheck size={17}/><span>{t("auth.pinHelp")}</span></div>}
    </form></div>
  </div>;
}

type HomeScreenProps = { onPauseSession: () => void; soundEnabled: boolean; onStartPlan: (plan: AdaptivePlan) => Promise<void>; onOpenSpecialist: () => void; onOpen: (screen: Screen) => void; onExercise: (exercise: Exercise) => void; onStartSession: () => void; onResume: () => void; activeSession: LearningSession | null; activeSessionLoading: boolean; dailyMinutes: 3 | 5 | 10; onMinutesChange: (value: 3 | 5 | 10) => void; sessionLoading: boolean; sessionError: string; child?: Child; dashboard: Dashboard | null; consent: ChildConsent | null; userRole: Role; exercises: Exercise[] };

function HomeScreen(props: HomeScreenProps) {
  if (props.userRole === "student") return <ChildHomeScreen {...props}/>;
  if (props.userRole !== "parent") return null;
  return <>{props.sessionError && <div className="v2-inline-alert" role="alert">{props.sessionError}</div>}<ParentOverview busy={props.sessionLoading || props.activeSessionLoading} onStartPlan={props.onStartPlan} exercises={props.exercises} onExercise={props.onExercise} onOpenSpecialist={props.onOpenSpecialist} child={props.child} dashboard={props.dashboard} activeSession={props.activeSession} onStartSession={props.onStartSession} onResume={props.onResume} onNavigate={props.onOpen}/></>;
}

function ChildHomeScreen({ onOpen, onExercise, onStartSession, onResume, soundEnabled, activeSession, activeSessionLoading, sessionLoading, sessionError, child, dashboard, consent, exercises }: HomeScreenProps) {
  const currentSession = activeSession && activeSession.status !== "completed" ? activeSession : null;
  return <ChildRoomHome child={child} dashboard={dashboard} exercises={exercises} currentSession={currentSession} busy={activeSessionLoading || sessionLoading} error={sessionError} canSave={Boolean(consent?.privacy_accepted)} soundEnabled={soundEnabled} onStart={onStartSession} onResume={onResume} onNavigate={onOpen} onExercise={onExercise}/>;
}

function SessionScreen({ session, busy, onContinue, onPause, onFinish }: { session: LearningSession; busy: boolean; onContinue: () => void; onPause: () => void; onFinish: () => void }) {
  useLocale();
  const complete = session.current_index >= session.exercises.length || session.status === "completed";
  const results = session.results || [];
  const summary = summarizeSessionResults(results, session.exercises.map((exercise) => exercise.id));
  const totalMinutes = Math.max(1, Math.round(summary.durationSeconds / 60));
  if (complete) return <div className="page-enter session-complete"><div className="completion-mascot"><Image src="/illustrations/session-complete-parrot.webp" alt={t("screen.SessionScreen.ui1")} width={190} height={285}/></div><span className="kicker">{t("screen.SessionScreen.ui2")}</span><h1>{t("screen.SessionScreen.ui3")}</h1><p>{t("screen.SessionScreen.ui4")}</p><div className="session-summary"><StatCard icon={<Check/>} value={`${summary.completedCount}/${session.exercises.length}`} label={t("screen.SessionScreen.ui5")}/><StatCard icon={<Target/>} value={summary.averageScore === null ? t("screen.SessionScreen.ui6") : `${summary.averageScore}%`} label={t("screen.SessionScreen.ui7")}/><StatCard icon={<Timer/>} value={t("shell.template14", { v0: totalMinutes })} label={t("screen.SessionScreen.ui8")}/></div><button className="primary-button" onClick={onFinish}>{t("screen.SessionScreen.ui9")} <ChevronRight size={18}/></button></div>;
  return <div className="page-enter stack-xl"><PageTitle eyebrow={t("screen.SessionScreen.ui10")} title={t("screen.SessionScreen.ui11")} subtitle={t("screen.SessionScreen.ui12")}/><section className="session-mode"><div className="session-progress-head"><div><strong>{session.current_index}  {t("screen.SessionScreen.ui13")} {session.exercises.length}  {t("screen.SessionScreen.ui14")}</strong><span>{t("screen.SessionScreen.ui15")} {Math.max(1, Math.round(session.target_minutes * (session.exercises.length - session.current_index) / session.exercises.length))}  {t("screen.SessionScreen.ui16")}</span></div><b>{Math.round(session.current_index / session.exercises.length * 100)}%</b></div><div className="session-progress-track"><i style={{width:`${session.current_index / session.exercises.length * 100}%`}}/></div><div className="activity-warning"><Sparkles size={18}/><span>{t("screen.SessionScreen.ui17")} <b>{session.exercises[session.current_index]?.title}</b>{session.exercises[session.current_index + 1] ? t("shell.template15", { v0: session.exercises[session.current_index + 1].title }) : t("screen.SessionScreen.ui18")}</span></div><div className="session-steps">{session.exercises.map((exercise, index) => { const done = index < session.current_index; const current = index === session.current_index; return <div key={exercise.id} className={`${done ? "done" : ""} ${current ? "current" : ""}`}><span>{done ? <Check size={20}/> : index + 1}</span><div><small>{exercise.adaptive ? t("shell.template16", { v0: exercise.adaptive.goal_title }) : exercise.skill ? skillLabel(exercise.skill) : t("screen.SessionScreen.ui19")}</small><strong>{exercise.title}</strong><p>{exercise.instruction}</p>{exercise.adaptive && <em className="session-adaptive-note">{exercise.adaptive.assignment_reason.messages[0]}</em>}</div>{current ? <Play size={20}/> : done ? <Star size={18} fill="currentColor"/> : <LockKeyhole size={18}/>}</div>; })}</div><div className="session-actions"><button className="small-button" disabled={busy} onClick={onPause}>{t("screen.SessionScreen.ui20")}</button><button className="primary-button session-continue" disabled={busy} onClick={onContinue}><Play size={18} fill="currentColor"/>{session.current_index ? t("screen.SessionScreen.ui21") : t("screen.SessionScreen.ui22")}</button></div></section></div>;
}

function ExerciseCompletionScreen({ completion, onContinue, onFinish }: { completion: ExerciseCompletion; onContinue: () => void; onFinish: () => void }) {
  useLocale();
  const nextLabel = completion.sessionFinished
    ? t("screen.ExerciseCompletionScreen.ui1")
    : completion.nextExercise
      ? t("shell.template17", { v0: completion.nextExercise.title })
      : t("screen.ExerciseCompletionScreen.ui2");
  return <div className="page-enter exercise-completion" role="status" aria-live="polite">
    <div className="completion-check"><Check size={42} strokeWidth={2.2}/></div>
    <span className="kicker">{completion.refused ? t("screen.ExerciseCompletionScreen.ui3") : t("screen.ExerciseCompletionScreen.ui4")}</span>
    <h1>{completion.title}</h1>
    <p>{completion.message}</p>
    {!completion.refused && completion.nextExercise && !completion.sessionFinished && <div className="next-activity-preview"><span>{t("screen.ExerciseCompletionScreen.ui5")}</span><strong>{completion.nextExercise.title}</strong><small>{completion.nextExercise.instruction}</small></div>}
    <div className="completion-actions">
      <button className="primary-button" onClick={completion.refused ? onFinish : onContinue}>{completion.refused ? t("screen.ExerciseCompletionScreen.ui6") : nextLabel}<ChevronRight size={18}/></button>
      {!completion.refused && !completion.sessionFinished && <button className="secondary-button" onClick={onFinish}>{completion.sessionMode ? t("screen.ExerciseCompletionScreen.ui7") : t("screen.ExerciseCompletionScreen.ui6")}</button>}
    </div>
  </div>;
}

function skillLabel(skill: Exercise["skill"] | SkillProgress["skill"]) {
  return { articulation: t("screen.skillLabel.ui1"), vocabulary: t("screen.skillLabel.ui2"), speech_comprehension: t("screen.skillLabel.ui3"), word_repetition: t("screen.skillLabel.ui4"), phrase_building: t("screen.skillLabel.ui5"), communication: t("screen.skillLabel.ui6") }[skill || "communication"];
}

function ModuleCard({ module, onClick, index, completed, total }: { module: typeof modules[number]; onClick: () => void; index: number; completed?: number; total?: number }) {
  useLocale();
  return (
    <button className={`module-card ${module.accent}`} onClick={onClick}>
      <div className="module-top"><span className="module-number">0{index}</span><span className="module-time">{module.time}</span></div>
      <div className="module-icon"><ModuleGlyph module={module.id}/></div>
      <span className="module-eyebrow">{module.eyebrow}</span>
      <h3>{module.title}</h3>
      <p>{module.description}</p>
      <div className="module-progress"><span style={{ width: `${module.progress}%` }} /></div>
      <div className="module-bottom"><small>{t("screen.ModuleCard.ui1")} {module.progress}%{total ? t("shell.template18", { v0: Math.min(completed || 0, total), v1: total }) : ""}</small><span className="round-arrow"><ChevronRight size={18} /></span></div>
    </button>
  );
}

function GamesScreen({ onOpen, onExercise, dashboard, exercises, childMode, parentPracticeMode, onParentPracticeModeChange }: { onOpen: (screen: Screen) => void; onExercise: (exercise: Exercise) => void; dashboard: Dashboard | null; exercises: Exercise[]; childMode: boolean; parentPracticeMode?: ParentPracticeMode; onParentPracticeModeChange?: (mode: ParentPracticeMode) => void }) {
  useLocale();
  return (
    <div className={`page-enter stack-xl exercise-catalog-page ${childMode ? "child-games" : ""}`}>
      <section className="exercise-catalog-hero">
        <div className="exercise-catalog-hero-copy"><span className="kicker">{t("screen.GamesScreen.ui1")} {exercises.length}</span><h1>{childMode ? t("screen.GamesScreen.ui2") : t("screen.GamesScreen.ui3")}</h1><p>{childMode ? t("screen.GamesScreen.ui4") : t("screen.GamesScreen.ui5")}</p></div>
        <Image src="/app-illustrations/exercise-library-hero.webp" width={768} height={512} alt={t("screen.GamesScreen.ui6")} priority />
      </section>
      {!childMode && exercises.some((item) => item.engine?.review_gate.demo_only) && <div className="unreviewed-demo-banner" role="status"><ShieldAlert size={20}/><div><strong>{childMode ? t("screen.GamesScreen.ui7") : t("screen.GamesScreen.ui8")}</strong><span>{childMode ? t("screen.GamesScreen.ui9") : t("screen.GamesScreen.ui10")}</span></div></div>}
      <button className="child-aac-entry" onClick={() => onOpen("aac")}><Image src="/app-illustrations/aac-help.webp" width={78} height={78} alt={t("screen.GamesScreen.ui11")}/><div><strong>{t("screen.GamesScreen.ui12")}</strong><small>{t("screen.GamesScreen.ui13")}</small></div><ChevronRight size={24}/></button>
      {parentPracticeMode && <section className="practice-mode-card" aria-labelledby="practice-mode-title"><div><Eye size={22}/><span><strong id="practice-mode-title">{t("screen.GamesScreen.ui14")}</strong><small>{t("screen.GamesScreen.ui15")}</small></span></div><div className="practice-mode-options"><button type="button" className={parentPracticeMode === "adult_preview" ? "active" : ""} aria-pressed={parentPracticeMode === "adult_preview"} onClick={() => onParentPracticeModeChange?.("adult_preview")}><Eye size={17}/>  {t("screen.GamesScreen.ui16")}</button><button type="button" className={parentPracticeMode === "child_practice" ? "active" : ""} aria-pressed={parentPracticeMode === "child_practice"} onClick={() => onParentPracticeModeChange?.("child_practice")}><Baby size={17}/>  {t("screen.GamesScreen.ui17")}</button></div></section>}
      <ExerciseLibrary items={exercises.filter(item => item.module !== "motor")} completedIds={dashboard?.completed_exercise_ids || []} onExercise={onExercise} />
      {!childMode && <div className="tip-banner"><div className="tip-icon"><Sparkles/></div><div><strong>{t("screen.GamesScreen.ui21")}</strong><p>{t("screen.GamesScreen.ui22")}</p></div></div>}
    </div>
  );
}

const exerciseImages: Record<string, string> = {
  animals: "aac-cat.webp", food: "aac-apple.webp", toys: "aac-teddy.webp", body: "aac-me.webp", clothes: "aac-school.webp", household: "aac-home.webp", actions: "aac-walk.webp", qualities: "aac-hot.webp", location: "aac-on-table.webp", places: "aac-playground.webp", opposites: "aac-cold.webp", commands: "aac-play.webp",
  request: "aac-juice.webp", observation: "aac-see.webp", preference: "aac-love.webp", family: "aac-mother.webp", feelings: "aac-happy.webp", routine: "aac-yesterday.webp", help: "aac-help.webp", desire: "aac-want.webp", need: "aac-drink.webp", refusal: "aac-no.webp", choice: "aac-water.webp", greeting: "aac-hello.webp", answer: "aac-yes.webp", agent_action: "aac-played.webp", spatial_phrase: "aac-in-box.webp", question: "aac-what-is-this.webp", past_event: "aac-walked.webp",
};

function ExerciseLibrary({ items, completedIds, onExercise }: { items: Exercise[]; completedIds: number[]; onExercise: (exercise: Exercise) => void }) {
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState("all");
  const [duration, setDuration] = useState("all");
  const completed = new Set(completedIds);
  const labels = { motor: t("screen.ExerciseLibrary.ui1"), sensory: t("screen.ExerciseLibrary.ui2"), mixed: t("screen.ExerciseLibrary.ui3") };
  // A planning estimate, not a timer or a measured completion time: about 30 seconds per round.
  const minutes = (exercise: Exercise) => Math.max(1, Math.ceil((exercise.adaptive?.difficulty_params.round_count || exercise.engine?.content.default_rounds || 6) / 2));
  const filtered = items.filter(exercise => (direction === "all" || exercise.module === direction) && (duration === "all" || (duration === "short" ? minutes(exercise) <= 3 : minutes(exercise) > 3)) && `${exercise.title} ${exercise.instruction}`.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
  const reset = () => { setQuery(""); setDirection("all"); setDuration("all"); };
  return <section className="exercise-library focused-catalog" aria-labelledby="all-exercises-title">
    <div className="catalog-filters">
      <label className="catalog-search">{t("ux.searchExercises")}<span><Search size={20}/><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("ux.searchExample")}/></span></label>
      <label>{t("ux.direction")}<select value={direction} onChange={event => setDirection(event.target.value)}><option value="all">{t("ux.allDirections")}</option>{Object.entries(labels).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>{t("ux.duration")}<select value={duration} onChange={event => setDuration(event.target.value)}><option value="all">{t("ux.anyDuration")}</option><option value="short">{t("ux.shortDuration")}</option><option value="long">{t("ux.longDuration")}</option></select></label>
    </div>
    <p className="catalog-estimate-note">{t("ux.estimateHint")}</p>
    <div className="section-heading"><h2 id="all-exercises-title" aria-live="polite">{t("ux.foundExercises", {count:filtered.length})}</h2>{(query || direction !== "all" || duration !== "all") && <button type="button" className="small-button" onClick={reset}>{t("ux.resetFilters")}</button>}</div>
    <div className="exercise-grid">{filtered.map(exercise => <button type="button" key={exercise.id} className={`exercise-card ${exercise.module}`} onClick={() => onExercise(exercise)}>
      <span className="exercise-card-visual"><Image src={exercise.engine?.content.exploration?.image.media_ref || (exerciseImages[exercise.target] ? `/app-illustrations/${exerciseImages[exercise.target]}` : exercise.icon)} width={320} height={230} alt=""/></span>
      <div className="exercise-card-copy"><small>{labels[exercise.module]}{completed.has(exercise.id) ? t("screen.ExerciseLibrary.ui6") : ""}</small><strong>{exercise.title}</strong><p>{exercise.instruction}</p>
      <span className="exercise-card-meta"><span><Clock3 size={16}/>{t("ux.aboutMinutes", {count:minutes(exercise)})}</span>{exercise.module === "motor" && <span><UserRound size={16}/>{t("ux.withAdult")}</span>}</span>
      <span className="exercise-card-open">{t("screen.ExerciseLibrary.ui7")} <ArrowRight size={18}/></span></div>
    </button>)}</div>
    {!filtered.length && <div className="empty-state large" role="status"><Search size={28}/><strong>{items.length ? t("ux.noExercises") : t("content.empty")}</strong><span>{items.length ? t("ux.tryFilters") : t("screen.ExerciseLibrary.ui9")}</span>{items.length > 0 && <button type="button" className="small-button" onClick={reset}>{t("ux.resetFilters")}</button>}</div>}
  </section>;
}

function PageTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-title"><span className="kicker">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>;
}

function GameHeader({ title, subtitle, step, onBack }: { title: string; subtitle: string; step: string; onBack: () => void }) {
  useLocale();
  return (
    <div className="game-header">
      <button className="back-button" onClick={onBack} aria-label={t("screen.GameHeader.ui1")}><ArrowLeft size={20} /></button>
      <div><span>{subtitle}</span><h2>{title}</h2></div>
      <div className="step-pill">{step}</div>
    </div>
  );
}

const motorExercises = [
  { id: "smile", get title() { return t("motor.exercise0.title"); }, get text() { return t("motor.exercise0.text"); } },
  { id: "tube", get title() { return t("motor.exercise1.title"); }, get text() { return t("motor.exercise1.text"); } },
  { id: "open", get title() { return t("motor.exercise2.title"); }, get text() { return t("motor.exercise2.text"); } },
  { id: "teeth", get title() { return t("motor.exercise3.title"); }, get text() { return t("motor.exercise3.text"); } },
  { id: "cheeks", get title() { return t("motor.exercise4.title"); }, get text() { return t("motor.exercise4.text"); } },
  { id: "sequence", get title() { return t("motor.exercise5.title"); }, get text() { return t("motor.exercise5.text"); } },
] as const;
type MotorExercise = typeof motorExercises[number]["id"];
type MotorPracticePhase = "idle" | "prepare" | "checking" | "matched" | "not_found";
type MotorDetectionStatus = "idle" | "loading" | "calibrating" | "tracking" | "no_face" | "error";
type MotorDetectionState = { status: MotorDetectionStatus; confidence: number; sequenceStep: 0 | 1; message: string };

const idleMotorDetection: MotorDetectionState = { status: "idle", confidence: 0, sequenceStep: 0, message: "" };

function MouthGuide({ type }: { type: MotorExercise }) {
  useLocale();
  if (type === "sequence") return <div className="mouth-sequence" aria-label={t("screen.MouthGuide.ui1")}><MouthGuide type="smile"/><ChevronRight/><MouthGuide type="tube"/></div>;
  return <div className={`mouth-guide ${type}`} aria-hidden="true"><i className="guide-eye left"/><i className="guide-eye right"/><span className="guide-mouth">{type === "teeth" && <b><i/><i/><i/><i/></b>}</span>{type === "cheeks" && <><i className="guide-cheek left"/><i className="guide-cheek right"/></>}</div>;
}

function MotorGame({ exercises, initialExercise, cameraConsentGranted, canManageConsent, onOpenConsent, onBack, onComplete }: { exercises: Exercise[]; initialExercise: Exercise | null; cameraConsentGranted: boolean; canManageConsent: boolean; onOpenConsent: () => void; onBack: () => void; onComplete: (score: number, exerciseId: number, measurement: GameMeasurement, details?: Record<string, unknown>) => Promise<unknown> | void }) {
  useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastDetectionAtRef = useRef(0);
  const baselineRef = useRef<BlendshapeScores>({});
  const baselineSamplesRef = useRef(0);
  const stableMatchesRef = useRef(0);
  const sequenceStepRef = useRef<0 | 1>(0);
  const bestConfidenceRef = useRef(0);
  const [cameraState, setCameraState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const availableMotorExercises = motorExercises.filter((item) => exercises.some((exercise) => exercise.target === item.id) || initialExercise?.target === item.id);
  const initialIndex = Math.max(0, availableMotorExercises.findIndex((item) => item.id === initialExercise?.target));
  const [exerciseIndex, setExerciseIndex] = useState(initialIndex);
  const [saved, setSaved] = useState<"independent" | "supported" | null>(null);
  const exercise = availableMotorExercises[exerciseIndex] || availableMotorExercises[0];
  const [practice, setPractice] = useState<{ phase: MotorPracticePhase; seconds: number }>({ phase: "idle", seconds: 0 });
  const [detection, setDetection] = useState<MotorDetectionState>(idleMotorDetection);

  const stopAnalysis = useCallback(() => {
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    lastVideoTimeRef.current = -1;
    lastDetectionAtRef.current = 0;
  }, []);

  const stopCamera = useCallback(() => {
    stopAnalysis();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [stopAnalysis]);

  useEffect(() => () => {
    stopCamera();
    faceLandmarkerRef.current?.close();
    faceLandmarkerRef.current = null;
  }, [stopCamera]);

  useEffect(() => {
    if (practice.phase !== "prepare" && practice.phase !== "checking") return;
    const timer = window.setTimeout(() => {
      if (practice.seconds > 1) {
        setPractice({ ...practice, seconds: practice.seconds - 1 });
      } else if (practice.phase === "prepare") {
        if (baselineSamplesRef.current < 3) {
          setPractice({ phase: "not_found", seconds: 0 });
          setDetection({ status: "no_face", confidence: 0, sequenceStep: 0, message: t("screen.MotorGame.ui1") });
        } else {
          setPractice({ phase: "checking", seconds: 10 });
          setDetection({ status: "tracking", confidence: 0, sequenceStep: 0, message: exercise?.id === "sequence" ? t("screen.MotorGame.ui2") : t("screen.MotorGame.ui3") });
        }
      } else {
        setPractice({ phase: "not_found", seconds: 0 });
        setDetection((current) => ({ ...current, status: "tracking", confidence: 0, message: t("screen.MotorGame.ui4") }));
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [exercise?.id, practice]);

  const loadFaceLandmarker = useCallback(async () => {
    if (faceLandmarkerRef.current) return faceLandmarkerRef.current;
    const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    const landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: "/mediapipe/models/face_landmarker.task", delegate: "CPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.55,
      minFacePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55,
      outputFaceBlendshapes: true,
    });
    faceLandmarkerRef.current = landmarker;
    return landmarker;
  }, []);

  useEffect(() => {
    if (!exercise || cameraState !== "ready" || (practice.phase !== "prepare" && practice.phase !== "checking")) return;
    let cancelled = false;

    const scanFrame = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const landmarker = faceLandmarkerRef.current;
      const timestamp = performance.now();
      if (video && landmarker && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTimeRef.current && timestamp - lastDetectionAtRef.current >= 120) {
        lastVideoTimeRef.current = video.currentTime;
        lastDetectionAtRef.current = timestamp;
        try {
          const result = landmarker.detectForVideo(video, timestamp);
          const categories = result.faceBlendshapes[0]?.categories || [];
          if (!categories.length) {
            stableMatchesRef.current = 0;
            if (practice.phase === "checking") setDetection((current) => ({ ...current, status: "no_face", confidence: 0, message: t("screen.MotorGame.ui5") }));
          } else {
            const scores = categoriesToScores(categories);
            if (practice.phase === "prepare") {
              baselineRef.current = mergeBaseline(baselineRef.current, scores, baselineSamplesRef.current);
              baselineSamplesRef.current += 1;
              setDetection({ status: "calibrating", confidence: 0, sequenceStep: 0, message: t("screen.MotorGame.ui6") });
            } else {
              const checkedTarget = targetForSequenceStep(exercise.id, sequenceStepRef.current);
              const check = evaluateMotorMovement(checkedTarget, scores, baselineRef.current);
              const confidence = Math.round(check.confidence * 100);
              bestConfidenceRef.current = Math.max(bestConfidenceRef.current, confidence);
              stableMatchesRef.current = check.matched ? stableMatchesRef.current + 1 : 0;

              if (stableMatchesRef.current >= 6) {
                if (exercise.id === "sequence" && sequenceStepRef.current === 0) {
                  sequenceStepRef.current = 1;
                  stableMatchesRef.current = 0;
                  setDetection({ status: "tracking", confidence: 0, sequenceStep: 1, message: t("screen.MotorGame.ui7") });
                } else {
                  setPractice({ phase: "matched", seconds: 0 });
                  setDetection({ status: "tracking", confidence: 100, sequenceStep: sequenceStepRef.current, message: t("screen.MotorGame.ui8") });
                }
              } else {
                const message = exercise.id === "sequence"
                  ? sequenceStepRef.current === 0 ? t("screen.MotorGame.ui2") : t("screen.MotorGame.ui7")
                  : confidence >= 55 ? t("screen.MotorGame.ui9") : t("screen.MotorGame.ui10");
                setDetection({ status: "tracking", confidence, sequenceStep: sequenceStepRef.current, message });
              }
            }
          }
        } catch {
          setPractice({ phase: "idle", seconds: 0 });
          setDetection({ status: "error", confidence: 0, sequenceStep: 0, message: t("screen.MotorGame.ui11") });
        }
      }
      animationFrameRef.current = window.requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = window.requestAnimationFrame(scanFrame);
    return () => {
      cancelled = true;
      stopAnalysis();
    };
  }, [cameraState, exercise, practice.phase, stopAnalysis]);

  const startCamera = async () => {
    if (!cameraConsentGranted) return;
    setCameraState("loading");
    setCameraError(null);
    stopCamera();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("camera_api_unavailable");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 720, height: 540 }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) throw new Error("video_element_unavailable");
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraState("ready");
      setDetection(idleMotorDetection);
    } catch (cause) {
      stopCamera();
      setCameraState("error");
      const name = cause instanceof DOMException ? cause.name : "";
      if (["NotAllowedError", "SecurityError"].includes(name)) {
        setCameraError(t("screen.MotorGame.ui12"));
      } else if (["NotFoundError", "DevicesNotFoundError"].includes(name)) {
        setCameraError(t("screen.MotorGame.ui13"));
      } else if (["NotReadableError", "TrackStartError"].includes(name)) {
        setCameraError(t("screen.MotorGame.ui14"));
      } else {
        setCameraError(t("screen.MotorGame.ui15"));
      }
    }
  };

  const disableCamera = () => {
    stopCamera();
    setCameraState("idle");
    setCameraError(null);
    setPractice({ phase: "idle", seconds: 0 });
    setDetection(idleMotorDetection);
  };

  const startPractice = async () => {
    if (cameraState !== "ready") {
      setDetection({ status: "error", confidence: 0, sequenceStep: 0, message: t("screen.MotorGame.ui16") });
      return;
    }
    setSaved(null);
    setDetection({ status: "loading", confidence: 0, sequenceStep: 0, message: t("screen.MotorGame.ui17") });
    try {
      await loadFaceLandmarker();
      if (!streamRef.current?.active) {
        setPractice({ phase: "idle", seconds: 0 });
        setDetection({ status: "error", confidence: 0, sequenceStep: 0, message: t("screen.MotorGame.ui18") });
        return;
      }
      baselineRef.current = {};
      baselineSamplesRef.current = 0;
      stableMatchesRef.current = 0;
      sequenceStepRef.current = 0;
      bestConfidenceRef.current = 0;
      setDetection({ status: "calibrating", confidence: 0, sequenceStep: 0, message: t("screen.MotorGame.ui6") });
      setPractice({ phase: "prepare", seconds: 3 });
    } catch {
      setPractice({ phase: "idle", seconds: 0 });
      setDetection({ status: "error", confidence: 0, sequenceStep: 0, message: t("screen.MotorGame.ui19") });
    }
  };

  const resetPractice = () => {
    setPractice({ phase: "idle", seconds: 0 });
    setDetection(idleMotorDetection);
    stableMatchesRef.current = 0;
  };

  const changeExercise = () => {
    const nextIndex = (exerciseIndex + 1) % Math.max(availableMotorExercises.length, 1);
    setExerciseIndex(nextIndex);
    setSaved(null);
    resetPractice();
  };

  const finishDetectedMovement = async (support: "independent" | "supported") => {
    const completedExerciseId = exercises.find((item) => item.target === exercise?.id)?.id;
    if (!completedExerciseId || saved || practice.phase !== "matched") return;
    const result = await onComplete(0, completedExerciseId, {
      attempt_status: "participated",
      attempts_count: 1,
      correct_answers: 1,
      independence: support === "independent" ? 100 : 50,
      prompt_level: support === "independent" ? "independent" : "minimal",
    }, {
      source: "local-face-movement-check",
      detector: "mediapipe-face-blendshapes",
      target: exercise.id,
      movement_detected: true,
      threshold_signal: bestConfidenceRef.current,
      media_sent_to_server: false,
      media_saved: false,
    });
    if (result) setSaved(support);
  };

  const stopExercise = async (status: "break" | "refused") => {
    const completedExerciseId = exercises.find((item) => item.target === exercise?.id)?.id;
    if (!completedExerciseId) return;
    const result = await onComplete(0, completedExerciseId, { attempt_status: status, prompts_used: 0 }, { source: "manual_choice" });
    if (result && status === "break") onBack();
  };

  if (!exercise) return <div className="empty-state large"><ShieldAlert size={28}/><strong>{t("screen.MotorGame.ui20")}</strong><span>{t("screen.MotorGame.ui21")}</span><button className="secondary-button" onClick={onBack}>{t("screen.MotorGame.ui22")}</button></div>;

  return (
    <div className="page-enter game-page">
      <GameHeader title={t("screen.MotorGame.ui23")} subtitle={t("screen.MotorGame.ui24")} step={t("shell.template19", { v0: exerciseIndex + 1, v1: availableMotorExercises.length })} onBack={onBack} />
      <div className="game-layout">
        <div className="camera-panel">
          <video ref={videoRef} playsInline muted aria-hidden="true" className={cameraState === "ready" ? "visible" : ""} />
          {cameraState !== "ready" && <div className="camera-placeholder" aria-live="polite"><Image className="camera-placeholder-art" src="/app-illustrations/exercise-camera-hero.webp" width={768} height={512} alt={t("screen.MotorGame.ui25")}/><div className="camera-placeholder-content"><h3>{!cameraConsentGranted ? t("screen.MotorGame.ui26") : cameraState === "loading" ? t("screen.MotorGame.ui27") : cameraState === "error" ? t("screen.MotorGame.ui28") : t("screen.MotorGame.ui29")}</h3><p>{!cameraConsentGranted ? canManageConsent ? t("screen.MotorGame.ui30") : t("screen.MotorGame.ui31") : cameraState === "error" ? t("screen.MotorGame.ui32") : t("screen.MotorGame.ui33")}</p>{cameraError && <div className="camera-error" role="alert"><ShieldAlert size={17}/><span>{cameraError}</span></div>}{!cameraConsentGranted ? canManageConsent && <button className="primary-button" onClick={onOpenConsent}><ShieldCheck size={19}/>  {t("screen.MotorGame.ui34")}</button> : <button className="primary-button" onClick={startCamera} disabled={cameraState === "loading"}><Camera size={19} /> {cameraState === "error" ? t("screen.MotorGame.ui35") : t("screen.MotorGame.ui36")}</button>}</div></div>}
          {cameraState === "ready" && <><div className="face-frame" /><div className="camera-label"><span className="live-dot" />  {t("screen.MotorGame.ui37")}</div><button className="camera-stop-button" onClick={disableCamera}><CircleX size={15}/>  {t("screen.MotorGame.ui38")}</button>{practice.phase !== "idle" && !saved && <div className={`motor-attempt-overlay ${practice.phase}`} aria-hidden="true"><div>{practice.phase === "prepare" ? <><small>{t("screen.MotorGame.ui39")}</small><strong>{practice.seconds}</strong></> : practice.phase === "checking" ? <><small>{detection.message}</small><strong>{detection.confidence}%</strong></> : practice.phase === "matched" ? <><Check size={54}/><strong>{t("screen.MotorGame.ui40")}</strong></> : <><RotateCcw size={45}/><strong>{t("screen.MotorGame.ui41")}</strong></>}</div></div>}</>}
        </div>
        <div className="instruction-panel">
          <span className="kicker">{t("screen.MotorGame.ui42")}</span>
          <div className={`mouth-demo ${exercise.id}`}><MouthGuide type={exercise.id}/></div>
          <h2>{exercise.title}</h2>
          <p>{exercise.text}</p>
          <div className="motor-camera-note"><ShieldCheck size={18}/><span>{t("screen.MotorGame.ui43")}</span></div>
          <div className="coach-note"><Sparkles size={18} /> {cameraState === "ready" ? t("screen.MotorGame.ui44") : t("screen.MotorGame.ui45")}</div>
          <div className="motor-practice-flow" aria-live="polite" aria-atomic="true">
            {saved ? <div className="success-box"><Check size={20}/><div><strong>{t("screen.MotorGame.ui46")}</strong><span>{t("screen.MotorGame.ui47")}</span></div></div> : practice.phase === "idle" ? <><button className="primary-button motor-start-button" onClick={startPractice} disabled={cameraState !== "ready" || detection.status === "loading"}><Play size={18} fill="currentColor"/> {detection.status === "loading" ? t("screen.MotorGame.ui48") : t("screen.MotorGame.ui49")}</button>{detection.message && <div className={`motor-detection-message ${detection.status === "error" ? "error" : ""}`} role={detection.status === "error" ? "alert" : "status"}>{detection.message}</div>}</> : practice.phase === "prepare" || practice.phase === "checking" ? <div className={`motor-practice-status ${practice.phase}`}><span>{practice.phase === "prepare" ? practice.seconds : `${detection.confidence}%`}</span><div><strong>{practice.phase === "prepare" ? t("screen.MotorGame.ui50") : detection.message}</strong><small>{practice.phase === "prepare" ? t("screen.MotorGame.ui6") : detection.status === "no_face" ? t("screen.MotorGame.ui51") : t("shell.template20", { v0: practice.seconds })}</small>{practice.phase === "checking" && <i className="motor-signal-track"><b style={{ width: `${detection.confidence}%` }}/></i>}</div><button className="small-button" onClick={resetPractice}>{t("screen.MotorGame.ui52")}</button></div> : practice.phase === "matched" ? <><div className="success-box"><Check size={20}/><div><strong>{t("screen.MotorGame.ui8")}</strong><span>{t("screen.MotorGame.ui53")}</span></div></div><div className="motor-finish-actions"><button className="primary-button" onClick={() => finishDetectedMovement("independent")}><Check size={17}/>  {t("screen.MotorGame.ui54")}</button><button className="secondary-button" onClick={() => finishDetectedMovement("supported")}>{t("screen.MotorGame.ui55")}</button></div><button className="secondary-button motor-repeat-button" onClick={startPractice}><RotateCcw size={16}/>  {t("screen.MotorGame.ui56")}</button></> : <><div className="motor-not-found" role="status"><CircleAlert size={20}/><div><strong>{t("screen.MotorGame.ui4")}</strong><span>{t("screen.MotorGame.ui57")}</span></div></div><button className="primary-button motor-repeat-button" onClick={startPractice}><RotateCcw size={16}/>  {t("screen.MotorGame.ui35")}</button></>}
          </div>
          {!saved && <div className="motor-stop-actions"><button className="small-button" onClick={() => stopExercise("break")}><Pause size={15}/>  {t("screen.MotorGame.ui58")}</button><button className="small-button" onClick={() => stopExercise("refused")}><CircleX size={15}/>  {t("screen.MotorGame.ui59")}</button></div>}
          {availableMotorExercises.length > 1 && <button className="secondary-button wide" onClick={changeExercise}>{saved ? t("screen.MotorGame.ui60") : t("screen.MotorGame.ui61")}<ChevronRight size={18} /></button>}
        </div>
      </div>
    </div>
  );
}

type SensoryItem = { key: string; word: string; speech?: string; hint: string; icon?: LucideIcon; image?: string; visualClass?: string; isScene?: boolean };

const sensoryVisualTokens: Record<string, LucideIcon> = {
  dog: Dog, fish: Fish, bird: Bird, rabbit: Rabbit, turtle: Turtle, snail: Snail, bug: Bug,
  milk: Milk, blocks: Blocks, drum: Drum,
};

function SensoryVisual({ item }: { item: SensoryItem }) {
  const Icon = item.icon;
  return <span className={`sensory-visual ${item.visualClass || ""}`} aria-hidden="true">{item.image ? <Image src={item.image} alt="" width={item.isScene ? 960 : 640} height={item.isScene ? 720 : 640} sizes="(max-width:600px) 45vw, (max-width:1000px) 40vw, 360px"/> : Icon ? <Icon strokeWidth={1.65}/> : null}</span>;
}


type SensoryRound = { target: number; options: number[] };

function SensoryGame({ exercise, soundEnabled, onBack, onComplete }: { exercise?: Exercise; soundEnabled: boolean; onBack: () => void; onComplete: (score: number, exerciseId: number, measurement: GameMeasurement, details?: Record<string, unknown>) => Promise<unknown> | void }) {
  useLocale();
  const pet = useExercisePet();
  const sourceStimuli = exercise?.engine?.content.stimuli || [];
  const mixesVisualSystems = sourceStimuli.some((item) => Boolean(item.media_ref)) && sourceStimuli.some((item) => Boolean(item.visual_token));
  const consistentStimuli = mixesVisualSystems ? sourceStimuli.filter((item) => Boolean(item.media_ref)) : sourceStimuli;
  const [roundMedia, setRoundMedia] = useState<Record<string, string>>({});
  const previousMediaRef = useRef<Record<string, string>>({});
  const items: SensoryItem[] = consistentStimuli.map((item) => ({
    key: item.key,
    word: item.label,
    speech: item.speech,
    hint: item.hint || "",
    image: roundMedia[item.key] || item.media_ref,
    isScene: exercise?.engine?.mechanic === "action_choice",
    icon: item.visual_token ? sensoryVisualTokens[item.visual_token] : undefined,
  }));
  const [difficultyLevel, setDifficultyLevel] = useState<1 | 2 | 3>(exercise?.adaptive?.difficulty_params.difficulty_level || Math.min(3, Math.max(1, exercise?.difficulty || 2)) as 1 | 2 | 3);
  const baseDifficulty = resolveDifficulty(exercise?.engine?.content.difficulty_levels, difficultyLevel);
  const planned = exercise?.adaptive?.difficulty_params;
  const [roundLimit, setRoundLimit] = useState(planned?.round_count || exercise?.engine?.content.default_rounds || baseDifficulty.rounds);
  const difficulty = {...baseDifficulty, option_count: planned?.option_count || baseDifficulty.option_count, rounds: roundLimit};
  const [phase, setPhase] = useState<"demo" | "playing" | "resolved" | "technical">(soundEnabled ? "demo" : "technical");
  const [roundData, setRoundData] = useState<SensoryRound | null>(null);
  const [round, setRound] = useState(1);
  const [speechRate, setSpeechRate] = useState(0.78);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [audioPending, setAudioPending] = useState(false);
  const [attemptsThisRound, setAttemptsThisRound] = useState(0);
  const [wrongChoices, setWrongChoices] = useState<number[]>([]);
  const [reducedOptions, setReducedOptions] = useState<number[] | null>(null);
  const [roundCorrect, setRoundCorrect] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [accessibleSupportMode, setAccessibleSupportMode] = useState(false);
  const soundButtonRef = useRef<HTMLButtonElement>(null);
  const correctAnswersRef = useRef(0);
  const independentAnswersRef = useRef(0);
  const promptsUsedRef = useRef(0);
  const gameplayChoicesRef = useRef(0);
  const promptLevelRef = useRef<0 | 1 | 2>(0);
  const promptTypesRef = useRef<string[]>([]);
  const roundOutcomesRef = useRef<Array<Record<string, unknown>>>([]);
  const usedTargetsRef = useRef<Set<number>>(new Set());
  const preferredTargetsRef = useRef([...(planned?.preferred_stimulus_keys || [])]);
  const evidenceRef = useRef(newAnswerEvidence());
  const answerLockRef = useRef(false);
  const audioLockRef = useRef(false);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (phase !== "playing" || audioPending) return;
    const frame = window.requestAnimationFrame(() => soundButtonRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [audioPending, phase, round]);

  if (items.length < difficulty.option_count) return <div className="empty-state large" role="alert"><ShieldAlert size={28}/><strong>{t("screen.SensoryGame.ui1")}</strong><span>{t("screen.SensoryGame.ui2")}</span><button className="secondary-button" onClick={onBack}>{t("screen.SensoryGame.ui3")}</button></div>;

  const playWord = async (target = roundData?.target, repeat = true, encouragement?: string, encouragementProfile: "exercise" | "pet" = "exercise") => {
    if (target === undefined || audioLockRef.current || stoppedRef.current) return;
    if (repeat && phase === "playing") {
      evidenceRef.current = withSupport(evidenceRef.current, "repeat_audio");
      promptsUsedRef.current += 1;
      promptTypesRef.current.push("repeat_audio");
      promptLevelRef.current = Math.max(1, promptLevelRef.current) as 1 | 2;
    }
    audioLockRef.current = true;
    setAudioPending(true);
    const language = exercise?.engine?.language || "ru";
    // Hold the answer lock for the whole sequence; cancellation must not start a late word.
    const encouraged = !encouragement || await speak(encouragement, speechRate, soundEnabled, language, "exercise", exercise?.engine?.version_id, encouragementProfile);
    const played = encouraged && !stoppedRef.current && await speak(items[target].speech || items[target].word, speechRate, soundEnabled, language, "exercise", exercise?.engine?.version_id);
    audioLockRef.current = false;
    if (stoppedRef.current) return;
    setAudioPending(false);
    if (played) setAudioPlayed(true);
    else { setAudioPlayed(false); setPhase("technical"); }
  };

  const beginRound = async () => {
    if (!soundEnabled) { setPhase("technical"); return; }
    if (usedTargetsRef.current.size >= items.length) usedTargetsRef.current.clear();
    evidenceRef.current = newAnswerEvidence();
    answerLockRef.current = false;
    const preferredKey=preferredTargetsRef.current.shift();
    const choice = createChoiceRound(consistentStimuli, difficulty.option_count, [...usedTargetsRef.current].map(i=>items[i].key), Math.random, undefined, preferredKey);
    const nextRound = {target:items.findIndex(item=>item.key===choice.targetKey),options:choice.optionKeys.map(key=>items.findIndex(item=>item.key===key))};
    usedTargetsRef.current.add(nextRound.target);
    const targetKey = consistentStimuli[nextRound.target].key;
    const media = chooseRoundMedia(consistentStimuli, targetKey, previousMediaRef.current, exercise?.engine?.content.exemplar_policy === "matched_set");
    if (media[targetKey]) previousMediaRef.current[targetKey] = media[targetKey];
    setRoundMedia(media);
    setRoundData(nextRound);
    setPhase("playing");
    setAudioPlayed(false);
    setAttemptsThisRound(0);
    setWrongChoices([]);
    setReducedOptions(null);
    setRoundCorrect(false);
    setFeedback("");
    audioLockRef.current = true;
    setAudioPending(true);
    const played = await speak(items[nextRound.target].speech || items[nextRound.target].word, speechRate, soundEnabled, exercise?.engine?.language || "ru", "exercise", exercise?.engine?.version_id);
    audioLockRef.current = false;
    if (stoppedRef.current) return;
    setAudioPending(false);
    if (played) setAudioPlayed(true);
    else setPhase("technical");
  };

  const meaningHint = async () => {
    if (!roundData || phase !== "playing" || !audioPlayed || audioLockRef.current || answerLockRef.current || stoppedRef.current) return;
    evidenceRef.current = withSupport(evidenceRef.current, "visual_hint");
    promptsUsedRef.current += 1;
    promptTypesRef.current.push("visual_hint");
    promptLevelRef.current = Math.max(1, promptLevelRef.current) as 1 | 2;
    pet("hint");
    const hint = items[roundData.target].hint;
    setFeedback(hint);
    audioLockRef.current = true;
    setAudioPending(true);
    await speak(hint, speechRate, soundEnabled, exercise?.engine?.language || "ru", "exercise", exercise?.engine?.version_id);
    audioLockRef.current = false;
    if (!stoppedRef.current) setAudioPending(false);
  };

  const choose = (index: number) => {
    if (!roundData || phase !== "playing" || !audioPlayed || audioLockRef.current || answerLockRef.current || stoppedRef.current) return;
    evidenceRef.current = withResponse(evidenceRef.current, items[index].key);
    const attempt = attemptsThisRound + 1;
    gameplayChoicesRef.current += 1;
    setAttemptsThisRound(attempt);
    if (index === roundData.target) {
      const language = exercise?.engine?.language || "ru";
      const praise = language === "kk" ? "Жарайсың!" : nextPetPhrase("correct");
      // Exercise feedback follows the exercise sound toggle, even when the pet is muted/hidden.
      // The pet shows the same phrase without scheduling a second audio clip.
      pet("correct", { phrase: praise, silent: true });
      correctAnswersRef.current += 1;
      answerLockRef.current = true;
      const independent = responseOutcome(evidenceRef.current) === "independent";
      if (independent) independentAnswersRef.current += 1;
      setRoundCorrect(true);
      roundOutcomesRef.current.push({
        target_key: items[roundData.target].key,
        media_ref: items[roundData.target].image,
        option_media: roundData.options.map((value) => ({ key: items[value].key, media_ref: items[value].image })),
        option_keys: roundData.options.map((value) => items[value].key),
        selected_key: items[index].key,
        attempts: attempt,
        outcome: independent ? "independent" : "prompted",
        supports: evidenceRef.current.supports,
        first_response: evidenceRef.current.first_response,
      });
      setPhase("resolved");
      setFeedback(independent ? t("screen.SensoryGame.ui5") : t("screen.SensoryGame.ui6"));
      void speak(praise, speechRate, soundEnabled, language, "exercise", exercise?.engine?.version_id, "pet");
      return;
    }

    const nextWrongChoices = [...new Set([...wrongChoices, index])];
    setWrongChoices(nextWrongChoices);
    promptsUsedRef.current += 1;
    if (attempt === 1) {
      promptLevelRef.current = Math.max(promptLevelRef.current, 1) as 0 | 1 | 2;
      promptTypesRef.current.push("repeat_audio");
      evidenceRef.current = withSupport(evidenceRef.current, "repeat_audio");
      const encouragement = exercise?.engine?.language === "kk" ? "Тағы бір рет көр." : nextPetPhrase("incorrect");
      pet("incorrect", { phrase: encouragement, silent: true });
      setFeedback(encouragement);
      void playWord(roundData.target, false, encouragement, "pet");
    } else if (attempt === 2) {
      promptLevelRef.current = 2;
      promptTypesRef.current.push("reduced_choice");
      evidenceRef.current = withSupport(evidenceRef.current, "reduced_choice");
      const other = shuffled(roundData.options.filter((value) => value !== roundData.target && !nextWrongChoices.includes(value)))[0]
        ?? roundData.options.find((value) => value !== roundData.target);
      setReducedOptions(other === undefined ? [roundData.target] : shuffled([roundData.target, other]));
      const encouragement = exercise?.engine?.language === "kk" ? "Екі суреттің бірін таңда." : "Теперь выбери из двух картинок.";
      pet("incorrect", { phrase: encouragement, silent: true });
      setFeedback(encouragement);
      void playWord(roundData.target, false, encouragement);
    } else {
      promptLevelRef.current = 2;
      promptTypesRef.current.push("model_answer");
      evidenceRef.current = withSupport(evidenceRef.current, "model_answer");
      answerLockRef.current = true;
      setRoundCorrect(false);
      setPhase("resolved");
      roundOutcomesRef.current.push({
        target_key: items[roundData.target].key,
        media_ref: items[roundData.target].image,
        option_media: roundData.options.map((value) => ({ key: items[value].key, media_ref: items[value].image })),
        option_keys: roundData.options.map((value) => items[value].key),
        selected_key: items[index].key,
        attempts: attempt,
        outcome: "modelled",
        supports: evidenceRef.current.supports,
        first_response: evidenceRef.current.first_response,
      });
      const modelText = exercise?.engine?.language === "kk" ? items[roundData.target].word : exercise?.engine?.mechanic === "action_choice" ? `Ребёнок ${items[roundData.target].word.toLowerCase()}.` : `Это ${items[roundData.target].word.toLowerCase()}.`;
      setFeedback(t("game.modelTogether", { text: modelText }));
      void speak(modelText, 0.75, soundEnabled, exercise?.engine?.language || "ru", "exercise", exercise?.engine?.version_id);
    }
  };

  const next = async () => {
    if (!roundData) return;
    if (round === difficulty.rounds) {
      const correctAnswers = correctAnswersRef.current;
      const measurement: GameMeasurement = accessibleSupportMode ? {
        attempts_count: difficulty.rounds,
        correct_answers: correctAnswers,
        prompts_used: promptsUsedRef.current,
        gameplay_choices: gameplayChoicesRef.current,
        independent_completions: independentAnswersRef.current,
        prompted_completions: Math.max(0, correctAnswers - independentAnswersRef.current),
        attempt_status: "participated",
        independence: 0,
        prompt_level: "full",
      } : {
        attempts_count: difficulty.rounds,
        correct_answers: correctAnswers,
        prompts_used: promptsUsedRef.current,
        gameplay_choices: gameplayChoicesRef.current,
        independent_completions: independentAnswersRef.current,
        prompted_completions: Math.max(0, correctAnswers - independentAnswersRef.current),
        attempt_status: "completed",
        independence: Math.round(independentAnswersRef.current / difficulty.rounds * 100),
        prompt_level: promptLevelRef.current === 0 ? "independent" : promptLevelRef.current === 1 ? "minimal" : "full",
      };
      const result = exercise ? await onComplete(Math.round(correctAnswers / difficulty.rounds * 100), exercise.id, measurement, { exercise_version_id: exercise?.engine?.version_id, bank_key: exercise?.engine?.content.bank_key, bank_size: items.length, prompt_types: promptTypesRef.current, difficulty_level: difficultyLevel, option_count: difficulty.option_count, round_count: difficulty.rounds, round_outcomes: roundOutcomesRef.current, accessibility_mode: accessibleSupportMode ? "spoken_options_non_scored" : "visual_choice" }) : null;
      if (exercise && !result) return;
      correctAnswersRef.current = 0;
      independentAnswersRef.current = 0;
      promptsUsedRef.current = 0;
      gameplayChoicesRef.current = 0;
      promptLevelRef.current = 0;
      promptTypesRef.current = [];
      roundOutcomesRef.current = [];
      usedTargetsRef.current.clear();
      setRound(1);
      setRoundData(null);
      setPhase("demo");
    } else {
      setRound((value) => value + 1);
      void beginRound();
    }
  };

  const recordTechnicalIssue = async () => {
    if (!exercise) return;
    const result = await onComplete(0, exercise.id, { attempts_count: 0, correct_answers: 0, prompts_used: 0, attempt_status: "technical_error" }, { reason: soundEnabled ? "audio_unavailable" : "sound_disabled" });
    if (result) onBack();
  };

  const stopExercise = async (status: "break" | "refused") => {
    if (!exercise) { onBack(); return; }
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    const result = await onComplete(0, exercise.id, { attempts_count: 0, correct_answers: 0, prompts_used: 0, attempt_status: status }, { reason: "child_choice", completed_rounds: roundOutcomesRef.current.length, round_outcomes: roundOutcomesRef.current, bank_key: exercise.engine?.content.bank_key });
    if (!result) stoppedRef.current = false;
    if (result && status === "break") onBack();
  };

  const visibleOptions = reducedOptions || roundData?.options || [];
  return (
    <div className={`page-enter game-page ${exercise?.engine?.mechanic === "action_choice" ? "action-choice" : ""}`}>
      <GameHeader title={exercise?.title || t("screen.SensoryGame.ui10")} subtitle={t("screen.SensoryGame.ui11")} step={phase === "demo" ? t("screen.SensoryGame.ui12") : t("shell.template23", { v0: round, v1: difficulty.rounds })} onBack={onBack} />
      <div className="listen-card">
        {phase === "demo" ? <div className="sensory-demo"><SensoryVisual item={items[0]}/><span className="kicker">{t("screen.SensoryGame.ui13")}</span><h2>{t("screen.SensoryGame.ui14")}</h2><p>{t("screen.SensoryGame.ui15")}</p><fieldset className="sensory-access-mode"><legend>{t("screen.SensoryGame.ui16")}</legend><button type="button" className={!accessibleSupportMode ? "active" : ""} aria-pressed={!accessibleSupportMode} onClick={() => setAccessibleSupportMode(false)}><Eye size={17}/>  {t("screen.SensoryGame.ui17")}</button><button type="button" className={accessibleSupportMode ? "active" : ""} aria-pressed={accessibleSupportMode} onClick={() => setAccessibleSupportMode(true)}><Volume2 size={17}/>  {t("screen.SensoryGame.ui18")}</button></fieldset>{accessibleSupportMode && <p id="accessible-support-note" className="accessible-support-note"><ShieldAlert size={17}/>  {t("screen.SensoryGame.ui19")}</p>}{exercise?.adaptive ? <div className="adaptive-runner-setting"><Target size={18}/><span><strong>{difficulty.option_count}  {t("screen.SensoryGame.ui20")}</strong><small>{t("screen.SensoryGame.ui21")}</small></span></div> : <div className="runner-levels" aria-label={t("screen.SensoryGame.ui22")}><span>{t("screen.SensoryGame.ui23")}</span>{([1,2,3] as const).map((level) => { const value = resolveDifficulty(exercise?.engine?.content.difficulty_levels, level); return <button type="button" key={level} className={difficultyLevel === level ? "active" : ""} aria-pressed={difficultyLevel === level} onClick={() => setDifficultyLevel(level)}>{value.option_count}</button>; })}</div>}<>{exercise?.engine?.content.round_choices && <PracticeLength value={roundLimit} choices={exercise.engine.content.round_choices} bankSize={items.length} unit={exercise.engine.mechanic === "action_choice" ? t("screen.SensoryGame.ui24") : t("screen.SensoryGame.ui25")} onChange={setRoundLimit}/>}</><button className="primary-button" onClick={() => void beginRound()}>{t("screen.SensoryGame.ui26")} <ChevronRight size={17}/></button></div> : phase === "technical" ? <div className="sensory-demo technical"><Volume2 size={42}/><span className="kicker">{t("screen.SensoryGame.ui27")}</span><h2>{t("screen.SensoryGame.ui28")}</h2><p>{t("screen.SensoryGame.ui29")}</p><button className="primary-button" onClick={recordTechnicalIssue}>{t("screen.SensoryGame.ui30")}</button></div> : <>
          <div className="sound-zone"><button ref={soundButtonRef} className="sound-button" disabled={audioPending} onClick={() => void playWord()} aria-label={t("screen.SensoryGame.ui31")}><Volume2 size={34} strokeWidth={2} /></button><div><span className="kicker">{t("screen.SensoryGame.ui32")}</span><h2>{audioPending ? t("screen.SensoryGame.ui33") : audioPlayed ? t("screen.SensoryGame.ui34") : t("screen.SensoryGame.ui35")}</h2><div className="wave"><i /><i /><i /><i /><i /><i /><i /></div><div className="speech-rate" aria-label={t("screen.SensoryGame.ui36")}>{[{v:.65,l:t("screen.SensoryGame.ui37")},{v:.78,l:t("screen.SensoryGame.ui38")}].map((item)=><button key={item.v} className={speechRate===item.v?"active":""} aria-pressed={speechRate===item.v} onClick={()=>setSpeechRate(item.v)}>{item.l}</button>)}</div></div><button className="replay" disabled={audioPending} onClick={() => void playWord()}><RotateCcw size={17} />  {t("screen.SensoryGame.ui39")}</button></div>
          {accessibleSupportMode && <p id="accessible-support-note" className="accessible-support-note in-game"><ShieldAlert size={17}/>  {t("screen.SensoryGame.ui40")}</p>}
          <h3 className="choose-title">{t("screen.SensoryGame.ui41")}</h3>
          {exercise?.engine?.content.bank_key?.startsWith("scene-words-") && phase === "playing" && <button className="secondary-button" disabled={!audioPlayed || audioPending} onClick={()=>void meaningHint()}><Sparkles size={18}/>  {t("screen.SensoryGame.ui42")}</button>}
          <div className={`picture-options ${reducedOptions ? "reduced" : ""}`} data-option-count={visibleOptions.length}>
            {visibleOptions.map((index) => { const item = items[index]; const isAnswer = roundData?.target === index; const revealed = phase === "resolved"; const optionNumber = visibleOptions.indexOf(index) + 1; return <button key={item.word} disabled={!audioPlayed || audioPending || phase === "resolved" || (!reducedOptions && wrongChoices.includes(index))} aria-label={revealed || accessibleSupportMode ? item.word : t("shell.template24", { v0: optionNumber })} aria-describedby={accessibleSupportMode ? "accessible-support-note" : undefined} onClick={() => choose(index)} className={`${wrongChoices.includes(index) ? "wrong" : ""} ${revealed && isAnswer ? "answer" : ""}`}><SensoryVisual item={item}/>{revealed && <strong>{item.word}</strong>}{revealed && isAnswer && <i><Check size={16}/></i>}</button>; })}
          </div>
          {feedback && <div className={`answer-panel ${phase === "resolved" && roundCorrect ? "good" : "try"}`} role="status" aria-live="polite"><div className="answer-emoji">{phase === "resolved" && roundCorrect ? <Star fill="currentColor"/> : <Sparkles/>}</div><div><strong>{phase === "resolved" ? (roundCorrect ? t("screen.SensoryGame.ui43") : t("screen.SensoryGame.ui44")) : t("screen.SensoryGame.ui45")}</strong><span>{feedback}</span></div>{phase === "resolved" && round >= difficulty.rounds && roundLimit < (exercise?.engine?.content.max_rounds || roundLimit) && <button className="secondary-button" onClick={() => { setRoundLimit(value => Math.min(value + 6, exercise?.engine?.content.max_rounds || value)); setRound(value => value + 1); void beginRound(); }}>{t("screen.SensoryGame.ui46")}</button>}{phase === "resolved" && <button className="primary-button" onClick={next}>{round === difficulty.rounds ? t("screen.SensoryGame.ui47") : t("screen.SensoryGame.ui48")}<ChevronRight size={17}/></button>}</div>}
          <div className="score-dots" role="progressbar" aria-label={t("screen.SensoryGame.ui49")} aria-valuemin={1} aria-valuemax={difficulty.rounds} aria-valuenow={round} aria-valuetext={t("shell.template25", { v0: round, v1: difficulty.rounds })}>{Array.from({length:difficulty.rounds},(_,index)=>index+1).map((value) => <span key={value} className={value < round || (value === round && phase === "resolved") ? "filled" : ""}/>)}</div>
        </>}
        <div className="sensory-stop-actions" aria-label={t("screen.SensoryGame.ui50")}><button className="small-button" onClick={() => void stopExercise("break")}><Pause size={16}/>  {t("screen.SensoryGame.ui51")}</button><button className="small-button" onClick={() => void stopExercise("refused")}><CircleX size={16}/>  {t("screen.SensoryGame.ui52")}</button></div>
      </div>
    </div>
  );
}

const aacCategories = [
  { id: "favorites", get label() { return t("aac.category.favorites"); }, icon: Star }, { id: "help", get label() { return t("aac.category.help"); }, icon: HandHelping },
  { id: "wants", get label() { return t("aac.category.wants"); }, icon: Heart }, { id: "needs", get label() { return t("aac.category.needs"); }, icon: Activity },
  { id: "feelings", get label() { return t("aac.category.feelings"); }, icon: Smile }, { id: "yes_no", get label() { return t("aac.category.yes_no"); }, icon: Check },
  { id: "people", get label() { return t("aac.category.people"); }, icon: Users }, { id: "food", get label() { return t("aac.category.food"); }, icon: Apple },
  { id: "play", get label() { return t("aac.category.play"); }, icon: Gamepad2 }, { id: "places", get label() { return t("aac.category.places"); }, icon: MapPin }, { id: "actions", get label() { return t("aac.category.actions"); }, icon: Play }, { id: "household", get label() { return t("aac.category.household"); }, icon: House },
] as const;

const aacIconByLabel: Record<string, LucideIcon> = {
  "Помоги": HandHelping, "Больно": HeartPulse, "Перерыв": Pause, "Стоп": CircleX, "Не хочу": CircleX,
  "Ещё": Plus, "Хочу": HandHeart, "Пить": GlassWater, "Есть": Utensils, "Туалет": Toilet, "Отдых": Armchair,
  "Я": CircleUserRound, "Мама": Contact, "Папа": UserRoundCheck, "Бабушка": Glasses, "Дедушка": UserRound,
  "Брат": PersonStanding, "Сестра": Baby, "Сок": CupSoda, "Вода": GlassWater, "Чай": Coffee,
  "Яблоко": Apple, "Банан": Banana, "Хлеб": Croissant, "Суп": Soup, "Каша": CookingPot,
  "Мяч": Volleyball, "Машинка": Car, "Кукла": Baby, "Книга": BookOpen, "Пазл": Puzzle, "Кот": Cat,
  "Люблю": HandHeart, "Вижу": Eye, "Иду": PersonStanding, "Играю": Gamepad2, "Рисовать": Paintbrush,
  "Читать": BookOpen, "Спать": BedDouble, "Гулять": Trees, "Играл": Gamepad2, "Гулял": PersonStanding,
  "Да": CircleCheck, "Нет": CircleX, "Весело": Laugh, "Грустно": Frown, "Устал": Meh, "Спокойно": Smile,
  "Злюсь": Angry, "Страшно": ShieldAlert, "Жарко": ThermometerSun, "Холодно": ThermometerSnowflake,
  "Домой": House, "Школа": School, "Площадка": FerrisWheel, "Магазин": ShoppingCart, "Детский сад": Building2,
  "Привет": Hand, "Где?": CircleHelp, "Что это?": CircleHelp, "На столе": TableProperties,
  "В коробке": PackageOpen, "Под стулом": Armchair, "Вчера": Timer,
};

const aacCategoryIcons: Record<string, LucideIcon> = {
  help: HandHelping, wants: Heart, needs: Activity, feelings: Smile, yes_no: Check,
  people: Users, food: Apple, play: Gamepad2, places: MapPin, actions: Play,
};

const aacPictogramByLabel: Record<string, string> = {
  "Помоги": "help", "Больно": "pain", "Перерыв": "break", "Не хочу": "dont-want",
  "Ещё": "more", "Хочу": "want", "Пить": "drink", "Есть": "eat", "Туалет": "toilet", "Отдых": "rest",
  "Я": "me", "Мама": "mother", "Папа": "father", "Бабушка": "grandmother", "Дедушка": "grandfather",
  "Брат": "brother", "Сестра": "sister", "Привет": "hello",
  "Сок": "juice", "Вода": "water", "Чай": "tea", "Яблоко": "apple", "Банан": "banana",
  "Хлеб": "bread", "Суп": "soup", "Каша": "porridge",
  "Мяч": "ball", "Машинка": "toy-car", "Кукла": "doll", "Книга": "book", "Пазл": "puzzle", "Кот": "cat",
  "Да": "yes", "Нет": "no", "Весело": "happy", "Грустно": "sad", "Устал": "tired", "Спокойно": "calm",
  "Злюсь": "angry", "Страшно": "scared", "Жарко": "hot", "Холодно": "cold",
  "Люблю": "love", "Вижу": "see", "Иду": "go", "Играю": "play", "Рисовать": "draw", "Читать": "read",
  "Спать": "sleep", "Гулять": "walk", "Что это?": "what-is-this", "Вчера": "yesterday", "Играл": "played", "Гулял": "walked",
  "Домой": "home", "Школа": "school", "Площадка": "playground", "Где?": "where", "На столе": "on-table",
  "В коробке": "in-box", "Под стулом": "under-chair", "Магазин": "shop", "Детский сад": "kindergarten",
};

function AACVisual({ card, compact = false }: { card: AACCard; compact?: boolean }) {
  const pictogram = aacPictogramByLabel[card.label];
  const Icon = aacIconByLabel[card.label] || aacCategoryIcons[card.category] || MessageCircle;
  const designedSymbols: Record<string, string> = {
    "Вода": "/app-illustrations/aac-water.webp", "Помоги": "/app-illustrations/aac-help.webp", "Стоп": "/app-illustrations/aac-stop.webp", "Перерыв": "/app-illustrations/aac-break.webp",
    "Яблоко": "/app-illustrations/aac-apple.webp", "Банан": "/app-illustrations/aac-banana.webp", "Мишка": "/app-illustrations/aac-teddy.webp", "Поезд": "/app-illustrations/aac-train.webp",
    "Что это?": "/app-illustrations/aac-what-is-this.webp", "Устал": "/app-illustrations/aac-tired.webp", "Страшно": "/app-illustrations/aac-scared.webp", "Больно": "/app-illustrations/aac-pain.webp",
    "Не хочу": "/app-illustrations/aac-dont-want.webp", "Пить": "/app-illustrations/aac-drink.webp", "Есть": "/app-illustrations/aac-eat.webp", "Туалет": "/app-illustrations/aac-toilet.webp",
    "Отдых": "/app-illustrations/aac-rest.webp", "Ещё": "/app-illustrations/aac-more.webp", "Хочу": "/app-illustrations/aac-want.webp", "Я": "/app-illustrations/aac-me.webp",
    "Мама": "/app-illustrations/aac-mother.webp", "Папа": "/app-illustrations/aac-father.webp", "Сок": "/app-illustrations/aac-juice.webp", "Мяч": "/app-illustrations/aac-ball.webp",
    "Кот": "/app-illustrations/aac-cat.webp", "Люблю": "/app-illustrations/aac-love.webp", "Вижу": "/app-illustrations/aac-see.webp", "Да": "/app-illustrations/aac-yes.webp",
    "Нет": "/app-illustrations/aac-no.webp", "Весело": "/app-illustrations/aac-happy.webp", "Грустно": "/app-illustrations/aac-sad.webp", "Домой": "/app-illustrations/aac-home.webp",
    "Привет": "/app-illustrations/aac-hello.webp", "Бабушка": "/app-illustrations/aac-grandmother.webp", "Машинка": "/app-illustrations/aac-toy-car.webp", "Кукла": "/app-illustrations/aac-doll.webp",
    "Иду": "/app-illustrations/aac-go.webp", "Играю": "/app-illustrations/aac-play.webp", "Спокойно": "/app-illustrations/aac-calm.webp", "Школа": "/app-illustrations/aac-school.webp",
    "Площадка": "/app-illustrations/aac-playground.webp", "Где?": "/app-illustrations/aac-where.webp", "На столе": "/app-illustrations/aac-on-table.webp", "В коробке": "/app-illustrations/aac-in-box.webp",
    "Под стулом": "/app-illustrations/aac-under-chair.webp", "Вчера": "/app-illustrations/aac-yesterday.webp", "Играл": "/app-illustrations/aac-played.webp", "Гулял": "/app-illustrations/aac-walked.webp",
    "Хлеб": "/app-illustrations/aac-bread.webp", "Суп": "/app-illustrations/aac-soup.webp", "Каша": "/app-illustrations/aac-porridge.webp", "Чай": "/app-illustrations/aac-tea.webp",
    "Книга": "/app-illustrations/aac-book.webp", "Пазл": "/app-illustrations/aac-puzzle.webp", "Рисовать": "/app-illustrations/aac-draw.webp", "Читать": "/app-illustrations/aac-read.webp",
    "Спать": "/app-illustrations/aac-sleep.webp", "Гулять": "/app-illustrations/aac-walk.webp", "Злюсь": "/app-illustrations/aac-angry.webp", "Жарко": "/app-illustrations/aac-hot.webp",
    "Холодно": "/app-illustrations/aac-cold.webp", "Магазин": "/app-illustrations/aac-shop.webp", "Детский сад": "/app-illustrations/aac-kindergarten.webp",
    "Дедушка": "/app-illustrations/aac-grandfather.webp", "Брат": "/app-illustrations/aac-brother.webp", "Сестра": "/app-illustrations/aac-sister.webp",
  };
  const customPhoto = card.image?.startsWith("data:image/") ? card.image : null;
  const photo = customPhoto || designedSymbols[card.label] || (card.image?.startsWith("/") && card.image !== "/soyle-mark.svg" ? card.image : null);
  const relation = card.label === "На столе" ? "above" : card.label === "В коробке" ? "inside" : card.label === "Под стулом" ? "below" : "";
  const past = ["Вчера", "Играл", "Гулял"].includes(card.label);
  return <span className={`aac-visual aac-${card.category} ${!pictogram && relation ? `relation-${relation}` : ""} ${compact ? "compact" : ""}`} data-label={card.label} aria-hidden="true">{photo ? <Image className="aac-pictogram-image" src={photo} alt="" width={128} height={128} unoptimized/> : pictogram ? <Image className="aac-pictogram-image" src={`/aac-pictograms/${pictogram}.png`} alt="" width={128} height={128}/> : <><Icon strokeWidth={1.75}/>{relation && <i className="aac-relation-dot"/>}{past && <i className="aac-past-mark"/>}</>}</span>;
}

const aacSafetyConcepts: Record<string,string> = {"Помоги":"help","Больно":"pain","Перерыв":"break","Стоп":"stop","Не хочу":"refuse","Да":"yes","Нет":"no"};

function PhraseGame({ childId, canManage, exercise, freeMode = false, soundEnabled, onBack, onComplete }: { childId?: number; canManage: boolean; exercise?: Exercise; freeMode?: boolean; soundEnabled: boolean; onBack: () => void; onComplete?: (score: number, phrase: string, exerciseId: number, measurement: GameMeasurement) => Promise<unknown> | void }) {
  const pet = useExercisePet();
  const aacLocale = useLocale();
  const [cards, setCards] = useState<AACCard[]>([]);
  const [recentCardIds, setRecentCardIds] = useState<number[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [boardError, setBoardError] = useState(false);
  const [selected, setSelected] = useState<AACCard[]>([]);
  const [category, setCategory] = useState<string>(() => ({
    help: "help", refusal: "yes_no", need: "needs", desire: "wants", request: "wants", preference: "food", choice: "food",
    feelings: "feelings", answer: "yes_no", family: "people", greeting: "people", observation: "actions", agent_action: "actions",
    routine: "actions", past_event: "actions", spatial_phrase: "places", question: "places",
  }[exercise?.target || ""] || "favorites"));
  const [history, setHistory] = useState<Array<{ id: number; phrase: string }>>([]);
  const [cardQuery, setCardQuery] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ label: "", speech: "", category: "needs" });
  const [customImage, setCustomImage] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [aacNotice, setAacNotice] = useState("");
  const [speechPending, setSpeechPending] = useState(false);
  const [promptLevel, setPromptLevel] = useState<"independent" | "minimal" | "full">("independent");
  const savedRef = useRef(false);
  const speechLifetime = useRef(0);
  useEffect(() => () => { speechLifetime.current += 1; stopCurrentSpeech(); }, [childId]);
  const composition = composeAACMessage(selected, freeMode ? "free" : "guided", languageOf(getLocale()));
  const sentence = composition.valid ? composition.phrase : selected.map((item) => item.label).join(" + ");
  const boardRequest = useRef(0);
  const loadBoard = useCallback(() => {
    const requestId = ++boardRequest.current;
    if (!childId) { setCardsLoading(false); return; }
    setCardsLoading(true); setBoardError(false); setRecentCardIds([]);
    setSelected([]);
    api<AACCard[]>(`/api/aac/cards/${childId}${canManage && freeMode ? "?preview=true" : ""}`).then(value => { if (requestId === boardRequest.current) setCards(value); }).catch((cause) => {
      if (requestId !== boardRequest.current) return;
      setCards([]); setBoardError(true);
      setAacNotice(cause instanceof Error ? t("common.withReason", {message:t("aac.copy080"), reason:cause.message}) : t("aac.copy080"));
    }).finally(() => { if (requestId === boardRequest.current) setCardsLoading(false); });
    api<Array<{ id: number; phrase: string }>>(`/api/aac/history/${childId}`).then(value => { if (requestId === boardRequest.current) setHistory(value); }).catch((cause) => {
      if (requestId !== boardRequest.current) return;
      setAacNotice(cause instanceof Error ? t("common.withReason", {message:t("aac.copy081"), reason:cause.message}) : t("aac.copy081"));
    });
  }, [childId,canManage,freeMode]);
  useEffect(() => { const timer = window.setTimeout(loadBoard, 0); return () => { window.clearTimeout(timer); boardRequest.current += 1; }; }, [loadBoard, aacLocale]);
  const normalizedCardQuery = cardQuery.trim().toLocaleLowerCase(aacLocale);
  const scenario = !freeMode && exercise ? exercise.engine?.content : undefined;
  const scenarioLabels = scenario?.labels?.length ? new Set(scenario.labels) : null;
  const selectedLabels = selected.map(scenarioCardLabel);
  const scenarioEvaluation = evaluateAACScenario(scenario, selectedLabels);
  const canAddGuidedCard = (card: AACCard) => freeMode || canAddAACScenarioCard(scenario, selectedLabels, scenarioCardLabel(card));
  const composerHint = freeMode
    ? selected.length
      ? composition.valid ? t("aac.copy000") : composition.reason
      : t("aac.copy001")
    : selected.length && !composition.valid
      ? composition.reason
      : scenarioEvaluation.hint;
  const availableCards = scenarioLabels ? cards.filter((card) => scenarioLabels.has(scenarioCardLabel(card))) : cards;
  const categoryCards = category === "recent" ? recentCardIds.flatMap(id => availableCards.find(card => card.id === id) || []) : category === "favorites" ? availableCards.filter(card => card.favorite || card.is_core) : availableCards.filter(card => card.category === category);
  const visibleCards = (freeMode && !normalizedCardQuery ? categoryCards : availableCards).filter(card => !normalizedCardQuery || `${card.label} ${card.speech}`.toLocaleLowerCase(aacLocale).includes(normalizedCardQuery));

  const safetyCards = ["Помоги", "Перерыв", "Стоп", "Не хочу"].flatMap((label) => scenarioLabels?.has(label) ? [] : cards.find((card) => card.label === label || card.concept_key === aacSafetyConcepts[label]) || []);
  const addCard = (card: AACCard) => {
    if (selected.some((item) => item.id === card.id)) {
      setAacNotice(t("aac.alreadyAdded", {label:card.label}));
      return;
    }
    if (!canAddGuidedCard(card)) {
      setAacNotice(scenarioEvaluation.complete ? scenarioEvaluation.hint : t("aac.copy002"));
      return;
    }
    setRecentCardIds(ids => [card.id, ...ids.filter(id => id !== card.id)].slice(0, 12));
    savedRef.current = false;
    setAacNotice("");
    setSelected((items) => [...items, card].slice(-8));
  };
  const toggleFavorite = async (card: AACCard) => {
    if (!childId) return;
    try {
      await api(`/api/aac/cards/${card.id}/favorite?child_id=${childId}`, { method: "PATCH", body: JSON.stringify({ favorite: !card.favorite }) });
      setCards((items) => items.map((item) => item.id === card.id ? { ...item, favorite: !item.favorite } : item));
    } catch (cause) {
      setAacNotice(cause instanceof Error ? t("common.withReason", {message:t("aac.copy003"), reason:cause.message}) : t("aac.copy003"));
    }
  };
  const sayPhrase = async () => {
    if (!selected.length || !childId || speechPending) return;
    if (!freeMode && !scenarioEvaluation.complete) {
      pet("hint");
      setAacNotice(scenarioEvaluation.hint);
      return;
    }
    setSpeechPending(true);
    const lifetime = ++speechLifetime.current;
    try {
      const composed = await api<{ valid: boolean; phrase: string; reason: string }>("/api/aac/compose", { method: "POST", body: JSON.stringify({ child_id: childId, card_ids: selected.map((item) => item.id), language: selected[0].language || "ru", mode: freeMode ? "free" : "guided", preview_translations: canManage && freeMode }) });
      if (lifetime !== speechLifetime.current) return;
      if (!composed.valid) { pet("incorrect"); setAacNotice(composed.reason || t("aac.copy004")); return; }
      setAacNotice("");
      const played = await speak(composed.phrase, 0.72, freeMode || soundEnabled, selected[0]?.language || "ru", "exercise", freeMode ? undefined : exercise?.engine?.version_id);
      if (lifetime !== speechLifetime.current) return;
      if (!played) { setAacNotice(t("aac.copy005")); return; }
      pet("correct");
      try {
        if (!selected.some(card => card.translation_preview)) {
        const saved = await api<{ id: number; phrase: string }>("/api/aac/history", { method: "POST", body: JSON.stringify({ child_id: childId, card_ids: selected.map((item) => item.id), mode: freeMode ? "free" : "guided" }) });
        setHistory((items) => [saved, ...items.filter((item) => item.phrase !== saved.phrase)].slice(0, 12));
        }
      } catch (cause) {
        setAacNotice(cause instanceof Error ? t("common.withReason", {message:t("aac.copy006"), reason:cause.message}) : t("aac.copy006"));
      }
      if (lifetime !== speechLifetime.current) return;
      if (!freeMode && !savedRef.current && exercise && onComplete) {
        const labels = selected.map((card) => card.label);
        const refused = (selected.some(card => card.concept_key === "refuse" || card.concept_key === "stop" || (exercise.target === "answer" && card.concept_key === "no")) || labels.includes("Не хочу") || labels.includes("Стоп") || (exercise.target === "answer" && labels.includes("Нет"))) && exercise.target !== "refusal";
        const paused = selected.some((card) => card.concept_key === "break" || card.label === "Перерыв");
        if (!scenarioEvaluation.complete && !refused && !paused) {
          pet("hint");
          setAacNotice(scenarioEvaluation.hint);
          return;
        }
        const result = await onComplete(0, composed.phrase, exercise.id, { prompts_used: promptLevel === "independent" ? 0 : 1, prompt_level: promptLevel, attempt_status: refused ? "refused" : paused ? "break" : "participated", independence: promptLevel === "independent" ? 100 : promptLevel === "minimal" ? 60 : 30, communication_initiatives: 0 });
        if (result) savedRef.current = true;
      }
    } catch (cause) {
      if (lifetime === speechLifetime.current) setAacNotice(cause instanceof Error ? cause.message : t("aac.copy007"));
    } finally {
      if (lifetime === speechLifetime.current) setSpeechPending(false);
    }
  };
  const sendQuickMessage = async (card: AACCard) => {
    setSpeechPending(true);
    const lifetime = ++speechLifetime.current;
    setSelected([card]);
    setAacNotice(t("aac.copy008"));
    try {
      const played = await speak(card.speech, 0.72, true, card.language || "ru", "exercise", freeMode ? undefined : exercise?.engine?.version_id);
      if (lifetime !== speechLifetime.current) return;
      setAacNotice(!played ? t("aac.copy009") : (card.concept_key === "break" || card.label === "Перерыв") ? t("aac.copy010") : (["no","stop","refuse"].includes(card.concept_key || "") || ["Нет","Стоп","Не хочу"].includes(card.label)) ? t("aac.copy011") : t("aac.copy012"));
      if (!freeMode && !savedRef.current && exercise && onComplete && (["break","stop","refuse"].includes(card.concept_key || "") || ["Перерыв","Стоп","Не хочу"].includes(card.label))) {
        const result = await onComplete(0, card.speech, exercise.id, { attempts_count: 0, correct_answers: 0, prompts_used: 0, attempt_status: (card.concept_key === "break" || card.label === "Перерыв") ? "break" : "refused", communication_initiatives: 0 });
        if (result) savedRef.current = true;
      }
    } catch (cause) {
      if (lifetime === speechLifetime.current) setAacNotice(cause instanceof Error ? cause.message : t("aac.copy013"));
    } finally {
      if (lifetime === speechLifetime.current) setSpeechPending(false);
    }
  };
  const createCustom = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!childId) return;
    if (!customImage) { setAacNotice(t("aac.copy014")); return; }
    try {
      const card = await api<AACCard>("/api/aac/cards", { method: "POST", body: JSON.stringify({ child_id: childId, ...custom, language: languageOf(getLocale()), image: customImage }) });
      setCards((items) => [...items, card]); setCustom({ label: "", speech: "", category: "needs" }); setCustomImage(""); setCustomOpen(false); setCategory(card.category); setAacNotice(t("aac.copy015"));
    } catch (cause) {
      setAacNotice(cause instanceof Error ? cause.message : t("aac.copy016"));
    }
  };
  const replayHistory = async (phrase: string) => {
    if (speechPending) return;
    const lifetime = ++speechLifetime.current;
    setSpeechPending(true);
    try {
      const played = await speak(phrase, 0.72, freeMode || soundEnabled);
      if (lifetime === speechLifetime.current) setAacNotice(played ? t("aac.copy012") : t("aac.copy017"));
    } finally { if (lifetime === speechLifetime.current) setSpeechPending(false); }
  };
  const activeCategory = aacCategories.find((item) => item.id === category) || aacCategories[0];
  const quickCards = ["Помоги", "Больно", "Стоп", "Перерыв", "Не хочу", "Да"].flatMap((label) => cards.find((card) => card.label === label || card.concept_key === aacSafetyConcepts[label]) || []);
  return <div className={`page-enter game-page aac-page redesigned ${freeMode ? "aac-free" : ""}`}>
    {cards.some(card => card.translation_preview) && <p role="status">{t("aac.previewNote")}</p>}
    <GameHeader title={freeMode ? t("nav.words") : exercise?.title || t("aac.copy018")} subtitle={freeMode ? t("aac.copy019") : t("aac.copy020")} step={freeMode ? t("aac.copy021") : scenarioEvaluation.stepLabel} onBack={onBack}/>

    {!freeMode && <div className="aac-goal"><div><span className="kicker">{t("aac.copy025")}</span><strong>{scenario?.title || exercise?.instruction || t("aac.copy026")}</strong><p>{scenario?.instruction || exercise?.instruction}</p>{scenario?.steps?.length ? <ol className="aac-task-steps">{scenario.steps.map((step) => <li key={step}>{step}</li>)}</ol> : null}</div><Target size={22}/><p>{scenario?.criterion || t("aac.copy027")}</p>{canManage && <div className="aac-prompt-level" aria-label={t("aac.copy028")}><span>{t("aac.copy029")}</span>{([['independent',t("specialist.copy002")],['minimal',t("aac.copy030")],['full',t("aac.copy031")]] as const).map(([value,label]) => <button key={value} className={promptLevel === value ? "active" : ""} aria-pressed={promptLevel === value} onClick={() => setPromptLevel(value)}>{label}</button>)}</div>}</div>}
    <section className="aac-composer aac-composer-top"><div className="aac-composer-head"><div><span className="kicker">{freeMode ? t("aac.copy032") : t("aac.copy033")}</span><strong aria-live="polite">{sentence || t("aac.copy034")}</strong><small>{composerHint}</small></div><div className="aac-composer-actions">{freeMode && <button type="button" className="clear-button" disabled={!selected.length || speechPending} onClick={() => { setSelected(items => items.slice(0, -1)); setAacNotice(""); savedRef.current = false; }}><Undo2 size={18}/>{t("ux.undoWord")}</button>}<button className="clear-button" disabled={!selected.length || speechPending} onClick={() => { setSelected([]); setAacNotice(""); savedRef.current = false; }}>{t("aac.copy035")}</button><button className="speak-button" disabled={speechPending || !selected.length || !composition.valid || (!freeMode && !scenarioEvaluation.complete)} onClick={sayPhrase}><Volume2 size={21}/>{speechPending ? t("aac.copy036") : freeMode ? t("aac.copy037") : scenarioEvaluation.actionLabel}</button></div></div><div className={`aac-sentence ${selected.length ? "filled" : ""}`}>{selected.length ? selected.map((card, index) => <button key={`${card.id}-${index}`} disabled={speechPending} aria-label={t("aac.removeCard", {label:card.label})} onClick={() => { savedRef.current = false; setSelected((items) => items.filter((_, itemIndex) => itemIndex !== index)); }}><span className="aac-card-order">{index + 1}</span><AACVisual card={card} compact/><span>{card.label}</span><X size={13}/></button>) : <div className="aac-empty-message"><MessageCircle size={24}/><div><strong>{freeMode ? t("aac.copy039") : scenarioEvaluation.hint}</strong><span>{freeMode ? t("aac.copy040") : t("aac.copy041")}</span></div></div>}</div>{selected.length > 0 && <p className="aac-remove-hint">{t("aac.copy042")}</p>}</section>
    {freeMode && <section className="aac-quick" aria-label={t("aac.copy022")}><div className="aac-quick-head"><div><span className="kicker">{t("aac.copy023")}</span><strong>{t("aac.copy024")}</strong></div><ShieldCheck size={22}/></div><div>{quickCards.map((card) => <button key={card.id} onClick={() => sendQuickMessage(card)}><AACVisual card={card} compact/><span>{card.label}</span></button>)}</div>{aacNotice && <p role="status">{aacNotice}{(selected[0]?.concept_key === "break" || selected[0]?.label === "Перерыв") && <button onClick={onBack}>{t("game.break")}</button>}</p>}</section>}
    {aacNotice && !freeMode && <div className="aac-notice" role="status"><Volume2 size={18}/><span>{aacNotice}</span>{(selected[0]?.concept_key === "break" || selected[0]?.label === "Перерыв") && <button className="small-button" onClick={onBack}>{t("game.break")}</button>}</div>}
    {!freeMode ? <div className="aac-guided-workspace">
      <section className="aac-board guided"><div className="aac-toolbar"><div><span className="kicker">{scenarioEvaluation.complete ? t("aac.copy043") : t("aac.copy044")}</span><h3>{scenario?.title || t("aac.copy045")}</h3></div><small>{availableCards.length} {availableCards.length === 1 ? t("aac.copy046") : availableCards.length < 5 ? t("aac.copy047") : t("aac.copy048")}</small></div>
        <div className="aac-card-grid guided">{visibleCards.map((card) => <div className={`aac-card aac-card-${card.category} ${card.is_core ? "core" : ""}`} key={card.id}><button className="aac-card-main" disabled={speechPending || selected.some((item) => item.id === card.id) || !canAddGuidedCard(card)} onClick={() => addCard(card)}><AACVisual card={card}/><strong>{card.label}</strong><small>{card.speech}</small></button></div>)}</div>
      </section>
      {safetyCards.length > 0 && <section className="aac-guided-safety" aria-label={t("aac.copy049")}><div><span className="kicker">{t("aac.copy050")}</span><strong>{t("aac.copy051")}</strong></div><div>{safetyCards.map((card) => <button key={card.id} onClick={() => sendQuickMessage(card)}><AACVisual card={card} compact/><span>{card.label}</span></button>)}</div></section>}
    </div> : <div className="aac-workspace">
      <aside className="aac-category-panel"><div><span className="kicker">{t("aac.copy052")}</span><h3>{category === "recent" ? t("ux.recentCards") : category === "favorites" ? t("aac.copy053") : activeCategory.label}</h3></div><nav className="aac-tabs primary-aac-tabs" aria-label={t("aac.copy054")}><button className={category === "favorites" ? "active" : ""} aria-pressed={category === "favorites"} onClick={() => { setCategory("favorites"); setCardQuery(""); }}><Star size={19}/><span>{t("aac.copy055")}</span><small>{availableCards.filter((card) => card.favorite || card.is_core).length}</small></button><button type="button" className={category === "recent" ? "active" : ""} aria-pressed={category === "recent"} onClick={() => { setCategory("recent"); setCardQuery(""); }}><Clock3 size={19}/><span>{t("ux.recentCards")}</span><small>{recentCardIds.length}</small></button><button className={categoriesOpen ? "active" : ""} aria-expanded={categoriesOpen} aria-controls="more-aac-categories" onClick={() => setCategoriesOpen((value) => !value)}><Plus size={19}/><span>{t("nav.more")}</span><small>{aacCategories.length - 1}</small></button></nav>{categoriesOpen && <nav id="more-aac-categories" className="aac-tabs more-aac-tabs" aria-label={t("aac.copy056")}>{aacCategories.filter((item) => item.id !== "favorites").map((item) => { const Icon = item.icon; const count = availableCards.filter((card) => card.category === item.id).length; return <button key={item.id} className={category === item.id ? "active" : ""} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setCardQuery(""); }}><Icon size={18}/><span>{item.label}</span><small>{count}</small></button>; })}</nav>}{history.length > 0 && <div className="aac-history"><span className="kicker">{t("aac.copy057")}</span>{history.slice(0,3).map((item) => <button key={item.id} onClick={() => replayHistory(item.phrase)}><RotateCcw size={14}/><span>{item.phrase}</span></button>)}</div>}</aside>
      <section className="aac-board" aria-busy={cardsLoading}><div className="aac-toolbar"><div><span className="kicker">{category === "favorites" ? t("aac.copy058") : t("aac.copy059")}</span><h3>{normalizedCardQuery ? t("ux.searchAllWords") : category === "recent" ? t("ux.recentCards") : category === "favorites" ? t("aac.copy060") : activeCategory.label}</h3></div><div className="aac-tools">{<label className="aac-search"><Search size={16}/><input type="search" value={cardQuery} onChange={(event) => setCardQuery(event.target.value)} placeholder={t("aac.copy061")} aria-label={t("aac.copy061")}/></label>}<button className="small-button" onClick={() => document.querySelector<HTMLElement>(".aac-page")?.requestFullscreen?.()}><LayoutDashboard size={15}/> {t("aac.copy062")}</button>{canManage && freeMode && <button className="small-button" onClick={() => setCustomOpen((value) => !value)}><Plus size={15}/> {t("aac.copy063")}</button>}</div></div>
        {customOpen && <form className="aac-custom-form" onSubmit={createCustom}><label>{t("aac.copy064")}<input value={custom.label} onChange={(e) => setCustom({...custom,label:e.target.value})} placeholder={t("aac.copy065")} required/></label><label>{t("aac.copy066")}<input value={custom.speech} onChange={(e) => setCustom({...custom,speech:e.target.value})} placeholder={t("aac.copy067")} required/></label><label>{t("aac.copy068")}<select value={custom.category} onChange={(e) => setCustom({...custom,category:e.target.value})}>{aacCategories.filter((item) => item.id !== "favorites").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="aac-custom-photo">{t("aac.copy069")}<input type="file" accept="image/png,image/jpeg,image/webp" required={!customImage} disabled={imageBusy} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setImageBusy(true); try { setCustomImage(await compressPhoto(file)); setAacNotice(""); } catch (cause) { setAacNotice(cause instanceof Error ? cause.message : t("aac.copy070")); } finally { setImageBusy(false); } }}/>{customImage && <Image src={customImage} alt={t("aac.copy071")} width={64} height={64} unoptimized/>}</label><button className="primary-button" disabled={imageBusy || !customImage}>{imageBusy ? t("aac.copy072") : t("aac.copy073")}</button></form>}
        <div className="aac-card-grid">{visibleCards.map((card) => <div className={`aac-card aac-card-${card.category} ${card.is_core ? "core" : ""}`} key={card.id}><button className="aac-card-main" disabled={speechPending || selected.some((item) => item.id === card.id)} onClick={() => addCard(card)}><AACVisual card={card}/><strong>{card.label}</strong><small>{card.speech}</small></button><button className={`aac-favorite ${card.favorite ? "active" : ""}`} onClick={() => toggleFavorite(card)} aria-label={card.favorite ? t("aac.removeFavorite", {label:card.label}) : t("aac.addFavorite", {label:card.label})}><Star size={15} fill={card.favorite ? "currentColor" : "none"}/></button></div>)}</div>
        {cardsLoading ? <p role="status">{t("ux.loadingWords")}</p> : boardError ? <div className="aac-empty" role="alert"><strong>{t("aac.copy080")}</strong><button type="button" className="small-button" onClick={loadBoard}>{t("ux.retry")}</button></div> : !visibleCards.length && <div className="aac-empty" role="status"><Search size={24}/><strong>{t("aac.copy078")}</strong><span>{category === "recent" && !normalizedCardQuery ? t("ux.recentHint") : t("aac.copy079")}</span>{normalizedCardQuery && <button type="button" className="small-button" onClick={() => setCardQuery("")}>{t("ux.clearSearch")}</button>}</div>}
      </section>
    </div>}
  </div>;
}


function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="stat-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>; }

function AIParentScreen({ child }: { child?: Child }) {
  useLocale();
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answer, setAnswer] = useState<AIAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const quickQuestions = [
    { title: t("screen.AIParentScreen.ui1"), question: t("screen.AIParentScreen.ui2") },
    { title: t("screen.AIParentScreen.ui3"), question: t("screen.AIParentScreen.ui4") },
    { title: t("screen.AIParentScreen.ui5"), question: t("screen.AIParentScreen.ui6") },
  ];
  const ask = async (event?: React.FormEvent, preparedQuestion?: string) => {
    event?.preventDefault();
    const value = (preparedQuestion || question).trim();
    if (!child || value.length < 3 || loading) return;
    setSubmittedQuestion(value); setQuestion(""); setLoading(true); setError(""); setAnswer(null);
    try {
      setAnswer(await api<AIAnswer>(`/api/ai/ask/${child.id}`, { method: "POST", body: JSON.stringify({ question: value }) }));
    } catch (cause) { setQuestion(value); setError(cause instanceof Error ? cause.message : t("screen.AIParentScreen.ui7")); }
    finally { setLoading(false); }
  };
  const chooseQuestion = (value: string) => {
    setQuestion(value);
    setError("");
    requestAnimationFrame(() => questionRef.current?.focus());
  };
  const resetConversation = () => {
    setAnswer(null);
    setSubmittedQuestion("");
    setError("");
    requestAnimationFrame(() => questionRef.current?.focus());
  };
  return <div className="page-enter ai-parent-page redesigned-ai">
    <header className="ai-page-heading">
      <div className="ai-page-title"><span className="ai-mark"><Bot size={24}/></span><div><span className="kicker">{t("screen.AIParentScreen.ui8")}</span><h1>{t("screen.AIParentScreen.ui9")}</h1><p>{t("screen.AIParentScreen.ui10")}</p></div></div>
      <span className="ai-status ready"><i/>{t("screen.AIParentScreen.ui11")}</span>
    </header>

    <div className="ai-chat-layout">
      <aside className="ai-prompt-panel" aria-label={t("screen.AIParentScreen.ui12")}>
        <div><span className="kicker">{t("screen.AIParentScreen.ui13")}</span><h2>{t("screen.AIParentScreen.ui12")}</h2><p>{t("screen.AIParentScreen.ui14")}</p></div>
        <div className="ai-quick-questions">{quickQuestions.map((item) => <button type="button" key={item.title} onClick={() => chooseQuestion(item.question)}><span><MessageCircle size={17}/></span><strong>{item.title}</strong><ChevronRight size={16}/></button>)}</div>
        <div className="ai-privacy-note"><ShieldCheck size={18}/><div><strong>{t("screen.AIParentScreen.ui15")}</strong><span>{t("screen.AIParentScreen.ui16")}</span></div></div>
        <div className="ai-limits"><strong>{t("screen.AIParentScreen.ui17")}</strong><ul><li>{t("screen.AIParentScreen.ui18")}</li><li>{t("screen.AIParentScreen.ui19")}</li><li>{t("screen.AIParentScreen.ui20")}</li></ul><small>{t("screen.AIParentScreen.ui21")}</small></div>
      </aside>

      <section className="ai-conversation" aria-label={t("screen.AIParentScreen.ui22")}>
        <div className="ai-conversation-head"><div><span className="ai-mini-avatar"><Bot size={18}/></span><span><strong>{t("screen.AIParentScreen.ui23")}</strong><small>{t("screen.AIParentScreen.ui24")}</small></span></div>{(answer || submittedQuestion) && <button type="button" className="ai-new-chat" onClick={resetConversation} disabled={loading}><Plus size={16}/>{t("screen.AIParentScreen.ui25")}</button>}</div>

        <div className={`ai-thread ${!answer && !loading ? "empty" : ""}`} aria-live="polite" aria-busy={loading}>
          {!answer && !loading && !submittedQuestion && <div className="ai-welcome"><span><Bot size={28}/></span><h2>{t("screen.AIParentScreen.ui26")}</h2><p>{t("screen.AIParentScreen.ui27")}</p><div><ShieldCheck size={16}/>  {t("screen.AIParentScreen.ui28")}</div></div>}

          {submittedQuestion && <div className="ai-message user-message"><small>{t("screen.AIParentScreen.ui29")}</small><p>{submittedQuestion}</p></div>}

          {loading && <div className="ai-message assistant-message ai-thinking" role="status"><div className="ai-message-meta"><span><Bot size={16}/></span><strong>{t("screen.AIParentScreen.ui23")}</strong></div><div className="ai-thinking-row"><i/><i/><i/><span>{t("screen.AIParentScreen.ui30")}</span></div></div>}

          {answer && <article className="ai-message assistant-message ai-answer-card">
            <div className="ai-message-meta"><span><Bot size={16}/></span><div><strong>{t("screen.AIParentScreen.ui23")}</strong><small>{t("screen.AIParentScreen.ui31")}</small></div></div>
            {answer.provider_message && <div className="inline-error ai-provider-error" role="status"><ShieldAlert size={17} aria-hidden="true"/><span>{answer.provider_message}</span></div>}
            <p className="ai-answer-text">{answer.answer}</p>
            {answer.suggested_actions.length > 0 && <div className="ai-action-plan"><strong>{t("screen.AIParentScreen.ui32")}</strong><ol>{answer.suggested_actions.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol></div>}
            <div className={answer.needs_professional_help ? "ai-safety warning" : "ai-safety"}><ShieldCheck size={18} aria-hidden="true"/><span>{answer.safety_note}</span></div>
            <small className="ai-disclaimer">{answer.disclaimer}</small>
            <div className="ai-answer-actions"><button type="button" onClick={() => void ask(undefined, submittedQuestion)} disabled={loading}><RotateCcw size={15}/>{t("screen.AIParentScreen.ui33")}</button><button type="button" onClick={resetConversation}><Plus size={15}/>{t("screen.AIParentScreen.ui34")}</button></div>
          </article>}
        </div>

        {error && <div className="inline-error ai-chat-error" role="alert"><CircleAlert size={17}/><span>{error}</span></div>}
        <form className="ai-composer" onSubmit={ask}>
          <label className="sr-only" htmlFor="ai-parent-question">{t("screen.AIParentScreen.ui35")}</label>
          <textarea id="ai-parent-question" ref={questionRef} value={question} onChange={(event) => setQuestion(event.target.value)} minLength={3} maxLength={600} rows={2} placeholder={t("screen.AIParentScreen.ui36")}/>
          <div className="ai-composer-footer"><span>{question.length}{t("screen.AIParentScreen.ui37")}</span><button className="primary-button" aria-label={t("screen.AIParentScreen.ui38")} disabled={loading || question.trim().length < 3}><ArrowUp size={19}/><span>{t("screen.AIParentScreen.ui39")}</span></button></div>
        </form>
      </section>
    </div>
  </div>;
}

function ChildMoreScreen({ onOpen }: { onOpen: (screen: Screen) => void }) {
  useLocale();
  const items: Array<{ screen: Screen; title: string; text: string; icon: LucideIcon; image: string }> = [
    { screen: "world", title: t("screen.ChildMoreScreen.ui1"), text: t("screen.ChildMoreScreen.ui2"), icon: ImageIcon, image: "/app-illustrations/more-world.webp" },
    { screen: "skills", title: t("screen.ChildMoreScreen.ui3"), text: t("screen.ChildMoreScreen.ui4"), icon: BarChart3, image: "/app-illustrations/more-skills.webp" },
    { screen: "achievements", title: t("screen.ChildMoreScreen.ui5"), text: t("screen.ChildMoreScreen.ui6"), icon: Trophy, image: "/app-illustrations/more-achievements.webp" },
    { screen: "settings", title: t("screen.ChildMoreScreen.ui7"), text: t("screen.ChildMoreScreen.ui8"), icon: Settings, image: "/app-illustrations/more-settings.webp" },
  ];
  return <div className="v2-screen v2-child-more page-enter"><header className="v2-page-heading"><Image src="/app-illustrations/more-hero.webp" alt="" fill unoptimized sizes="(max-width: 760px) 100vw, 1190px"/><span className="v2-child-more-heading-copy"><span className="v2-kicker">{t("screen.ChildMoreScreen.ui9")}</span><h1>{t("screen.ChildMoreScreen.ui10")}</h1><p>{t("screen.ChildMoreScreen.ui11")}</p></span></header><div className="v2-child-more-grid">{items.map((item) => { const Icon = item.icon; return <button type="button" key={item.screen} onClick={() => onOpen(item.screen)}><span className="v2-child-more-icon"><Icon aria-hidden="true"/></span><span className="v2-child-more-copy"><strong>{item.title}</strong><small>{item.text}</small><span className="v2-child-more-arrow"><ChevronRight aria-hidden="true"/></span></span><span className="v2-child-more-art"><Image src={item.image} alt="" fill unoptimized sizes="(max-width: 760px) 115px, 150px"/></span></button>; })}</div></div>;
}

function ParentMoreScreen({ onOpen }: { onOpen: (screen: Screen) => void }) {
  useLocale();
  const items: Array<{ screen: Screen; title: string; text: string; icon: LucideIcon }> = [
    { screen: "goals", title: t("screen.ParentMoreScreen.ui1"), text: t("screen.ParentMoreScreen.ui2"), icon: Target },
    { screen: "ai", title: t("screen.ParentMoreScreen.ui3"), text: t("screen.ParentMoreScreen.ui4"), icon: Bot },
    { screen: "parent", title: t("screen.ParentMoreScreen.ui5"), text: t("screen.ParentMoreScreen.ui6"), icon: UserRound },
    { screen: "settings", title: t("screen.ParentMoreScreen.ui7"), text: t("screen.ParentMoreScreen.ui8"), icon: Settings },
    { screen: "profile", title: t("screen.ParentMoreScreen.ui9"), text: t("screen.ParentMoreScreen.ui10"), icon: CircleUserRound },
  ];
  return <div className="page-enter parent-more-page"><PageTitle eyebrow={t("screen.ParentMoreScreen.ui11")} title={t("screen.ParentMoreScreen.ui12")} subtitle={t("screen.ParentMoreScreen.ui13")}/><div className="parent-more-grid">{items.map((item) => { const Icon = item.icon; return <button key={item.screen} aria-label={item.title} onClick={() => onOpen(item.screen)}><span><Icon size={25}/></span><div><strong>{item.title}</strong><small>{item.text}</small></div><ChevronRight size={23}/></button>; })}</div></div>;
}

const parentSections = [{id: "overview", get label() { return t("cabinet.overview"); }}, {id: "practice", get label() { return t("cabinet.practice"); }}, {id: "specialist", get label() { return t("cabinet.specialist"); }}, {id: "materials", get label() { return t("cabinet.materials"); }}, {id: "access", get label() { return t("cabinet.access"); }}] as const;

function ParentScreen({ child, childProfiles, onSelectChild, onDeleted, dashboard, onConsentChange, onNavigate, onStartPlan }: { child?: Child; childProfiles: Child[]; onSelectChild: (id: number) => void; onDeleted: (id: number) => void; dashboard: Dashboard | null; onConsentChange: (consent: ChildConsent) => void; onNavigate: (screen: Screen) => void; onStartPlan: (plan: AdaptivePlan) => Promise<void> }) {
  useLocale();
  const [section, navigate] = useCabinetSection("parent", parentSections);
  const [student, setStudent] = useState<{ username: string } | null>(null);
  const [studentForm, setStudentForm] = useState({ username: "", pin: "" });
  const [accountMessage, setAccountMessage] = useState("");
  const [consent, setConsent] = useState<ChildConsent>({ child_id: child?.id || 0, privacy_accepted: false, camera_processing: false, ai_processing: false, analytics_processing: false, version: "", updated_at: null });
  const [consentReady, setConsentReady] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [dataMessage, setDataMessage] = useState("");
  useEffect(() => {
    if (!child?.id) return;
    let active = true;
    api<ChildConsent>(`/api/children/${child.id}/consent`).then((value) => { if (active) { setConsent(value); onConsentChange(value); setConsentReady(true); } }).catch((cause) => {
      if (!active) return;
      setDataMessage(cause instanceof Error ? t("screen.ParentScreen.template1", { v0: cause.message }) : t("screen.ParentScreen.ui1"));
    });
    api<{ username: string } | null>(`/api/children/${child.id}/student-account`).then((value) => { if (!active) return; setStudent(value); if (value) setStudentForm((current) => ({ ...current, username: value.username })); }).catch((cause) => {
      if (!active) return;
      setAccountMessage(cause instanceof Error ? t("screen.ParentScreen.template2", { v0: cause.message }) : t("screen.ParentScreen.ui2"));
    });
    return () => { active = false; };
  }, [child?.id, onConsentChange]);
  const saveStudent = async (event: React.FormEvent) => {
    event.preventDefault(); setAccountMessage("");
    if (!child) return;
    try {
      const result = await api<{ username: string }>(`/api/children/${child.id}/student-account`, { method: "POST", body: JSON.stringify(studentForm) });
      setStudent(result); setStudentForm((current) => ({ ...current, pin: "" })); setAccountMessage(t("screen.ParentScreen.ui3"));
    } catch (cause) { setAccountMessage(cause instanceof Error ? cause.message : t("screen.ParentScreen.ui4")); }
  };
  const exportData = async () => {
    if (!child) return;
    const data = await api<Record<string, unknown>>(`/api/children/${child.id}/export`);
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `soyle-${child.name}.json`; link.click(); URL.revokeObjectURL(url);
  };
  const saveConsent = async () => {
    if (!child || !consentReady || consentSaving) return;
    setConsentSaving(true); setDataMessage("");
    try {
      const value = await api<ChildConsent>(`/api/children/${child.id}/consent`, { method: "PUT", body: JSON.stringify({ privacy_accepted: consent.privacy_accepted, camera_processing: consent.camera_processing, ai_processing: false, analytics_processing: consent.analytics_processing, specialist_sharing: Boolean(consent.specialist_sharing) }) });
      setConsent(value); onConsentChange(value); setDataMessage(t("screen.ParentScreen.ui5"));
    } catch (cause) { setDataMessage(cause instanceof Error ? cause.message : t("screen.ParentScreen.ui6")); }
    finally { setConsentSaving(false); }
  };
  const deleteData = async (event: React.FormEvent) => {
    event.preventDefault(); if (!child) return; setDataMessage("");
    try { await api(`/api/children/${child.id}`, { method: "DELETE", body: JSON.stringify({ password: deletePassword }) }); onDeleted(child.id); }
    catch (cause) { setDataMessage(cause instanceof Error ? cause.message : t("screen.ParentScreen.ui7")); }
  };
  return <div className="page-enter stack-xl parent-page focused-parent-cabinet">
    <PageTitle eyebrow={t("screen.ParentScreen.ui11")} title={child?.name || t("screen.ParentScreen.ui12")} subtitle={t("screen.ParentScreen.ui13")} />
    <CabinetNavigation cabinet="parent" sections={parentSections.filter(item => item.id !== "materials")} active={section === "materials" ? "practice" : section} onNavigate={navigate}/>
    {childProfiles.length > 1 && <label className="cabinet-child-picker">{t("screen.ParentScreen.ui14")}<select value={child?.id || ""} onChange={event => { const url = new URL(window.location.href); url.searchParams.set("child", event.target.value); window.history.replaceState(null, "", url); onSelectChild(Number(event.target.value)); }}>{childProfiles.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    <div className="cabinet-page" hidden={section !== "overview"}><ParentCabinetOverview child={child} consentReady={consentReady} consent={consent} student={student} onPractice={() => navigate("practice")} onSpecialist={() => navigate("specialist")} onResults={() => onNavigate("progress")} onAccess={() => navigate("access")}/></div>
    <div className="cabinet-page" hidden={section !== "practice" && section !== "materials"}>
    <div className="cabinet-intro"><h2>{t("screen.ParentScreen.ui46")}</h2><p>{t("screen.ParentScreen.ui47")}</p><button className="secondary-button" onClick={() => onNavigate("goals")}>{t("screen.ParentScreen.ui48")}</button></div>
    <section className="admin-card family-support-guide"><div className="admin-card-head"><div><span className="kicker">{t("screen.ParentScreen.ui49")}</span><h3>{t("screen.ParentScreen.ui50")}</h3><p>{t("screen.ParentScreen.ui51")}</p></div></div><div><article><span>1</span><div><strong>{t("screen.ParentScreen.ui52")}</strong><p>{t("screen.ParentScreen.ui53")}</p></div></article><article><span>2</span><div><strong>{t("screen.ParentScreen.ui54")}</strong><p>{t("screen.ParentScreen.ui55")}</p></div></article><article><span>3</span><div><strong>{t("screen.ParentScreen.ui56")}</strong><p>{t("screen.ParentScreen.ui57")}</p></div></article><article className="stop"><Pause size={18}/><div><strong>{t("screen.ParentScreen.ui58")}</strong><p>{t("screen.ParentScreen.ui59")}</p></div></article></div></section>
    {child&&<VocabularyProgress key={child.id} childId={child.id} refreshKey={dashboard?.total_sessions||0}/>}
    <FunctionalSkillMap childId={child?.id}/>
    <HomePracticeLibrary childId={child?.id}/>
    <details className="cabinet-method-note"><summary>{t("journey.previewStories")}</summary>
    <section className="storybook-preview-entry"><div><span className="kicker">{t("screen.ParentScreen.ui20")}</span><h2>{t("screen.ParentScreen.ui21")}</h2><p>{t("screen.ParentScreen.ui22")}</p></div><button className="primary-button" onClick={() => onNavigate("comic-preview")}><BookOpen/>  {t("screen.ParentScreen.ui23")} <ChevronRight/></button></section>
    <section className="storybook-preview-entry"><div><span className="kicker">{t("screen.ParentScreen.ui24")}</span><h2>{t("screen.ParentScreen.ui25")}</h2><p>{t("screen.ParentScreen.ui26")}</p></div><button className="primary-button" onClick={() => onNavigate("story-preview")}><BookOpen/>  {t("screen.ParentScreen.ui27")} <ChevronRight/></button></section>
    </details>
    <details className="cabinet-method-note"><summary>{t("screen.ParentScreen.ui60")}</summary>
      <section className="recommend-card"><div className="recommend-icon"><Bot /></div><span className="kicker">{t("screen.ParentScreen.ui61")}</span><h2>{t("screen.ParentScreen.ui62")}</h2><p>{t("screen.ParentScreen.ui63")}</p><ul><li><Check size={16}/>{t("screen.ParentScreen.ui64")}</li><li><Check size={16}/>{t("screen.ParentScreen.ui65")}</li><li><Check size={16}/>{t("screen.ParentScreen.ui66")}</li></ul></section>
    </details>
    </div>
    <div className="cabinet-page" hidden={section !== "access"}>
    <div className="cabinet-intro"><h2>{t("screen.ParentScreen.ui74")}</h2><p>{t("screen.ParentScreen.ui75")}</p></div>
    <div className="parent-management-grid">
      <section className="admin-card student-access"><div className="admin-card-head"><div><span className="kicker">{t("screen.ParentScreen.ui76")}</span><h3>{student ? t("screen.ParentScreen.ui77") : t("screen.ParentScreen.ui78")}</h3><p>{t("screen.ParentScreen.ui79")}</p></div><span className="period-pill">{t("screen.ParentScreen.ui80")}</span></div><form className="student-access-form" onSubmit={saveStudent}><label>{t("screen.ParentScreen.ui81")}<input value={studentForm.username} onChange={(e) => setStudentForm({...studentForm, username:e.target.value})} placeholder={t("screen.ParentScreen.ui82")} pattern={"[A-Za-z0-9_.\\-]+"} minLength={3} required/></label><label>{t("screen.ParentScreen.ui83")}<input value={studentForm.pin} onChange={(e) => setStudentForm({...studentForm, pin:e.target.value.replace(/\D/g, "")})} placeholder={t("screen.ParentScreen.ui84")} inputMode="numeric" minLength={4} maxLength={12} required/></label><button className="primary-button">{t("screen.ParentScreen.ui85")}</button></form>{accountMessage && <div className="usage-note" role="status"><Check size={18}/><p>{accountMessage}</p></div>}</section>
      <section className="admin-card privacy-control"><div className="admin-card-head"><div><span className="kicker">{t("screen.ParentScreen.ui86")}</span><h3>{t("screen.ParentScreen.ui87")}</h3><p>{t("screen.ParentScreen.ui88")}</p></div></div><div className="consent-options"><label><input type="checkbox" disabled={!consentReady || consentSaving} checked={consent.privacy_accepted} onChange={(e)=>setConsent(e.target.checked ? {...consent,privacy_accepted:true} : {...consent,privacy_accepted:false,camera_processing:false,ai_processing:false,analytics_processing:false,specialist_sharing:false})}/><span><b>{t("screen.ParentScreen.ui89")}</b><small>{t("screen.ParentScreen.ui90")}</small></span></label><label className={!consent.privacy_accepted ? "disabled" : ""}><input type="checkbox" disabled={!consentReady || consentSaving || !consent.privacy_accepted} checked={consent.camera_processing} onChange={(e)=>setConsent({...consent,camera_processing:e.target.checked})}/><span><b>{t("screen.ParentScreen.ui91")}</b><small>{t("screen.ParentScreen.ui92")}</small></span></label><label className={!consent.privacy_accepted ? "disabled" : ""}><input type="checkbox" disabled={!consentReady || consentSaving || !consent.privacy_accepted} checked={consent.analytics_processing} onChange={(e)=>setConsent({...consent,analytics_processing:e.target.checked})}/><span><b>{t("screen.ParentScreen.ui93")}</b><small>{t("screen.ParentScreen.ui94")}</small></span></label><label className={!consent.privacy_accepted ? "disabled" : ""}><input type="checkbox" disabled={!consentReady || consentSaving || !consent.privacy_accepted} checked={Boolean(consent.specialist_sharing)} onChange={(e)=>setConsent({...consent,specialist_sharing:e.target.checked})}/><span><b>{t("screen.ParentScreen.ui95")}</b><small>{t("screen.ParentScreen.ui96")}</small></span></label></div><div className="privacy-actions"><button className="primary-button" disabled={!consentReady || consentSaving} onClick={saveConsent}>{t("screen.ParentScreen.ui97")}</button>{consent.updated_at && <small className="consent-updated">{t("screen.ParentScreen.ui98")} {formatDate(consent.updated_at, {dateStyle: "short", timeStyle: "short"})}</small>}</div></section>
    </div>

    <section className="data-control"><div><ShieldCheck/><span><strong>{t("screen.ParentScreen.ui99")}</strong><small>{t("screen.ParentScreen.ui100")}</small></span></div><div className="data-actions"><button className="secondary-button" onClick={exportData}>{t("screen.ParentScreen.ui101")}</button><button className="small-button danger-button" onClick={() => setDeleteOpen(!deleteOpen)}>{t("screen.ParentScreen.ui102")}</button></div></section>{deleteOpen && <form className="delete-data-form" onSubmit={deleteData}><div><strong>{t("screen.ParentScreen.ui103")}</strong><p>{t("screen.ParentScreen.ui104")}</p></div><input type="password" value={deletePassword} onChange={(e)=>setDeletePassword(e.target.value)} placeholder={t("screen.ParentScreen.ui105")} required/><button className="small-button danger-button">{t("screen.ParentScreen.ui106")}</button></form>}{dataMessage && <div className="usage-note"><Check size={18}/><p>{dataMessage}</p></div>}
    </div>
    <div className="cabinet-page" hidden={section !== "specialist"}>{child && <FamilySpecialistAccess key={child.id} childId={child.id} enabled={consentReady && Boolean(consent.specialist_sharing)} onManagePermissions={() => navigate("access")} onStartPlan={onStartPlan}/>}</div>
    <div className="medical-note"><ShieldCheck size={25}/><div><strong>{t("screen.ParentScreen.ui107")}</strong><p>{t("screen.ParentScreen.ui108")}</p></div></div>
  </div>;
}

function AdminScreen() {
  useLocale();
  type StudentAccount = { id: number; username: string; child_name: string; parent_name: string; is_active: number | boolean };
  type UsageDaily = { date: string; requests: number; input_tokens: number; output_tokens: number; total_tokens: number; estimated_cost_usd: number };
  type UsageEvent = { id: number; actor_id: number; actor_type: "user" | "student"; actor_name: string; actor_username: string; actor_role: Role | "unknown"; child_id: number | null; child_name: string | null; provider: string; model: string; feature: string; input_tokens: number; output_tokens: number; total_tokens: number; estimated_cost_usd: number; created_at: string };
  type UsageData = { period_days: number; requests: number; input_tokens: number; output_tokens: number; total_tokens: number; estimated_cost_usd: number; note: string; breakdown: Array<{ provider: string; model: string; feature: string; requests: number; input_tokens: number; output_tokens: number; cost: number }>; daily: UsageDaily[]; recent: UsageEvent[] };
  type AuditEvent = { id: number; actor_key: string; action: string; object_type: string; object_id: string | null; metadata: Record<string, unknown>; created_at: string };
  type DraftPreview = { valid: boolean; can_publish: boolean; blocker: string | null; errors: string[]; version: DraftExerciseVersion };
  const [contentLoading, setContentLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, children: 0, sessions: 0, exercises: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [usage, setUsage] = useState<UsageData>({ period_days: 30, requests: 0, input_tokens: 0, output_tokens: 0, total_tokens: 0, estimated_cost_usd: 0, note: "", breakdown: [], daily: [], recent: [] });
  const [usageDays, setUsageDays] = useState<7 | 30 | 90>(30);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState("");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [drafts, setDrafts] = useState<DraftPreview[]>([]);
  const [homeDrafts, setHomeDrafts] = useState<HomeActivityDraft[]>([]);
  const [reviewWorkspace, setReviewWorkspace] = useState<ContentReviewWorkspaceData | null>(null);
  const [homePreview, setHomePreview] = useState<HomeActivityDraft | null>(null);
  const [tab, setTab] = useState<"users" | "exercises" | "usage" | "audit">("exercises");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", objective: "", instruction: "", difficulty: 1, stimuli: "" });
  const [formMessage, setFormMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const reviewReturnScrollRef = useRef(0);
  const load = useCallback(async () => {
    setAdminError(""); setContentLoading(true);
    const results = await Promise.allSettled([
      api<typeof stats>("/api/admin/stats"),
      api<User[]>("/api/admin/users"),
      api<StudentAccount[]>("/api/admin/students"),
      api<Exercise[]>("/api/exercises"),
      api<AuditEvent[]>("/api/admin/audit"),
      api<DraftPreview[]>("/api/admin/exercise-drafts"),
      api<HomeActivityDraft[]>("/api/admin/home-activity-drafts"),
      api<{ status: string }>("/api/health"),
    ]);
    if (results[0].status === "fulfilled") setStats(results[0].value);
    if (results[1].status === "fulfilled") setUsers(results[1].value);
    if (results[2].status === "fulfilled") setStudents(results[2].value);
    if (results[3].status === "fulfilled") setExercises(results[3].value);
    if (results[4].status === "fulfilled") setAuditEvents(results[4].value);
    if (results[5].status === "fulfilled") setDrafts(results[5].value);
    if (results[6].status === "fulfilled") setHomeDrafts(results[6].value);
    setApiHealthy(results[7].status === "fulfilled" && results[7].value.status === "ok");
    setContentLoading(false);
    if (results.some((result) => result.status === "rejected")) setAdminError(t("screen.AdminScreen.ui1"));
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const loadUsage = useCallback(async (days: 7 | 30 | 90) => {
    setUsageLoading(true);
    setUsageError("");
    try {
      setUsage(await api<UsageData>(`/api/admin/usage?days=${days}&limit=50`));
    } catch (error) {
      setUsageError(error instanceof Error ? error.message : t("screen.AdminScreen.ui2"));
    } finally {
      setUsageLoading(false);
    }
  }, []);
  const changeRole = async (id: number, role: Exclude<Role, "student">) => { try { await api(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }); await load(); } catch (cause) { setAdminError(cause instanceof Error ? cause.message : t("screen.AdminScreen.ui3")); } };
  const toggleUser = async (item: User) => { try { await api(`/api/admin/users/${item.id}/active`, { method: "PATCH", body: JSON.stringify({ is_active: !item.is_active }) }); await load(); } catch (cause) { setAdminError(cause instanceof Error ? cause.message : t("screen.AdminScreen.ui4")); } };
  const addExercise = async (event: React.FormEvent) => {
    event.preventDefault(); setFormMessage("");
    const stimuli = form.stimuli.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [key = "", label = "", speech = "", visual = ""] = line.split("|").map((part) => part.trim());
      return { key, label, speech, ...(visual.startsWith("/") ? { media_ref: visual } : visual ? { visual_token: visual } : {}) };
    });
    try {
      const preview = await api<DraftPreview>("/api/admin/exercise-drafts", { method: "POST", body: JSON.stringify({
        module: "sensory", mechanic: "auditory_choice", title: form.title, objective: form.objective,
        instruction: form.instruction, difficulty: form.difficulty, skill: "vocabulary", language: "ru",
        response_mode: "single_tap", prompt_policy: { steps: ["repeat_audio", "visual_hint", "reduced_choice", "model_answer"], time_limit: null, max_attempts: 3 },
        completion_rule: { rounds: 12, success: "matching_stimulus_key" }, content: { stimuli, difficulty_levels: [{level:1,option_count:2,rounds:12,max_attempts:3},{level:2,option_count:3,rounds:12,max_attempts:3},{level:3,option_count:4,rounds:12,max_attempts:3}] },
        method_card: {
          target_skill: form.objective,
          skill_group: ["понимание предметов", "словарное понимание"],
          intended_for: ["Дети, которым нужна практика понимания знакомых слов"],
          diagnosis_boundary: "Целевая группа описана через наблюдаемый навык, а не диагноз.",
          prerequisites: ["Может рассмотреть два изображения", "Может ответить касанием или доступным альтернативным способом"],
          stimuli_and_responses: "Структурированные изображения; ответ — одно нажатие после аудиоинструкции.",
          child_instruction: form.instruction,
          adult_guidance: ["Дать не меньше пяти секунд", "Не требовать речевого ответа", "Отмечать использованную подсказку"],
          accepted_responses: ["Самостоятельное нажатие", "Нажатие с отмеченной подсказкой", "Отказ, перерыв или просьба о помощи"],
          difficulty_levels: ["Два варианта", "Три варианта", "Четыре варианта"],
          prompts: ["Повтор аудио", "Смысловая подсказка", "Сокращение выбора", "Модель ответа"],
          ambiguities: ["Однозначность изображений и отвлекающих вариантов требует ручной проверки"],
          stop_conditions: ["Отказ", "Перерыв", "Дискомфорт", "Техническая ошибка"],
          result_registration: ["Разделять самостоятельный ответ, подсказку, отказ, перерыв и техническую ошибку"],
          real_life_transfer: ["Проверить перенос со знакомыми безопасными предметами дома"],
          sources: [],
          evidence_note: "Источники не заявлены; материал требует независимой русскоязычной методической проверки.",
          methodology_review_status: "pending",
        },
      }) });
      setFormMessage(preview.valid ? t("screen.AdminScreen.ui33") : t("screen.AdminScreen.template1", { v0: preview.errors.join("; ") }));
      setForm({ title: "", objective: "", instruction: "", difficulty: 1, stimuli: "" });
      await load();
    } catch (cause) { setFormMessage(cause instanceof Error ? cause.message : t("screen.AdminScreen.ui34")); }
  };
  const openReview = async (versionId: number) => {
    setAdminError("");
    reviewReturnScrollRef.current = window.scrollY;
    try { setReviewWorkspace(await api<ContentReviewWorkspaceData>(`/api/admin/exercise-drafts/${versionId}/preview`)); window.scrollTo({ top: 0 }); }
    catch (cause) { setAdminError(cause instanceof Error ? cause.message : t("screen.AdminScreen.ui35")); }
  };
  const closeReviewWorkspace = () => {
    setReviewWorkspace(null);
    window.requestAnimationFrame(() => window.scrollTo({ top: reviewReturnScrollRef.current }));
  };
  const openHomePreview = (item: HomeActivityDraft) => {
    reviewReturnScrollRef.current = window.scrollY;
    setHomePreview(item);
    window.scrollTo({ top: 0 });
  };
  const closeHomePreview = () => {
    setHomePreview(null);
    window.requestAnimationFrame(() => window.scrollTo({ top: reviewReturnScrollRef.current }));
  };
  const reviewContent = async (stage: "admin", decision: "changes_requested", comment: string) => {
    if (!reviewWorkspace) return;
    const updated = await api<ContentReviewWorkspaceData>(`/api/admin/exercise-drafts/${reviewWorkspace.version.id}/reviews`, { method: "POST", body: JSON.stringify({ stage, decision, comment }) });
    setReviewWorkspace(updated);
    await load();
  };
  const publishContent = async (comment: string) => {
    if (!reviewWorkspace) return;
    await api(`/api/admin/exercise-drafts/${reviewWorkspace.version.id}/publish`, {method: "POST", body: JSON.stringify({comment})});
    closeReviewWorkspace();
    await load();
  };
  const publishHomeContent = async () => {
    if (!homePreview) return;
    await api(`/api/admin/home-activity-drafts/${homePreview.id}/publish`, {method: "POST"});
    closeHomePreview();
    await load();
  };
  const archiveExercise = async (id: number) => { try { await api(`/api/admin/exercises/${id}`, { method: "DELETE" }); await load(); } catch (cause) { setAdminError(cause instanceof Error ? cause.message : t("screen.AdminScreen.ui36")); } };
  const featureLabel = (feature: string) => ({ home_practice_plan: t("screen.AdminScreen.ui37"), parent_support_answer: t("screen.AdminScreen.ui38") }[feature] || feature);
  const actorRoleLabel = (role: UsageEvent["actor_role"]) => ({ parent: t("screen.AdminScreen.ui39"), student: t("screen.AdminScreen.ui40"), admin: t("screen.AdminScreen.ui41"), specialist: t("screen.AdminScreen.ui42"), unknown: t("screen.AdminScreen.ui43") }[role]);
  const formatTokens = (value: number) => value.toLocaleString(getLocale());
  const formatCost = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 6 }).format(value);
  const maxDailyTokens = Math.max(0, ...usage.daily.map((item) => item.total_tokens));
  if (tab === "exercises" && reviewWorkspace) return <div className="page-enter admin-review-page"><ContentReviewWorkspace data={reviewWorkspace} onClose={closeReviewWorkspace} onSpeak={(text, rate) => speak(text, rate, true, reviewWorkspace.version.language || "ru", "exercise", reviewWorkspace.version.id)} onReview={reviewContent} onPublish={publishContent}/></div>;
  if (tab === "exercises" && homePreview) return <div className="page-enter admin-review-page"><HomeActivityReviewPreview activity={homePreview} onClose={closeHomePreview} onPublish={publishHomeContent}/></div>;
  return <div className="page-enter stack-xl admin-page">
    <div className="admin-heading"><PageTitle eyebrow={t("screen.AdminScreen.ui44")} title={t("screen.AdminScreen.ui45")} subtitle={t("screen.AdminScreen.ui46")}/><span className={`system-status ${apiHealthy === false ? "blocked" : ""}`}><i/> {apiHealthy === null ? t("screen.AdminScreen.ui47") : apiHealthy ? t("screen.AdminScreen.ui48") : t("screen.AdminScreen.ui49")}</span></div>
    {adminError && <div className="game-error" role="alert"><ShieldAlert size={18}/><span>{adminError}</span><button className="small-button" onClick={() => void load()}>{t("screen.AdminScreen.ui50")}</button></div>}
    {tab === "users" && <div className="stats-row admin-stats"><StatCard icon={<Users/>} value={String(stats.users)} label={t("screen.AdminScreen.ui51")}/><StatCard icon={<UserRound/>} value={String(stats.children)} label={t("screen.AdminScreen.ui52")}/><StatCard icon={<Target/>} value={String(stats.sessions)} label={t("screen.AdminScreen.ui53")}/><StatCard icon={<Gamepad2/>} value={String(stats.exercises)} label={t("screen.AdminScreen.ui54")}/></div>}
    <div className="admin-tabs" role="tablist" aria-label={t("screen.AdminScreen.ui55")}><button type="button" role="tab" aria-selected={tab === "users"} className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}><Users size={17}/>{t("screen.AdminScreen.ui56")}</button><button type="button" role="tab" aria-selected={tab === "exercises"} className={tab === "exercises" ? "active" : ""} onClick={() => setTab("exercises")}><Gamepad2 size={17}/>{t("screen.AdminScreen.ui57")}</button><button type="button" role="tab" aria-selected={tab === "usage"} className={tab === "usage" ? "active" : ""} onClick={() => { setTab("usage"); void loadUsage(usageDays); }}><BarChart3 size={17}/>{t("screen.AdminScreen.ui58")}</button><button type="button" role="tab" aria-selected={tab === "audit"} className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}><ShieldCheck size={17}/>{t("screen.AdminScreen.ui59")}</button></div>
    {tab === "users" && <section className="admin-card"><div className="admin-card-head"><div><span className="kicker">{t("screen.AdminScreen.ui60")}</span><h3>{t("screen.AdminScreen.ui61")}</h3><p>{t("screen.AdminScreen.ui62")}</p></div></div><div className="admin-table-wrap"><table className="account-table"><caption className="sr-only">{t("screen.AdminScreen.ui63")}</caption><thead><tr><th scope="col">{t("screen.AdminScreen.ui64")}</th><th scope="col">{t("screen.AdminScreen.ui65")}</th><th scope="col">{t("screen.AdminScreen.ui66")}</th><th scope="col">{t("screen.AdminScreen.ui67")}</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td data-label={t("screen.AdminScreen.ui64")}><b>{item.full_name}</b><small>{item.email}</small></td><td data-label={t("screen.AdminScreen.ui65")}><select aria-label={t("screen.AdminScreen.template2", { v0: item.full_name })} value={item.role} onChange={(e) => changeRole(item.id, e.target.value as Exclude<Role,"student">)}><option value="parent">{t("screen.AdminScreen.ui68")}</option><option value="specialist">{t("screen.AdminScreen.ui69")}</option><option value="admin">{t("screen.AdminScreen.ui70")}</option></select></td><td data-label={t("screen.AdminScreen.ui66")}><i className={`status ${item.is_active ? "active" : "blocked"}`}>{item.is_active ? t("screen.AdminScreen.ui71") : t("screen.AdminScreen.ui72")}</i></td><td data-label={t("screen.AdminScreen.ui67")}><button type="button" className="small-button" onClick={() => toggleUser(item)}>{item.is_active ? t("screen.AdminScreen.ui73") : t("screen.AdminScreen.ui74")}</button></td></tr>)}</tbody></table></div><div className="student-accounts"><div className="student-accounts-head"><span className="kicker">{t("screen.AdminScreen.ui75")}</span><small>{students.length}  {t("screen.AdminScreen.ui76")}</small></div><div className="student-account-grid">{students.map((item) => <article key={item.id}><span className="student-icon"><Backpack/></span><div><strong>{item.child_name}</strong><small>{t("screen.AdminScreen.ui77")} {item.username}</small><small>{t("screen.AdminScreen.ui78")} {item.parent_name}</small></div><i className="status active">{t("screen.AdminScreen.ui79")}</i></article>)}</div></div></section>}
    {tab === "exercises" && <section className="admin-card admin-content-panel">
      <div className="admin-card-head"><div><span className="kicker">{t("screen.AdminScreen.ui80")}</span><h2>{t("screen.AdminScreen.ui81")}</h2><p>{t("screen.AdminScreen.ui82")}</p></div><button type="button" className="primary-button" aria-expanded={formOpen} onClick={() => setFormOpen(!formOpen)}>{formOpen ? t("screen.AdminScreen.ui83") : t("screen.AdminScreen.ui84")}</button></div>
      {formOpen && <form className="exercise-form exercise-draft-form" onSubmit={addExercise}><label>{t("screen.AdminScreen.ui85")}<input placeholder={t("screen.AdminScreen.ui86")} value={form.title} onChange={(e) => setForm({...form,title:e.target.value})} required/></label><label>{t("screen.AdminScreen.ui87")}<input placeholder={t("screen.AdminScreen.ui88")} value={form.objective} onChange={(e) => setForm({...form,objective:e.target.value})} required/></label><label>{t("screen.AdminScreen.ui89")}<input placeholder={t("screen.AdminScreen.ui90")} value={form.instruction} onChange={(e) => setForm({...form,instruction:e.target.value})} required/></label><label>{t("screen.AdminScreen.ui91")}<select value={form.difficulty} onChange={(e) => setForm({...form,difficulty:Number(e.target.value)})}><option value={1}>{t("screen.AdminScreen.ui92")}</option><option value={2}>{t("screen.AdminScreen.ui93")}</option><option value={3}>{t("screen.AdminScreen.ui94")}</option></select></label><label className="draft-stimuli">{t("screen.AdminScreen.ui95")}<textarea value={form.stimuli} onChange={(e) => setForm({...form,stimuli:e.target.value})} placeholder={t("screen.AdminScreen.ui96")} required/><small>{t("screen.AdminScreen.ui97")}</small></label><div className="draft-form-actions"><button className="primary-button">{t("screen.AdminScreen.ui98")}</button><span>{t("screen.AdminScreen.ui99")}</span></div></form>}
      {formMessage && <div className="usage-note" role="status"><ShieldCheck size={18}/><p>{formMessage}</p></div>}
      <AdminContentQueue drafts={drafts} exercises={exercises} homeDrafts={homeDrafts} loading={contentLoading} onReview={id => void openReview(id)} onHomePreview={openHomePreview} onArchive={id => void archiveExercise(id)}/>
    </section>}
    {tab === "usage" && <section className="usage-dashboard" aria-busy={usageLoading}>
      <div className="usage-toolbar">
        <div><span className="kicker">{t("screen.AdminScreen.ui100")}</span><h2>{t("screen.AdminScreen.ui101")}</h2><p>{t("screen.AdminScreen.ui102")}</p></div>
        <div className="usage-periods" aria-label={t("screen.AdminScreen.ui103")}>{([7, 30, 90] as const).map((days) => <button key={days} className={usageDays === days ? "active" : ""} aria-pressed={usageDays === days} onClick={() => { setUsageDays(days); void loadUsage(days); }}>{days}  {t("screen.AdminScreen.ui104")}</button>)}</div>
      </div>
      {usageLoading ? <div className="admin-card usage-loading" role="status"><span className="sr-only">{t("screen.AdminScreen.ui105")}</span>{[1,2,3,4].map((item) => <i key={item}/>)}</div> : usageError ? <div className="admin-card usage-error" role="alert"><CircleAlert/><div><strong>{t("screen.AdminScreen.ui106")}</strong><p>{usageError}</p></div><button className="secondary-button" onClick={() => void loadUsage(usageDays)}><RotateCcw size={16}/>{t("screen.AdminScreen.ui50")}</button></div> : <>
        <div className="usage-cards">
          <StatCard icon={<Bot/>} value={formatTokens(usage.requests)} label={t("screen.AdminScreen.ui107")}/>
          <StatCard icon={<BarChart3/>} value={formatTokens(usage.total_tokens)} label={t("screen.AdminScreen.ui108")}/>
          <StatCard icon={<ArrowUp/>} value={formatTokens(usage.input_tokens)} label={t("screen.AdminScreen.ui109")}/>
          <StatCard icon={<ArrowDown/>} value={formatTokens(usage.output_tokens)} label={t("screen.AdminScreen.ui110")}/>
          <StatCard icon={<CreditCard/>} value={formatCost(usage.estimated_cost_usd)} label={t("screen.AdminScreen.ui111")}/>
        </div>
        <div className="usage-insights-grid">
          <section className="admin-card usage-chart-card">
            <div className="admin-card-head"><div><span className="kicker">{t("screen.AdminScreen.ui112")}</span><h3>{t("screen.AdminScreen.ui113")}</h3></div><span className="period-pill">{usage.period_days}  {t("screen.AdminScreen.ui104")}</span></div>
            {maxDailyTokens > 0 ? <figure className="usage-chart" role="img" aria-label={t("screen.AdminScreen.template3", { v0: formatTokens(maxDailyTokens) })}>
              <div className="usage-chart-bars">{usage.daily.map((item) => {
                const label = formatDate(item.date, {day: "numeric", month: "short"});
                const height = item.total_tokens ? Math.max(3, Math.round(item.total_tokens / maxDailyTokens * 100)) : 0;
                return <span className="usage-chart-day" key={item.date} title={t("screen.AdminScreen.template4", { v0: label, v1: formatTokens(item.total_tokens), v2: item.requests })}><i style={{height: `${height}%`}}/><small>{label}</small></span>;
              })}</div>
              <figcaption>{t("screen.AdminScreen.ui114")}</figcaption>
            </figure> : <div className="usage-empty"><BarChart3/><strong>{t("screen.AdminScreen.ui115")}</strong><p>{t("screen.AdminScreen.ui116")}</p></div>}
          </section>
          <section className="admin-card usage-breakdown-card">
            <div className="admin-card-head"><div><span className="kicker">{t("screen.AdminScreen.ui117")}</span><h3>{t("screen.AdminScreen.ui118")}</h3></div></div>
            {usage.breakdown.length ? <div className="usage-table"><div className="usage-row header"><span>{t("screen.AdminScreen.ui119")}</span><span>{t("screen.AdminScreen.ui120")}</span><span>{t("screen.AdminScreen.ui121")}</span><span>{t("screen.AdminScreen.ui122")}</span></div>{usage.breakdown.map((item) => <div className="usage-row" key={`${item.model}-${item.feature}`}><span><b>{featureLabel(item.feature)}</b><small>{item.provider} · {item.model}</small></span><span>{formatTokens(item.requests)}</span><span>{formatTokens(item.input_tokens + item.output_tokens)}</span><span>{formatCost(Number(item.cost || 0))}</span></div>)}</div> : <div className="usage-empty compact"><PackageOpen/><strong>{t("screen.AdminScreen.ui123")}</strong></div>}
          </section>
        </div>
        <section className="admin-card usage-history-card">
          <div className="admin-card-head"><div><span className="kicker">{t("screen.AdminScreen.ui124")}</span><h3>{t("screen.AdminScreen.ui125")}</h3><p>{t("screen.AdminScreen.ui126")} {usage.recent.length}  {t("screen.AdminScreen.ui127")}</p></div><button className="small-button" onClick={() => void loadUsage(usageDays)} aria-label={t("screen.AdminScreen.ui128")}><RotateCcw size={15}/>{t("screen.AdminScreen.ui129")}</button></div>
          {usage.recent.length ? <div className="usage-history-wrap"><table className="usage-history-table"><caption className="sr-only">{t("screen.AdminScreen.ui130")}</caption><thead><tr><th scope="col">{t("screen.AdminScreen.ui131")}</th><th scope="col">{t("screen.AdminScreen.ui132")}</th><th scope="col">{t("screen.AdminScreen.ui133")}</th><th scope="col">{t("screen.AdminScreen.ui134")}</th><th scope="col">{t("screen.AdminScreen.ui121")}</th><th scope="col">{t("screen.AdminScreen.ui122")}</th></tr></thead><tbody>{usage.recent.map((event) => <tr key={event.id}>
            <td data-label={t("screen.AdminScreen.ui131")}><time dateTime={event.created_at}>{formatDate(event.created_at, {day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"})}</time></td>
            <td data-label={t("screen.AdminScreen.ui132")}><strong>{event.actor_name}</strong><small>{event.actor_username ? `@${event.actor_username} · ` : ""}{actorRoleLabel(event.actor_role)}</small></td>
            <td data-label={t("screen.AdminScreen.ui133")}>{event.child_name || t("screen.AdminScreen.ui135")}</td>
            <td data-label={t("screen.AdminScreen.ui134")}><strong>{featureLabel(event.feature)}</strong><small>{event.provider} · {event.model}</small></td>
            <td data-label={t("screen.AdminScreen.ui121")}><strong>{formatTokens(event.total_tokens)}</strong><small>{formatTokens(event.input_tokens)}  {t("screen.AdminScreen.ui136")} {formatTokens(event.output_tokens)}  {t("screen.AdminScreen.ui137")}</small></td>
            <td data-label={t("screen.AdminScreen.ui122")}>{formatCost(event.estimated_cost_usd)}</td>
          </tr>)}</tbody></table></div> : <div className="usage-empty"><Bot/><strong>{t("screen.AdminScreen.ui138")}</strong><p>{t("screen.AdminScreen.ui139")}</p></div>}
          <div className="usage-note"><Sparkles size={19}/><p>{usage.note}</p></div>
        </section>
      </>}
    </section>}
    {tab === "audit" && <section className="admin-card"><div className="admin-card-head"><div><span className="kicker">{t("screen.AdminScreen.ui140")}</span><h3>{t("screen.AdminScreen.ui141")}</h3></div><span className="period-pill">{t("screen.AdminScreen.ui142")}</span></div><div className="data-table audit-table"><div className="table-row header"><span>{t("screen.AdminScreen.ui67")}</span><span>{t("screen.AdminScreen.ui143")}</span><span>{t("screen.AdminScreen.ui144")}</span><span>{t("screen.AdminScreen.ui145")}</span></div>{auditEvents.length ? auditEvents.map((event) => <div className="table-row" key={event.id}><span><b>{event.action}</b><small>{Object.keys(event.metadata).length ? JSON.stringify(event.metadata) : t("screen.AdminScreen.ui146")}</small></span><span>{event.object_type}{event.object_id ? ` #${event.object_id}` : ""}</span><span>{event.actor_key}</span><span>{formatDate(event.created_at, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>) : <div className="empty-state">{t("screen.AdminScreen.ui147")}</div>}</div></section>}
  </div>;
}

function ProfileScreen({ user, child, dashboard, settings, onOpen, onLogout }: { user: User; child?: Child; dashboard: Dashboard | null; settings: AppSettings; onOpen: (screen: Screen) => void; onLogout: () => void }) {
  useLocale();
  const age = child ? Math.max(0, new Date().getFullYear() - new Date(child.birth_date).getFullYear() - (new Date() < new Date(new Date().getFullYear(), new Date(child.birth_date).getMonth(), new Date(child.birth_date).getDate()) ? 1 : 0)) : null;
  const primaryModule = child ? modules.find((item) => item.id === child.primary_module)?.title : null;
  const languageName = { ru: t("landing.copy146"), en: "English", kk: t("screen.ProfileScreen.ui1") }[settings.language];
  const themeName = { peach: t("theme.calm"), ocean: t("theme.ocean"), lavender: t("theme.lavender"), contrast: t("screen.ProfileScreen.ui2") }[settings.theme];
  if (user.role === "student") return <div className="v2-screen v2-child-profile page-enter">
    <header className="v2-child-profile-hero">
      <Image src="/app-illustrations/profile-child-hero.webp" alt="" fill priority unoptimized sizes="(max-width: 760px) 100vw, 75vw"/>
      <div className="v2-child-profile-hero-copy"><span className="v2-kicker">{t("screen.ProfileScreen.ui3")}</span><h1>{t("screen.ProfileScreen.ui4")} {child?.name || user.full_name.split(" ")[0]}!</h1><p>{t("screen.ProfileScreen.ui5")}</p><button type="button" onClick={() => onOpen("achievements")}>{t("screen.ProfileScreen.ui6")} <ArrowRight/></button></div>
    </header>
    <section className="v2-child-profile-stats" aria-label={t("screen.ProfileScreen.ui7")}>
      <article><span><Star/></span><strong>{dashboard?.stars || 0}</strong><small>{t("screen.ProfileScreen.ui8")}</small></article>
      <article><span><Gamepad2/></span><strong>{dashboard?.total_sessions || 0}</strong><small>{t("screen.ProfileScreen.ui9")}</small></article>
      <article><span><Clock3/></span><strong>{dashboard?.total_minutes || 0}</strong><small>{t("screen.ProfileScreen.ui10")}</small></article>
    </section>
    <section className="v2-child-profile-destinations"><div><span className="v2-kicker">{t("screen.ProfileScreen.ui11")}</span><h2>{t("screen.ProfileScreen.ui12")}</h2></div><div className="v2-child-profile-links"><button type="button" onClick={() => onOpen("stories")}><BookOpen/><span><strong>{t("nav.stories")}</strong><small>{t("screen.ProfileScreen.ui13")}</small></span><ChevronRight/></button><button type="button" onClick={() => onOpen("world")}><ImageIcon/><span><strong>{t("nav.world")}</strong><small>{t("screen.ProfileScreen.ui14")}</small></span><ChevronRight/></button><button type="button" onClick={() => onOpen("aac")}><MessageCircle/><span><strong>{t("nav.words")}</strong><small>{t("screen.ProfileScreen.ui15")}</small></span><ChevronRight/></button><button type="button" onClick={() => onOpen("settings")}><Settings/><span><strong>{t("nav.settings")}</strong><small>{t("screen.ProfileScreen.ui16")}</small></span><ChevronRight/></button></div></section>
    <section className="v2-child-profile-account"><div><span className="v2-kicker">{t("screen.ProfileScreen.ui17")}</span><h2>{t("screen.ProfileScreen.ui18")}</h2><p>{t("screen.ProfileScreen.ui19")} <strong>{user.full_name}</strong>  {t("screen.ProfileScreen.ui20")} <strong>{user.username}</strong>{age !== null ? <>  {t("screen.ProfileScreen.ui21")} <strong>{age}  {t("screen.ProfileScreen.ui22")}</strong></> : null}</p><p>{t("screen.ProfileScreen.ui23")} <strong>{languageName}</strong>  {t("screen.ProfileScreen.ui24")} <strong>{themeName}</strong></p></div><button type="button" onClick={onLogout}><LogOut/> {t("common.logoutAccount")}</button></section>
  </div>;
  return <div className="page-enter profile-page">
    <PageTitle eyebrow={t("screen.ProfileScreen.ui25")} title={t("screen.ProfileScreen.ui26")} subtitle={t("screen.ProfileScreen.ui27")}/>
    <section className="profile-hero-card">
      <div className="profile-avatar-large">{user.full_name[0]}</div>
      <div><span className="kicker">{roleLabel(user.role)}</span><h2>{user.full_name}</h2><p>@{user.username}</p></div>
      <button className="small-button" onClick={() => onOpen("settings")}><Settings size={16}/> {t("nav.settings")}</button>
    </section>
    <div className="profile-grid">
      <section className="profile-info-card"><div className="profile-card-title"><UserRound size={20}/><div><span className="kicker">{t("settings.account")}</span><h3>{t("screen.ProfileScreen.ui28")}</h3></div></div><dl><div><dt>{t("common.name")}</dt><dd>{user.full_name}</dd></div><div><dt>{t("common.login")}</dt><dd>{user.username}</dd></div><div><dt>{t("common.role")}</dt><dd>{roleLabel(user.role)}</dd></div><div><dt>{t("settings.language")}</dt><dd>{languageName}</dd></div><div><dt>{t("screen.ProfileScreen.ui29")}</dt><dd>{themeName}</dd></div></dl></section>
      {child && <section className="profile-info-card child-profile-card"><div className="profile-card-title"><Baby size={20}/><div><span className="kicker">{t("screen.ProfileScreen.ui30")}</span><h3>{child.name}</h3></div></div><dl><div><dt>{t("screen.ProfileScreen.ui31")}</dt><dd>{age}  {t("screen.ProfileScreen.ui22")}</dd></div><div><dt>{t("screen.ProfileScreen.ui32")}</dt><dd>{primaryModule}</dd></div><div><dt>{t("screen.ProfileScreen.ui33")}</dt><dd>{dashboard?.total_sessions || 0}</dd></div><div><dt>{t("screen.ProfileScreen.ui34")}</dt><dd>{dashboard?.total_minutes || 0}</dd></div><div><dt>{t("screen.ProfileScreen.ui35")}</dt><dd>{dashboard?.stars || 0}</dd></div></dl>{user.role === "parent" && <button className="secondary-button wide" onClick={() => onOpen("parent")}>{t("screen.ProfileScreen.ui36")} <ChevronRight size={16}/></button>}</section>}
    </div>
    {user.role === "parent" && <section className="parent-more-grid profile-quick-links" aria-label={t("screen.ProfileScreen.ui37")}>
      <button onClick={() => onOpen("goals")}><span><Target/></span><div><strong>{t("screen.ProfileScreen.ui38")}</strong><small>{t("screen.ProfileScreen.ui39")}</small></div><ChevronRight/></button>
      <button onClick={() => onOpen("ai")}><span><Bot/></span><div><strong>{t("screen.ProfileScreen.ui40")}</strong><small>{t("screen.ProfileScreen.ui41")}</small></div><ChevronRight/></button>
      <button onClick={() => onOpen("parent")}><span><ShieldCheck/></span><div><strong>{t("screen.ProfileScreen.ui42")}</strong><small>{t("screen.ProfileScreen.ui43")}</small></div><ChevronRight/></button>
      <button onClick={() => onOpen("settings")}><span><Settings/></span><div><strong>{t("nav.settings")}</strong><small>{t("screen.ProfileScreen.ui44")}</small></div><ChevronRight/></button>
    </section>}
    <button className="profile-logout" onClick={onLogout}><LogOut size={17}/> {t("common.logoutAccount")}</button>
  </div>;
}

function SettingsScreen({ petPreferences, role, settings, saving, onChange, onLogout, onOpenParent }: { petPreferences: ReturnType<typeof usePetPreferences>; role: Role; settings: AppSettings; saving: boolean; onChange: (settings: AppSettings) => void; onLogout: () => void; onOpenParent: () => void }) {
  useLocale();
  const themes = [
    { id: "peach", name: t("theme.calm"), description: t("theme.calmDescription"), colors: ["#1668c7", "#eaf3ff", "#ffffff"] },
    { id: "ocean", name: t("theme.ocean"), description: t("theme.oceanDescription"), colors: ["#2d7180", "#e5f2f4", "#ffffff"] },
    { id: "lavender", name: t("theme.lavender"), description: t("theme.lavenderDescription"), colors: ["#6759aa", "#f0eef8", "#ffffff"] },
    { id: "contrast", name: t("theme.contrast"), description: t("theme.contrastDescription"), colors: ["#164f91", "#dcecff", "#ffffff"] },
  ] as const;
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => onChange({ ...settings, [key]: value });
  if (role === "student") return <div className="page-enter child-settings-page">
    <PageTitle eyebrow={t("settings.childHeading")} title={t("settings.childTitle")} subtitle={t("settings.childDescription")}/>
    <div className="child-settings-grid">
      <section className="child-settings-section"><div className="settings-section-heading"><span className="kicker">{t("settings.during")}</span><h2>{t("settings.soundMotion")}</h2></div><ChildSettingToggle title={t("settings.soundHints")} description={t("settings.listen")} value={settings.sound_enabled} onChange={(value) => update("sound_enabled", value)}/><ChildSettingToggle title={t("settings.calm")} description={t("settings.lessMotion")} value={settings.calm_mode} onChange={(value) => update("calm_mode", value)}/></section>
      <section className="child-settings-section"><div className="settings-section-heading"><h2>{t("settings.languageHeading")}</h2><p>{t("settings.languageHelp")}</p></div><LanguagePicker value={normalizeLocale(settings.language)} onChange={locale => update("language", languageOf(locale))}/></section>
      <PetSettings preferences={petPreferences}/>
    </div>
    <div className="child-settings-footer"><span aria-live="polite">{saving ? t("common.saving") : t("common.saved")}</span><button type="button" className="profile-logout" onClick={onLogout}><LogOut size={18}/> {t("common.logout")}</button></div>
  </div>;
  return <div className="page-enter settings-page redesigned-settings">
    <div className="settings-page-header"><PageTitle eyebrow={t("settings.heading")} title={t("settings.family")} subtitle={t("settings.description")}/><span className="settings-save-status" role="status">{saving ? <Timer size={16}/> : <CircleCheck size={16}/>} {saving ? t("settings.savingChanges") : t("settings.allSaved")}</span></div>
    <div className="settings-layout">
      <div className="settings-sections">
        <section className="settings-section language-setting">
          <div className="settings-section-heading"><span className="kicker">{t("settings.content")}</span><h3>{t("settings.languageHeading")}</h3><p>{t("settings.languageHelp")}</p></div>
          <LanguagePicker value={normalizeLocale(settings.language)} onChange={locale => update("language", languageOf(locale))}/>
        </section>
        {(role === "admin" || role === "specialist") && <><TranslationEditor specialist={role === "specialist"}/><TranslationEditor resource="aac" specialist={role === "specialist"}/></>}
        <section className="settings-section theme-setting">
          <div className="settings-section-heading"><div><span className="kicker">{t("settings.appearance")}</span><h3>{t("settings.color")}</h3><p>{t("settings.colorDescription")}</p></div></div>
          <div className="theme-options" role="group" aria-label={t("settings.color")}>{themes.map((item) => <button type="button" key={item.id} className={settings.theme === item.id ? "active" : ""} aria-pressed={settings.theme === item.id} onClick={() => update("theme", item.id as AppSettings["theme"])}><span className="theme-swatch">{item.colors.map((color) => <i key={color} style={{background:color}}/>)}</span><span className="theme-copy"><strong>{item.name}</strong><small>{item.description}</small></span>{settings.theme === item.id && <span className="theme-selected"><Check size={14}/> {t("common.selected")}</span>}</button>)}</div>
        </section>
        <section className="settings-section preference-setting">
          <div className="settings-section-heading"><span className="kicker">{t("settings.accessibility")}</span><h3>{t("settings.comfort")}</h3></div>
          <SettingRow icon={<Volume2/>} title={t("settings.soundHints")} text={t("settings.soundDescription")} value={settings.sound_enabled} onChange={(value) => update("sound_enabled", value)}/>
          <SettingRow icon={<Camera/>} title={t("settings.camera")} text={t("settings.cameraDescription")} value={settings.camera_enabled} onChange={(value) => update("camera_enabled", value)}/>
          <SettingRow icon={<Sparkles/>} title={t("settings.calm")} text={t("settings.calmDescription")} value={settings.calm_mode} onChange={(value) => update("calm_mode", value)}/>
        </section>
        <section className="settings-section account-setting">
          <div className="settings-section-heading"><span className="kicker">{t("settings.account")}</span><h3>{t("settings.session")}</h3></div>
          <div className="setting-row"><div className="setting-icon"><LockKeyhole/></div><div><strong>{t("settings.protected")}</strong><span>{t("settings.protectedDescription")}</span></div><span className="status active">{t("settings.secure")}</span></div>
          {role === "parent" && <div className="setting-row"><div className="setting-icon"><ShieldCheck/></div><div><strong>{t("settings.privacy")}</strong><span>{t("settings.privacyDescription")}</span></div><button type="button" className="small-button" onClick={onOpenParent}>{t("common.open")}</button></div>}
          <div className="setting-row"><div className="setting-icon danger"><LogOut/></div><div><strong>{t("common.logoutAccount")}</strong><span>{t("settings.logoutDescription")}</span></div><button type="button" className="small-button" onClick={onLogout}>{t("common.logout")}</button></div>
        </section>
      </div>
    </div>
  </div>;
}

function SettingRow({ icon, title, text, value, onChange }: { icon: React.ReactNode; title: string; text: string; value: boolean; onChange: (v: boolean) => void }) {
  return <div className="setting-row"><div className="setting-icon">{icon}</div><div><strong>{title}</strong><span>{text}</span></div><button type="button" className={`toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)} aria-label={title} role="switch" aria-checked={value}><i/></button></div>;
}
