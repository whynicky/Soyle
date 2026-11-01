"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { t, useLocale, formatDate } from "@/lib/i18n";
import type { Child, ChildConsent } from "@/lib/api";

export function ParentCabinetOverview({child,consentReady,consent,student,onPractice,onSpecialist,onResults,onAccess}: {
  child?: Child; consentReady:boolean; consent:ChildConsent; student:{username:string}|null;
  onPractice:()=>void; onSpecialist:()=>void; onResults:()=>void; onAccess:()=>void;
}) {
  useLocale();
  return <div className="cabinet-overview-focused">
    <section className="cabinet-child-summary"><div><span className="kicker">{t("journey.childProfile")}</span><h2>{child?.name || t("screen.ParentScreen.ui35")}</h2>{child?.birth_date && <p>{t("journey.birthday", {date:formatDate(child.birth_date)})}</p>}</div><dl><div><dt>{t("journey.childLogin")}</dt><dd>{student?.username || t("journey.notConfigured")}</dd></div><div><dt>{t("journey.permissions")}</dt><dd>{!consentReady ? t("common.wait") : consent.privacy_accepted ? t("journey.enabled") : t("journey.needsSetup")}</dd></div></dl><button className="small-button" onClick={onAccess}>{t("journey.manageAccess")}<ArrowRight size={18}/></button></section>
    <section className="cabinet-destination-cards" aria-label={t("journey.cabinetActions")}>{[
      {key:'family',title:t("journey.familyPractice"),text:t("journey.familyPracticeHint"),action:t("journey.openPractice"),onClick:onPractice},
      {key:'support',title:t("cabinet.specialist"),text:t("journey.specialistHint"),action:t("journey.openSpecialist"),onClick:onSpecialist},
      {key:'progress',title:t("navigation.results"),text:t("journey.cabinetResultsHint"),action:t("journey.openResults"),onClick:onResults},
    ].map(item => <article key={item.key}><Image src={`/app-illustrations/journey-${item.key}.png`} alt="" width={320} height={240}/><div><h3>{item.title}</h3><p>{item.text}</p><button type="button" className="small-button" onClick={item.onClick}>{item.action}<ArrowRight size={18}/></button></div></article>)}</section>
    <p className="cabinet-location-hint">{t("journey.materialsLocation")}</p>
  </div>;
}
