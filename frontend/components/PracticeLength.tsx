"use client";

import { t, useLocale } from "@/lib/i18n";

export function PracticeLength({ value, choices, bankSize, unit, onChange }: {
  value: number;
  choices: number[];
  bankSize: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  useLocale();
  const localizedUnit = ({ "действий": t("practice.unit.actions"), "слов": t("practice.unit.words"), "ситуаций": t("practice.unit.scenarios"), "картинки": t("practice.unit.pictures") } as Record<string, string>)[unit] || unit;
  return <fieldset className="practice-length">
    <legend>{t("practice.length.title")}</legend>
    <p>{t("practice.length.bank", { count: bankSize, unit: localizedUnit })}</p>
    <div>{choices.map(count => <button key={count} type="button" aria-pressed={value === count} onClick={() => onChange(count)}>{t("practice.length.count", { count })}</button>)}</div>
    {value > bankSize && <small>{t("practice.length.repeat")}</small>}
  </fieldset>;
}
