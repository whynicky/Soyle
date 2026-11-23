import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Logo, LOCKUP } from "../components/Logo";
import { UI, UICrop } from "../components/UICrop";
import { ease, lerp, tw } from "../lib/anim";
import { C } from "../theme";
import { fgCam, worldCam } from "./shared";

// Window in the valley (like the hero window on the Söyle website).
const WIN = { x: 320, y: 296, w: 1280, h: 800, r: 30 };
const SHOT_K = WIN.w / UI.child.w; // 0.4
// Logo position inside the child home screenshot (px in the 3200×2000 capture)
const SHOT_LOGO = { x: 60, y: 60, h: 87 };
const BIG_LOGO_H = 112;

/** Rounded-rect outline as two halves drawn from the top centre (the line lifts out of the horizon). */
function halfPath(side: -1 | 1, x: number, y: number, w: number, h: number, r: number) {
  const cx = x + w / 2;
  const ex = side < 0 ? x : x + w;
  const sweep = side < 0 ? 0 : 1;
  const cornerX = ex - side * r;
  return `M ${cx} ${y} L ${cornerX} ${y} A ${r} ${r} 0 0 ${sweep} ${ex} ${y + r} L ${ex} ${y + h}`;
}

export const S3Product = () => {
  const f = useCurrentFrame();
  if (f < 300 || f > 486) return null;

  // camera push into the window (matches the world push)
  const push = tw(f, 446, 486, 0, 1, ease.in);
  const cam = worldCam(f);
  const winRise = tw(f, 362, 404, 34, 0, ease.out);
  const wx = lerp(WIN.x, 0, push), wy = lerp(WIN.y + winRise, 0, push);
  const ww = lerp(WIN.w, 1920, push), wh = lerp(WIN.h, 1200, push);
  const wr = lerp(WIN.r, 0, push);
  const k = ww / UI.child.w;

  // outline: stem rises from the crest, then splits around the window
  const crestY = cam.oy + 317 * 2 * cam.s;
  const stem = tw(f, 326, 342, 0, 1, ease.inOut);
  const outline = tw(f, 338, 384, 0, 1, ease.inOut);
  const outlineFade = 1 - tw(f, 392, 412);
  const fill = tw(f, 364, 402, 0, 1, ease.soft);
  const halfLen = WIN.w / 2 - WIN.r + (Math.PI * WIN.r) / 2 + WIN.h;

  // the big logo in the sky, then its flight into the product
  const logoIn = tw(f, 322, 356, 0, 1, ease.out);
  const fly = tw(f, 404, 440, 0, 1, ease.inOut);
  const bigW = (LOCKUP.width / LOCKUP.height) * BIG_LOGO_H;
  const targetH = SHOT_LOGO.h * (WIN.w / UI.child.w);
  const lx = lerp(960 - bigW / 2, WIN.x + SHOT_LOGO.x * SHOT_K, fly);
  const ly = lerp(118, WIN.y + SHOT_LOGO.y * SHOT_K, fly);
  const lh = lerp(BIG_LOGO_H, targetH, fly);
  const logoColor = fly < 0.5 ? C.navy : "#161616";
  const landed = f >= 440;

  return (
    <AbsoluteFill>
      {/* stem + outline */}
      {outlineFade > 0 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: outlineFade }}>
          <line x1={960} y1={crestY} x2={960} y2={lerp(crestY, WIN.y + winRise, stem)} stroke="#FFF7EC" strokeWidth={2.4} strokeLinecap="round" opacity={stem > 0 ? 1 - tw(f, 338, 350) : 0} />
          {([-1, 1] as const).map((s) => (
            <path key={s} d={halfPath(s, WIN.x, WIN.y + winRise, WIN.w, WIN.h, WIN.r)} fill="none" stroke="#FFF7EC" strokeWidth={2.4} strokeLinecap="round"
              strokeDasharray={halfLen} strokeDashoffset={halfLen * (1 - outline)} />
          ))}
        </svg>
      )}

      {/* the window */}
      {fill > 0 && (
        <div style={{
          position: "absolute", left: wx, top: wy, width: ww, height: wh, borderRadius: wr, overflow: "hidden",
          background: C.paper, opacity: fill,
          boxShadow: `0 ${60 * (1 - push)}px ${120 * (1 - push)}px -40px rgba(32,36,58,.38), 0 0 0 1px rgba(255,255,255,${0.6 * (1 - push)})`,
        }}>
          <UICrop shot={UI.child} width={ww} style={{ left: 0, top: 0 }} imgOpacity={tw(f, 372, 410)} />
          {/* hold the product's own logo spot until the flying logo lands */}
          {!landed && <div style={{ position: "absolute", left: (SHOT_LOGO.x - 6) * k, top: (SHOT_LOGO.y - 6) * k, width: 320 * k, height: 100 * k, background: "#FCF3EA" }} />}
        </div>
      )}

      {/* foreground grass stays in front of the window, as on the website */}
      {f < 488 && (() => { const c = fgCam(f); return (
        <Img src={staticFile("scenery/foreground-day-3840.webp")} style={{ position: "absolute", left: c.ox, top: c.oy, width: 1920 * c.s, height: 1280 * c.s, maxWidth: "none", opacity: 1 - tw(f, 476, 488), filter: push > 0 ? `blur(${(push * 6).toFixed(2)}px)` : undefined }} />
      ); })()}

      {/* Söyle */}
      {!landed && logoIn > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, clipPath: fly > 0 ? undefined : `inset(0 0 ${1080 - (118 + BIG_LOGO_H + 8)}px 0)` }}>
            <Logo x={lx} y={ly + (1 - logoIn) * BIG_LOGO_H * 0.9} h={lh} color={logoColor} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
