import { Easing, interpolate } from "remotion";

// --sl-ease from the Söyle website: cubic-bezier(.22, 1, .36, 1)
export const ease = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.33, 0, 0.2, 1),
  linear: (t: number) => t,
};

/** Clamped tween between frames a and b. */
export const tw = (f: number, a: number, b: number, from = 0, to = 1, e: (t: number) => number = ease.out) =>
  interpolate(f, [a, b], [from, to], { easing: e, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
