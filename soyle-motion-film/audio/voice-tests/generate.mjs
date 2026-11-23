// Söyle — Kazakh voice tests for the film narration.
// Run from soyle-motion-film:   node audio/voice-tests/generate.mjs
// Needs Node 20+ and internet. Keys are read from the environment or from ../.env.local (never printed):
//   AZURE_SPEECH_KEY, AZURE_SPEECH_REGION   — Azure Speech (voice kk-KZ-AigulNeural, already used by the Söyle app)
//   ELEVENLABS_API_KEY                       — ElevenLabs (optional; skipped if missing)
//   ELEVEN_EXTRA_VOICES="id1,id2"            — optional extra ElevenLabs voice IDs (e.g. a native Kazakh voice from the Voice Library)
import fs from "node:fs";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const film = path.resolve(here, "../..");
const out = path.join(here, "out");
fs.mkdirSync(out, { recursive: true });

// read keys from ../.env.local (the Söyle project) without printing them
for (const file of [path.resolve(film, "../.env.local"), path.resolve(film, ".env.local")]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const { lines } = JSON.parse(fs.readFileSync(path.join(film, "audio/narration.json"), "utf8"));
const spoken = lines.filter((l) => l.tts);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const toSSMLText = (t) => esc(t.replace(/<pause (\d+)>/g, "§$1§")).replace(/§(\d+)§/g, '<break time="$1ms"/>');
const toPlain = (t) => t.replace(/\s*<pause \d+>\s*/g, " — ").replace(/ — —/g, " —");

// ---------- Azure: three deliveries of the same voice ----------
const AZURE_VARIANTS = [
  { id: "azure-aigul-calm", rate: "-8%", pitch: "-2%" },
  { id: "azure-aigul-warm", rate: "-12%", pitch: "-4%" },
  { id: "azure-aigul-bright", rate: "-4%", pitch: "+2%" },
];
async function azure(variant, line) {
  const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="kk-KZ"><voice name="kk-KZ-AigulNeural"><prosody rate="${variant.rate}" pitch="${variant.pitch}">${toSSMLText(line.tts)}</prosody></voice></speak>`;
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-48khz-16bit-mono-pcm", "User-Agent": "soyle-film" },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Azure ${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

// ---------- ElevenLabs: several female voices, Kazakh models ----------
const ELEVEN_VOICES = [
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "alice" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "jessica" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "lily" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "matilda" },
  ...(process.env.ELEVEN_EXTRA_VOICES || "").split(",").filter(Boolean).map((id) => ({ id: id.trim(), name: `custom-${id.trim().slice(0, 6)}` })),
];
const ELEVEN_MODELS = ["eleven_v4", "eleven_v3"];
async function eleven(voice, model, line) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=pcm_48000`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: toPlain(line.tts), model_id: model, language_code: "kk",
      voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${model} ${res.status} ${(await res.text()).slice(0, 200)}`);
  const pcm = Buffer.from(await res.arrayBuffer());
  return wav(pcm, 48000);
}
function wav(pcm, sr) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function run(label, fn) {
  const dir = path.join(out, label);
  fs.mkdirSync(dir, { recursive: true });
  for (const line of spoken) {
    const file = path.join(dir, `${line.id}.wav`);
    if (fs.existsSync(file)) continue;
    fs.writeFileSync(file, await fn(line));
    process.stdout.write(".");
  }
  console.log(` ${label}`);
}

if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
  for (const v of AZURE_VARIANTS) await run(v.id, (l) => azure(v, l)).catch((e) => console.log(`\n${v.id}: ${e.message}`));
} else console.log("Azure: AZURE_SPEECH_KEY / AZURE_SPEECH_REGION not set — skipped");

if (process.env.ELEVENLABS_API_KEY) {
  for (const model of ELEVEN_MODELS)
    for (const v of ELEVEN_VOICES) await run(`eleven-${model.replace("eleven_", "")}-${v.name}`, (l) => eleven(v, model, l)).catch((e) => console.log(`\n${v.name}: ${e.message}`));
} else console.log("ElevenLabs: ELEVENLABS_API_KEY not set — skipped");

console.log(`Done → ${out}`);
