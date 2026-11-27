"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowLeft, ArrowRight, BookOpen, ExternalLink, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { t, useLocale } from "@/lib/i18n";

const links = {
  spoken: "https://www.asha.org/practice-portal/clinical-topics/spoken-language-disorders/",
  late: "https://www.asha.org/practice-portal/clinical-topics/late-language-emergence/",
  aac: "https://www.asha.org/practice/early-intervention-provider-support/augmentative-and-alternative-communication-in-early-intervention/",
  multilingual: "https://www.asha.org/practice-portal/professional-issues/multilingual-service-delivery/",
  apraxia: "https://www.asha.org/practice-portal/clinical-topics/childhood-apraxia-of-speech/",
  speechSounds: "https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/",
  cdc: "https://www.cdc.gov/act-early/families/concerned.html",
  nidcd: "https://www.nidcd.nih.gov/sites/default/files/Documents/health/voice/NIDCD-Speech-Language-Dev-Milestones.pdf",
  stuttering: "https://www.nidcd.nih.gov/health/stuttering",
  unicef: "https://www.unicef.org/documents/care-child-development",
  ansari: "https://doi.org/10.3389/fpsyg.2025.1517311",
  roberts: "https://doi.org/10.1001/jamapediatrics.2019.1197",
  takacs: "https://doi.org/10.3102/0034654314566989",
} as const;

const sourceGroups = [
  { title: "sources.ref.ashaLanguage", urls: [links.late, links.spoken, links.cdc, links.nidcd] },
  { title: "sources.ref.ashaApraxia", urls: [links.apraxia, links.speechSounds, links.stuttering] },
  { title: "sources.ref.ashaAAC", urls: [links.aac, links.multilingual] },
  { title: "sources.ref.unicef", urls: [links.unicef, links.roberts] },
] as const;

const referenceList = [
  ["sources.ref.ashaLanguage", links.late],
  ["sources.ref.ashaAAC", links.aac],
  ["sources.ref.ashaMultilingual", links.multilingual],
  ["sources.ref.ashaApraxia", links.apraxia],
  ["sources.ref.ashaSounds", links.speechSounds],
  ["sources.ref.cdc", links.cdc],
  ["sources.ref.nidcd", links.nidcd],
  ["sources.ref.unicef", links.unicef],
  ["sources.ref.ansari", links.ansari],
  ["sources.ref.roberts", links.roberts],
  ["sources.ref.takacs", links.takacs],
] as const;

function CitationLinks({ urls }: { urls: readonly string[] }) {
  const labels = new Map<string, string>([
    [links.spoken, t("sources.ref.ashaLanguage")], [links.late, t("sources.ref.ashaLanguage")],
    [links.aac, t("sources.ref.ashaAAC")], [links.multilingual, t("sources.ref.ashaMultilingual")],
    [links.apraxia, t("sources.ref.ashaApraxia")], [links.speechSounds, t("sources.ref.ashaSounds")],
    [links.cdc, t("sources.ref.cdc")], [links.nidcd, t("sources.ref.nidcd")],
    [links.stuttering, t("sources.ref.nidcd")], [links.unicef, t("sources.ref.unicef")],
    [links.ansari, t("sources.ref.ansari")], [links.roberts, t("sources.ref.roberts")],
    [links.takacs, t("sources.ref.takacs")],
  ]);
  return <div className="source-citations">{urls.map(url => <a href={url} key={url} target="_blank" rel="noreferrer"><span>{labels.get(url)}</span><ExternalLink size={15} aria-hidden="true"/></a>)}</div>;
}

export function SourcesPage() {
  useLocale();
  const tasks = [
    { title: t("sources.task1.title"), body: t("sources.task1.body"), urls: [links.ansari, links.spoken], mark: "01" },
    { title: t("sources.task2.title"), body: t("sources.task2.body"), urls: [links.spoken, links.ansari], mark: "02" },
    { title: t("sources.task3.title"), body: t("sources.task3.body"), urls: [links.spoken, links.aac], mark: "03" },
    { title: t("sources.task4.title"), body: t("sources.task4.body"), urls: [links.takacs, links.aac, links.roberts], mark: "04" },
  ];
  const steps = [
    { title: t("sources.ai.step1.title"), body: t("sources.ai.step1.body"), icon: MessageCircle },
    { title: t("sources.ai.step2.title"), body: t("sources.ai.step2.body"), icon: ArrowDownRight },
    { title: t("sources.ai.step3.title"), body: t("sources.ai.step3.body"), icon: Sparkles },
  ];
  return <main className="source-page">
    <div className="source-wrap">
      <Link className="source-back" href="/"><ArrowLeft size={17} aria-hidden="true"/>{t("sources.back")}</Link>

      <section className="source-hero" aria-labelledby="source-title">
        <div className="source-hero-copy">
          <span className="source-eyebrow"><BookOpen size={16} aria-hidden="true"/>{t("sources.kicker")}</span>
          <h1 id="source-title">{t("sources.title")}</h1>
          <p className="source-lead">{t("sources.lead")}</p>
          <div className="source-collaboration"><span><Sparkles size={18} aria-hidden="true"/></span><div><strong>{t("sources.collabLabel")}</strong><p>{t("sources.collabText")}</p></div></div>
        </div>
        <div className="source-diagram" aria-label={t("sources.ai.topics")}>
          <div className="source-diagram-center"><span>Söyle</span><small>{t("sources.kicker")}</small></div>
          <span className="source-node source-node-one"><BookOpen size={18}/><b>01</b></span>
          <span className="source-node source-node-two"><MessageCircle size={18}/><b>02</b></span>
          <span className="source-node source-node-three"><ShieldCheck size={18}/><b>03</b></span>
          <i className="source-orbit source-orbit-one"/><i className="source-orbit source-orbit-two"/>
          <span className="source-diagram-caption">{t("sources.ai.step1.title")} <ArrowRight size={14}/> {t("sources.ai.step3.title")}</span>
        </div>
      </section>

      <section className="source-section" aria-labelledby="source-tasks-title">
        <header className="source-section-heading"><span>{t("sources.tasks.kicker")}</span><h2 id="source-tasks-title">{t("sources.tasks.title")}</h2><p>{t("sources.tasks.lead")}</p></header>
        <div className="source-task-grid">{tasks.map(task => <article className="source-task-card" key={task.mark}>
          <div className="source-task-mark">{task.mark}</div><h3>{task.title}</h3><p>{task.body}</p><CitationLinks urls={task.urls}/>
        </article>)}</div>
      </section>

      <section className="source-ai-section" aria-labelledby="source-ai-title">
        <div className="source-ai-heading"><span className="source-eyebrow"><Sparkles size={16} aria-hidden="true"/>{t("sources.ai.kicker")}</span><h2 id="source-ai-title">{t("sources.ai.title")}</h2><p>{t("sources.ai.lead")}</p></div>
        <div className="source-steps">{steps.map((step, index) => { const Icon = step.icon; return <article className="source-step" key={step.title}>
          <div className="source-step-top"><span className="source-step-icon"><Icon size={19} aria-hidden="true"/></span><small>0{index + 1}</small></div><h3>{step.title}</h3><p>{step.body}</p>
        </article>; })}</div>
        <div className="source-ai-note"><p>{t("sources.ai.topics")}</p><Link href="/sources#references">{t("sources.chatLink")} <ArrowRight size={16}/></Link></div>
      </section>

      <section className="source-limits" aria-labelledby="source-limits-title">
        <div className="source-limits-icon"><ShieldCheck size={24} aria-hidden="true"/></div>
        <div><span>{t("sources.limits.kicker")}</span><h2 id="source-limits-title">{t("sources.limits.title")}</h2><p>{t("sources.limits.body")}</p><ul><li>{t("sources.limits.one")}</li><li>{t("sources.limits.two")}</li><li>{t("sources.ai.safety")}</li></ul></div>
      </section>

      <section className="source-references" id="references" aria-labelledby="source-references-title">
        <header className="source-section-heading"><span>{t("sources.references.kicker")}</span><h2 id="source-references-title">{t("sources.references.title")}</h2><p>{t("sources.references.lead")}</p></header>
        <div className="source-reference-groups">{sourceGroups.map((group, index) => <article key={group.title}><span className="source-reference-index">0{index + 1}</span><h3>{t(group.title)}</h3><CitationLinks urls={group.urls}/></article>)}</div>
        <details className="source-reference-list"><summary>{t("sources.references.title")}</summary><div>{referenceList.map(([key, url]) => <a href={url} key={url} target="_blank" rel="noreferrer"><span>{t(key)}</span><ExternalLink size={15} aria-hidden="true"/></a>)}</div></details>
      </section>

      <footer className="source-footer"><Link href="/">{t("sources.back")}</Link><Link className="source-footer-cta" href="/app">{t("landing.copy034")} <ArrowRight size={17}/></Link></footer>
    </div>
  </main>;
}
