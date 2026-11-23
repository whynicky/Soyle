import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Label, Words } from "../components/Type";
import { Rect, UI, UICrop } from "../components/UICrop";
import { VoiceLine } from "../components/VoiceLine";
import { ease, lerp, tw } from "../lib/anim";
import { C } from "../theme";
import { s5Line, SPINE_X } from "./shared";

const WIN = { x: 140, y: 300, w: 960 };
const WK = WIN.w / UI.overview.w;
const SHADOW = "0 50px 90px -40px rgba(32,36,58,.30), 0 2px 8px rgba(32,36,58,.05)";

// Authentic demo content from the Söyle parent cabinet (website demo, «Демонстрациялық деректер»).
const ADVICE: Rect = { x: 1322, y: 268, w: 470, h: 205 };   // «Маман кеңесі»
const NOTE: Rect = { x: 425, y: 742, w: 650, h: 140 };      // «Түскі ас кезіндегі өтініш» + parent's note

type Lift = { r: Rect; to: { x: number; y: number; w: number }; at: number; label: string; labelY: number; nodeY: number };
const LIFTS: Lift[] = [
  { r: ADVICE, to: { x: 1236, y: 352, w: 520 }, at: 850, label: "Маманға", labelY: 296, nodeY: 316 },
  { r: NOTE, to: { x: 1236, y: 690, w: 620 }, at: 892, label: "Ата-анаға", labelY: 634, nodeY: 654 },
];

export const S5Support = () => {
  const f = useCurrentFrame();
  if (f < 790 || f > 1030) return null;
  const out = tw(f, 982, 1000, 0, 1, ease.soft);
  const winIn = tw(f, 812, 846);
  const drift = tw(f, 840, 1000, 0, 1, ease.linear);
  const lineOpacity = 1 - tw(f, 990, 1006);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${out * 60}px)` }}>
        <Words text="Әр қадамда қолдау." size={84} align="left" width={1100} tracking={-0.04} style={{ left: WIN.x, top: 132 }}
          progress={(i) => tw(f, 820 + i * 7, 848 + i * 7)} />
        <div style={{
          position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: UI.overview.h * WK, borderRadius: 22, overflow: "hidden",
          boxShadow: SHADOW, opacity: winIn, transform: `translateY(${(1 - winIn) * 60}px) scale(${1 + drift * 0.015})`, transformOrigin: "50% 100%",
        }}>
          <UICrop shot={UI.overview} width={WIN.w} />
        </div>
        {LIFTS.map((l) => {
          const p = tw(f, l.at, l.at + 38, 0, 1, ease.inOut);
          if (p <= 0) return null;
          const fromX = WIN.x + l.r.x * WK, fromY = WIN.y + l.r.y * WK, fromW = l.r.w * WK;
          const w = lerp(fromW, l.to.w, p);
          const pad = 26 * p;
          const labelIn = tw(f, l.at + 24, l.at + 44);
          return (
            <div key={l.label}>
              <div style={{
                position: "absolute", left: lerp(fromX, l.to.x, p) - pad, top: lerp(fromY, l.to.y, p) - pad,
                padding: pad, borderRadius: 22, background: `rgba(246,246,245,${p})`,
                boxShadow: `0 ${40 * p}px ${80 * p}px -36px rgba(32,36,58,${0.32 * p})`,
              }}>
                <UICrop shot={UI.overview} r={l.r} width={w} style={{ position: "relative" }} />
              </div>
              <Label size={30} color={C.navySoft} style={{ left: l.to.x - 26, top: l.labelY, opacity: labelIn, transform: `translateY(${(1 - labelIn) * 12}px)` }}>{l.label}</Label>
              <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
                <circle cx={SPINE_X} cy={l.nodeY} r={7 * labelIn} fill={C.cream} stroke={C.navy} strokeWidth={2.4} />
              </svg>
            </div>
          );
        })}
      </AbsoluteFill>
      <VoiceLine pts={s5Line(f)} width={2.4} opacity={lineOpacity} />
    </AbsoluteFill>
  );
};
