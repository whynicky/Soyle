"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
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

const referenceList = [
  ["sources.ref.ashaLanguage", links.spoken],
  ["sources.ref.ashaLate", links.late],
  ["sources.ref.ashaAAC", links.aac],
  ["sources.ref.ashaMultilingual", links.multilingual],
  ["sources.ref.ashaApraxia", links.apraxia],
  ["sources.ref.ashaSounds", links.speechSounds],
  ["sources.ref.cdc", links.cdc],
  ["sources.ref.nidcd", links.nidcd],
  ["sources.ref.stuttering", links.stuttering],
  ["sources.ref.unicef", links.unicef],
  ["sources.ref.ansari", links.ansari],
  ["sources.ref.roberts", links.roberts],
  ["sources.ref.takacs", links.takacs],
] as const;

const assistantGroups = [
  { title: "sources.ai.group1.title", body: "sources.ai.group1.body", urls: [links.late, links.spoken, links.cdc, links.nidcd] },
  { title: "sources.ai.group2.title", body: "sources.ai.group2.body", urls: [links.apraxia, links.speechSounds, links.stuttering] },
  { title: "sources.ai.group3.title", body: "sources.ai.group3.body", urls: [links.aac, links.multilingual] },
  { title: "sources.ai.group4.title", body: "sources.ai.group4.body", urls: [links.unicef, links.roberts, links.late] },
] as const;

const assistantTopics = [
  "sources.ai.topic1", "sources.ai.topic2", "sources.ai.topic3", "sources.ai.topic4",
  "sources.ai.topic5", "sources.ai.topic6", "sources.ai.topic7", "sources.ai.topic8",
  "sources.ai.topic9", "sources.ai.topic10", "sources.ai.topic11",
] as const;

function CitationLinks({ urls }: { urls: readonly string[] }) {
  const labels = new Map<string, string>([
    [links.spoken, t("sources.ref.ashaLanguage")], [links.late, t("sources.ref.ashaLate")],
    [links.aac, t("sources.ref.ashaAAC")], [links.multilingual, t("sources.ref.ashaMultilingual")],
    [links.apraxia, t("sources.ref.ashaApraxia")], [links.speechSounds, t("sources.ref.ashaSounds")],
    [links.cdc, t("sources.ref.cdc")], [links.nidcd, t("sources.ref.nidcd")],
    [links.stuttering, t("sources.ref.stuttering")], [links.unicef, t("sources.ref.unicef")],
    [links.ansari, t("sources.ref.ansari")], [links.roberts, t("sources.ref.roberts")],
    [links.takacs, t("sources.ref.takacs")],
  ]);
  return <div className="source-citations">{urls.map(url => <a href={url} key={url} target="_blank" rel="noreferrer"><span>{labels.get(url)}</span><ExternalLink size={14} aria-hidden="true"/></a>)}</div>;
}

export function SourcesPage() {
  useLocale();
  const tasks = [
    { title: t("sources.task1.title"), body: t("sources.task1.body"), basis: t("sources.task1.basis"), own: t("sources.task1.own"), urls: [links.ansari, links.spoken], mark: "01" },
    { title: t("sources.task2.title"), body: t("sources.task2.body"), basis: t("sources.task2.basis"), own: t("sources.task2.own"), urls: [links.spoken, links.ansari], mark: "02" },
    { title: t("sources.task3.title"), body: t("sources.task3.body"), basis: t("sources.task3.basis"), own: t("sources.task3.own"), urls: [links.spoken, links.aac], mark: "03" },
    { title: t("sources.task4.title"), body: t("sources.task4.body"), basis: t("sources.task4.basis"), own: t("sources.task4.own"), urls: [links.takacs, links.aac, links.roberts], mark: "04" },
  ];
  const steps = [
    ["sources.ai.step1.title", "sources.ai.step1.body"],
    ["sources.ai.step2.title", "sources.ai.step2.body"],
    ["sources.ai.step3.title", "sources.ai.step3.body"],
  ] as const;

  return <main className="source-page">
    <div className="source-wrap">
      <Link className="source-back" href="/"><ArrowLeft size={16} aria-hidden="true"/>{t("sources.back")}</Link>

      <header className="source-masthead">
        <div className="source-masthead-copy">
          <p className="source-kicker">{t("sources.kicker")}</p>
          <h1>{t("sources.title")}</h1>
          <p className="source-lead">{t("sources.lead")}</p>
        </div>
        <aside className="source-index" aria-label={t("sources.meta.title")}>
          <span>{t("sources.meta.title")}</span>
          <div><strong>04</strong><small>{t("sources.meta.tasks")}</small></div>
          <div><strong>11</strong><small>{t("sources.meta.topics")}</small></div>
        </aside>
      </header>

      <aside className="source-collaboration">
        <span className="source-collaboration-label">{t("sources.collabLabel")}</span>
        <p>{t("sources.collabText")}</p>
      </aside>

      <section className="source-section" aria-labelledby="source-tasks-title">
        <header className="source-section-heading">
          <span>{t("sources.tasks.kicker")}</span>
          <h2 id="source-tasks-title">{t("sources.tasks.title")}</h2>
          <p>{t("sources.tasks.lead")}</p>
        </header>
        <div className="source-task-list">{tasks.map(task => <article className="source-task" key={task.mark}>
          <div className="source-task-heading">
            <span className="source-task-mark">{task.mark}</span>
            <div><h3>{task.title}</h3><p>{task.body}</p></div>
          </div>
          <div className="source-task-details">
            <div><span>{t("sources.taskBasis")}</span><p>{task.basis}</p></div>
            <div><span>{t("sources.taskSoyle")}</span><p>{task.own}</p></div>
          </div>
          <CitationLinks urls={task.urls}/>
        </article>)}</div>
      </section>

      <section className="source-assistant" aria-labelledby="source-ai-title">
        <header className="source-section-heading">
          <span>{t("sources.ai.kicker")}</span>
          <h2 id="source-ai-title">{t("sources.ai.title")}</h2>
          <p>{t("sources.ai.lead")}</p>
        </header>
        <div className="source-steps">{steps.map(([title, body], index) => <article className="source-step" key={title}>
          <span className="source-step-number">0{index + 1}</span>
          <div><h3>{t(title)}</h3><p>{t(body)}</p></div>
        </article>)}</div>

        <div className="source-topics">
          <div className="source-topics-copy"><span>{t("sources.ai.topicLabel")}</span><h3>{t("sources.ai.topicsTitle")}</h3><p>{t("sources.ai.topics")}</p></div>
          <ul>{assistantTopics.map(key => <li key={key}>{t(key)}</li>)}</ul>
        </div>

        <div className="source-theme-map">
          <header><span>{t("sources.ai.mappingLabel")}</span><h3>{t("sources.ai.mappingTitle")}</h3></header>
          {assistantGroups.map((group, index) => <article className="source-theme-row" key={group.title}>
            <span className="source-theme-number">0{index + 1}</span>
            <div className="source-theme-copy"><h4>{t(group.title)}</h4><p>{t(group.body)}</p><CitationLinks urls={group.urls}/></div>
          </article>)}
        </div>
      </section>

      <section className="source-limits" aria-labelledby="source-limits-title">
        <div className="source-limits-heading"><ShieldCheck size={19} aria-hidden="true"/><span>{t("sources.limits.kicker")}</span></div>
        <div><h2 id="source-limits-title">{t("sources.limits.title")}</h2><p>{t("sources.limits.body")}</p><ul><li>{t("sources.limits.one")}</li><li>{t("sources.limits.two")}</li><li>{t("sources.ai.safety")}</li></ul></div>
      </section>

      <section className="source-references" id="references" aria-labelledby="source-references-title">
        <header className="source-section-heading">
          <span>{t("sources.references.kicker")}</span>
          <h2 id="source-references-title">{t("sources.references.title")}</h2>
          <p>{t("sources.references.lead")}</p>
        </header>
        <ol className="source-reference-list">{referenceList.map(([key, url], index) => <li key={url}>
          <span className="source-reference-number">{String(index + 1).padStart(2, "0")}</span>
          <a href={url} target="_blank" rel="noreferrer"><span>{t(key)}</span><ExternalLink size={15} aria-hidden="true"/></a>
        </li>)}</ol>
      </section>

      <footer className="source-footer"><Link href="/">{t("sources.back")}</Link><Link className="source-footer-cta" href="/app">{t("landing.copy034")} <ArrowRight size={16}/></Link></footer>
    </div>
  </main>;
}
