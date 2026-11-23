"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Ear, Eye, Pencil, Plus, RotateCcw, Trash2, Users, Volume2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { api, type Exercise, type FamilyRelation, type PersonalCard } from "@/lib/api";
import { t, useLocale } from "@/lib/i18n";
import { speak, stopCurrentSpeech } from "@/lib/speech";
import { cardSpeech, cardWord, familyRelations, minimumPracticeCards, personalChoiceExercise, practiceCards, relationKey } from "@/lib/personalCards";
import { PersonalCardEditor } from "./PersonalCardEditor";

type Props = {
  childId?: number;
  canManage: boolean;
  soundEnabled: boolean;
  header?: ReactNode;
  onPractice: (exercise: Exercise) => void;
};

const byRelation = (cards: PersonalCard[]) => [...cards].sort((a, b) =>
  familyRelations.indexOf(a.relation as FamilyRelation) - familyRelations.indexOf(b.relation as FamilyRelation) || a.id - b.id);

/** «Моя семья»: a ready beginner module built from the family's own photos. */
export function FamilyExperience({ childId, canManage, soundEnabled, header, onPractice }: Props) {
  useLocale();
  const [cards, setCards] = useState<PersonalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState<"manage" | "child">(canManage ? "manage" : "child");
  const [editing, setEditing] = useState<{ card?: PersonalCard; relation?: FamilyRelation } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!childId) return;
    let current = true;
    queueMicrotask(() => { if (current) { setLoading(true); setLoadError(""); } });
    api<PersonalCard[]>(`/api/world/${childId}?kind=family`)
      .then(items => { if (current) setCards(byRelation(items)); })
      .catch(cause => { if (current) setLoadError(cause instanceof Error ? cause.message : t("personal.error.load")); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; stopCurrentSpeech(); };
  }, [childId, revision]);

  const say = (text: string, language: "ru" | "kk") => speak(text, .82, soundEnabled, language);

  const saved = (card: PersonalCard) => {
    setCards(items => byRelation([card, ...items.filter(item => item.id !== card.id)]));
    setEditing(null);
    setMessage(t("personal.saved", { name: cardWord(card) }));
  };

  const remove = async (card: PersonalCard) => {
    if (!childId || !window.confirm(t("personal.deleteConfirm", { name: card.name || cardWord(card) }))) return;
    setError(""); setMessage("");
    try {
      await api(`/api/world/${childId}/${card.id}`, { method: "DELETE" });
      setCards(items => items.filter(item => item.id !== card.id));
      setMessage(t("personal.deleted"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("world.ui14")); }
  };

  const practice = () => {
    const exercise = personalChoiceExercise(cards, t("personal.family.findTitle"), "family");
    if (exercise) onPractice(exercise);
  };

  if (!childId) return <div className="v2-screen v2-world-empty" role="status">{t("world.ui18")}</div>;
  const status = <>
    {loadError && <div className="v2-inline-alert" role="alert"><p>{loadError}</p><button className="small-button" onClick={() => setRevision(value => value + 1)}>{t("ux.retry")}</button></div>}
    {error && <p className="v2-inline-alert" role="alert">{error}</p>}
    {message && <p className="v2-save-message" role="status">{message}</p>}
  </>;

  if (!canManage) return <div className="v2-screen family-module playroom-catalog family-room-catalog page-enter">{header}{status}
    {loading ? <p className="v2-world-empty" role="status">{t("world.ui36")}</p> : <FamilyLearning cards={cards} onSpeak={say} onPractice={practice}/>}
  </div>;

  return <div className="v2-screen family-module family-module-manage page-enter">
    <header className="personal-page-header">
      <div><h1>{t("personal.family.title")}</h1><p>{t("personal.family.parentLead")}</p></div>
      <div className="personal-view-switch" role="group" aria-label={t("personal.family.viewLabel")}>
        <button type="button" aria-pressed={view === "manage"} onClick={() => { setMessage(""); setView("manage"); }}><Users size={18}/>{t("personal.family.cards")}</button>
        <button type="button" aria-pressed={view === "child"} onClick={() => { setEditing(null); setMessage(""); setView("child"); }}><Eye size={18}/>{t("personal.family.asChild")}</button>
      </div>
    </header>
    {status}
    {view === "child" ? <section className="family-child-preview" aria-label={t("personal.family.asChild")}><FamilyLearning cards={cards} onSpeak={say} onPractice={practice}/></section> : <>
      <aside className="personal-note"><strong>{t("personal.family.readyModule")}</strong><span>{t("personal.family.readyModuleText")}</span></aside>
      {editing && <PersonalCardEditor key={editing.card?.id || editing.relation} childId={childId} kind="family" card={editing.card} initialRelation={editing.relation} onSaved={saved} onCancel={() => setEditing(null)} onSpeak={say}/>}
      {loading ? <p className="v2-world-empty" role="status">{t("world.ui36")}</p> : <div className="family-relation-grid">
        {familyRelations.map(relation => {
          const members = cards.filter(card => card.relation === relation);
          return <section key={relation} className="family-relation" aria-labelledby={`relation-${relation}`}>
            <header><h2 id={`relation-${relation}`}>{t(relationKey(relation))}</h2>{members.length > 0 && <span>{members.length}</span>}</header>
            {members.map(card => <article key={card.id} className="family-member">
              <button type="button" className="family-member-photo" onClick={() => void say(cardSpeech(card), card.language)} aria-label={t("world.listen", { name: cardSpeech(card) })}><Image src={card.image_data} alt={card.name || cardWord(card)} fill unoptimized sizes="160px"/></button>
              <div className="family-member-copy"><strong>{card.name || cardWord(card)}</strong>
                <small>{t(card.language === "kk" ? "personal.language.kk" : "personal.language.ru")} · {cardSpeech(card)}</small>
                <small>{card.practice?.rounds ? t("personal.practiceStat", { independent: card.practice.independent, rounds: card.practice.rounds }) : t("personal.practiceNone")}</small></div>
              <div className="family-member-actions">
                <button type="button" onClick={() => void say(cardSpeech(card), card.language)} aria-label={t("world.speak", { name: cardSpeech(card) })}><Volume2 size={18}/></button>
                <button type="button" onClick={() => setEditing({ card })} aria-label={t("personal.editNamed", { name: card.name || cardWord(card) })}><Pencil size={18}/></button>
                <button type="button" onClick={() => void remove(card)} aria-label={t("world.delete", { name: card.name || cardWord(card) })}><Trash2 size={18}/></button>
              </div>
            </article>)}
            <button type="button" className="family-add" onClick={() => setEditing({ relation })}><Plus size={18}/>{t(members.length ? "personal.family.addAnother" : "personal.family.addPhoto")}</button>
          </section>;
        })}
      </div>}
      {!loading && cards.length < minimumPracticeCards && <p className="personal-hint" role="status">{t("personal.family.needTwo")}</p>}
    </>}
  </div>;
}

/** Child-facing part: meet each person, listen again, then find them by ear. */
function FamilyLearning({ cards, onSpeak, onPractice }: { cards: PersonalCard[]; onSpeak: (text: string, language: "ru" | "kk") => Promise<boolean>; onPractice: () => void }) {
  useLocale();
  const [meeting, setMeeting] = useState<number | null>(null);
  const canPractice = practiceCards(cards).cards.length >= minimumPracticeCards;
  if (!cards.length) return <div className="library-empty world-empty family-empty"><Image src="/app-illustrations/aac-mother.webp" alt="" width={160} height={160}/><div><h2>{t("personal.family.emptyChild")}</h2><p>{t("personal.family.emptyChildHint")}</p></div></div>;

  if (meeting !== null) {
    const card = cards[meeting];
    const go = (next: number) => { setMeeting(next); void onSpeak(cardSpeech(cards[next]), cards[next].language); };
    return <section className="family-meet" aria-label={t("personal.family.meet")}>
      <button type="button" className="family-meet-photo" onClick={() => void onSpeak(cardSpeech(card), card.language)} aria-label={t("world.listen", { name: cardSpeech(card) })}><Image src={card.image_data} alt={card.name || cardWord(card)} fill unoptimized sizes="(max-width: 760px) 90vw, 480px"/></button>
      <div className="family-meet-word"><strong>{cardWord(card)}</strong>{card.name && <span>{card.name}</span>}</div>
      <div className="family-meet-controls">
        <button type="button" className="family-round-button" disabled={meeting === 0} onClick={() => go(meeting - 1)} aria-label={t("personal.previous")}><ChevronLeft size={28}/></button>
        <button type="button" className="family-listen-button" onClick={() => void onSpeak(cardSpeech(card), card.language)}><RotateCcw size={24}/>{t("personal.again")}</button>
        <button type="button" className="family-round-button" disabled={meeting === cards.length - 1} onClick={() => go(meeting + 1)} aria-label={t("personal.next")}><ChevronRight size={28}/></button>
      </div>
      <div className="family-meet-dots" aria-hidden="true">{cards.map((item, index) => <i key={item.id} className={index === meeting ? "active" : ""}/>)}</div>
      <div className="family-meet-finish">
        <button type="button" className="secondary-button" onClick={() => setMeeting(null)}>{t("personal.family.allFamily")}</button>
        {meeting === cards.length - 1 && canPractice && <button type="button" className="primary-button" onClick={onPractice}><Ear size={18}/>{t("personal.family.find")}</button>}
      </div>
    </section>;
  }

  return <div className="family-learning">
    <div className="family-actions">
      <button type="button" className="family-action meet" onClick={() => { setMeeting(0); void onSpeak(cardSpeech(cards[0]), cards[0].language); }}><Users size={30}/><span><strong>{t("personal.family.meet")}</strong><small>{t("personal.family.meetHint")}</small></span></button>
      <button type="button" className="family-action find" disabled={!canPractice} onClick={onPractice}><Ear size={30}/><span><strong>{t("personal.family.find")}</strong><small>{canPractice ? t("personal.family.findHint") : t("personal.family.findLocked")}</small></span></button>
    </div>
    <div className="family-gallery">{cards.map(card => <button type="button" key={card.id} className="family-tile" onClick={() => void onSpeak(cardSpeech(card), card.language)} aria-label={t("world.listen", { name: cardSpeech(card) })}>
      <span className="family-tile-photo"><Image src={card.image_data} alt="" fill unoptimized sizes="(max-width: 480px) 45vw, 220px"/></span>
      <strong>{cardWord(card)}</strong>{card.name && <small>{card.name}</small>}<Volume2 className="family-tile-sound" size={20} aria-hidden="true"/>
    </button>)}</div>
  </div>;
}
