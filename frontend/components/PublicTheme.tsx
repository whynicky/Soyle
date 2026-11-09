"use client";

import { createContext, useContext, useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { t, useLocale } from "@/lib/i18n";
import { landingThemeCookie, landingThemes, parseLandingTheme, type LandingTheme } from "@/lib/landingTheme";
import "@/app/public-theme.css";

type ColorScheme = "light" | "dark";
type PrepareTheme = (scheme: ColorScheme) => Promise<unknown>;
const themeChange = "soyle-public-theme";
const systemQuery = "(prefers-color-scheme: dark)";
let activeChange: { theme: LandingTheme; cancel: () => void } | undefined;
let sessionTheme: LandingTheme | undefined;
const preparedImages = new Map<string, Promise<void>>();

function readTheme() {
  if (sessionTheme) return sessionTheme;
  const cookie = document.cookie.split("; ").find((part) => part.startsWith(landingThemeCookie + "="));
  return parseLandingTheme(cookie?.slice(landingThemeCookie.length + 1));
}

function subscribe(listener: () => void) {
  window.addEventListener(themeChange, listener);
  window.addEventListener("pageshow", listener);
  return () => {
    window.removeEventListener(themeChange, listener);
    window.removeEventListener("pageshow", listener);
  };
}

function subscribeSystem(listener: () => void) {
  const media = window.matchMedia(systemQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function preloadThemeImage(src: string, srcSet?: string, sizes?: string) {
  const key = [src, srcSet, sizes].join("|");
  const previous = preparedImages.get(key);
  if (previous) return previous;
  const image = new Image();
  image.fetchPriority = "low";
  if (sizes) image.sizes = sizes;
  if (srcSet) image.srcset = srcSet;
  image.src = src;
  const ready = image.decode().catch(() => { preparedImages.delete(key); });
  preparedImages.set(key, ready);
  return ready;
}

function colorScheme(theme: LandingTheme): ColorScheme {
  return theme === "system" ? (window.matchMedia(systemQuery).matches ? "dark" : "light") : theme;
}

function saveTheme(theme: LandingTheme) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  sessionTheme = undefined;
  document.cookie = `${landingThemeCookie}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  if (readTheme() !== theme) sessionTheme = theme;
  flushSync(() => window.dispatchEvent(new Event(themeChange)));
}

export function usePublicTheme(initialTheme: LandingTheme, prepare?: PrepareTheme, motion: "reveal" | "fade" = "reveal") {
  const theme = useSyncExternalStore(subscribe, readTheme, () => initialTheme);

  useEffect(() => {
    if (!prepare) return;
    const warm = () => { void prepare(colorScheme(theme) === "dark" ? "light" : "dark"); };
    if ("requestIdleCallback" in window) {
      const idle = window.requestIdleCallback(warm, { timeout: 1200 });
      return () => window.cancelIdleCallback(idle);
    }
    const timer = setTimeout(warm, 240);
    return () => clearTimeout(timer);
  }, [prepare, theme]);

  function changeTheme(next: LandingTheme, origin: HTMLElement) {
    const current = readTheme();
    if (next === (activeChange?.theme ?? current)) return;
    activeChange?.cancel();
    if (next === current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || colorScheme(current) === colorScheme(next)) {
      saveTheme(next);
      return;
    }

    const root = document.documentElement;
    let transition: ViewTransition | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const skipOnScroll = () => transition?.skipTransition();
    const change = {
      theme: next,
      cancel: () => {
        transition?.skipTransition();
        finish();
      },
    };
    function finish() {
      if (activeChange !== change) return;
      activeChange = undefined;
      clearTimeout(timer);
      window.removeEventListener("scroll", skipOnScroll);
      delete root.dataset.publicThemeTransition;
      root.style.removeProperty("--public-theme-x");
      root.style.removeProperty("--public-theme-y");
      root.style.removeProperty("--public-theme-radius");
    }
    activeChange = change;

    if (motion === "fade" || typeof document.startViewTransition !== "function") {
      root.dataset.publicThemeTransition = "fade";
      saveTheme(next);
      timer = setTimeout(finish, motion === "fade" ? 240 : 200);
      return;
    }

    const control = origin.closest("label") ?? origin;
    const rect = control.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty("--public-theme-x", `${x}px`);
    root.style.setProperty("--public-theme-y", `${y}px`);
    root.style.setProperty("--public-theme-radius", `${Math.ceil(radius)}px`);
    root.dataset.publicThemeTransition = "circle";
    transition = document.startViewTransition(() => {
      if (activeChange === change && origin.isConnected) saveTheme(next);
    });
    window.addEventListener("scroll", skipOnScroll, { passive: true, once: true });
    void transition.ready.catch(() => {});
    void transition.finished.then(finish, finish);
  }

  return { theme, changeTheme };
}

type ThemeControl = ReturnType<typeof usePublicTheme>;
const SiteThemeContext = createContext<ThemeControl | null>(null);

export function SiteThemeSurface({ initialTheme, className, children }: {
  initialTheme: LandingTheme; className: string; children: ReactNode;
}) {
  const control = usePublicTheme(initialTheme, undefined, "fade");
  return <SiteThemeContext.Provider value={control}>
    <div className={`site-theme-surface ${className}`} data-site-theme={control.theme}>{children}</div>
  </SiteThemeContext.Provider>;
}

export function ThemeChoice({ theme, changeTheme, compact = false }: ThemeControl & { compact?: boolean }) {
  const label = t("landing.theme.label");
  return <label className={`site-theme-choice${compact ? " site-theme-choice-compact" : ""}`}>
    {compact ? <span className="site-theme-glyph" data-theme={theme} aria-hidden="true"><Sun size={17} className="public-theme-sun"/><Moon size={17} className="public-theme-moon"/></span> : <span>{label}</span>}
    <select aria-label={label} value={theme} onChange={event => void changeTheme(parseLandingTheme(event.target.value), event.currentTarget)}>
      {landingThemes.map(mode => <option value={mode} key={mode}>{t(`landing.theme.${mode}`)}</option>)}
    </select>
    {!compact && <ChevronDown size={14} aria-hidden="true"/>}
  </label>;
}

export function SiteThemeChoice() {
  const control = useContext(SiteThemeContext);
  return control && <ThemeChoice {...control}/>;
}

const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export function WorkspaceThemeChoice({ labeled = false }: { labeled?: boolean }) {
  useLocale();
  const control = useContext(SiteThemeContext);
  const name = useId();
  if (!control) return null;

  return <fieldset className={`workspace-theme-choice${labeled ? " workspace-theme-choice--labeled" : ""}`}>
    <legend className="sr-only">{t("landing.theme.label")}</legend>
    {landingThemes.map(mode => {
      const Icon = themeIcons[mode];
      const label = t(`landing.theme.${mode}`);
      return <label key={mode} title={labeled ? undefined : label}>
        <input type="radio" name={name} value={mode} checked={control.theme === mode}
          onChange={event => void control.changeTheme(mode, event.currentTarget)}/>
        <span className="workspace-theme-option">
          <Icon size={18} aria-hidden="true"/>
          <span className={labeled ? undefined : "sr-only"}>{label}</span>
        </span>
      </label>;
    })}
  </fieldset>;
}

export function PublicThemeToggle({ theme, onChange }: {
  theme: LandingTheme;
  onChange: (theme: LandingTheme, origin: HTMLElement) => void;
}) {
  const systemDark = useSyncExternalStore(subscribeSystem, () => window.matchMedia(systemQuery).matches, () => false);
  const next = theme === "dark" || (theme === "system" && systemDark) ? "light" : "dark";
  return (
    <button
      className="public-theme-toggle"
      data-theme={theme}
      type="button"
      aria-label={t(`landing.theme.to-${next}`)}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => onChange(colorScheme(activeChange?.theme ?? readTheme()) === "dark" ? "light" : "dark", event.currentTarget)}
    >
      <Sun size={17} className="public-theme-sun" aria-hidden="true" />
      <Moon size={17} className="public-theme-moon" aria-hidden="true" />
    </button>
  );
}
