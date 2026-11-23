import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { fontsReady } from "./fonts";
import { C } from "./theme";
import { World } from "./scenes/World";
import { S1Opening } from "./scenes/S1Opening";
import { S2Idea } from "./scenes/S2Idea";
import { S3Product } from "./scenes/S3Product";
import { S4Learning } from "./scenes/S4Learning";
import { S5Support } from "./scenes/S5Support";
import { S6Reveal } from "./scenes/S6Reveal";

export const Film = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => { fontsReady.then(() => continueRender(handle)); }, [handle]);
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <World />
      <S1Opening />
      <S2Idea />
      <S3Product />
      <S4Learning />
      <S5Support />
      <S6Reveal />
    </AbsoluteFill>
  );
};
