import { Img, staticFile } from "remotion";

export const UI = {
  child: { src: "ui/child-home.png", w: 3200, h: 2000 },
  lesson0: { src: "ui/sc-lesson-0.png", w: 1912, h: 1136 },
  lesson1: { src: "ui/sc-lesson-1.png", w: 1912, h: 1136 },
  plan: { src: "ui/sc-plan.png", w: 1912, h: 1136 },
  overview: { src: "ui/sc-overview.png", w: 1912, h: 1136 },
  aac: { src: "ui/sc-aac-apple.png", w: 1912, h: 1136 },
} as const;
export type Shot = (typeof UI)[keyof typeof UI];
export type Rect = { x: number; y: number; w: number; h: number };

type Props = {
  shot: Shot;
  r?: Rect;
  width: number;
  style?: React.CSSProperties;
  radius?: number;
  imgOpacity?: number;
};

/** A region of an authentic Söyle screenshot, scaled to a display width. */
export const UICrop = ({ shot, r, width, style, radius = 0, imgOpacity = 1 }: Props) => {
  const rect = r ?? { x: 0, y: 0, w: shot.w, h: shot.h };
  const k = width / rect.w;
  return (
    <div style={{ position: "absolute", width, height: rect.h * k, overflow: "hidden", borderRadius: radius, ...style }}>
      <Img
        src={staticFile(shot.src)}
        style={{ position: "absolute", left: -rect.x * k, top: -rect.y * k, width: shot.w * k, height: shot.h * k, maxWidth: "none", opacity: imgOpacity }}
      />
    </div>
  );
};
