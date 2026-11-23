import { AbsoluteFill, useCurrentFrame } from "remotion";
import { VoiceLine } from "../components/VoiceLine";
import { Words } from "../components/Type";
import { ease, tw } from "../lib/anim";
import { slice } from "../lib/line";
import { C } from "../theme";
import { S1_LINE, s1Line, s2Line, WORLD } from "./shared";

const HEAD = "Әр баланың өз үні бар.";
const SIZE = 112;
// Reading order is held back for «үні»: the sentence waits for its voice.
const WORD_START = [44, 53, 62, 98, 71];

export const S1Opening = () => {
  const f = useCurrentFrame();
  if (f > 262) return null;
  const draw = tw(f, 8, 50, 0, 1, ease.inOut);
  const pts = f < WORLD.reveal0 ? s1Line(f) : s2Line(f);
  const shown = f < 52 ? slice(pts, 0.5 - draw / 2, 0.5 + draw / 2) : pts;
  const lineColor = f < 214 ? C.navy : "#FFF7EC";
  const lineOpacity = f < 214 ? 1 - tw(f, 200, 214) * 0.0 : tw(f, 214, 222) * (1 - tw(f, 236, 258));
  const push = 1 + tw(f, 60, 160, 0, 0.018, ease.linear);
  // headline returns into the line as the world opens
  const back = (i: number) => tw(f, 150 + i * 3, 172 + i * 3, 0, 1, ease.in);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: `960px ${S1_LINE.y}px` }}>
        <Words
          text={HEAD}
          size={SIZE}
          style={{ top: S1_LINE.y - SIZE * 1.12 - 18 }}
          progress={(i) => tw(f, WORD_START[i], WORD_START[i] + (i === 3 ? 22 : 26), 0, 1, ease.out) * (1 - back(i))}
        />
      </AbsoluteFill>
      {f < 214 ? (
        <VoiceLine pts={shown} color={lineColor} width={2.6} opacity={lineOpacity} />
      ) : (
        <VoiceLine pts={shown} color={lineColor} width={2.2} opacity={lineOpacity} glow="#FFF1DE" />
      )}
    </AbsoluteFill>
  );
};
