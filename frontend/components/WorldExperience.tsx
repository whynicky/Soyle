"use client";

import { getLocale, languageOf, t, useLocale } from "@/lib/i18n";
import { stopCurrentSpeech } from "@/lib/speech";

import Image from "next/image";
import { LibraryScene } from "./LibraryScene";
import { ArrowRight, Camera, Check, Ear, MessageCircle, Pencil, Plus, Trash2, Volume2, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { api, type Exercise, type PersonalCategory, type PersonalWordCategory, type WorldPhoto } from "@/lib/api";
import { compressPhoto } from "@/lib/imageUpload";
import { cardCategoryLabel, cardSpeech, categoryKey, minimumPracticeCards, personalChoiceExercise, personalWordCategories, practiceCards } from "@/lib/personalCards";
import { PersonalCardEditor } from "./PersonalCardEditor";

/** Filter/selection key: a built-in topic or `custom:<id>` for a parent's own category. */
const photoCategory = (photo: WorldPhoto) => photo.category === "custom" ? `custom:${photo.custom_category_id}` : photo.category;
const categoryPayload = (key: string) => key.startsWith("custom:") ? { category: "custom", custom_category_id: Number(key.slice(7)) } : { category: key };

export function WorldExperience({ childId, canManage, onWords, onSpeak, onPractice, navigation }: { navigation?: ReactNode; childId?: number; canManage: boolean; onWords: () => void; onSpeak: (text: string, language: "ru" | "kk") => Promise<boolean>; onPractice: (exercise: Exercise) => void }) {
  useLocale();
  const [customCategories, setCustomCategories] = useState<PersonalCategory[]>([]);
  const categories = [
    ...personalWordCategories.map(key => ({ key: key as string, label: t(categoryKey(key as PersonalWordCategory)) })),
    ...customCategories.map(item => ({ key: `custom:${item.id}`, label: item.label })),
  ];
  const fileId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [photos, setPhotos] = useState<WorldPhoto[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [pendingPhotos, setPendingPhotos] = useState<Array<{ id: string; name: string; image_data: string; category: string; language: "ru" | "kk" }>>([]);
  const [editingPhoto, setEditingPhoto] = useState<number | null>(null);
  const [speakingPhoto, setSpeakingPhoto] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [legacyPhotos, setLegacyPhotos] = useState<Array<{ id: string; name: string; src: string }>>([]);

  useEffect(() => {
    if (!childId) return;
    let current = true;
    queueMicrotask(() => { if(current) { setLoading(true); setLoadError(""); } });
    Promise.all([api<WorldPhoto[]>(`/api/world/${childId}?kind=word`), api<PersonalCategory[]>(`/api/world/${childId}/categories`)])
      .then(([items, own]) => { if (current) { setPhotos(items); setCustomCategories(own); } })
      .catch((cause) => { if (current) setLoadError(cause instanceof Error ? cause.message : t("world.ui5")); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; stopCurrentSpeech(); };
  }, [childId, revision]);

  useEffect(() => {
    if (!childId || !canManage) return;
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(`soyle-world-photos-${childId}`) || "[]");
        setLegacyPhotos(Array.isArray(stored) ? stored.filter((item) => typeof item?.src === "string" && item.src.startsWith("data:image/")) : []);
      } catch { setLegacyPhotos([]); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [childId, canManage]);

  const importLegacy = async () => {
    if (!childId || !legacyPhotos.length || saving) return;
    setSaving(true); setError(""); setMessage("");
    const remaining: typeof legacyPhotos = [];
    let imported = 0;
    for (const legacy of legacyPhotos) {
      try {
        const blob = await fetch(legacy.src).then((response) => response.blob());
        const image_data = await compressPhoto(new File([blob], `${legacy.name || "photo"}.jpg`, { type: blob.type }));
        const photo = await api<WorldPhoto>(`/api/world/${childId}`, { method: "POST", body: JSON.stringify({ name: legacy.name || t("world.ui6"), ...categoryPayload(category === "all" ? "people" : category), language: languageOf(getLocale()), image_data }) });
        setPhotos((items) => [photo, ...items]);
        imported += 1;
      } catch { remaining.push(legacy); }
    }
    window.localStorage.setItem(`soyle-world-photos-${childId}`, JSON.stringify(remaining));
    setLegacyPhotos(remaining);
    setSaving(false);
    setMessage(imported ? t("world.imported", { count: imported }) : "");
    if (remaining.length) setError(t("world.importFailed", { count: remaining.length }));
  };

  const preparePhotos = async (files: File[]) => {
    if (!childId || !files.length || saving) return;
    setSaving(true); setMessage(""); setError("");
    const available = Math.max(0, 4 - pendingPhotos.length);
    const failures: string[] = [];
    if (files.length > available) failures.push(t("world.ui7"));
    for (const file of files.slice(0, available)) {
      try {
        const image_data = await compressPhoto(file);
        setPendingPhotos((items) => [...items, { id: crypto.randomUUID(), name: "", image_data, category: category === "all" ? "people" : category, language: languageOf(getLocale()) }]);
      } catch (cause) { failures.push(`${file.name}: ${cause instanceof Error ? cause.message : t("world.ui8")}`); }
    }
    setError(failures.join(" "));
    setSaving(false);
  };

  const upload = async () => {
    if (!childId || !pendingPhotos.length || saving) return;
    if (pendingPhotos.some((photo) => !photo.name.trim())) { setError(t("world.ui9")); return; }
    setSaving(true); setMessage(""); setError("");
    let saved = 0;
    const failures: string[] = [];
    for (const pending of pendingPhotos) {
      try {
        const photo = await api<WorldPhoto>(`/api/world/${childId}`, {
          method: "POST", body: JSON.stringify({ kind: "word", name: pending.name.trim(), ...categoryPayload(pending.category), language: pending.language, image_data: pending.image_data }),
        });
        setPhotos((items) => [photo, ...items]);
        setPendingPhotos((items) => items.filter((item) => item.id !== pending.id));
        saved += 1;
      } catch (cause) { failures.push(`${pending.name}: ${cause instanceof Error ? cause.message : t("world.ui10")}`); }
    }
    if (saved) { setMessage(t("world.saved", { count: saved })); setCategory("all"); setQuery(""); }
    setError(failures.join(" "));
    setSaving(false);
  };

  const [newCategory, setNewCategory] = useState("");
  const createCategory = async () => {
    if (!childId || saving || !newCategory.trim()) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const created = await api<PersonalCategory>(`/api/world/${childId}/categories`, { method: "POST", body: JSON.stringify({ label: newCategory.trim() }) });
      setCustomCategories(items => items.some(item => item.id === created.id) ? items : [...items, created]);
      setPendingPhotos(items => items.map(item => ({ ...item, category: `custom:${created.id}` })));
      setNewCategory("");
      setMessage(t("personal.categoryCreated", { name: created.label }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("personal.error.category")); }
    finally { setSaving(false); }
  };

  const edited = (photo: WorldPhoto) => {
    setPhotos((items) => items.map((item) => item.id === photo.id ? photo : item));
    setEditingPhoto(null);
    setMessage(t("personal.saved", { name: photo.name }));
  };

  const remove = async (photo: WorldPhoto) => {
    if (!childId || saving || !window.confirm(t("world.deleteConfirm", { name: photo.name }))) return;
    setSaving(true); setError("");
    try {
      await api(`/api/world/${childId}/${photo.id}`, { method: "DELETE" });
      setPhotos((items) => items.filter((item) => item.id !== photo.id));
      setMessage(t("world.ui13"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("world.ui14")); }
    finally { setSaving(false); }
  };

  const addToWords = async (photo: WorldPhoto) => {
    if (!childId || saving) return;
    setSaving(true); setError(""); setMessage("");
    const categoryMap: Record<string, string> = { people: "people", toys: "play", food: "food", places: "places", animals: "people", home: "household", clothing: "household", custom: "household" };
    try {
      await api("/api/aac/cards", { method: "POST", body: JSON.stringify({ child_id: childId, label: photo.name.slice(0, 40), speech: cardSpeech(photo), category: categoryMap[photo.category] || "household", image: photo.image_data, language: photo.language || languageOf(getLocale()) }) });
      setMessage(t("world.cardAdded", { name: photo.name }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("world.ui15")); }
    finally { setSaving(false); }
  };

  const speakName = async (photo: WorldPhoto) => {
    setSpeakingPhoto(photo.id); setError("");
    try {
      if (!await onSpeak(cardSpeech(photo), photo.language)) setError(t("world.ui16"));
    } catch { setError(t("world.ui17")); }
    finally { setSpeakingPhoto((current) => current === photo.id ? null : current); }
  };

  const visible = photos.filter(photo => (category === "all" || photoCategory(photo) === category) && photo.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  // Tabs list every topic that has cards, plus the selected one, so the bar stays short.
  const tabs = categories.filter(item => item.key === category || photos.some(photo => photoCategory(photo) === item.key));
  const canPractice = practiceCards(visible).cards.length >= minimumPracticeCards;
  const practice = () => {
    const exercise = personalChoiceExercise(visible, t("personal.words.findTitle"), category === "all" ? "words" : category.replace(":", "-"));
    if (exercise) onPractice(exercise);
  };
  if (!childId) return <div className="v2-screen v2-world-empty" role="status">{t("world.ui18")}</div>;
  return <div className="v2-screen v2-world focused-world page-enter">
    <header className="library-heading family-library-header"><div><h1>{canManage ? t("personal.words.title") : t("world.ui19")}</h1><p>{canManage ? t("personal.words.parentLead") : t("world.ui22")}</p>{navigation}</div><LibraryScene scene="world"/></header>
    {canManage && <button className="primary-button world-add-photo" aria-expanded={uploadOpen} aria-controls="world-upload" onClick={() => setUploadOpen(value => !value)}><Camera size={20}/>{t(uploadOpen ? "library.closeUpload" : "world.ui23")}</button>}
    {loadError && <div className="v2-inline-alert" role="alert"><p>{loadError}</p><button className="small-button" onClick={() => setRevision(value => value+1)}>{t("ux.retry")}</button></div>}
    {error && <p className="v2-inline-alert" role="alert">{error}</p>}
    {message && <p className="v2-save-message" role="status"><Check/>{message}</p>}
    <div className="world-library-tools"><label className="library-search">{t("library.findPhoto")}<span><Search size={20}/><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("library.searchPhotoPlaceholder")}/></span></label><div className="v2-world-tabs" role="group" aria-label={t("world.ui25")}>{[{key:"all",label:t("library.allPhotos")},...tabs].map(item => <button key={item.key} aria-pressed={category === item.key} className={category === item.key ? "active" : ""} onClick={() => setCategory(item.key)}>{item.label}<span>{item.key === "all" ? photos.length : photos.filter(photo => photoCategory(photo) === item.key).length}</span></button>)}</div>
      {visible.length > 0 && <button type="button" className="secondary-button personal-practice-button" disabled={!canPractice} onClick={practice}><Ear size={18}/>{canPractice ? t("personal.words.find") : t("personal.words.findLocked")}</button>}</div>
    {canManage && <div className="v2-world-upload-form" id="world-upload" hidden={!uploadOpen}>
      <div className="world-upload-heading"><h2>{t("library.uploadTitle")}</h2><p>{t("library.uploadSteps")}</p></div>
      <button className="v2-upload-button" type="button" disabled={saving || pendingPhotos.length >= 4} onClick={() => fileInput.current?.click()}><Plus/>{saving ? t("world.ui26") : t("world.ui27")}</button>
      <input ref={fileInput} id={fileId} tabIndex={-1} className="v2-visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={saving || pendingPhotos.length >= 4} onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ""; void preparePhotos(files); }}/>
      <small>{t("world.ui28")}</small>
      <div className="personal-inline-field"><label>{t("personal.editor.newCategoryName")}<input maxLength={30} value={newCategory} disabled={saving} onChange={(event) => setNewCategory(event.target.value)} placeholder={t("personal.editor.newCategoryPlaceholder")}/></label><button type="button" className="small-button" disabled={saving || !newCategory.trim()} onClick={() => void createCategory()}>{t("personal.editor.addCategory")}</button></div>{pendingPhotos.length >= 4 && <p role="status">{t("library.uploadLimit")}</p>}
      {pendingPhotos.length > 0 && <form className="v2-photo-upload-review" onSubmit={(event) => { event.preventDefault(); void upload(); }}>
        <div className="v2-photo-upload-previews">{pendingPhotos.map((photo, index) => <div className="v2-photo-upload-preview" key={photo.id}>
          <div className="v2-upload-photo-image"><Image src={photo.image_data} alt={t("world.newPhoto", { number: index + 1 })} fill sizes="(max-width: 480px) 100vw, 40vw" unoptimized/></div>
          <label>{t("world.ui29")} {index + 1}<input required maxLength={60} disabled={saving} value={photo.name} placeholder={t("world.ui30")} onChange={(event) => setPendingPhotos((items) => items.map((item) => item.id === photo.id ? { ...item, name: event.target.value } : item))}/></label>
          <label>{t("world.ui31")}<select disabled={saving} value={photo.category} onChange={(event) => setPendingPhotos((items) => items.map((item) => item.id === photo.id ? { ...item, category: event.target.value } : item))}>{categories.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
          <label>{t("personal.editor.language")}<select disabled={saving} value={photo.language} onChange={(event) => setPendingPhotos((items) => items.map((item) => item.id === photo.id ? { ...item, language: event.target.value as "ru" | "kk" } : item))}><option value="ru">{t("personal.language.ru")}</option><option value="kk">{t("personal.language.kk")}</option></select></label>
          <button type="button" className="small-button" disabled={saving} onClick={() => setPendingPhotos((items) => items.filter((item) => item.id !== photo.id))}>{t("world.ui32")} {index + 1}</button>
        </div>)}</div>
        <button type="submit" className="primary-button" disabled={saving}>{saving ? t("world.ui33") : t("world.ui34")}</button>
      </form>}
      {legacyPhotos.length > 0 && <button className="v2-legacy-import" onClick={() => void importLegacy()} disabled={saving}>{t("world.import", { count: legacyPhotos.length })}</button>}
    </div>}

    {canManage && editingPhoto !== null && photos.some(photo => photo.id === editingPhoto) && <PersonalCardEditor key={editingPhoto} childId={childId} kind="word" card={photos.find(photo => photo.id === editingPhoto)} categories={customCategories} onCategoryCreated={(created) => setCustomCategories(items => [...items, created])} onSaved={edited} onCancel={() => setEditingPhoto(null)} onSpeak={onSpeak}/>}
    {loading ? <p className="v2-world-empty" role="status">{t("world.ui36")}</p> : visible.length ? <div className="v2-photo-grid">{visible.map((photo) => <article key={photo.id} className="v2-photo-card"><button className="v2-photo-image-button" onClick={() => void speakName(photo)} aria-label={t("world.listen", { name: photo.name })}><Image src={photo.image_data} alt={photo.name} fill unoptimized sizes="(max-width: 480px) 100vw, (max-width: 760px) 50vw, 30vw"/></button><footer><span className="personal-card-title"><strong>{photo.name}</strong>{category === "all" && <small>{cardCategoryLabel(photo, t)}</small>}{canManage && <small>{photo.practice?.rounds ? t("personal.practiceStat", { independent: photo.practice.independent, rounds: photo.practice.rounds }) : t("personal.practiceNone")}</small>}</span><button onClick={() => void speakName(photo)} aria-label={t("world.speak", { name: photo.name })}><Volume2/>{speakingPhoto === photo.id && <span className="v2-visually-hidden">{t("world.ui37")}</span>}</button></footer>{canManage && <div className="v2-photo-actions"><button disabled={saving} onClick={() => setEditingPhoto(photo.id)}><Pencil/>{t("common.edit")}</button><button disabled={saving} onClick={() => void addToWords(photo)}><MessageCircle/>  {t("world.ui42")}</button><button disabled={saving} onClick={() => void remove(photo)} aria-label={t("world.delete", { name: photo.name })}><Trash2/></button></div>}</article>)}</div> : !loadError && <div className="library-empty world-empty"><Image src="/app-illustrations/library-world.png" alt="" width={160} height={160}/><div><h2>{t(query || photos.length ? "library.noPhotos" : "library.firstPhoto")}</h2><p>{query || photos.length ? t("library.changeFilters") : canManage ? t("library.firstPhotoHint") : t("world.ui45")}</p>{query || photos.length ? <button className="small-button" onClick={() => {setQuery("");setCategory("all");}}>{t("library.reset")}</button> : canManage && <button className="small-button" onClick={() => {setUploadOpen(true);fileInput.current?.click();}}>{t("world.ui27")}</button>}</div></div>}
    <button className="v2-world-words-link" onClick={onWords}><MessageCircle/><span><strong>{t("world.ui46")}</strong><small>{canManage ? t("world.ui47") : t("world.ui48")}</small></span><ArrowRight/></button>
  </div>;
}
