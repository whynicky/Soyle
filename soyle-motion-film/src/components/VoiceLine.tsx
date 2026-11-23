import { Pt, smoothPath } from "../lib/line";

type Props = {
  pts: Pt[];
  color?: string;
  width?: number;
  opacity?: number;
  closed?: boolean;
  glow?: string;
};

/** The voice line — one continuous stroke that carries the film from scene to scene. */
export const VoiceLine = ({ pts, color = "#20243A", width = 2.5, opacity = 1, closed = false, glow }: Props) => {
  if (pts.length < 2 || opacity <= 0) return null;
  const d = smoothPath(pts, closed);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible", opacity }}>
      {glow && <path d={d} fill="none" stroke={glow} strokeWidth={width * 5} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} />}
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
