import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ObjectCard } from "../components/ObjectCard";
import { Words } from "../components/Type";
import { UI, UICrop } from "../components/UICrop";
import { VoiceLine } from "../components/VoiceLine";
import { ease, lerp, tw } from "../lib/anim";
import { slice } from "../lib/line";
import { B } from "../timing";
import { C, FONT } from "../theme";
import { BOARD, s4Line } from "./shared";

const PANEL_SHADOW = "0 50px 90px -40px rgba(32,36,58,.30), 0 2px 8px rgba(32,36,58,.05)";

/** Caption in the left column: words rise in, then sink back. */
const Caption = ({ f, text, at, out, top = 380 }: { f: number; text: string; at: number; out: number; top?: number }) => (
  <Words
    text={text}
    size={88}
    align="left"
    width={620}
    tracking={-0.04}
    style={{ left: 140, top, rowGap: 0 }}
    progress={(i) => tw(f, at + i * 6, at + 26 + i * 6) * (1 - tw(f, out + i * 3, out + 16 + i * 3, 0, 1, ease.in))}
  />
);

// ---- Beat A: «Жаңа сөздер.» — listen and choose (authentic demo lesson) ----
const LESSON = { x: 420, y: 190, w: 1400, h: 830 };
const BeatWords = ({ f }: { f: number }) => {
  if (f < 494 || f > 566) return null;
  const k = 1000 / LESSON.w;
  const enter = tw(f, 498, 532);
  const exit = tw(f, 548, 566, 0, 1, ease.in);
  const answered = tw(f, 532, 538);
  const press = f < 530 ? 1 : f < 534 ? lerp(1, 0.962, tw(f, 530, 534)) : lerp(0.962, 1, tw(f, 534, 546));
  const apple = { x: 902 - LESSON.x, y: 437 - LESSON.y, w: 434, h: 406 };
  return (
    <AbsoluteFill>
      <Caption f={f} text="Жаңа сөздер." at={502} out={548} />
      <div style={{
        position: "absolute", left: 780, top: 214, width: 1000, height: LESSON.h * k, borderRadius: 26, overflow: "hidden", background: C.paper,
        boxShadow: PANEL_SHADOW, opacity: enter * (1 - exit),
        transform: `translate(${-exit * 60}px, ${(1 - enter) * 50}px) scale(${0.965 + enter * 0.035})`,
      }}>
        <UICrop shot={UI.lesson0} r={LESSON} width={1000} />
        <UICrop shot={UI.lesson1} r={LESSON} width={1000} style={{ opacity: answered }} />
        <div style={{ position: "absolute", left: apple.x * k, top: apple.y * k, transform: `scale(${press})`, transformOrigin: "center" }}>
          <UICrop shot={answered > 0.5 ? UI.lesson1 : UI.lesson0} r={{ x: 902, y: 437, w: 434, h: 406 }} width={434 * k} radius={14} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- Beat B: «Қызықты тапсырмалар.» — the weekly plan (authentic demo plan) ----
const PLAN_ROWS = [
  { r: { x: 440, y: 316, w: 580, h: 156 }, top: 132, at: 568 },
  { r: { x: 440, y: 498, w: 580, h: 110 }, top: 290, at: 576 },
  { r: { x: 440, y: 622, w: 580, h: 160 }, top: 400, at: 584 },
];
const BeatTasks = ({ f }: { f: number }) => {
  if (f < 554 || f > 636) return null;
  const enter = tw(f, 558, 584);
  const exit = tw(f, 616, 634, 0, 1, ease.in);
  const k = 0.9;
  const detail = tw(f, 590, 614);
  return (
    <AbsoluteFill>
      <Caption f={f} text="Қызықты тапсырмалар." at={566} out={616} top={330} />
      <div style={{
        position: "absolute", left: 780, top: 214, width: 1000, height: 594, borderRadius: 26, overflow: "hidden", background: "linear-gradient(#F7F7F6, #F5F5F4 60%, #F4F4F4)",
        boxShadow: PANEL_SHADOW, opacity: enter * (1 - exit), transform: `translate(${-exit * 60}px, ${(1 - enter) * 50}px)`,
      }}>
        <UICrop shot={UI.plan} r={{ x: 425, y: 140, w: 520, h: 100 }} width={520 * k} style={{ left: 38, top: 30, opacity: tw(f, 562, 580) }} />
        {PLAN_ROWS.map((row, i) => {
          const p = tw(f, row.at, row.at + 22);
          return <UICrop key={i} shot={UI.plan} r={row.r} width={row.r.w * k} style={{ left: 38, top: row.top + (1 - p) * 36, opacity: p }} />;
        })}
        <UICrop shot={UI.plan} r={{ x: 1060, y: 256, w: 746, h: 600 }} width={404}
          style={{ left: 572 + (1 - detail) * 40, top: 132, opacity: detail }} />
      </div>
    </AbsoluteFill>
  );
};

// ---- Beat C: «Ойын арқылы үйрену.» — storybook illustrations as pure image ----
const STORY = [
  { src: "story/request.webp", x: 780, pos: [58, 64], at: 630 },
  { src: "story/help.webp", x: 1120, pos: [60, 52], at: 638 },
  { src: "story/received.webp", x: 1460, pos: [42, 34], at: 646 },
];
const BeatPlay = ({ f }: { f: number }) => {
  if (f < 624 || f > 700) return null;
  const exit = tw(f, 672, 692, 0, 1, ease.in);
  return (
    <AbsoluteFill>
      <Caption f={f} text="Ойын арқылы үйрену." at={636} out={672} top={330} />
      {STORY.map((s, i) => {
        const p = tw(f, s.at, s.at + 26, 0, 1, ease.inOut);
        const pan = tw(f, s.at, 700, 0, 1, ease.linear);
        return (
          <div key={i} style={{
            position: "absolute", left: s.x, top: 214, width: 320, height: 594, borderRadius: 26, overflow: "hidden",
            clipPath: `inset(${(1 - p) * 100}% 0 0 0 round 26px)`, boxShadow: PANEL_SHADOW,
            opacity: 1 - exit, transform: `translateY(${-exit * 50 - i * exit * 14}px)`,
          }}>
            <Img src={staticFile(s.src)} style={{
              width: "100%", height: "100%", objectFit: "cover",
              objectPosition: `${lerp(s.pos[0], s.pos[1], pan)}% 50%`, transform: `scale(${1.14 - pan * 0.08})`,
            }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---- Beat D: the communication board says «Алма жегім келеді.» ----
const CARD = 300;
const CARDS = [
  { obj: "water", label: "Су", x: 474 },
  { obj: "apple", label: "Алма", x: 810 },
  { obj: "play", label: "Ойнау", x: 1146 },
] as const;
const CARD_TOP = 344;
const PHRASE = { x: BOARD.x0, top: 742, size: 76 };

const BeatVoice = ({ f }: { f: number }) => {
  if (f < 684 || f > 816) return null;
  const out = tw(f, 796, 810, 0, 1, ease.in);
  const press = f < 722 ? 1 : f < 728 ? lerp(1, 0.955, tw(f, 722, 728)) : lerp(0.955, 1, tw(f, 728, 742, 0, 1, ease.out));
  const sel = tw(f, 726, 734);
  const check = tw(f, 730, 744, 0, 1, ease.inOut);
  const dim = tw(f, 730, 748);

  // «Алма» lifts out of its card and becomes the first word of the phrase
  const fly = tw(f, 738, 760, 0, 1, ease.inOut);
  const fromX = 810 + CARD / 2 - 41, fromY = CARD_TOP + 232, fromS = 34;
  const ax = lerp(fromX, PHRASE.x, fly);
  const ay = lerp(fromY, PHRASE.top, fly) - Math.sin(fly * Math.PI) * 70;
  const as = lerp(fromS, PHRASE.size, fly);
  const btnIn = tw(f, 764, 778);
  const btnPress = f < 774 ? 1 : f < 778 ? lerp(1, 0.94, tw(f, 774, 778)) : lerp(0.94, 1, tw(f, 778, 790));
  const rest = (i: number) => tw(f, 752 + i * 8, 772 + i * 8);
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${-out * 40}px)` }}>
      <div style={{ position: "absolute", left: BOARD.x0, top: 254, fontFamily: FONT, fontSize: 44, letterSpacing: "-0.03em", color: C.uiInk, opacity: tw(f, 690, 712), transform: `translateY(${(1 - tw(f, 690, 712)) * 20}px)` }}>
        Қарым-қатынас карточкалары
      </div>
      {CARDS.map((c, i) => {
        const p = tw(f, 694 + i * 6, 722 + i * 6);
        const isApple = c.obj === "apple";
        return (
          <ObjectCard key={c.obj} obj={c.obj} label={c.label} size={CARD}
            selected={isApple ? sel : 0} labelOpacity={isApple && fly > 0 ? 0 : 1} check={isApple ? check : 0} dim={isApple ? 0 : dim}
            style={{
              left: c.x, top: CARD_TOP + (1 - p) * 70, opacity: p * (isApple ? 1 : 1 - dim * 0.5),
              transform: `scale(${(0.94 + 0.06 * p) * (isApple ? press : 1 - dim * 0.03)})`,
            }} />
        );
      })}
      {/* the phrase */}
      <div style={{ position: "absolute", left: PHRASE.x, top: PHRASE.top, display: "flex", columnGap: PHRASE.size * 0.26, fontFamily: FONT, fontWeight: 600, fontSize: PHRASE.size, letterSpacing: "-0.03em", lineHeight: 1.12, color: C.uiInk }}>
        <span style={{ opacity: 0 }}>Алма</span>
        {["жегім", "келеді."].map((w, i) => (
          <span key={w} style={{ display: "inline-block", overflow: "hidden" }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - rest(i)) * PHRASE.size}px)` }}>{w}</span>
          </span>
        ))}
      </div>
      {fly > 0 && (
        <div style={{ position: "absolute", left: ax, top: ay, fontFamily: FONT, fontWeight: 600, fontSize: as, letterSpacing: `${lerp(-0.01, -0.03, fly)}em`, lineHeight: 1.12, color: C.uiInk }}>Алма</div>
      )}
      {/* «Дыбыстау» — the board's speak button */}
      <div style={{
        position: "absolute", left: BOARD.x1 - 252, top: PHRASE.top + 6, width: 252, height: 76, borderRadius: 20, background: C.cta, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: FONT, fontWeight: 600, fontSize: 28,
        opacity: btnIn, transform: `translateY(${(1 - btnIn) * 16}px) scale(${btnPress})`,
      }}>
        <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" />
          <path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.4 18.4a9 9 0 0 0 0-12.8" />
        </svg>
        Дыбыстау
      </div>
    </AbsoluteFill>
  );
};

export const S4Learning = () => {
  const f = useCurrentFrame();
  if (f < B.words.start || f > 820) return null;
  // camera continues from the window: dive into the «Жаттығулар» card of the child home
  const dive = tw(f, 484, 512, 0, 1, ease.in);
  const homeOpacity = 1 - tw(f, 494, 512);
  const draw = tw(f, 500, 534, 0, 1, ease.inOut);
  const pts = s4Line(f);
  const shown = f < 534 ? slice(pts, 0, draw) : pts;
  const speaking = f >= 776;
  return (
    <AbsoluteFill>
      {homeOpacity > 0 && (
        <AbsoluteFill style={{ transform: `scale(${1 + dive * 1.6})`, transformOrigin: "626px 1020px", opacity: homeOpacity, filter: `blur(${(dive * 4).toFixed(2)}px)` }}>
          <UICrop shot={UI.child} width={1920} style={{ left: 0, top: 0 }} />
        </AbsoluteFill>
      )}
      <BeatWords f={f} />
      <BeatTasks f={f} />
      <BeatPlay f={f} />
      <BeatVoice f={f} />
      {f < 790 && speaking && <VoiceLine pts={s4Line(f, 1.9, 0.7)} width={2} color={C.lavenderDeep} opacity={0.85} />}
      {f < 790 && draw > 0 && (
        <VoiceLine pts={shown} width={2.4} glow={speaking ? C.lavender : undefined} />
      )}
    </AbsoluteFill>
  );
};
