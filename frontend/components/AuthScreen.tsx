"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Backpack, Eye, EyeOff, ShieldCheck, UserRoundCheck } from "lucide-react";
import { api, ApiError, clearLegacyAuth, type User } from "@/lib/api";
import { unlockSpeechAudio } from "@/lib/speech";
import { t, useLocale } from "@/lib/i18n";
import type { LandingTheme } from "@/lib/landingTheme";
import { BrandLogo } from "./BrandLogo";
import { LanguagePicker } from "./LanguagePicker";
import { preloadThemeImage, ThemeChoice, usePublicTheme } from "./PublicTheme";
import "@/app/auth.css";

export function AuthLoading({ theme: initialTheme }: { theme: LandingTheme }) {
  const { theme } = usePublicTheme(initialTheme);
  return <div className="sa-loading" data-entry-theme={theme} role="status">
    <BrandLogo variant="mark" size={40} decorative /><span>{t("screen.SoyleApp.ui1")}</span>
  </div>;
}

type AuthField = "name" | "username" | "password";
type AuthErrors = Partial<Record<AuthField | "form", string>>;

function prepareAuthTheme(scheme: "light" | "dark") {
  const width = window.devicePixelRatio <= 1 ? 520 : window.devicePixelRatio <= 2 ? 1040 : 1560;
  return preloadThemeImage(`/landing/scenery/end-${scheme === "dark" ? "night" : "day"}-mobile-${width}.webp`);
}

export type AuthEntryMode = "login" | "register";

export function AuthScreen({ onAuthenticated, theme: initialTheme, initialMode }: {
  onAuthenticated: (user: User) => void;
  theme: LandingTheme;
  initialMode: AuthEntryMode;
}) {
  const { theme, changeTheme } = usePublicTheme(initialTheme, prepareAuthTheme, "fade");
  useLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<AuthEntryMode | "student">(initialMode);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const previousMode = useRef(mode);

  useLayoutEffect(() => {
    if (previousMode.current !== mode) headingRef.current?.focus();
    previousMode.current = mode;
  }, [mode]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setErrors({});
    const data = new FormData(event.currentTarget);
    const username = data.get("username");
    const password = data.get("password");
    const name = data.get("name");
    let accepted = false;
    setLoading(true);
    try {
      if (mode === "student") unlockSpeechAudio();
      const endpoint = mode === "student" ? "student-login" : mode === "login" ? "login" : "register";
      const payload = mode === "student" ? { username, pin: password } : mode === "login" ? { username, password } : { username, password, full_name: name };
      await api<{ user: User }>(`/api/auth/${endpoint}`, {
        method: "POST", body: JSON.stringify(payload),
      });
      accepted = true;
      const currentUser = await api<User>("/api/auth/me");
      clearLegacyAuth(); onAuthenticated(currentUser);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t("errors.auth");
      if (!accepted && cause instanceof ApiError && cause.status === 401) {
        setErrors({ password: message });
      } else if (!accepted && mode === "register" && cause instanceof ApiError && cause.status === 409) {
        setErrors({ username: message });
      } else {
        setErrors({ form: message === t("screen.AuthScreen.ui1") ? t("screen.AuthScreen.ui2") : message });
      }
    }
    finally { setLoading(false); }
  };

  const heading = mode === "student" ? t("auth.child") : mode === "login" ? t("auth.login") : t("auth.register");
  function switchMode(next: typeof mode) {
    if (mode === next || loading) return;
    setMode(next);
    formRef.current?.reset();
    setErrors({});
    setShowPassword(false);
  }

  function updateField(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const field = input.name as AuthField;
    if (field === "password" && mode === "student") input.value = input.value.replace(/\D/g, "");
    if (errors[field] || errors.form) setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function reportInvalid(event: React.InvalidEvent<HTMLFormElement>) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    event.preventDefault();
    const field = input.name as AuthField;
    const message = input.validity.valueMissing ? t("auth.requiredField")
      : field === "username" ? t(mode === "login" && input.value.includes("@") ? "auth.useAccountLogin" : "auth.loginRequirements")
        : field === "name" ? t("auth.nameLength")
          : mode === "student" ? t("auth.pinLength") : t("auth.passwordLength");
    setErrors((current) => ({ ...current, [field]: message }));
    if (input.form?.querySelector(":invalid") === input) input.focus();
  }

  function fieldFeedback(field: AuthField, hint?: string) {
    const message = errors[field];
    return (message || hint) && (
      <small id={`sa-${field}-feedback`} className={message ? "sa-field-error" : undefined} role={message ? "alert" : undefined}>
        {message || hint}
      </small>
    );
  }

  return (
    <main className="sa-page" data-entry-theme={theme}>
      <header className="sa-nav">
        <Link href="/" className="sa-home" aria-label={t("landing.copy036")}>
          <ArrowLeft size={16} aria-hidden="true" />
          <BrandLogo size={25} decorative />
        </Link>
        <div className="sa-nav-actions">
          <LanguagePicker compact />
          <ThemeChoice theme={theme} changeTheme={changeTheme} compact />
        </div>
      </header>
      <div className="sa-layout">
        <aside className="sa-scene">
          <div className="sa-scene-art" aria-hidden="true" />
          <div className="sa-scene-copy">
            <p>{t("landing.showcase.titleFirst")} {t("landing.showcase.titleSecond")}</p>
            <p>{t("auth.sceneDescription")}</p>
          </div>
        </aside>
        <section className="sa-form-area" aria-labelledby="sa-heading">
          <form className="sa-form" ref={formRef} onSubmit={submit} onInvalid={reportInvalid} aria-busy={loading}>
            <div className="sa-form-heading">
              <h1 id="sa-heading" ref={headingRef} tabIndex={-1}>{heading}</h1>
              <p>{mode === "student" ? t("auth.childHelp") : mode === "login" ? t("auth.loginHelp") : t("auth.registerHelp")}</p>
            </div>
            {mode !== "register" && (
              <div className="sa-roles" role="group" aria-label={t("auth.type")}>
                <button type="button" aria-pressed={mode === "login"} disabled={loading} onClick={() => switchMode("login")}><UserRoundCheck size={17} aria-hidden="true" />{t("auth.adult")}</button>
                <button type="button" aria-pressed={mode === "student"} disabled={loading} onClick={() => switchMode("student")}><Backpack size={17} aria-hidden="true" />{t("auth.kid")}</button>
              </div>
            )}
            <div className="sa-fields">
              {mode === "register" && (
                <div className="sa-field">
                  <label htmlFor="sa-name">{t("auth.yourName")}</label>
                  <input id="sa-name" name="name" onChange={updateField} placeholder={t("auth.exampleName")} autoComplete="name" required minLength={2} maxLength={100}
                    aria-invalid={!!errors.name} aria-describedby={errors.name ? "sa-name-feedback" : undefined} />
                  {fieldFeedback("name")}
                </div>
              )}
              <div className="sa-field">
                <label htmlFor="sa-username">{mode === "student" ? t("auth.childLogin") : t("common.login")}</label>
                <input
                  id="sa-username" name="username" type="text" autoComplete={mode === "student" ? "off" : "username"} autoCapitalize="none" spellCheck={false}
                  onChange={updateField}
                  placeholder={t(mode === "student" ? "auth.parentLogin" : mode === "login" ? "auth.accountLogin" : "auth.latin")}
                  pattern="[A-Za-z0-9_.\-]+"
                  required minLength={3} maxLength={40} aria-invalid={!!errors.username}
                  aria-describedby={errors.username || mode === "register" ? "sa-username-feedback" : undefined}
                />
                {fieldFeedback("username", mode === "register" ? t("auth.loginRequirements") : undefined)}
              </div>
              <div className="sa-field">
                <label htmlFor="sa-password">{mode === "student" ? t("auth.pin") : t("auth.password")}</label>
                <div className="sa-password-field">
                  <input
                    id="sa-password" name="password" type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : mode === "register" ? "new-password" : "off"}
                    inputMode={mode === "student" ? "numeric" : undefined} onChange={updateField}
                    placeholder={mode === "student" ? t("auth.pinLength") : t("auth.enterPassword")}
                    required minLength={mode === "register" ? 8 : mode === "student" ? 4 : 1} maxLength={mode === "student" ? 12 : 128}
                    aria-invalid={!!errors.password} aria-describedby={errors.password || mode === "register" ? "sa-password-feedback" : undefined}
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}>
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                {fieldFeedback("password", mode === "register" ? t("auth.passwordLength") : undefined)}
              </div>
            </div>
            {errors.form && <p className="sa-error" role="alert">{errors.form}</p>}
            <button className="sa-submit" disabled={loading}>
              {loading ? t("common.wait") : mode === "register" ? t("auth.create") : mode === "student" ? t("auth.begin") : t("auth.signIn")}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            {mode !== "student" ? (
              <div className="sa-secondary">
                <span>{mode === "login" ? t("auth.first") : t("auth.already")}</span>
                <button type="button" disabled={loading} onClick={() => switchMode(mode === "login" ? "register" : "login")}>
                  {mode === "login" ? t("auth.createParent") : t("auth.signIn")}
                </button>
              </div>
            ) : (
              <p className="sa-student-help"><ShieldCheck size={17} aria-hidden="true" />{t("auth.pinHelp")}</p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
