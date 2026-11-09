"use client";

import { shortDashes, t, useLocale, formatDate } from "@/lib/i18n";

import { Check, ChevronLeft, CircleAlert, CircleX, Clock3, FileCheck2, History, LockKeyhole, MessageSquareText, Play, RotateCcw, ShieldCheck, Volume2 } from "lucide-react";
import Image from "next/image";
import { AudioReviewPanel } from "./AudioReviewPanel";
import { ExplorationReview } from "./ExplorationReview";
import { useState } from "react";
import { DraftExercisePreview, type DraftExerciseVersion, type ExerciseMethodCard } from "@/components/P1ExerciseRunners";

type ReviewStage = "revision" | "admin" | "technical" | "methodology" | "accessibility" | "publication";
type ReviewDecision = "passed" | "approved" | "changes_requested";

export type ContentReviewWorkspaceData = {
  method_card_translation?: {language:"kk";status:"needs_review"|"missing";payload:ExerciseMethodCard|null}|null;
  valid: boolean;
  can_publish: boolean;
  blocker: string | null;
  errors: string[];
  version: DraftExerciseVersion;
  stimuli_index: Array<{
    id: number;
    stimulus_key: string;
    kind: string;
    label: string;
    speech: string;
    media_ref: string | null;
    position: number;
    metadata: { hint?: string; alt?: string; origin?: string; license?: string };
  }>;
  reviews: Array<{ id: number; stage: ReviewStage; decision: string; comment: string; reviewer_name: string; created_at: string }>;
  version_history: Array<{ id: number; version: number; title: string; review_status: string; publication_status: string; technical_status: string; methodology_status: string; accessibility_status: string; release_status: string; created_at: string; published_at: string | null }>;
  capabilities: { admin_review: boolean };
};

export type HomeActivityDraft = {
  translation_status?: "missing" | "needs_review";
  id: number;
  title: string;
  objective: string;
  review_status: string;
  publication_status: string;
  materials: string[];
  adult_instructions: string[];
  accepted_responses: string[];
  prompts: string[];
  stop_conditions: string[];
  method_card?: { prerequisites?: string[]; ambiguities?: string[]; transfer?: string[]; sources?: string[]; methodology_review_status?: string };
};

const stageCopy = {
  revision: {get title() { return t("contentReviewWorkspace.ui1"); }, description: "", permission: ""},
  admin: {get title() { return t("contentReviewWorkspace.ui2"); }, description: "", permission: ""},
  technical: { get title() { return t("contentReviewWorkspace.ui3"); }, get description() { return t("contentReviewWorkspace.ui4"); }, get permission() { return t("contentReviewWorkspace.ui5"); } },
  methodology: { get title() { return t("contentReviewWorkspace.ui6"); }, get description() { return t("contentReviewWorkspace.ui7"); }, get permission() { return t("contentReviewWorkspace.ui8"); } },
  accessibility: { get title() { return t("contentReviewWorkspace.ui9"); }, get description() { return t("contentReviewWorkspace.ui10"); }, get permission() { return t("contentReviewWorkspace.ui11"); } },
  publication: { get title() { return t("contentReviewWorkspace.ui12"); }, get description() { return t("contentReviewWorkspace.ui13"); }, get permission() { return t("contentReviewWorkspace.ui14"); } },
} as const;

const statusCopy: Record<string, string> = {
  get updated() { return t("contentReviewWorkspace.ui15"); },
  get pending() { return t("contentReviewWorkspace.ui16"); },
  get automated_passed() { return t("contentReviewWorkspace.ui17"); },
  get passed() { return t("contentReviewWorkspace.ui18"); },
  get approved() { return t("contentReviewWorkspace.ui19"); },
  get changes_requested() { return t("contentReviewWorkspace.ui20"); },
  get legacy_publication() { return t("contentReviewWorkspace.ui21"); },
};

function ReviewStatus({ value }: { value?: string }) {
  useLocale();
  const status = value || "pending";
  return <span className={`review-stage-status ${status}`}>{statusCopy[status] || status}</span>;
}

function ReviewList({ title, values, warning = false }: { title: string; values?: string[]; warning?: boolean }) {
  useLocale();
  if (!values?.length) return null;
  return <section className={warning ? "method-field warning" : "method-field"}><h4>{warning && <CircleAlert size={16}/>} {title}</h4><ul>{values.map((value) => <li key={value}>{shortDashes(value)}</li>)}</ul></section>;
}

function MethodCardView({ card }: { card?: ExerciseMethodCard }) {
  useLocale();
  if (!card) return <div className="review-warning" role="alert"><CircleAlert/><div><strong>{t("contentReviewWorkspace.ui22")}</strong><p>{t("contentReviewWorkspace.ui23")}</p></div></div>;
  return <div className="method-card-view">
    <section className="method-summary"><div><span>{t("contentReviewWorkspace.ui24")}</span><strong>{card.target_skill}</strong></div><div><span>{t("contentReviewWorkspace.ui25")}</span><strong>{card.skill_group.join(" · ")}</strong></div><p>{card.diagnosis_boundary}</p></section>
    <div className="method-grid">
      <ReviewList title={t("contentReviewWorkspace.ui26")} values={card.intended_for}/>
      <ReviewList title={t("contentReviewWorkspace.ui27")} values={card.prerequisites}/>
      <section className="method-field"><h4>{t("contentReviewWorkspace.ui28")}</h4><p>{shortDashes(card.stimuli_and_responses)}</p></section>
      <section className="method-field"><h4>{t("contentReviewWorkspace.ui29")}</h4><p>«{shortDashes(card.child_instruction)}»</p></section>
      <ReviewList title={t("contentReviewWorkspace.ui30")} values={card.adult_guidance}/>
      <ReviewList title={t("contentReviewWorkspace.ui31")} values={card.accepted_responses}/>
      <ReviewList title={t("contentReviewWorkspace.ui32")} values={card.difficulty_levels}/>
      <ReviewList title={t("contentReviewWorkspace.ui33")} values={card.prompts}/>
      <ReviewList title={t("contentReviewWorkspace.ui34")} values={card.ambiguities} warning/>
      <ReviewList title={t("contentReviewWorkspace.ui35")} values={card.stop_conditions} warning/>
      <ReviewList title={t("contentReviewWorkspace.ui36")} values={card.result_registration}/>
      <ReviewList title={t("contentReviewWorkspace.ui37")} values={card.real_life_transfer}/>
      <section className="method-field"><h4>{t("contentReviewWorkspace.ui38")}</h4>{card.sources.length ? <ul>{card.sources.map((source, index) => <li key={index}>{typeof source === "string" ? source : <><strong>{source.title || t("contentReviewWorkspace.ui39")}</strong>{source.url?.startsWith("https://") && <p><a href={source.url} target="_blank" rel="noreferrer">{t("contentReviewWorkspace.ui40")}</a></p>}{source.population && <p>{shortDashes(source.population)}</p>}{source.scope && <p>{shortDashes(source.scope)}</p>}{source.limitation && <p>{t("contentReviewWorkspace.ui41")} {shortDashes(source.limitation)}</p>}</>}</li>)}</ul> : <p>{t("contentReviewWorkspace.ui42")}</p>}<p className="method-evidence-note">{shortDashes(card.evidence_note)}</p></section>
    </div>
  </div>;
}

function StimulusReview({ data, onSpeak }: { data: ContentReviewWorkspaceData; onSpeak: (text: string, rate?: number) => Promise<boolean> }) {
  useLocale();
  const { version } = data;
  if (version.mechanic === "scene_search" && version.content.exploration) return <ExplorationReview scene={version.content.exploration} onSpeak={onSpeak}/>;
  if (version.content.presentation === "picture_description") return <div className="stimulus-review-grid">{version.content.scenes?.map(scene => <article key={scene.key}><Image src={scene.media_ref} alt={scene.parts.join(" ")} width={960} height={720}/><strong>{scene.parts.join(" ")}</strong><p>{scene.theme}  {t("contentReviewWorkspace.ui43")}</p><button className="small-button" onClick={() => void onSpeak(scene.parts.join(" "), .76)}><Volume2 size={16}/>  {t("contentReviewWorkspace.ui44")}</button></article>)}</div>;
  if (version.mechanic === "category_sort") return <div className="stimulus-review-grid">{(version.content.sort_items || []).map(item => <article key={item.key}><div className="stimulus-exemplars"><figure><Image src={item.media_ref} alt={item.label} width={640} height={640}/><figcaption>{item.label}</figcaption></figure></div><p>{t("contentReviewWorkspace.ui45")} <strong>{version.content.categories?.find(group => group.key === item.category_key)?.label}</strong></p></article>)}</div>;
  if (version.mechanic === "action_sequence" || version.mechanic === "object_match") return <div className="scenario-review-list">{(version.content.tasks || []).map(task => <article key={task.key}><header><h4>{shortDashes(task.instruction)}</h4><button className="small-button" onClick={() => void onSpeak(task.instruction, .78)}><Volume2 size={16}/>  {t("contentReviewWorkspace.ui44")}</button></header><p>{version.mechanic === "action_sequence" ? t("contentReviewWorkspace.order", { sequence: (task.correct_order || []).map(key => task.cards.find(item => item.key === key)?.label).join(" → ") }) : t("contentReviewWorkspace.pairs", { pairs: (task.pairs || []).map(pair => `${task.cards.find(item => item.key === pair.object_key)?.label} → ${task.targets?.find(item => item.key === pair.target_key)?.label}`).join("; ") })}</p><div className="scenario-review-objects">{[...task.cards, ...(task.targets || [])].map((item, index) => <figure key={`${item.key}-${index}`}><Image src={item.media_ref} alt={item.label} width={640} height={640}/><figcaption>{item.label}</figcaption></figure>)}</div></article>)}</div>;
  if (version.mechanic === "tap_instruction") {
    return <div className="scenario-review-list">{(version.content.scenarios || []).map((scenario) => {
      const object = scenario.objects.find((item) => item.key === scenario.success.object_key);
      const target = scenario.objects.find((item) => item.key === scenario.success.target_key);
      return <article key={scenario.key}><header><div><span className="kicker">{scenario.key}</span><strong>{shortDashes(scenario.instruction)}</strong><small>{t("contentReviewWorkspace.ui46")} {object?.label} → {target?.label}</small></div><button type="button" className="small-button" onClick={() => void onSpeak(scenario.speech, .78)}><Volume2 size={16}/>  {t("contentReviewWorkspace.ui44")}</button></header><div>{scenario.objects.map((item) => <figure key={item.key}><Image src={item.media_ref} alt={item.label} width={480} height={480} sizes="(max-width:600px) 40vw, 240px"/><figcaption><strong>{item.label}</strong><small>{item.role === "movable" ? t("contentReviewWorkspace.ui47") : t("contentReviewWorkspace.ui48")}</small>{scenario.success.object_key === item.key || scenario.success.target_key === item.key ? <span><Check size={13}/>  {t("contentReviewWorkspace.ui49")}</span> : null}</figcaption></figure>)}</div></article>;
    })}</div>;
  }
  return <div className="stimulus-review-grid">{(version.content.stimuli || []).map((stimulus) => {
    const indexed = data.stimuli_index.find((item) => item.stimulus_key === stimulus.key);
    return <article key={stimulus.key}><div className="stimulus-exemplars">{[stimulus.media_ref || "/soyle-icon.png", ...(stimulus.exemplars || [])].map((path, index) => <figure key={path}><Image src={path} alt={t("contentReviewWorkspace.example", { label: indexed?.metadata.alt || stimulus.label, number: index + 1 })} width={640} height={640} sizes="(max-width:600px) 80vw, 300px"/><figcaption>{t("contentReviewWorkspace.ui50")} {index + 1}</figcaption></figure>)}</div><div><span className="kicker">{stimulus.key}</span><strong>{stimulus.label}</strong><p>{stimulus.hint || t("contentReviewWorkspace.ui51")}</p><small>{t("contentReviewWorkspace.ui52")}{stimulus.speech}{t("contentReviewWorkspace.ui53")} {stimulus.key}</small></div><button type="button" className="small-button" onClick={() => void onSpeak(stimulus.speech, .78)}><Volume2 size={16}/>  {t("contentReviewWorkspace.ui44")}</button></article>;
  })}</div>;
}

export function ContentReviewWorkspace({ data, onClose, onSpeak, onReview, onPublish }: { data: ContentReviewWorkspaceData; onClose: () => void; onSpeak: (text: string, rate?: number) => Promise<boolean>; onReview: (stage: "admin", decision: "changes_requested", comment: string) => Promise<void>; onPublish: (comment: string) => Promise<void> }) {
  useLocale();
  const [audioReady, setAudioReady] = useState(false);
  const [tab, setTab] = useState<"content" | "runner" | "history">("content");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (publish: boolean) => {
    if (!publish && comment.trim().length < 5) { setMessage(t("contentReviewWorkspace.ui54")); return; }
    setSaving(true); setMessage("");
    try {
      if (publish) await onPublish(comment.trim());
      else { await onReview("admin", "changes_requested", comment.trim()); setComment(""); setMessage(t("contentReviewWorkspace.ui55")); }
    } catch (error) { setMessage(error instanceof Error ? error.message : t("contentReviewWorkspace.ui56")); }
    finally { setSaving(false); }
  };

  if (tab === "runner") return <div className="content-review-workspace"><button type="button" className="review-back" onClick={() => setTab("content")}><ChevronLeft size={17}/>  {t("contentReviewWorkspace.ui57")}</button><DraftExercisePreview version={data.version} onClose={() => setTab("content")} onSpeak={onSpeak}/></div>;

  return <section className="content-review-workspace" data-mechanic={data.version.mechanic} aria-labelledby="content-review-title">
    <header className="review-workspace-head"><div><span className="kicker">{t("contentReviewWorkspace.ui58")}</span><h2 id="content-review-title">{shortDashes(data.version.title)}</h2><p>{data.version.objective}</p></div><button type="button" className="small-button" onClick={onClose}><CircleX size={17}/>  {t("contentReviewWorkspace.ui59")}</button></header>
    {data.version.content.cover_media_ref && <Image className="review-workspace-cover" src={data.version.content.cover_media_ref} alt="" width={960} height={640} sizes="(max-width: 480px) 90vw, 416px"/>}
    <div className="review-gate-banner"><LockKeyhole/><div><strong>{t("contentReviewWorkspace.ui60")}</strong><p>{t("contentReviewWorkspace.ui61")}</p></div></div>
    <nav className="review-workspace-tabs" aria-label={t("contentReviewWorkspace.ui62")}><button type="button" className={tab === "content" ? "active" : ""} aria-pressed={tab === "content"} onClick={() => setTab("content")}><FileCheck2 size={17}/>  {t("contentReviewWorkspace.ui63")}</button><button type="button" onClick={() => setTab("runner")}><Play size={17}/>  {t("contentReviewWorkspace.ui64")}</button><button type="button" className={tab === "history" ? "active" : ""} aria-pressed={tab === "history"} onClick={() => setTab("history")}><History size={17}/>  {t("contentReviewWorkspace.ui65")}</button></nav>
    {tab === "content" ? <>
      <div className="admin-queue-note"><ShieldCheck size={20}/><p>{t("contentReviewWorkspace.ui66")}</p></div>
      {!data.valid && <div className="review-warning" role="alert"><CircleAlert/><div><strong>{t("contentReviewWorkspace.ui67")}</strong><ul>{data.errors.map((error) => <li key={error}>{error}</li>)}</ul></div></div>}
      <section className="review-section"><header><div><span className="kicker">{t("contentReviewWorkspace.ui68")}</span><h3>{t("contentReviewWorkspace.ui69")}</h3></div><span className="period-pill">{data.version.mechanic === "tap_instruction" ? data.version.content.scenarios?.length || 0 : data.version.content.scenes?.length || data.version.content.sort_items?.length || data.version.content.tasks?.length || data.version.content.stimuli?.length || 0}  {t("contentReviewWorkspace.ui70")}</span></header><StimulusReview data={data} onSpeak={onSpeak}/></section>
      <AudioReviewPanel versionId={data.version.id} onReady={setAudioReady}/>
      <section className="review-section"><header><div><span className="kicker">{t("contentReviewWorkspace.ui71")}</span><h3>{t("contentReviewWorkspace.ui72")}</h3></div><span className="period-pill">{data.version.content.asset_registry?.length || 0}  {t("contentReviewWorkspace.ui73")}</span></header><div className="asset-review-registry">{data.version.content.asset_registry?.length ? data.version.content.asset_registry.map((asset) => <article key={asset.media_ref}><code>{asset.media_ref}</code><small>{asset.origin}<br/>{asset.license}</small><span>{asset.license_status === "documented" ? t("contentReviewWorkspace.ui74") : asset.license_status}</span></article>) : <div className="review-warning" role="alert"><CircleAlert/><div><strong>{t("contentReviewWorkspace.ui75")}</strong><p>{t("contentReviewWorkspace.ui76")}</p></div></div>}</div></section>
      <section className="review-section"><header><div><span className="kicker">{t("contentReviewWorkspace.ui77")}</span><h3>{t("contentReviewWorkspace.ui78")}</h3></div></header>{data.method_card_translation && <p role="status">{t("method.translationReview")}</p>}<MethodCardView card={data.method_card_translation?.payload || data.version.method_card}/>{data.method_card_translation?.payload && <details><summary>{t("content.source")}</summary><pre lang="ru-RU" style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(data.version.method_card,null,2)}</pre></details>}</section>
      <section className="review-section review-decision"><header><div><span className="kicker">{t("contentReviewWorkspace.ui79")}</span><h3>{t("contentReviewWorkspace.ui80")}</h3></div><MessageSquareText/></header><label>{t("contentReviewWorkspace.ui81")}<textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder={t("contentReviewWorkspace.ui82")} aria-describedby="review-comment-help"/></label><small id="review-comment-help">{t("contentReviewWorkspace.ui83")}</small><div className="review-actions"><button type="button" className="secondary-button" disabled={saving} onClick={() => void submit(false)}><RotateCcw size={16}/>  {t("contentReviewWorkspace.ui84")}</button><button type="button" className="primary-button" disabled={saving || !data.can_publish || !audioReady} onClick={() => void submit(true)}><Check size={16}/>{saving ? t("contentReviewWorkspace.ui85") : t("contentReviewWorkspace.ui86")}</button></div>{message && <p className="review-form-message" role="status">{message}</p>}</section>
    </> : <section className="review-section review-history"><header><div><span className="kicker">{t("contentReviewWorkspace.ui87")}</span><h3>{t("contentReviewWorkspace.ui88")}</h3></div><Clock3/></header><div className="version-history-list">{data.version_history.map((item) => <article key={item.id}><div><strong>{t("contentReviewWorkspace.ui89")} {item.version}</strong><small>{formatDate(item.created_at, {dateStyle: "short", timeStyle: "short"})}</small></div><span>{item.publication_status}</span><ReviewStatus value={item.review_status}/></article>)}</div><div className="review-event-list">{data.reviews.length ? data.reviews.map((item) => <article key={item.id}><span>{stageCopy[item.stage]?.title || item.stage}</span><strong>{statusCopy[item.decision] || item.decision}</strong><p>{item.comment}</p><small>{item.reviewer_name} · {formatDate(item.created_at, {dateStyle: "short", timeStyle: "short"})}</small></article>) : <div className="empty-state">{t("contentReviewWorkspace.ui90")}</div>}</div></section>}
  </section>;
}

export function HomeActivityReviewPreview({ activity, onClose, onPublish }: { activity: HomeActivityDraft; onClose: () => void; onPublish: () => Promise<void> }) {
  useLocale();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const publish = async () => {
    setSaving(true); setError("");
    try { await onPublish(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("contentReviewWorkspace.ui91")); }
    finally { setSaving(false); }
  };
  return <section className="content-review-workspace home-review-preview" aria-labelledby="home-review-title"><header className="review-workspace-head"><div><span className="kicker">{t("contentReviewWorkspace.ui92")}</span><h2 id="home-review-title">{activity.title}</h2><p>{activity.objective}</p></div><button type="button" className="small-button" onClick={onClose}><CircleX size={17}/>  {t("contentReviewWorkspace.ui59")}</button></header><div className="review-gate-banner"><LockKeyhole/><div><strong>{t("contentReviewWorkspace.ui93")}</strong><p>{t("contentReviewWorkspace.ui94")}</p></div></div><div className="home-preview-grid"><ReviewList title={t("contentReviewWorkspace.ui95")} values={activity.materials}/><ReviewList title={t("contentReviewWorkspace.ui96")} values={activity.adult_instructions}/><ReviewList title={t("contentReviewWorkspace.ui97")} values={activity.accepted_responses}/><ReviewList title={t("contentReviewWorkspace.ui98")} values={activity.prompts}/><ReviewList title={t("contentReviewWorkspace.ui35")} values={activity.stop_conditions} warning/><ReviewList title={t("contentReviewWorkspace.ui99")} values={activity.method_card?.prerequisites}/><ReviewList title={t("contentReviewWorkspace.ui100")} values={activity.method_card?.ambiguities} warning/><ReviewList title={t("contentReviewWorkspace.ui37")} values={activity.method_card?.transfer}/></div><div className="runner-finish"><ShieldCheck size={30}/><h3>{activity.translation_status ? t("home.translationReview") : t("contentReviewWorkspace.ui2")}</h3><button type="button" className="primary-button" disabled={saving || Boolean(activity.translation_status)} onClick={() => void publish()}>{saving ? t("contentReviewWorkspace.ui101") : t("contentReviewWorkspace.ui86")}</button>{error && <p role="alert">{error}</p>}</div></section>;
}
