import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Landscape } from "../components/Landscape";
import { ease, tw } from "../lib/anim";
import { fgCam, s2Line, worldCam, WORLD } from "./shared";

/** The Söyle landscape for scenes 2–3: revealed beneath the voice line, then entered. */
export const World = () => {
  const f = useCurrentFrame();
  if (f < WORLD.reveal0 - 2 || f > 492) return null;
  const sky = tw(f, 188, 250, 0, 1, ease.soft);
  const revealing = f < 258;
  const blur = tw(f, 450, 486, 0, 10, ease.in);
  const out = 1 - tw(f, 478, 490);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Landscape
        cam={worldCam(f)}
        fgCam={fgCam(f)}
        fgOpacity={f < 300 ? tw(f, 176, 212) : 0}
        revealBelow={revealing ? s2Line(f) : undefined}
        skyOpacity={sky}
        belowOpacity={tw(f, 168, 214, 0, 1, ease.soft)}
        blur={blur}
      />
    </AbsoluteFill>
  );
};
