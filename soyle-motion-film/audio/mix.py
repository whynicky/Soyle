"""
Söyle — final mix. Places narration lines at their times (audio/narration.json), the app's own
«Алма жегім келеді.», and the effects stem; ducks effects under the voice; sets loudness.

  python3 audio/mix.py                                   # effects + app voice only (no narrator)
  python3 audio/mix.py --voice audio/voice-tests/out/azure-aigul-calm
Outputs audio/stems/*.wav, audio/mix/<name>.wav and out/<name>.mp4 (video copied, AAC 256k).
"""
import argparse, json, os, subprocess
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal

SR = 48000
DUR = 44.0
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(FILM, *a)

def load(path):
    if not path.endswith(".wav"):
        tmp = "/tmp/_soyle_in.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ar", str(SR), "-ac", "1", tmp], check=True)
        path = tmp
    x, sr = sf.read(path, always_2d=True)
    x = x.mean(1)
    if sr != SR:
        x = signal.resample_poly(x, SR, sr)
    return x

def trim_silence(x, thresh_db=-50):
    a = np.abs(x); th = 10 ** (thresh_db / 20) * a.max()
    idx = np.where(a > th)[0]
    if not len(idx): return x
    s = max(0, idx[0] - int(0.01 * SR)); e = min(len(x), idx[-1] + int(0.08 * SR))
    return x[s:e]

def voice_chain(x):
    """Gentle clean-up for speech: high-pass, de-mud, light presence, soft de-ess, slow levelling."""
    x = signal.sosfilt(signal.butter(2, 80, "high", fs=SR, output="sos"), x)
    def peq(x, f, g_db, q):
        b, a = peaking(f, g_db, q); return signal.lfilter(b, a, x)
    x = peq(x, 280, -2.0, 1.0)   # less box
    x = peq(x, 3200, 1.5, 0.9)   # intelligibility on small speakers
    x = peq(x, 7200, -2.0, 2.5)  # tame sibilance
    return x

def peaking(f0, g_db, q):
    A = 10 ** (g_db / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]; a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return np.array(b) / a[0], np.array(a) / a[0]

def place(track, x, t):
    s = int(t * SR); e = min(len(track), s + len(x)); track[s:e] += x[: e - s]

def envelope(x, attack=0.03, release=0.35):
    a = np.abs(x); out = np.zeros_like(a); g = 0.0
    ka = np.exp(-1 / (attack * SR)); kr = np.exp(-1 / (release * SR))
    for i in range(0, len(a), 64):  # block-wise follower
        v = a[i:i + 64].max()
        g = ka * g + (1 - ka) * v if v > g else kr * g + (1 - kr) * v
        out[i:i + 64] = g
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", help="folder with v01.wav … v10.wav")
    ap.add_argument("--name", default=None)
    ap.add_argument("--duck", type=float, default=12.0, help="dB of effects reduction under speech")
    ap.add_argument("--target", type=float, default=-16.0, help="integrated LUFS")
    args = ap.parse_args()
    name = args.name or ("soyle-film-" + (os.path.basename(args.voice.rstrip("/")) if args.voice else "sfx-app-voice"))
    n = int(DUR * SR)
    meter = pyln.Meter(SR)

    narration = json.load(open(P("audio/narration.json")))["lines"]
    voice = np.zeros(n)
    cursor = 0.0  # end of the previous spoken line (s); lines never overlap
    for line in narration:
        if line["id"] == "app":
            x = trim_silence(load(P(line["source"])))
            x = voice_chain(x)
            x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.07
            t = line["time"]  # the app's own voice is locked to the «Дыбыстау» press
            place(voice, x, t); cursor = t + len(x) / SR
        elif args.voice:
            f = os.path.join(args.voice, f"{line['id']}.wav")
            if not os.path.exists(f):
                print("missing", f); continue
            x = voice_chain(trim_silence(load(f)))
            x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.07  # even level per line before final loudness
            t = max(line["time"], cursor + 0.15)
            if t > line["time"] + 0.01: print(f"  {line['id']} shifted {t - line['time']:+.2f}s to avoid overlap")
            if line["id"] == "app": pass
            place(voice, x, t); cursor = t + len(x) / SR
            print(f"  {line['id']}: {t:.2f}–{cursor:.2f}s")

    sfx, sr = sf.read(P("audio/stems/sfx.wav"), always_2d=True)
    sfx = np.pad(sfx[:n], ((0, max(0, n - len(sfx))), (0, 0)))
    # effects sit around 12 LU under the voice; ducked further while she speaks
    sfx = sfx / (10 ** ((meter.integrated_loudness(sfx) - (-24.5)) / 20))  # effects bed, ~15 LU under the voice in pauses
    env = envelope(voice)
    active = np.clip(env / (env.max() * 0.08 + 1e-9), 0, 1)
    duck = 10 ** (-args.duck * active / 20)
    sfx = sfx * duck[:, None]

    v2 = np.stack([voice, voice], 1)
    mix = v2 + sfx
    # loudness and a soft safety limiter (true-peak ≈ −1.5 dBTP)
    lufs = meter.integrated_loudness(mix)
    mix *= 10 ** ((args.target - lufs) / 20)
    ceiling = 10 ** (-1.5 / 20)
    over = np.abs(mix) > ceiling
    if over.any():
        mix = np.tanh(mix / ceiling) * ceiling
    os.makedirs(P("audio/mix"), exist_ok=True); os.makedirs(P("audio/stems"), exist_ok=True)
    sf.write(P("audio/stems/voice.wav"), voice.astype(np.float32), SR, subtype="PCM_24")
    sf.write(P(f"audio/mix/{name}.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
    final_lufs = meter.integrated_loudness(mix)
    print(f"{name}: {final_lufs:.1f} LUFS, peak {20*np.log10(np.abs(mix).max()):.2f} dBFS")
    video = P("out/soyle-film-preview.mp4") if not os.path.exists(P("out/soyle-film.mp4")) else P("out/soyle-film.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", P(f"audio/mix/{name}.wav"), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", P(f"out/{name}.mp4")], check=True)
    print("→", P(f"out/{name}.mp4"))

if __name__ == "__main__":
    main()
