import { getLength, getPointAtLength } from "@remotion/paths";

export type Pt = [number, number];
export const N = 220; // every state of the voice line is sampled with the same number of points

/** Smooth path through points (Catmull–Rom converted to cubic Béziers). */
export function smoothPath(pts: Pt[], closed = false): string {
  if (pts.length < 2) return "";
  const p = pts;
  let d = `M ${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
  const n = p.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = p[i - 1] ?? (closed ? p[n - 1] : p[i]);
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? (closed ? p[0] : p2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return closed ? d + " Z" : d;
}

/** Evenly sample a path string into n points. */
export function samplePath(d: string, n = N): Pt[] {
  const len = getLength(d);
  return Array.from({ length: n }, (_, i) => {
    const pt = getPointAtLength(d, (len * i) / (n - 1));
    return [pt?.x ?? 0, pt?.y ?? 0] as Pt;
  });
}

export const mixPts = (a: Pt[], b: Pt[], t: number): Pt[] => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);

/** A horizontal line from x0 to x1 at y, with a voice-like wave applied by fn(xNorm) => dy. */
export function flatLine(x0: number, x1: number, y: number, wave: (u: number) => number = () => 0, n = N): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    return [x0 + (x1 - x0) * u, y + wave(u)] as Pt;
  });
}

/** Partial polyline (for drawing on) from u0..u1 of the points. */
export function slice(pts: Pt[], u0: number, u1: number): Pt[] {
  const n = pts.length;
  const a = Math.max(0, Math.floor(u0 * (n - 1)));
  const b = Math.min(n - 1, Math.ceil(u1 * (n - 1)));
  return pts.slice(a, b + 1);
}
