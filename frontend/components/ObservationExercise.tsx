"use client";

import { t, useLocale } from "@/lib/i18n";
import { useExercisePet } from "./pet/ExercisePet";

import Image from 'next/image';
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import { Volume2, RotateCcw, Pause, CircleX } from 'lucide-react';
import { PracticeLength } from './PracticeLength';
import { shuffleWithRandom } from '@/lib/exerciseRuntime';
import { descriptionPhrase, descriptionQuestion, observationRounds, type ObservationContent } from '@/lib/observationRuntime';
import { stopCurrentSpeech } from '@/lib/speech';

type Measurement = {attempt_status: 'participated' | 'break' | 'refused' | 'technical_error'; prompts_used: number; gameplay_choices: number; prompt_level: 'independent' | 'minimal' | 'full'; communication_initiatives: number};
type Description = {scene_key: string; theme: string; phrase: string; parts_count: number; target_parts: number; responses: {step: number; label: string; matches: boolean}[]; supports: string[]};
type Props = {language?: "ru" | "kk"; content: ObservationContent; soundEnabled: boolean; defaultRounds?: number; onSpeak: (text: string, rate?: number) => Promise<boolean>; onBack: () => void;
  onComplete: (measurement: Measurement, details: Record<string, unknown>) => Promise<unknown> | void; stopRef?: Ref<(status: 'break' | 'refused') => Promise<void>>};

export function ObservationExercise({language = "ru", content, soundEnabled, defaultRounds, onSpeak, onBack, onComplete, stopRef}: Props) {
  useLocale();
  const pet = useExercisePet();
  const rounds = useMemo(() => observationRounds(content.scenes || []), [content]);
  const [limit, setLimit] = useState(Math.min(defaultRounds || content.default_rounds || 12, rounds.length));
  const [doneCount, setDoneCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'ready' | 'technical' | 'done'>('intro');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [technical, setTechnical] = useState('');
  const scene = rounds[index];
  const target = 3;
  const step = Math.min(words.length, 2);
  const options = useMemo(() => shuffleWithRandom(scene?.options[step] || []), [scene, step]);
  const evidence = useRef({responses: [] as Description['responses'], supports: [] as string[]});
  const descriptions = useRef<Description[]>([]);
  const lock = useRef(false);
  const audioLock = useRef(false);
  const audioEpoch = useRef(0);
  useEffect(() => () => {audioEpoch.current++; stopCurrentSpeech();}, []);
  const inactive = busy || saving;
  const phrase = descriptionPhrase(words, language);
  async function play(text: string, support?: 'listen_word' | 'repeat_question') {
    if (audioLock.current || lock.current) return false;
    audioLock.current = true; setBusy(true);
    const epoch = ++audioEpoch.current;
    if (support) evidence.current.supports.push(support);
    try {
      const played = soundEnabled && await onSpeak(text, .76);
      if (epoch !== audioEpoch.current) return false;
      if (!played) { setTechnical(t("observationExercise.ui1")); setPhase('technical'); return false; }
      return true;
    } catch { if (epoch === audioEpoch.current) {setTechnical(t("observationExercise.ui2")); setPhase('technical');} return false; }
    finally { audioLock.current = false; setBusy(false); }
  }
  async function choose(label: string) {
    if (inactive || audioLock.current || phase !== 'playing') return;
    const matches = label === scene.parts[words.length];
    evidence.current.responses.push({step: words.length, label, matches});
    pet(matches ? "correct" : "incorrect");
    if (!matches) {
      evidence.current.supports.push('retry');
      setNotice(t("observationExercise.ui3"));
      await play(language === "kk" ? "Қайта қара. Сөздерді тыңдауға немесе үлгіні көруге болады." : "Посмотри ещё раз. Можно послушать слова или посмотреть образец.");
      return;
    }
    const next = [...words, label]; setWords(next); setNotice('');
    if (next.length >= target) setPhase('ready');
    await play(next.length >= target ? descriptionPhrase(next, language) : descriptionQuestion(scene, next.length, language));
  }
  async function model() {
    if (inactive || audioLock.current) return;
    pet('hint');
    evidence.current.supports.push('model');
    const next = scene.parts.slice(0, target); setWords(next); setPhase('ready'); setNotice(t("observationExercise.ui4"));
    await play(descriptionPhrase(next, language));
  }
  function remember() {
    descriptions.current = descriptions.current.filter(item => item.scene_key !== scene.key);
    descriptions.current.push({scene_key: scene.key, theme: scene.theme, phrase, parts_count: words.length, target_parts: target,
      responses: [...evidence.current.responses], supports: [...evidence.current.supports]});
  }
  async function save(status: Measurement['attempt_status']) {
    if (lock.current) return;
    if (status !== 'participated') {audioEpoch.current++; stopCurrentSpeech(); audioLock.current = false; setBusy(false);}
    else if (audioLock.current) return;
    lock.current = true; setSaving(true); setNotice('');
    if (phase === 'ready') remember();
    const done = descriptions.current;
    const supports = [...done.flatMap(item => item.supports), ...(phase !== 'ready' ? evidence.current.supports : [])];
    try {
      const result = await onComplete({attempt_status: status, prompts_used: supports.length,
        gameplay_choices: done.reduce((sum, item) => sum + item.responses.length, 0) + (phase !== 'ready' ? evidence.current.responses.length : 0),
        prompt_level: supports.includes('model') ? 'full' : supports.length ? 'minimal' : 'independent', communication_initiatives: 0},
        {presentation: 'picture_description', bank_key: content.bank_key, phrase: done.at(-1)?.phrase || '', descriptions: done,
          round_count: done.length, planned_round_count: limit, bank_size: rounds.length,
          unfinished_description: phase === 'ready' ? null : {scene_key: scene.key, words, ...evidence.current},
          ...(status === 'technical_error' ? {reason: technical} : {})});
      if (result) {setDoneCount(done.length);setPhase('done'); if (status !== 'participated') onBack();}
      else { lock.current = false; setNotice(t("observationExercise.ui5")); }
    } catch { lock.current = false; setNotice(t("observationExercise.ui5")); }
    finally {setSaving(false);}
  }
  useImperativeHandle(stopRef, () => async status => {await save(status);});
  async function advance(extend = false) {
    if (inactive || audioLock.current || phase !== 'ready' || words.length !== target) return;
    remember();
    if (index === limit - 1 && !extend) {await save('participated'); return;}
    if (extend) setLimit(Math.min(rounds.length, limit + 6));
    evidence.current = {responses: [], supports: []};
    setWords([]); setIndex(index + 1); setNotice(''); setPhase('playing');
    await play(descriptionQuestion(scene, 0, language));
  }
  if (!scene) return <p role="alert">{t("observationExercise.ui7")} <button onClick={onBack}>{t("observationExercise.ui8")}</button></p>;
  if (phase === 'done') return <div className="runner-intro"><h3>{t("observationExercise.ui9")}</h3><p>{t("observationExercise.ui10")} {doneCount}.</p><button className="primary-button" onClick={onBack}>{t("observationExercise.ui8")}</button></div>;
  return <section className="observation-exercise" aria-label={t("observationExercise.ui11")}>
    {phase === 'intro' ? <div className="runner-intro observation-intro"><h2>{t("observationExercise.ui12")}</h2><p>{t("observationExercise.ui13")}</p>
      <PracticeLength value={limit} choices={content.round_choices || [12,18,24]} bankSize={rounds.length} unit={t("observationExercise.ui14")} onChange={setLimit}/>
      <p>{t("observationExercise.ui15")}</p>
      <button className="primary-button" disabled={inactive} onClick={() => {setPhase('playing'); void play(language === "kk" ? "Суретке қара. Онда кім бар?" : "Рассмотри картинку. Кто на ней?");}}>{t("observationExercise.ui17")}</button></div> : phase === 'technical' ? <div className="runner-intro" role="alert"><h3>{t("observationExercise.ui18")}</h3><p>{technical}</p><button className="primary-button" disabled={saving} onClick={() => void save('technical_error')}>{t("observationExercise.ui19")}</button></div> : <>
      <header className="observation-heading"><div><span className="kicker">{t("observationExercise.round", { current: index + 1, total: limit, theme: scene.theme })}</span><h2>{phase === 'ready' ? t("observationExercise.ui22") : descriptionQuestion(scene, words.length, language)}</h2></div><button className="small-button" disabled={inactive} onClick={() => void play(phase === 'ready' ? phrase : descriptionQuestion(scene, words.length, language), 'repeat_question')}><Volume2 size={18}/> {phase === 'ready' ? t("observationExercise.ui23") : t("observationExercise.ui24")}</button></header>
      <div className="observation-workspace"><figure className="observation-scene"><Image src={scene.media_ref} alt={t("observationExercise.ui25")} width={1440} height={1080} sizes="(max-width: 760px) 100vw, 55vw" priority onError={() => {setTechnical(t("observationExercise.ui26"));setPhase('technical');}}/></figure>
      <div className="observation-compose"><ol className="description-slots" aria-label={t("observationExercise.ui27")}>{(language === "kk" ? [0, 2, 1] : [0, 1, 2]).map((position) => <li key={position} className={words[position] ? 'filled' : ''}>{words[position] || (position === 0 ? t("observationExercise.ui28") : position === 1 ? t("observationExercise.ui29") : scene.detail_question)}</li>)}</ol>
        <div className="observation-live" aria-live="polite">{busy ? t("observationExercise.ui30") : notice}</div>
        {phase === 'playing' && <div className="description-options" role="group" aria-label={descriptionQuestion(scene, words.length, language)}>{options.map(label => <div key={label}><button className="description-word" disabled={inactive} onClick={() => void choose(label)}>{label}</button><button className="description-listen" disabled={inactive} aria-label={t("observationExercise.listen", { label })} onClick={() => void play(label, 'listen_word')}><Volume2 size={21}/></button></div>)}</div>}
        {words.length > 0 && <button className="small-button" disabled={inactive} onClick={() => {setWords(words.slice(0,-1));setPhase('playing');setNotice('');}}><RotateCcw size={17}/>  {t("observationExercise.ui31")}</button>}
        {phase === 'ready' && <div className="description-actions"><button className="primary-button" disabled={inactive} onClick={() => void advance()}>{saving ? t("observationExercise.ui32") : index === limit - 1 ? t("observationExercise.ui33") : t("observationExercise.ui34")}</button>{index === limit - 1 && limit < rounds.length && <button className="secondary-button" disabled={inactive} onClick={() => void advance(true)}>{t("observationExercise.ui35")}</button>}</div>}

        {phase === 'playing' && <button className="small-button" disabled={inactive} onClick={() => void model()}>{t("observationExercise.ui36")}</button>}
      </div></div>
    </>}
    <div className="runner-stop-actions"><button className="small-button" disabled={saving} onClick={() => void save('break')}><Pause size={16}/>  {t("observationExercise.ui37")}</button><button className="small-button" disabled={saving} onClick={() => void save('refused')}><CircleX size={16}/>  {t("observationExercise.ui38")}</button></div>
  </section>;
}
