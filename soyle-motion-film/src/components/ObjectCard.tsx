import { Img, staticFile } from "remotion";
import { C, FONT } from "../theme";

type Props = {
  obj: "water" | "apple" | "play";
  label: string;
  size: number;
  selected?: number; // 0..1
  check?: number;    // 0..1 draw of the check mark
  dim?: number;      // 0..1
  style?: React.CSSProperties;
  labelOpacity?: number;
};

/**
 * A communication card, rebuilt 1:1 from the Söyle website board (.sl-object-choice):
 * paper card, 1px line border, squircle-like corners, object photo, 600 label; pressed state = accent border + soft fill.
 */
export const ObjectCard = ({ obj, label, size, selected = 0, check = 0, dim = 0, style, labelOpacity = 1 }: Props) => {
  const k = size / 300;
  const border = selected > 0 ? `${1.5 + selected * 1.2}px solid rgba(64,64,64,${0.18 + selected * 0.82})` : `1.5px solid ${C.line}`;
  const bg = `rgb(${255 - selected * 13},${255 - selected * 15},${255 - selected * 19})`;
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: 30 * k,
        background: bg,
        border,
        boxSizing: "border-box",
        display: "grid",
        justifyItems: "center",
        alignContent: "center",
        gap: 10 * k,
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: 34 * k,
        color: C.uiInk,
        letterSpacing: "-0.01em",
        opacity: 1 - dim * 0.55,
        boxShadow: `0 ${18 * k}px ${44 * k}px -${18 * k}px rgba(32,36,58,${0.16 + selected * 0.08})`,
        ...style,
      }}
    >
      <Img src={staticFile(`objects/soyle-object-${obj}.webp`)} style={{ width: 196 * k, height: 196 * k, objectFit: "contain" }} />
      <span style={{ opacity: labelOpacity }}>{label}</span>
      {check > 0 && (
        <svg width={34 * k} height={34 * k} viewBox="0 0 24 24" style={{ position: "absolute", right: 16 * k, top: 16 * k }}>
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={C.uiAccent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={22} strokeDashoffset={22 * (1 - check)} />
        </svg>
      )}
    </div>
  );
};
