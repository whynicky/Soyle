import fs from "node:fs/promises";
import sharp from "sharp";

const out = "public/branding";
const { mark, word, full } = JSON.parse(await fs.readFile("assets/branding/soyle-artwork.json", "utf8"));
const ink = "#161616";
const paper = "#f5f3f0";

function svg(width, height, contents) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${contents}</svg>`;
}

function path(geometry, color, transform = "") {
  return `<path fill="${color}" fill-rule="evenodd"${transform ? ` transform="${transform}"` : ""} d="${geometry.path}"/>`;
}

function logo(color) {
  return path(mark, color, full.markTransform) + path(word, color, full.wordTransform);
}

function icon(size, radius) {
  const scale = 68 / mark.height;
  const x = (100 - mark.width * scale) / 2;
  return sharp(Buffer.from(svg(100, 100,
    `<rect width="100" height="100" rx="${radius}" fill="${ink}"/>` +
    path(mark, paper, `translate(${x} 16) scale(${scale})`),
  ))).resize(size, size).png();
}

await fs.mkdir(out, { recursive: true });
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const mascot = await sharp("assets/branding/mascot-master.png")
  .trim({ threshold: 8 })
  .resize(608, 608, { fit: "contain", background: transparent })
  .png()
  .toBuffer();
const mascotTile = await sharp({ create: { width: 640, height: 640, channels: 4, background: transparent } })
  .composite([{ input: mascot, left: 16, top: 16 }]).png().toBuffer();
await fs.writeFile(`${out}/soyle-mascot.png`, mascotTile);
await sharp(mascotTile).webp({ quality: 95, alphaQuality: 100, effort: 6 }).toFile(`${out}/soyle-mascot.webp`);

const adaptive = `<style>svg{color:${ink}}@media (prefers-color-scheme:dark){svg{color:${paper}}}</style>`;
await Promise.all([
  fs.writeFile(`${out}/soyle-logo.svg`, svg(full.width, full.height, adaptive + logo("currentColor"))),
  fs.writeFile("public/soyle-mark.svg", svg(mark.width, mark.height, adaptive + path(mark, "currentColor"))),
  ...[192, 512].map(size => icon(size, 0).toFile(`${out}/pwa-icon-${size}.png`)),
  icon(180, 0).toFile(`${out}/apple-touch-icon.png`),
  icon(32, 20).toFile(`${out}/favicon.png`),
  icon(512, 20).toFile("app/icon.png"),
  icon(512, 20).toFile("public/soyle-icon.png"),
]);
await fs.copyFile(`${out}/apple-touch-icon.png`, "app/apple-icon.png");

const sizes = [16, 32, 48];
const icons = await Promise.all(sizes.map(size => icon(size, 20).toBuffer()));
const header = Buffer.alloc(6 + icons.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icons.length, 4);
let offset = header.length;
icons.forEach((image, i) => {
  const start = 6 + i * 16;
  header[start] = sizes[i];
  header[start + 1] = sizes[i];
  header.writeUInt16LE(1, start + 4);
  header.writeUInt16LE(32, start + 6);
  header.writeUInt32LE(image.length, start + 8);
  header.writeUInt32LE(offset, start + 12);
  offset += image.length;
});
const favicon = Buffer.concat([header, ...icons]);
await fs.writeFile(`${out}/favicon.ico`, favicon);
await fs.writeFile("app/favicon.ico", favicon);

const scale = 820 / full.width;
const top = (630 - full.height * scale) / 2;
await sharp(Buffer.from(svg(1200, 630,
  `<rect width="1200" height="630" fill="#fff8ed"/><g transform="translate(190 ${top}) scale(${scale})">${logo(ink)}</g>`,
))).png().toFile("app/opengraph-image.png");
console.log("Söyle SVG lockups and application icons generated.");
