"use client";

import { t, useLocale, languageOf, getLocale } from "@/lib/i18n";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Volume2, VolumeX } from "lucide-react";
import { useHomePetIdle } from "./useHomePetIdle";
import { homePetStates } from "@/lib/homePet";
import { usePetDrag } from "./usePetDrag";
import type { Rive } from "@rive-app/webgl2";
import { nextPetPhrase, petReactions, type PetEvent, type PetPreferences } from "@/lib/pet";
import { speakPet, stopPetSpeech } from "@/lib/speech";

type PetReaction = { event: PetEvent; phrase: string; id: number; mood: number; duration: number };
const tapReactions = ["greeting", "correct", "hint", "incorrect", "complete"] as const;
type PetReactionOptions = { phrase?: string; silent?: boolean };
const PetContext = createContext<(event: PetEvent, options?: PetReactionOptions) => void>(() => {});
const PetMessageContext = createContext("");
export const usePetMessage = () => useContext(PetMessageContext) || t("pet.question");
const PetDisplayContext = createContext<ReactNode>(null);
export const useExercisePet = () => useContext(PetContext);
export const ExercisePet = () => useContext(PetDisplayContext);

export function ExercisePetProvider({ preferences, soundEnabled, calmMode, initialEvent = "greeting", presentation = "exercise", onVoiceToggle, children }: { onVoiceToggle?: () => void; presentation?: "exercise" | "home"; preferences: PetPreferences; soundEnabled: boolean; calmMode: boolean; initialEvent?: PetEvent; children: ReactNode }) {
  const locale = useLocale();
  const [reaction, setReaction] = useState<PetReaction | null>(null);
  const lastTap = useRef(0);
  const tapSequence = useRef(0);
  const sequence = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const options = useRef({ preferences, soundEnabled });
  useEffect(() => { options.current = { preferences, soundEnabled }; if (!preferences.visible || !preferences.voice || !soundEnabled) { clearTimeout(speechTimer.current); stopPetSpeech(); } }, [preferences, soundEnabled]);
  const react = useCallback((event: PetEvent, reactionOptions?: PetReactionOptions) => {
    const { preferences, soundEnabled } = options.current;
    if (!preferences.visible) return;
    if (event === "tap" && Date.now() - lastTap.current < 2500) return;
    if (event === "tap") lastTap.current = Date.now();
    clearTimeout(timer.current); clearTimeout(speechTimer.current); stopPetSpeech();
    const spec = petReactions[event === "tap" ? tapReactions[tapSequence.current++ % tapReactions.length] : event];
    const phrase = reactionOptions?.phrase ?? nextPetPhrase(event, languageOf(getLocale()));
    setReaction({ event, phrase, id: ++sequence.current, mood: spec.mood, duration: spec.duration });
    timer.current = setTimeout(() => setReaction(null), spec.duration);
    // Allow the same interaction's exercise narration to claim audio first. Never queue stale speech.
    if (preferences.voice && soundEnabled && !reactionOptions?.silent) {
      if (event === "tap") void speakPet(phrase);
      else speechTimer.current = setTimeout(() => { void speakPet(phrase); }, 200);
    }
  }, []);
  useEffect(() => {
    const reset = setTimeout(() => setReaction(null), 0);
    const start = setTimeout(() => react(initialEvent), 600);
    return () => { clearTimeout(reset); clearTimeout(start); clearTimeout(timer.current); clearTimeout(speechTimer.current); stopPetSpeech(); };
  }, [initialEvent, react, preferences.visible, locale]);
  const display = preferences.visible ? <><PetCompanion showBubble={presentation !== "home"} reaction={reaction} motion={calmMode && preferences.motion !== "off" ? "reduced" : preferences.motion} onTap={() => react("tap")}/>
    {presentation === "home" && onVoiceToggle && <button type="button" className="pet-home-voice" onClick={onVoiceToggle} aria-pressed={preferences.voice && soundEnabled}>
      {preferences.voice && soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
      {t(preferences.voice && soundEnabled ? "pet.muteVoice" : "pet.enableVoice")}
    </button>}</> : null;
  return <PetContext.Provider value={react}><PetDisplayContext.Provider value={display}><PetMessageContext.Provider value={reaction?.phrase || t("pet.question")}>{children}</PetMessageContext.Provider></PetDisplayContext.Provider></PetContext.Provider>;
}

function PetCompanion({ reaction, motion, onTap, showBubble }: { showBubble: boolean; reaction: PetReaction | null; motion: PetPreferences["motion"]; onTap: () => void }) {
  const {container: dragRef, offset, dragging, handlers} = usePetDrag(true, onTap);
  const canvas = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<Rive | null>(null);
  const [ready, setReady] = useState(false);
  const [riveState, setRiveState] = useState("");
  const [failed, setFailed] = useState(false);
  const [systemReduced, setSystemReduced] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    const visibility = () => setPageVisible(!document.hidden);
    update(); visibility(); media.addEventListener("change", update); document.addEventListener("visibilitychange", visibility);
    return () => { media.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  const still = motion === "off";
  const reduced = systemReduced || motion === "reduced";
  const home = !showBubble;
  const machine = home ? "HomeCompanion" : "Companion";
  const homeState = useHomePetIdle(home && ready && !failed && !still && pageVisible && !reaction && !dragging, reduced);
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let instance: Rive | undefined;
    void import("@rive-app/webgl2").then(({ Rive, Layout, Fit, Alignment, RuntimeLoader }) => {
      if (disposed || !canvas.current) return;
      RuntimeLoader.setWasmUrl("/mascot/rive.wasm");
      RuntimeLoader.setWasmFallbackUrl("/mascot/rive_fallback.wasm");
      instance = new Rive({ canvas: canvas.current, src: "/mascot/soyle-mascot.riv?v=home-poses-6", artboard: "Söyle • Full-body pet", stateMachine: "Companion", autoBind: true, autoplay: false, shouldDisableRiveListeners: true, enableRiveAssetCDN: false, layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
        onLoad: () => {
          if (disposed || !instance) return;
          if (!instance.viewModelInstance?.number("mood") || !instance.viewModelInstance?.number("homeState")) { setFailed(true); return; }
          runtime.current = instance; instance.resizeDrawingSurfaceToCanvas(); instance.drawFrame(); setReady(true);
        }, onLoadError: () => { if (!disposed) setFailed(true); },
        // Expose the actual Rive graph state for production rendering checks.
        onStateChange: (event: { data?: unknown }) => { if (!disposed) setRiveState(String(event.data)); },
      });
      observer = new ResizeObserver(() => { instance?.resizeDrawingSurfaceToCanvas(); instance?.drawFrame(); });
      observer.observe(canvas.current);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; observer?.disconnect(); runtime.current = null; instance?.cleanup(); };
  }, []);
  useEffect(() => {
    const rive = runtime.current;
    if (!ready || !rive) return;
    // Reset to a rest pose when motion is explicitly disabled mid-reaction.
    rive.reset({ artboard: "Söyle • Full-body pet", stateMachine: still ? "Still" : machine, autoBind: true, autoplay: false });
    rive.resizeDrawingSurfaceToCanvas();
    rive.drawFrame();
  }, [ready, still, machine]);
  useEffect(() => {
    const rive = runtime.current;
    if (!ready || !rive) return;
    const mood = rive.viewModelInstance?.number(home ? "homeState" : "mood");
    const requestedMood = reaction?.mood || 0;
    // Reduced motion keeps gestures and expressions, replacing only the two jumps.
    const reactionMood = reduced && requestedMood === 2 ? 3 : reduced && requestedMood === 5 ? 1 : requestedMood;
    if (mood) mood.value = still ? 0 : home && !reaction ? homePetStates[homeState].value : reactionMood;
    if (still || !pageVisible || (home && dragging)) { rive.pause(); } else rive.play(machine);
  }, [ready, reaction, still, pageVisible, reduced, home, homeState, machine, dragging]);
  // The exported rest frame also works when WebGL is unavailable or motion is disabled.
  const showStill = still || failed || !ready;
  return <div ref={dragRef} className="exercise-pet" data-draggable={true} data-dragging={dragging} style={{transform:`translate(${offset.x}px, ${offset.y}px)`,position:"relative",zIndex:offset.x || offset.y || dragging ? 20 : undefined}} data-pet-mode={home ? "home" : "exercise"} data-home-pet-state={home && !reaction ? homeState : undefined} data-pet-renderer={showStill ? "static" : "rive"} data-pet-state={reaction?.event || "idle"} data-pet-motion={still ? "off" : reduced ? "reduced" : "full"} data-pet-ready={ready} data-rive-state={riveState}>
    {reaction && <div key={reaction?.id || "idle"} style={reaction ? { animationDelay: `${reaction.duration - 250}ms` } : undefined} className={`pet-bubble visible ${showBubble ? "" : "home-pet-bubble"}`} role="status" aria-live="polite" aria-atomic="true">{reaction?.phrase}</div>}
    <button type="button" className="pet-button" {...handlers} title={t("finish.ui10")} aria-label={t("finish.ui11")} ><canvas ref={canvas} aria-hidden="true" style={{visibility:showStill ? "hidden" : "visible"}}/>{showStill && <Image className="pet-still" src="/mascot/soyle-mascot-still.png" width={561} height={630} unoptimized alt="" aria-hidden="true"/>}</button>
  </div>;
}
