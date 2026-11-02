"""Bundle the mascot's fixed phrases for playback when online TTS is unavailable."""
import array
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.azure_tts import PET_PHRASES
from app.tts_library import BUNDLED_TTS_DIR, bundled_tts_path


def generate():
    directory = BUNDLED_TTS_DIR / "pet"
    directory.mkdir(exist_ok=True)
    manifest_path = directory / "manifest.json"
    clips = []
    with tempfile.TemporaryDirectory() as temporary:
        source = Path(temporary) / "phrase.aiff"
        rendered = Path(temporary) / "phrase.wav"
        for language, voice in [("ru", "Milena"), ("kk", "Aru")]:
            for text in sorted(PET_PHRASES[language]):
                target = directory / bundled_tts_path(text, language).name
                if not target.exists():
                    subprocess.run(["say", "-v", voice, "-r", "148", "-o", str(source), text], check=True)
                    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(source),
                                    "-ar", "24000", "-ac", "1", str(rendered)], check=True)
                    with wave.open(str(rendered)) as audio:
                        samples = array.array("h", audio.readframes(audio.getnframes()))
                    if max(map(abs, samples), default=0) < 500:
                        raise ValueError(f"Silent recording for {language}: {text}")
                    target.write_bytes(rendered.read_bytes())
                clips.append({"text": text, "file": target.name, "language": language, "voice": voice})
    manifest = {"clips": clips}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    generate()
