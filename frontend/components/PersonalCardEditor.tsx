"use client";

import Image from "next/image";
import { Camera, Check, ImagePlus, Volume2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { api, type FamilyRelation, type PersonalCard, type PersonalCategory, type PersonalWordCategory } from "@/lib/api";
import { getLocale, languageOf, t, useLocale } from "@/lib/i18n";
import { compressPhoto } from "@/lib/imageUpload";
import { categoryKey, familyRelations, personalWordCategories, relationKey, relationWord } from "@/lib/personalCards";

type Props = {
  childId: number;
  kind: "family" | "word";
  card?: PersonalCard;
  initialRelation?: FamilyRelation;
  initialCategory?: string;
  categories?: PersonalCategory[];
  onCategoryCreated?: (category: PersonalCategory) => void;
  onSaved: (card: PersonalCard) => void;
  onCancel: () => void;
  onSpeak: (text: string, language: "ru" | "kk") => Promise<boolean>;
};

/** One form for creating and editing any personal card, family or word. */
export function PersonalCardEditor({ childId, kind, card, initialRelation, initialCategory, categories = [], onCategoryCreated, onSaved, onCancel, onSpeak }: Props) {
  useLocale();
  const formId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(card?.image_data || "");
  const [name, setName] = useState(card?.name || "");
  const [relation, setRelation] = useState<FamilyRelation>(card?.relation || initialRelation || "mama");
  const [category, setCategory] = useState(card ? (card.category === "custom" ? `custom:${card.custom_category_id}` : card.category) : initialCategory || "people");
  const [language, setLanguage] = useState<"ru" | "kk">(card?.language || languageOf(getLocale()));
  const [speech, setSpeech] = useState(card?.speech || "");
  const [newCategory, setNewCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  // The editor opens above the list: bring it into view and focus the first step.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    form.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    form.querySelector<HTMLButtonElement>(".personal-editor-photo > button")?.focus({ preventScroll: true });
  }, []);
  const family = kind === "family";
  const word = family ? relationWord(relation, language) : name.trim();
  const spoken = speech.trim() || word;

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError("");
    try { setImage(await compressPhoto(file)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("world.ui8")); }
    finally { setBusy(false); }
  };

  const createCategory = async () => {
    const label = newCategory.trim();
    if (!label || busy) return;
    setBusy(true); setError("");
    try {
      const created = await api<PersonalCategory>(`/api/world/${childId}/categories`, { method: "POST", body: JSON.stringify({ label }) });
      onCategoryCreated?.(created);
      setCategory(`custom:${created.id}`);
      setNewCategory("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("personal.error.category")); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (busy) return;
    if (!image) { setError(t("personal.error.photo")); return; }
    if (!family && !name.trim()) { setError(t("personal.error.name")); return; }
    if (category === "custom:new") { setError(t("personal.error.newCategory")); return; }
    const [categoryValue, customId] = category.startsWith("custom:") ? ["custom", Number(category.slice(7))] : [category, null];
    const fields = family
      ? { name: name.trim(), relation, language, speech: speech.trim() }
      : { name: name.trim(), category: categoryValue, custom_category_id: customId, language, speech: speech.trim() };
    setBusy(true); setError("");
    try {
      const saved = card
        ? await api<PersonalCard>(`/api/world/${childId}/${card.id}`, { method: "PATCH", body: JSON.stringify({ ...fields, ...(image !== card.image_data ? { image_data: image } : {}) }) })
        : await api<PersonalCard>(`/api/world/${childId}`, { method: "POST", body: JSON.stringify({ kind, ...fields, image_data: image }) });
      onSaved(saved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("world.ui10")); }
    finally { setBusy(false); }
  };

  return <form ref={formRef} className="personal-editor" aria-labelledby={`${formId}-title`} onSubmit={event => { event.preventDefault(); void save(); }}>
    <header><h2 id={`${formId}-title`}>{t(card ? "personal.editor.editTitle" : family ? "personal.editor.familyTitle" : "personal.editor.wordTitle")}</h2>
      <button type="button" className="personal-icon-button" onClick={onCancel} aria-label={t("common.close")}><X size={20}/></button></header>
    <div className="personal-editor-body">
      <div className="personal-editor-photo">
        <button type="button" className={image ? "has-image" : ""} disabled={busy} onClick={() => fileInput.current?.click()} aria-label={t(image ? "personal.editor.replacePhoto" : "personal.editor.choosePhoto")}>
          {image ? <Image src={image} alt={t("personal.editor.preview")} fill unoptimized sizes="240px"/> : <span><ImagePlus size={30}/>{t("personal.editor.choosePhoto")}</span>}
        </button>
        {image && <button type="button" className="small-button" disabled={busy} onClick={() => fileInput.current?.click()}><Camera size={16}/>{t("personal.editor.replacePhoto")}</button>}
        <input ref={fileInput} className="v2-visually-hidden" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void pickPhoto(file); }}/>
        <small>{t("personal.editor.photoHint")}</small>
      </div>
      <div className="personal-editor-fields">
        {family ? <label>{t("personal.editor.relation")}<select value={relation} disabled={busy} onChange={event => setRelation(event.target.value as FamilyRelation)}>{familyRelations.map(item => <option key={item} value={item}>{t(relationKey(item))}</option>)}</select></label>
          : <label>{t("personal.editor.category")}<select value={category} disabled={busy} onChange={event => setCategory(event.target.value)}>
            {personalWordCategories.map(item => <option key={item} value={item}>{t(categoryKey(item as PersonalWordCategory))}</option>)}
            {categories.map(item => <option key={item.id} value={`custom:${item.id}`}>{item.label}</option>)}
            <option value="custom:new">{t("personal.editor.newCategory")}</option>
          </select></label>}
        {!family && category === "custom:new" && <div className="personal-inline-field"><label>{t("personal.editor.newCategoryName")}<input maxLength={30} value={newCategory} disabled={busy} onChange={event => setNewCategory(event.target.value)} placeholder={t("personal.editor.newCategoryPlaceholder")}/></label><button type="button" className="small-button" disabled={busy || !newCategory.trim()} onClick={() => void createCategory()}>{t("personal.editor.addCategory")}</button></div>}
        <label>{t(family ? "personal.editor.personName" : "personal.editor.word")}<input maxLength={60} required={!family} value={name} disabled={busy} onChange={event => setName(event.target.value)} placeholder={t(family ? "personal.editor.personNamePlaceholder" : "personal.editor.wordPlaceholder")}/></label>
        <label>{t("personal.editor.language")}<select value={language} disabled={busy} onChange={event => setLanguage(event.target.value as "ru" | "kk")}><option value="ru">{t("personal.language.ru")}</option><option value="kk">{t("personal.language.kk")}</option></select></label>
        <label>{t("personal.editor.speech")}<input maxLength={80} value={speech} disabled={busy} onChange={event => setSpeech(event.target.value)} placeholder={word || t("personal.editor.speechPlaceholder")}/><small>{t("personal.editor.speechHint")}</small></label>
        <div className="personal-editor-listen"><span>{t("personal.editor.childHears")} <strong>{spoken || "—"}</strong></span><button type="button" className="small-button" disabled={!spoken} onClick={() => void onSpeak(spoken, language)}><Volume2 size={16}/>{t("personal.listen")}</button></div>
      </div>
    </div>
    {error && <p className="v2-inline-alert" role="alert">{error}</p>}
    <footer><button type="button" className="secondary-button" disabled={busy} onClick={onCancel}>{t("common.cancel")}</button><button type="submit" className="primary-button" disabled={busy}><Check size={18}/>{busy ? t("world.ui33") : t("common.save")}</button></footer>
  </form>;
}
