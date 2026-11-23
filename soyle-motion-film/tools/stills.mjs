// Render chosen frames as stills and a contact sheet: node tools/stills.mjs 30 110 140
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
import fs from "node:fs";
const browserExecutable = process.env.REMOTION_BROWSER || (fs.existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);
const composition = await selectComposition({ serveUrl, id: "SoyleFilm", browserExecutable });
for (const frame of frames) {
  await renderStill({ composition, serveUrl, frame, output: `out/stills/f${frame}.png`, browserExecutable, scale: 0.5 });
  console.log("still", frame);
}
