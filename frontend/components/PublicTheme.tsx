"use client";

import { useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { t } from "@/lib/i18n";
import { landingThemeCookie, parseLandingTheme, type LandingTheme } from "@/lib/landingTheme";
import "@/app/public-theme.css";

type ColorScheme = "light" | "dark";
type PrepareTheme = (scheme: ColorScheme) => Promise<unknown>;
const themeChange = "soyle-public-theme";
const systemQuery = "(prefers-color-scheme: dark)";
let switching = false;
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

export function usePublicTheme(initialTheme: LandingTheme, prepare?: PrepareTheme) {
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

  async function changeTheme(next: LandingTheme, origin: HTMLElement) {
    const current = readTheme();
    if (switching || next === current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || colorScheme(current) === colorScheme(next)) {
      saveTheme(next);
      return;
    }

    switching = true;
    const root = document.documentElement;
    try {
      if (prepare) {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([prepare(colorScheme(next)), new Promise<void>((resolve) => { timeout = setTimeout(resolve, 450); })]);
        } finally {
          clearTimeout(timeout);
        }
      }
      if (!origin.isConnected) return;

      if (typeof document.startViewTransition !== "function") {
        root.dataset.publicThemeTransition = "fade";
        saveTheme(next);
        await new Promise<void>((resolve) => setTimeout(resolve, 200));
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
      const transition = document.startViewTransition(() => saveTheme(next));
      void transition.ready.catch(() => {});
      await transition.finished;
    } finally {
      delete root.dataset.publicThemeTransition;
      root.style.removeProperty("--public-theme-x");
      root.style.removeProperty("--public-theme-y");
      root.style.removeProperty("--public-theme-radius");
      switching = false;
    }
  }

  return { theme, changeTheme };
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
      onClick={(event) => onChange(colorScheme(theme) === "dark" ? "light" : "dark", event.currentTarget)}
    >
      <Sun size={17} className="public-theme-sun" aria-hidden="true" />
      <Moon size={17} className="public-theme-moon" aria-hidden="true" />
    </button>
  );
}
