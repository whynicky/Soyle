import { C, FONT } from "../theme";

type WordsProps = {
  text: string;
  /** progress 0..1 for each word (rise from behind a mask edge) */
  progress: (i: number) => number;
  size: number;
  weight?: number;
  color?: string;
  tracking?: number;
  /** distance the words travel when rising */
  rise?: number;
  style?: React.CSSProperties;
  align?: "left" | "center";
  width?: number;
};

/** Kinetic headline: each word rises into place from behind its own baseline mask. */
export const Words = ({ text, progress, size, weight = 400, color = C.navy, tracking = -0.035, rise, style, align = "center", width = 1920 }: WordsProps) => {
  const words = text.split(" ");
  const travel = rise ?? size * 1.05;
  return (
    <div
      style={{
        position: "absolute",
        width,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.26,
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: `${tracking}em`,
        lineHeight: 1.12,
        color,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = progress(i);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.16, marginBottom: -size * 0.16, paddingInline: size * 0.04, marginInline: -size * 0.04 }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * travel}px)`, opacity: p <= 0 ? 0 : 1 }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

export const Label = ({ children, size = 30, weight = 400, color = C.navy, style }: { children: React.ReactNode; size?: number; weight?: number; color?: string; style?: React.CSSProperties }) => (
  <div style={{ position: "absolute", fontFamily: FONT, fontSize: size, fontWeight: weight, color, letterSpacing: "-0.015em", lineHeight: 1.2, ...style }}>{children}</div>
);
