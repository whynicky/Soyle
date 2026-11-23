import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const fontsReady = Promise.all([
  loadFont({ family: "Soyle Onest", url: staticFile("fonts/onest-regular.ttf"), weight: "400" }),
  loadFont({ family: "Soyle Onest", url: staticFile("fonts/onest-bold.ttf"), weight: "600" }),
  loadFont({ family: "Soyle Onest", url: staticFile("fonts/onest-bold.ttf"), weight: "700" }),
]);
