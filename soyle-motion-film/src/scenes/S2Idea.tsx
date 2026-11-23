import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ObjectCard } from "../components/ObjectCard";
import { Words } from "../components/Type";
import { ease, tw } from "../lib/anim";
import { C } from "../theme";
import { worldCam } from "./shared";

const L1 = "Сөз әрқашан дауыстан басталмайды.";
const L2 = "Кейде — бір суреттен.";

// «Sometimes — from one picture»: a single card, the same «Алма» that will speak in scene 4.
const CARD = { obj: "apple", label: "Алма", x: 960, y: 590, size: 236, at: 266 } as const;

export const S2Idea = () => {
  const f = useCurrentFrame();
  if (f < 200 || f > 345) return null;
  const exit = tw(f, 294, 318, 0, 1, ease.in);
  const cam = worldCam(f);
  const camLift = cam.oy + 200; // cards ride with the hills
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - exit, transform: `translateY(${-exit * 40}px)` }}>
        <Words text={L1} size={70} tracking={-0.03} style={{ top: 132 }} progress={(i) => tw(f, 216 + i * 5, 244 + i * 5)} />
        <Words text={L2} size={70} tracking={-0.03} color={C.navySoft} style={{ top: 218 }} progress={(i) => tw(f, 246 + i * 6, 272 + i * 6)} />
      </AbsoluteFill>
      {(() => {
        const c = CARD;
        const p = tw(f, c.at, c.at + 30, 0, 1, ease.out);
        const sink = tw(f, 298, 330, 0, 1, ease.in);
        const float = Math.sin((f - c.at) / 22) * 5;
        return (
          <ObjectCard
            obj={c.obj}
            label={c.label}
            size={c.size}
            style={{
              left: c.x - c.size / 2,
              top: c.y - c.size / 2 + camLift + (1 - p) * 60 + sink * 120 + float,
              opacity: p * (1 - sink),
              transform: `scale(${(0.92 + p * 0.08) * (1 - sink * 0.2)})`,
            }}
          />
        );
      })()}
    </AbsoluteFill>
  );
};
