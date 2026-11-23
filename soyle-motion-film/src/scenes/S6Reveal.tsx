import { AbsoluteFill, useCurrentFrame } from "remotion";
import { crestPts, Landscape } from "../components/Landscape";
import { Logo, LOCKUP, markOutline } from "../components/Logo";
import { Words } from "../components/Type";
import { VoiceLine } from "../components/VoiceLine";
import { ease, tw } from "../lib/anim";
import { flatLine, mixPts, N } from "../lib/line";
import { C } from "../theme";
import { cam6, LOGO6, s5Line } from "./shared";

const LOGO_W = (LOCKUP.width / LOCKUP.height) * LOGO6.h;
const LOGO_X = 960 - LOGO_W / 2;
const S_OUTLINE = markOutline(LOGO_X, LOGO6.y, LOGO6.h, N);

export const S6Reveal = () => {
  const f = useCurrentFrame();
  if (f < 990) return null;
  const cam = cam6(f);
  const land = tw(f, 1000, 1032, 0, 1, ease.soft) * (1 - tw(f, 1046, 1086, 0, 1, ease.inOut));

  // the line: spine → crest of the hills → a calm centre line → the S of Söyle
  const toCrest = tw(f, 1000, 1036, 0, 1, ease.inOut);
  const toCalm = tw(f, 1040, 1074, 0, 1, ease.inOut);
  const toS = tw(f, 1070, 1106, 0, 1, ease.inOut);
  let pts = mixPts(s5Line(Math.min(f, 1000)), crestPts(cam), toCrest);
  pts = mixPts(pts, flatLine(700, 1220, 430), toCalm);
  pts = mixPts(pts, S_OUTLINE, toS);
  const fill = tw(f, 1100, 1118, 0, 1, ease.soft);
  const strokeOut = 1 - tw(f, 1112, 1126);
  const word = tw(f, 1106, 1134, 0, 1, ease.inOut);
  const settle = tw(f, 1120, 1320, 0, 1, ease.linear);

  return (
    <AbsoluteFill>
      {land > 0 && <Landscape cam={cam} fgCam={{ ...cam, oy: cam.oy + tw(f, 1028, 1090, 0, 260, ease.inOut) }} opacity={land} />}
      <VoiceLine pts={pts} width={2.4} color="#FFF7EC" opacity={land * strokeOut} glow="#FFF1DE" closed={false} />
      <VoiceLine pts={pts} width={2.4} color={C.navy} opacity={(1 - land) * strokeOut} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + settle * 0.012})`, transformOrigin: "960px 540px" }}>
        {fill > 0 && <Logo x={LOGO_X} y={LOGO6.y} h={LOGO6.h} color={C.navy} markFill={fill} wordReveal={word} />}
        <Words text="Әр баланың өз үні бар." size={76} tracking={-0.035} style={{ top: 566 }} progress={(i) => tw(f, 1122 + i * 5, 1150 + i * 5)} />
        <Words text="Сұрау. Таңдау. Өз ойыңды жеткізу." size={34} tracking={-0.015} color={C.navySoft} style={{ top: 676 }} progress={(i) => tw(f, 1142 + i * 5, 1166 + i * 5)} />
      </div>
    </AbsoluteFill>
  );
};
