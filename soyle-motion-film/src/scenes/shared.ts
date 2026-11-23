import { BASE_CAM, Cam, crestPts } from "../components/Landscape";
import { ease, tw } from "../lib/anim";
import { flatLine, mixPts, Pt, samplePath } from "../lib/line";

// ---------- Scene 1 voice line ----------
export const S1_LINE = { x0: 360, x1: 1560, y: 640 };
export const UNI_U = 0.738; // position of the word «үні» along the line (0..1)

/** The opening line: a traveling breath, and a lift under «үні». */
export function s1Wave(f: number) {
  const travel = tw(f, 28, 96, -0.15, 1.15, ease.soft);
  const breath = tw(f, 28, 40) * (1 - tw(f, 88, 104));
  const lift = tw(f, 96, 108, 0, 1, ease.out) * (1 - tw(f, 112, 150, 0, 1, ease.inOut));
  return (u: number) => {
    const pulse = Math.exp(-(((u - travel) / 0.07) ** 2)) * Math.sin(u * 70 - f * 0.55) * 7 * breath;
    const bump = -Math.exp(-(((u - UNI_U) / 0.045) ** 2)) * 13 * lift * (0.65 + 0.35 * Math.sin(f * 0.5));
    return pulse + bump;
  };
}
export const s1Line = (f: number): Pt[] => flatLine(S1_LINE.x0, S1_LINE.x1, S1_LINE.y, s1Wave(f));

// ---------- World camera (scenes 2–3) ----------
export const WORLD = { reveal0: 160, reveal1: 238 };

export function worldCam(f: number): Cam {
  const drop = tw(f, 156, 246, 300, 0, ease.inOut);       // the world rises into frame
  const drift = tw(f, 230, 470, 0, 1, ease.linear);       // slow push
  const push = tw(f, 446, 486, 0, 1, ease.in);            // camera enters the window
  const s = 1 + drift * 0.035 + push * 0.55;
  return { s, ox: -(1920 * (s - 1)) / 2, oy: BASE_CAM.oy + drop - (1280 * (s - 1)) * 0.42 };
}
export function fgCam(f: number): Cam {
  const rise = tw(f, 176, 270, 560, 0, ease.out);
  const drift = tw(f, 230, 470, 0, 1, ease.linear);
  const push = tw(f, 440, 484, 0, 1, ease.in);
  const s = 1 + drift * 0.07 + push * 1.1;
  return { s, ox: -(1920 * (s - 1)) / 2, oy: BASE_CAM.oy + rise - (1280 * (s - 1)) * 0.25 + push * 420 };
}

/** Line morphing from the opening baseline into the crest of the hills. */
export function s2Line(f: number): Pt[] {
  // 1) the baseline widens into a horizon, 2) it settles onto the crest of the hills
  const widen = tw(f, 148, 178, 0, 1, ease.inOut);
  const calm = 1 - tw(f, 148, 172);
  const w = s1Wave(Math.min(f, 150));
  const base = flatLine(
    S1_LINE.x0 + (-60 - S1_LINE.x0) * widen,
    S1_LINE.x1 + (1980 - S1_LINE.x1) * widen,
    S1_LINE.y,
    (u) => w(u) * calm,
  );
  const m = tw(f, WORLD.reveal0 + 8, WORLD.reveal1, 0, 1, ease.inOut);
  return mixPts(base, crestPts(worldCam(f)), m);
}

// ---------- Scene 4–5 voice line ----------
export const BOARD = { x0: 474, x1: 1446, divider: 712 };
export const GROUND = { x0: 140, x1: 1780, y: 900 };

/** The ground line under the learning beats, with a playhead that walks from beat to beat. */
function groundWave(f: number) {
  const head = 0.08 + tw(f, 548, 566, 0, 0.34, ease.inOut) + tw(f, 618, 636, 0, 0.34, ease.inOut);
  return (u: number) => Math.exp(-(((u - head) / 0.035) ** 2)) * Math.sin(u * 120 - f * 0.6) * 5;
}

/** The divider of the communication board: still, then the phrase is spoken. */
export function speakWave(f: number, phase = 0, gain = 1) {
  const t = f - 776;
  if (t <= 0) return () => 0;
  const amp = 30 * gain * tw(t, 0, 6) * Math.exp(-Math.max(0, t - 10) / 20);
  const c = 1.1 - t / 18;
  return (u: number) => {
    const env = Math.exp(-(((u - c) / 0.22) ** 2)) + 0.45 * Math.exp(-t / 16);
    return Math.sin(u * 46 - f * 0.95 + phase) * amp * env * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
  };
}

export function s4Line(f: number, phase = 0, gain = 1): Pt[] {
  const ground = flatLine(GROUND.x0, GROUND.x1, GROUND.y, groundWave(f));
  const m = tw(f, 690, 718, 0, 1, ease.inOut);
  if (m <= 0) return ground;
  const board = flatLine(BOARD.x0, BOARD.x1, BOARD.divider, speakWave(f, phase, gain));
  return mixPts(ground, board, m);
}

// ---------- Scene 5: the line becomes the spine that links family and specialist ----------
export const SPINE_X = 1180;
export const SPINE_D = `M 140 944 L 1010 944 C 1130 944 ${SPINE_X} 904 ${SPINE_X} 820 L ${SPINE_X} 300`;
let spineCache: Pt[] | null = null;
export const spinePts = () => (spineCache ??= samplePath(SPINE_D));

export function s5Line(f: number): Pt[] {
  const board = flatLine(BOARD.x0, BOARD.x1, BOARD.divider, speakWave(f));
  const m = tw(f, 800, 850, 0, 1, ease.inOut);
  return mixPts(board, spinePts(), m);
}

// ---------- Scene 6: back to the hills, then the line becomes the S ----------
export function cam6(f: number): Cam {
  const tilt = tw(f, 1028, 1090, 0, 1, ease.inOut);
  return { s: 1.02, ox: -19, oy: BASE_CAM.oy - 26 + tilt * 760 };
}
export const LOGO6 = { h: 128, y: 352 };
