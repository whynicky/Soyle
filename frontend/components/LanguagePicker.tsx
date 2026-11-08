"use client";
import { useEffect } from "react";
import { useLocale, setLocale, t, type Locale } from "@/lib/i18n";

function chooseLocale(locale: Locale) { setLocale(locale); window.dispatchEvent(new Event("soyle-language-selected")); }

export function LanguagePicker({ value, onChange, compact = false }: { value?: Locale; onChange?: (locale: Locale) => void; compact?: boolean }) {
  const locale = useLocale();
  return <div className={`language-options locale-picker${compact ? " locale-picker--compact" : ""}`} role="group" aria-label={t("settings.languageHeading")}>
    {([['ru-RU', 'Русский'], ['kk-KZ', 'Қазақша']] as const).map(([id, label]) => <button key={id} type="button" lang={id} aria-label={label} aria-pressed={(value ?? locale) === id} className={(value ?? locale) === id ? 'active' : ''} onClick={() => onChange ? onChange(id) : chooseLocale(id)}>{compact ? (id === "ru-RU" ? "РУС" : "ҚАЗ") : label}</button>)}
  </div>;
}

export function LocaleBootstrap() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("soyle-language");
      if (saved) setLocale(saved, false);
    } catch { /* Keep the picker usable without storage. */ }
  }, []);
  return null;
}
