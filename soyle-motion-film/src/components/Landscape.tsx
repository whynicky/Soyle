import { AbsoluteFill, Img, staticFile } from "remotion";
import { N, Pt, samplePath } from "../lib/line";

// Top edge of the near hills, from the Söyle website mask (hero-hills-mask.svg, 960×640 space).
export const CREST_D =
  "M0 240C16 244 33 249 48 253C81 248 110 244 142 245C198 244 238 261 286 279C352 301 423 317 478 317C493 317 500 318 505 317C612 301 717 265 794 225C853 195 898 181 960 180";
const crest960 = samplePath(CREST_D, N);

/** Camera on the 3:2 landscape: image drawn at 1920·s × 1280·s with its top-left at (ox, oy). */
export type Cam = { s: number; ox: number; oy: number };
export const BASE_CAM: Cam = { s: 1, ox: 0, oy: -200 };

export const crestPts = (cam: Cam): Pt[] => crest960.map(([x, y]) => [cam.ox + x * 2 * cam.s, cam.oy + y * 2 * cam.s] as Pt);

const polyBelow = (pts: Pt[]) => {
  const first = pts[0], last = pts[pts.length - 1];
  const body = pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",");
  return `polygon(${body}, ${last[0].toFixed(1)}px 2600px, ${first[0].toFixed(1)}px 2600px)`;
};

type Props = {
  cam: Cam;
  fgCam?: Cam;
  /** When set, the world is only fully visible below this line; above it shows at skyOpacity. */
  revealBelow?: Pt[];
  skyOpacity?: number;
  belowOpacity?: number;
  fgOpacity?: number;
  blur?: number;
  opacity?: number;
};

const Layer = ({ src, cam, style }: { src: string; cam: Cam; style?: React.CSSProperties }) => (
  <Img
    src={staticFile(src)}
    style={{ position: "absolute", left: cam.ox, top: cam.oy, width: 1920 * cam.s, height: 1280 * cam.s, maxWidth: "none", ...style }}
  />
);

export const Landscape = ({ cam, fgCam, revealBelow, skyOpacity = 1, belowOpacity = 1, fgOpacity = 1, blur = 0, opacity = 1 }: Props) => {
  const bg = "scenery/hero-day-3840.webp";
  return (
    <AbsoluteFill style={{ opacity, filter: blur ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      <Layer src={bg} cam={cam} style={{ opacity: revealBelow ? skyOpacity : 1 }} />
      {revealBelow && (
        <AbsoluteFill style={{ clipPath: polyBelow(revealBelow), opacity: belowOpacity }}>
          <Layer src={bg} cam={cam} />
        </AbsoluteFill>
      )}
      {fgCam && fgOpacity > 0 && <Layer src="scenery/foreground-day-3840.webp" cam={fgCam} style={{ opacity: fgOpacity }} />}
    </AbsoluteFill>
  );
};
