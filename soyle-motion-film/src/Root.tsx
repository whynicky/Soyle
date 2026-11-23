import { Composition } from "remotion";
import { Film } from "./Film";
import { FPS, HEIGHT, TOTAL, WIDTH } from "./timing";

export const Root = () => (
  <Composition id="SoyleFilm" component={Film} durationInFrames={TOTAL} fps={FPS} width={WIDTH} height={HEIGHT} />
);
