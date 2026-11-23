import art from "../brand/soyle-artwork.json";
import { samplePath, Pt } from "../lib/line";

export const MARK_D = art.mark.path;
export const WORD_D = art.word.path;
export const LOCKUP = art.full; // 573 × 166
const MARK_SCALE = 0.269;

/** Points along the S mark's outline, placed for a lockup of height h whose top-left is (x, y). */
export function markOutline(x: number, y: number, h: number, n: number): Pt[] {
  const k = (h / LOCKUP.height) * MARK_SCALE;
  return samplePath(MARK_D, n).map(([px, py]) => [x + px * k, y + py * k] as Pt);
}

type Props = {
  x: number;
  y: number;
  h: number;
  color: string;
  markFill?: number;   // 0..1 fill opacity of the S
  wordReveal?: number; // 0..1 left-to-right reveal of the word
  opacity?: number;
};

/** The original Söyle lockup (paths from the project's brand artwork). */
export const Logo = ({ x, y, h, color, markFill = 1, wordReveal = 1, opacity = 1 }: Props) => {
  const k = h / LOCKUP.height;
  const w = LOCKUP.width * k;
  const wordX = 169, wordW = art.word.width;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${LOCKUP.width} ${LOCKUP.height}`} style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity }}>
      <defs>
        <clipPath id={`word-reveal-${Math.round(x)}-${Math.round(y)}`}>
          <rect x={wordX - 20} y={-20} width={(wordW + 40) * wordReveal} height={LOCKUP.height + 40} />
        </clipPath>
      </defs>
      <path d={MARK_D} transform={LOCKUP.markTransform} fill={color} fillRule="evenodd" opacity={markFill} />
      <g clipPath={`url(#word-reveal-${Math.round(x)}-${Math.round(y)})`}>
        <path d={WORD_D} transform={LOCKUP.wordTransform} fill={color} fillRule="evenodd" />
      </g>
    </svg>
  );
};
