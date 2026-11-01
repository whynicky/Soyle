"use client";

import { t, useLocale } from "@/lib/i18n";
import { useExercisePet } from "./pet/ExercisePet";

import { ObservationExercise } from "./ObservationExercise";
import type { ObservationContent } from "@/lib/observationRuntime";
import { ExplorationExercise } from "./ExplorationExercise";
import type { ExplorationContent } from "@/lib/explorationRuntime";
import { VariedExerciseRunner } from "./VariedExerciseRunner";
import { variedMechanics, type VariedContent, type VariedMechanic } from "@/lib/variedRuntime";
import { PracticeLength } from "@/components/PracticeLength";

import { Check, ChevronRight, CircleX, Pause, RotateCcw, ShieldCheck, Volume2 } from "lucide-react";
import Image from "next/image";
import { InstructionResult } from "./InstructionResult";
import { newAnswerEvidence, withSupport, withResponse, responseOutcome } from "@/lib/answerEvidence";
import { useMemo, useRef, useState } from "react";
import {
  chooseRoundMedia,
  createChoiceRound, createInstructionSequence,
  instructionMatches,
  resolveDifficulty,
  shuffleWithRandom,
  type ChoiceRound,
  type ChoiceStimulus,
  type DifficultyLevel,
  type InstructionScenario,
} from "@/lib/exerciseRuntime";

export type DraftExerciseVersion = {
  language?: "ru" | "kk";
  id: number;
  exercise_id: number;
  version: number;
  title: string;
  instruction: string;
  objective: string;
  mechanic: "auditory_choice" | "action_choice" | "tap_instruction" | "guided_aac" | "scene_search" | VariedMechanic;
  review_status: string;
  publication_status: string;
  admin_review_status?: string;
  technical_status?: string;
  methodology_status?: string;
  accessibility_status?: string;
  release_status?: string;
  method_card?: ExerciseMethodCard;
  content: VariedContent & ObservationContent & ExplorationContent & {
    exemplar_policy?: "matched_set";
    bank_key?: string;
    round_choices?: number[];
    default_rounds?: number;
    max_rounds?: number;
    stimuli?: ChoiceStimulus[];
    difficulty_levels?: DifficultyLevel[];
    scenarios?: InstructionScenario[];
    asset_registry?: Array<{ media_ref: string; origin: string; license: string; license_status: string }>;
  };
};

export type ExerciseMethodCard = {
  target_skill: string;
  skill_group: string[];
  intended_for: string[];
  diagnosis_boundary: string;
  prerequisites: string[];
  stimuli_and_responses: string;
  child_instruction: string;
  adult_guidance: string[];
  accepted_responses: string[];
  difficulty_levels: string[];
  prompts: string[];
  ambiguities: string[];
  stop_conditions: string[];
  result_registration: string[];
  real_life_transfer: string[];
  sources: Array<string | Record<string, string>>;
  evidence_note: string;
  methodology_review_status: string;
};

type Speak = (text: string, rate?: number) => Promise<boolean>;

export type InstructionRunnerMeasurement = {
  attempts_count?: number;
  correct_answers?: number;
  prompts_used?: number;
  gameplay_choices?: number;
  independent_completions?: number;
  prompted_completions?: number;
  attempt_status: "completed" | "refused" | "break" | "technical_error";
  independence?: number;
  prompt_level?: "independent" | "minimal" | "full";
};

export function DraftExercisePreview({ version, onClose, onSpeak }: { version: DraftExerciseVersion; onClose: () => void; onSpeak: Speak }) {
  useLocale();
  return <section className="draft-runner-shell" aria-label={t("runner.preview", { title: version.title })}>
    <header><div><span className="kicker">{t("runner.ui1")}</span><h2>{version.title}</h2><p>{version.objective}</p></div><button type="button" className="small-button" onClick={onClose}><CircleX size={17}/>  {t("runner.ui2")}</button></header>
    <div className="draft-safety-note"><ShieldCheck size={19}/><span>{t("runner.ui3")}</span></div>
    {version.mechanic === "scene_search"
      ? <ExplorationExercise content={version.content} previewVersionId={version.id} soundEnabled onSpeak={onSpeak} onBack={onClose} onComplete={async()=>({preview:true})}/>
      : version.content.presentation === "picture_description"
      ? <ObservationExercise language={version.language || "ru"} content={version.content} soundEnabled onSpeak={onSpeak} onBack={onClose} onComplete={async () => ({preview: true})}/>
      : variedMechanics.includes(version.mechanic)
      ? <VariedExerciseRunner mechanic={version.mechanic as VariedMechanic} content={version.content} soundEnabled onSpeak={onSpeak} onBack={onClose} onComplete={async () => ({preview: true})}/>
      : version.mechanic === "tap_instruction"
      ? <TapInstructionPreview version={version} onSpeak={onSpeak}/>
      : version.mechanic === "auditory_choice" || version.mechanic === "action_choice"
        ? <ChoicePreview version={version} onSpeak={onSpeak}/>
        : <div className="empty-state">{t("runner.ui4")}</div>}
  </section>;
}

function ChoicePreview({ version, onSpeak }: { version: DraftExerciseVersion; onSpeak: Speak }) {
  const stimuli = useMemo(() => version.content.stimuli || [], [version.content.stimuli]);
  const byKey = useMemo(() => new Map(stimuli.map((item) => [item.key, item])), [stimuli]);
  useLocale();
  const [level, setLevel] = useState<1 | 2 | 3>(2);
  const config = resolveDifficulty(version.content.difficulty_levels, level);
  const [roundLimit, setRoundLimit] = useState(version.content.default_rounds || config.rounds);
  const [phase, setPhase] = useState<"intro" | "playing" | "resolved" | "done" | "stopped">("intro");
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundData, setRoundData] = useState<ChoiceRound | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [audioReady, setAudioReady] = useState(false);
  const [media, setMedia] = useState<Record<string, string>>({});
  const previousMediaRef = useRef<Record<string, string>>({});
  const previewEvidenceRef = useRef(newAnswerEvidence());
  const usedTargetKeysRef = useRef<string[]>([]);

  const speakTarget = async (round = roundData) => {
    if (!round) return;
    if (round === roundData) previewEvidenceRef.current = withSupport(previewEvidenceRef.current, "repeat_audio");
    setAudioReady(false);
    const played = await onSpeak(byKey.get(round.targetKey)?.speech || "", 0.78);
    setAudioReady(played);
    if (!played) setFeedback(t("runner.ui5"));
  };
  const begin = async (previousCorrectIndex?: number) => {
    if (usedTargetKeysRef.current.length >= stimuli.length) usedTargetKeysRef.current = [];
    const next = createChoiceRound(stimuli, config.option_count, usedTargetKeysRef.current, Math.random, previousCorrectIndex);
    usedTargetKeysRef.current.push(next.targetKey);
    previewEvidenceRef.current = newAnswerEvidence();
    const nextMedia = chooseRoundMedia(stimuli, next.targetKey, previousMediaRef.current, version.content.exemplar_policy === "matched_set");
    if (nextMedia[next.targetKey]) previousMediaRef.current[next.targetKey] = nextMedia[next.targetKey];
    setMedia(nextMedia);
    setRoundData(next); setVisibleKeys(next.optionKeys); setAttempts(0); setFeedback(""); setPhase("playing");
    await speakTarget(next);
  };
  const choose = (key: string) => {
    if (!roundData || phase !== "playing" || !audioReady) return;
    previewEvidenceRef.current = withResponse(previewEvidenceRef.current, key);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (key === roundData.targetKey) {
      setFeedback(responseOutcome(previewEvidenceRef.current) === "independent" ? t("runner.ui6") : t("runner.ui7"));
      setPhase("resolved");
      return;
    }
    if (nextAttempts === 1) {
      setFeedback(byKey.get(roundData.targetKey)?.hint || t("runner.ui8"));
      void speakTarget();
    } else if (nextAttempts < config.max_attempts) {
      const other = shuffleWithRandom(roundData.optionKeys.filter((item) => item !== roundData.targetKey && item !== key))[0];
      setVisibleKeys(shuffleWithRandom([roundData.targetKey, other].filter(Boolean)));
      setFeedback(t("runner.ui9"));
      void speakTarget();
    } else {
      setFeedback(t("runner.model", { label: byKey.get(roundData.targetKey)?.label || t("runner.ui10") }));
      setPhase("resolved");
    }
  };
  const next = () => {
    if (!roundData) return;
    if (roundNumber >= roundLimit) { setPhase("done"); return; }
    setRoundNumber((value) => value + 1);
    void begin(roundData.optionKeys.indexOf(roundData.targetKey));
  };
  const resetForLevel = (nextLevel: 1 | 2 | 3) => {
    usedTargetKeysRef.current = [];
    setLevel(nextLevel); setPhase("intro"); setRoundNumber(1); setRoundData(null); setFeedback(""); setAudioReady(false);
  };

  if (stimuli.length < 4) return <div className="empty-state">{t("runner.ui11")}</div>;
  if (phase === "done" || phase === "stopped") return <div className="runner-finish" role="status"><Check size={36}/><h3>{phase === "done" ? t("runner.ui12") : t("runner.ui13")}</h3><p>{phase === "done" ? t("runner.ui14") : t("runner.ui15")}</p><button type="button" className="primary-button" onClick={() => resetForLevel(level)}>{t("runner.ui16")}</button></div>;

  return <div className={`p1-choice-runner ${version.mechanic === "action_choice" ? "action-choice" : ""}`}>
    <div className="runner-levels" aria-label={t("runner.ui17")}><span>{t("runner.ui18")}</span>{([1, 2, 3] as const).map((value) => { const item = resolveDifficulty(version.content.difficulty_levels, value); return <button type="button" key={value} className={level === value ? "active" : ""} aria-pressed={level === value} onClick={() => resetForLevel(value)}>{item.option_count}</button>; })}</div>
    {phase === "intro" && version.content.round_choices && <PracticeLength value={roundLimit} choices={version.content.round_choices} bankSize={stimuli.length} unit={version.mechanic === "action_choice" ? t("runner.ui19") : t("runner.ui20")} onChange={setRoundLimit}/>}
    {phase === "intro" ? <div className="runner-intro"><Volume2 size={42}/><h3>{version.instruction}</h3><p>{t("runner.ui21")}</p><button type="button" className="primary-button" onClick={() => void begin()}>{t("runner.ui22")}</button></div> : <>
      <div className="runner-audio"><button type="button" className="sound-button" onClick={() => void speakTarget()} aria-label={t("runner.ui23")}><Volume2 size={28}/></button><div><span className="kicker">{t("runner.round", { current: roundNumber, total: roundLimit })}</span><strong>{audioReady ? t("runner.ui26") : t("runner.ui27")}</strong></div><button type="button" className="small-button" onClick={() => void speakTarget()}><RotateCcw size={16}/>  {t("runner.ui28")}</button></div>
      <div className={`p1-choice-grid options-${visibleKeys.length}`}>{visibleKeys.map((key, index) => { const item = byKey.get(key); if (!item) return null; const revealed = phase === "resolved"; return <button type="button" key={key} disabled={revealed || !audioReady} className={revealed && key === roundData?.targetKey ? "answer" : ""} aria-label={revealed ? item.label : t("runner.option", { number: index + 1 })} onClick={() => choose(key)}><Image src={media[key] || item.media_ref || "/soyle-icon.png"} alt="" width={version.mechanic === "action_choice" ? 960 : 210} height={version.mechanic === "action_choice" ? 720 : 150} sizes={version.mechanic === "action_choice" ? "(max-width:480px) calc(100vw - 64px), (max-width:1000px) 45vw, 300px" : undefined}/>{revealed && <strong>{item.label}</strong>}{revealed && key === roundData?.targetKey && <i><Check size={17}/></i>}</button>; })}</div>
      {feedback && <div className="runner-feedback" role="status" aria-live="polite"><span>{feedback}</span>{phase === "resolved" && roundNumber >= roundLimit && roundLimit < (version.content.max_rounds || roundLimit) && <button type="button" className="secondary-button" onClick={() => { setRoundLimit(value => Math.min(value + 6, version.content.max_rounds || value)); setRoundNumber(value => value + 1); void begin(); }}>{t("runner.ui29")}</button>}{phase === "resolved" && <button type="button" className="primary-button" onClick={next}>{roundNumber >= roundLimit ? t("runner.ui30") : t("runner.ui31")}<ChevronRight size={17}/></button>}</div>}
    </>}
    <div className="runner-stop-actions"><button type="button" className="small-button" onClick={() => setPhase("stopped")}><Pause size={16}/>  {t("runner.ui32")}</button><button type="button" className="small-button" onClick={() => setPhase("stopped")}><CircleX size={16}/>  {t("runner.ui33")}</button></div>
  </div>;
}

function TapInstructionPreview({ version, onSpeak }: { version: DraftExerciseVersion; onSpeak: Speak }) {
  useLocale();
  const [outcome, setOutcome] = useState<InstructionRunnerMeasurement | null>(null);
  const [revision, setRevision] = useState(0);
  if (outcome) return <div className="runner-finish" role="status"><Check size={36}/><h3>{outcome.attempt_status === "completed" ? t("runner.ui12") : t("runner.ui13")}</h3><p>{t("runner.ui34")}</p>{outcome.attempt_status === "completed" && <><p>{t("runner.ui35")} {outcome.independent_completions || 0}</p><p>{t("runner.ui36")} {outcome.prompted_completions || 0}</p></>}<button className="primary-button" onClick={() => { setOutcome(null); setRevision(value => value + 1); }}>{t("runner.ui16")}</button></div>;
  return <PublishedInstructionRunner key={revision} scenarios={version.content.scenarios || []} roundChoices={version.content.round_choices} defaultRounds={version.content.default_rounds} soundEnabled onSpeak={onSpeak} onBack={() => {}} onComplete={async measurement => { setOutcome(measurement); return {preview: true}; }}/>;
}

export function PublishedInstructionRunner({
  scenarios,
  roundChoices,
  defaultRounds,
  soundEnabled,
  onSpeak,
  onComplete,
  onBack,
}: {
  scenarios: InstructionScenario[];
  roundChoices?: number[];
  defaultRounds?: number;
  soundEnabled: boolean;
  onSpeak: Speak;
  onComplete: (measurement: InstructionRunnerMeasurement, details: Record<string, unknown>) => Promise<unknown> | void;
  onBack: () => void;
}) {
  useLocale();
  const pet = useExercisePet();
  const orderedScenarios = useMemo(() => scenarios.every(item => item.result) ? createInstructionSequence(scenarios) : scenarios, [scenarios]);
  const [roundLimit, setRoundLimit] = useState(Math.min(defaultRounds || scenarios.length, scenarios.length));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "playing" | "resolved" | "technical">(soundEnabled ? "intro" : "technical");
  const [technicalReason, setTechnicalReason] = useState<"audio" | "image">("audio");
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [modelled, setModelled] = useState(false);
  const completedRef = useRef(0);
  const independentRef = useRef(0);
  const promptsRef = useRef(0);
  const choicesRef = useRef(0);
  const promptLevelRef = useRef<0 | 1 | 2>(0);
  const outcomesRef = useRef<Array<Record<string, unknown>>>([]);
  const selectionTraceRef = useRef<Array<{role: string; key: string}>>([]);
  const evidenceRef = useRef(newAnswerEvidence());
  const busyRef = useRef(false);
  const resolvedRef = useRef(false);
  const stoppedRef = useRef(false);
  const [audioPending, setAudioPending] = useState(false);
  const scenario = orderedScenarios[index];
  const movable = useMemo(() => shuffleWithRandom(scenario?.objects.filter((item) => item.role === "movable") || []), [scenario]);
  const targets = useMemo(() => shuffleWithRandom(scenario?.objects.filter((item) => item.role === "target") || []), [scenario]);

  const playInstruction = async (repeat = false) => {
    if (busyRef.current || stoppedRef.current) return false;
    if (repeat && phase === "playing") {
      pet("hint");
      evidenceRef.current = withSupport(evidenceRef.current, "repeat_audio");
      promptsRef.current += 1;
      promptLevelRef.current = Math.max(1, promptLevelRef.current) as 1 | 2;
    }
    if (!scenario || !soundEnabled) { setPhase("technical"); return false; }
    busyRef.current = true;
    setAudioPending(true);
    const played = await onSpeak(scenario.speech, 0.78);
    busyRef.current = false;
    if (stoppedRef.current) return false;
    setAudioPending(false);
    if (!played) { setTechnicalReason("audio"); setPhase("technical"); }
    return played;
  };
  const begin = async () => {
    if (!scenario) return;
    setPhase("playing");
    setFeedback(t("runner.ui37"));
    await playInstruction();
  };
  const chooseObject = (key: string) => {
    if (phase !== "playing" || busyRef.current || resolvedRef.current || stoppedRef.current) return;
    choicesRef.current += 1;
    selectionTraceRef.current.push({role: "movable", key});
    setSelectedObject(key);
    setFeedback(t("runner.ui38"));
  };
  const chooseTarget = (key: string) => {
    if (phase !== "playing" || busyRef.current || resolvedRef.current || stoppedRef.current) return;
    choicesRef.current += 1;
    selectionTraceRef.current.push({role: "target", key});
    if (!selectedObject) { setFeedback(t("runner.ui39")); return; }
    evidenceRef.current = withResponse(evidenceRef.current, `${selectedObject}:${key}`);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (instructionMatches(scenario, selectedObject, key)) {
      pet("correct");
      resolvedRef.current = true;
      completedRef.current += 1;
      const independent = responseOutcome(evidenceRef.current) === "independent";
      if (independent) independentRef.current += 1;
      outcomesRef.current.push({ scenario_key: scenario.key, object_key: selectedObject, target_key: key, attempts: nextAttempts, outcome: responseOutcome(evidenceRef.current), supports: evidenceRef.current.supports, first_response: evidenceRef.current.first_response, selections: [...selectionTraceRef.current] });
      setPhase("resolved");
      setFeedback(independent ? t("runner.ui40") : t("runner.ui41"));
      return;
    }
    pet("incorrect");
    evidenceRef.current = withSupport(evidenceRef.current, nextAttempts >= 3 ? "model_answer" : nextAttempts >= 2 && !scenario.result ? "visual_hint" : "repeat_audio");
    promptsRef.current += 1;
    promptLevelRef.current = nextAttempts === 1 ? Math.max(promptLevelRef.current, 1) as 0 | 1 | 2 : 2;
    if (nextAttempts >= 3) {
      setModelled(true);
      resolvedRef.current = true;
      outcomesRef.current.push({ scenario_key: scenario.key, object_key: selectedObject, target_key: key, attempts: nextAttempts, outcome: "modelled", supports: evidenceRef.current.supports, first_response: evidenceRef.current.first_response, selections: [...selectionTraceRef.current] });
      setPhase("resolved");
      setFeedback(t("runner.ui42"));
      void playInstruction();
      return;
    }
    setSelectedObject(null);
    setFeedback(nextAttempts === 1 || scenario.result ? t("runner.ui43") : t("runner.ui44"));
    void playInstruction();
  };
  const showModel = () => {
    if (phase !== "playing" || busyRef.current || resolvedRef.current || stoppedRef.current) return;
    pet("hint");
    evidenceRef.current = withSupport(evidenceRef.current, "model_answer");
    promptsRef.current += 1;
    promptLevelRef.current = 2;
    resolvedRef.current = true;
    outcomesRef.current.push({ scenario_key: scenario.key, attempts: attempts, outcome: "modelled", supports: evidenceRef.current.supports, first_response: evidenceRef.current.first_response, selections: [...selectionTraceRef.current] });
    setModelled(true); setPhase("resolved"); setFeedback(t("runner.ui45"));
  };
  const next = async () => {
    if (index < roundLimit - 1) {
      evidenceRef.current = newAnswerEvidence();
      resolvedRef.current = false;
      selectionTraceRef.current = [];
      setModelled(false);
      setIndex((value) => value + 1);
      setSelectedObject(null);
      setAttempts(0);
      setFeedback("");
      setPhase("intro");
      return;
    }
    const correct = completedRef.current;
    await onComplete({
      attempts_count: roundLimit,
      correct_answers: correct,
      prompts_used: promptsRef.current,
      gameplay_choices: choicesRef.current,
      independent_completions: independentRef.current,
      prompted_completions: Math.max(0, correct - independentRef.current),
      attempt_status: "completed",
      independence: roundLimit ? Math.round(independentRef.current / roundLimit * 100) : 0,
      prompt_level: promptLevelRef.current === 0 ? "independent" : promptLevelRef.current === 1 ? "minimal" : "full",
    }, { mechanic: "tap_instruction", one_step_only: true, scenario_outcomes: outcomesRef.current, round_count: roundLimit, bank_size: scenarios.length, scenario_order: orderedScenarios.slice(0, roundLimit).map(item => item.key) });
  };
  const stop = async (status: "break" | "refused") => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    const result = await onComplete({
      prompts_used: promptsRef.current,
      gameplay_choices: choicesRef.current,
      attempt_status: status,
    }, { mechanic: "tap_instruction", reason: "child_choice", scenario_index: index, scenario_key: scenario.key, scenario_outcomes: outcomesRef.current, selections: selectionTraceRef.current });
    if (!result) stoppedRef.current = false;
    if (result && status === "break") onBack();
  };
  const recordTechnicalIssue = async () => {
    const result = await onComplete({ attempt_status: "technical_error" }, { mechanic: "tap_instruction", reason: technicalReason === "image" ? "image_unavailable" : soundEnabled ? "audio_unavailable" : "sound_disabled" });
    if (result) onBack();
  };

  if (!scenario) return <div className="empty-state large" role="alert"><strong>{t("runner.ui46")}</strong><span>{t("runner.ui47")}</span><button type="button" className="secondary-button" onClick={onBack}>{t("runner.ui48")}</button></div>;
  if (phase === "technical") return <div className="listen-card published-instruction-card"><div className="sensory-demo technical"><Volume2 size={42}/><span className="kicker">{t("runner.ui49")}</span><h2>{technicalReason === "image" ? t("runner.ui50") : t("runner.ui51")}</h2><p>{technicalReason === "image" ? t("runner.ui52") : t("runner.ui53")}</p><button type="button" className="primary-button" onClick={() => void recordTechnicalIssue()}>{t("runner.ui54")}</button></div></div>;
  return <div className="listen-card published-instruction-card"><div className="tap-instruction-runner">
    <div className="instruction-heading"><span className="kicker">{t("runner.instruction", { current: index + 1, total: roundLimit })}</span><h3>{scenario.result && phase !== "resolved" ? t("runner.ui56") : scenario.instruction}</h3><button type="button" className="small-button" disabled={audioPending || phase === "intro"} onClick={() => void playInstruction(true)}><Volume2 size={17}/>  {t("runner.ui28")}</button></div>
    {phase === "intro" && index === 0 && roundChoices && <PracticeLength value={roundLimit} choices={roundChoices} bankSize={scenarios.length} unit={t("runner.ui57")} onChange={setRoundLimit}/>}
    {phase === "intro" ? <div className="runner-intro"><p>{t("runner.ui58")}</p><button type="button" className="primary-button" onClick={() => void begin()}>{t("runner.ui59")}</button></div> : <div className="instruction-stage">
      <section aria-labelledby="published-movable-heading"><h4 id="published-movable-heading">{t("runner.ui60")}</h4><div>{movable.map((item, position) => <button type="button" key={item.key} className={`${selectedObject === item.key ? "selected" : ""} ${attempts >= 2 && !scenario.result && item.key === scenario.success.object_key ? "hinted" : ""}`} aria-pressed={selectedObject === item.key} disabled={phase === "resolved" || audioPending} onClick={() => chooseObject(item.key)}><Image src={item.media_ref} alt="" width={120} height={120} onError={() => { setTechnicalReason("image"); setPhase("technical"); }}/><strong>{phase === "resolved" || !scenario.result ? item.label : t("runner.object", { number: position + 1 })}</strong></button>)}</div></section>
      <ChevronRight className="instruction-arrow" aria-hidden="true"/>
      <section aria-labelledby="published-target-heading"><h4 id="published-target-heading">{t("runner.ui61")}</h4><div>{targets.map((item, position) => <button type="button" key={item.key} className={`${phase === "resolved" && item.key === scenario.success.target_key ? "completed" : ""} ${attempts >= 2 && !scenario.result && item.key === scenario.success.target_key ? "hinted" : ""}`} disabled={phase === "resolved" || audioPending} onClick={() => chooseTarget(item.key)}><Image src={item.media_ref} alt="" width={120} height={120} onError={() => { setTechnicalReason("image"); setPhase("technical"); }}/><strong>{phase === "resolved" || !scenario.result ? item.label : t("runner.target", { number: position + 1 })}</strong>{phase === "resolved" && item.key === scenario.success.target_key && <i><Check size={17}/></i>}</button>)}</div></section>
    </div>}
    {phase === "playing" && scenario.result && <button type="button" className="small-button" disabled={audioPending} onClick={showModel}>{t("runner.ui62")}</button>}
    {phase === "resolved" && <InstructionResult scenario={scenario} modelled={modelled} onSpeak={onSpeak} onMediaError={() => { setTechnicalReason("image"); setPhase("technical"); }}/>}
    {feedback && <div className="runner-feedback" role="status" aria-live="polite"><span>{feedback}</span>{phase === "resolved" && index === roundLimit - 1 && roundLimit < scenarios.length && <button type="button" className="secondary-button" onClick={() => { setRoundLimit(value => Math.min(value + 6, scenarios.length)); evidenceRef.current = newAnswerEvidence(); resolvedRef.current = false; selectionTraceRef.current = []; setModelled(false); setIndex(value => value + 1); setSelectedObject(null); setAttempts(0); setFeedback(""); setPhase("intro"); }}>{t("runner.ui63")}</button>}{phase === "resolved" && <button type="button" className="primary-button" onClick={() => void next()}>{index === roundLimit - 1 ? t("runner.ui30") : t("runner.ui64")}<ChevronRight size={17}/></button>}</div>}
    <div className="runner-stop-actions"><button type="button" className="small-button" onClick={() => void stop("break")}><Pause size={16}/>  {t("runner.ui32")}</button><button type="button" className="small-button" onClick={() => void stop("refused")}><CircleX size={16}/>  {t("runner.ui33")}</button></div>
  </div></div>;
}
