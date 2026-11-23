"""
Söyle — procedural sound design. Every effect is synthesised from shaped noise and
short impulses (no samples, no music, no tonal melodies). Run:  python3 audio/sfx/synth.py
Outputs (48 kHz, 24-bit stereo):
  audio/sfx/samples/*.wav   one file per effect family (for review)
  audio/stems/sfx.wav       the full 40 s effects stem, synced to src/timing.ts frames
"""
import json, os
import numpy as np
from scipy import signal
import soundfile as sf

SR = 48000
FPS = 30
DUR = 44.0
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
rng = np.random.default_rng(20261120)

def t_of(frame):  # frame → seconds
    return frame / FPS

# ---------- building blocks ----------
def pink(n):
    w = rng.standard_normal(n)
    f = np.fft.rfft(w)
    k = np.arange(len(f)); k[0] = 1
    return np.fft.irfft(f / np.sqrt(k), n)

def shaped_noise(dur, center, width, gain=None, pan=None, decor=0.9):
    """Noise whose band (centre Hz, width in octaves) and gain follow functions of u∈[0,1]."""
    n = int(dur * SR)
    out = []
    for ch in range(2):
        x = pink(n) if ch == 0 else decor * pink(n) + (1 - decor) * out[0]
        f, t, Z = signal.stft(x, SR, nperseg=2048, noverlap=1536)
        u = np.clip(t / max(dur, 1e-6), 0, 1)
        c = np.array([center(v) for v in u])
        w = np.array([width(v) for v in u])
        logf = np.log2(np.maximum(f, 20))[:, None]
        mask = np.exp(-0.5 * ((logf - np.log2(c)[None, :]) / (w[None, :] / 2)) ** 2)
        if gain is not None:
            mask = mask * np.array([gain(v) for v in u])[None, :]
        _, y = signal.istft(Z * mask, SR, nperseg=2048, noverlap=1536)
        y = y[:n] if len(y) >= n else np.pad(y, (0, n - len(y)))
        out.append(y)
    st = np.stack(out, 1)
    if pan is not None:
        uu = np.linspace(0, 1, n)
        p = np.array([pan(v) for v in uu])  # -1..1
        st[:, 0] *= np.cos((p + 1) * np.pi / 4) * np.sqrt(2)
        st[:, 1] *= np.sin((p + 1) * np.pi / 4) * np.sqrt(2)
    return norm(st)

def env(n, a, d, shape=2.0):
    """attack a, decay d (seconds) smooth envelope over n samples."""
    t = np.arange(n) / SR
    e = np.where(t < a, (t / max(a, 1e-4)) ** 1.5, np.exp(-(t - a) / max(d, 1e-4) * shape))
    return e

def bell(u, peak=0.5, sharp=2.2):
    return np.sin(np.pi * np.clip(u, 0, 1) ** (np.log(0.5) / np.log(peak))) ** sharp

def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)

def lp(x, hi, order=2):
    return signal.sosfilt(signal.butter(order, hi, btype="low", fs=SR, output="sos"), x, axis=0)

def hp(x, lo, order=2):
    return signal.sosfilt(signal.butter(order, lo, btype="high", fs=SR, output="sos"), x, axis=0)

def norm(x, peak=1.0):
    m = np.max(np.abs(x)) or 1
    return x / m * peak

def stereo(m, width=0.0):
    return np.stack([m, m], 1) if width == 0 else np.stack([m, m], 1)

def fade(x, fi=0.004, fo=0.02):
    n = len(x); a = int(fi * SR); b = int(fo * SR)
    g = np.ones(n)
    if a: g[:a] = np.linspace(0, 1, a)
    if b: g[-b:] *= np.linspace(1, 0, b)
    return x * g[:, None]

def smooth_random(dur, knots_per_s=3):
    """A slow, irregular 0..1 curve (no periodic flutter)."""
    k = max(4, int(dur * knots_per_s) + 2)
    pts = rng.random(k)
    xs = np.linspace(0, 1, k)
    return lambda u: float(np.interp(u, xs, pts))

# ---------- the Söyle sound family: paper, air, felt ----------
def line_stroke(dur=1.4, lo=2600, hi=5200, pan=(0, 0), brightness=1.0):
    """The voice line drawing: a soft brush/graphite stroke of air."""
    s = shaped_noise(dur, lambda u: lo + (hi - lo) * u, lambda u: 1.1, gain=lambda u: bell(u, 0.35, 1.6),
                     pan=lambda u: pan[0] + (pan[1] - pan[0]) * u)
    wobble = smooth_random(dur)
    grain = shaped_noise(dur, lambda u: 6200 * brightness, lambda u: 0.9, gain=lambda u: bell(u, 0.4, 2) * (0.75 + 0.25 * wobble(u)))
    return fade(norm(s + 0.25 * grain), 0.01, 0.08)

def breath(dur=1.2, c=1800):
    s = shaped_noise(dur, lambda u: c, lambda u: 1.6, gain=lambda u: bell(u, 0.45, 1.8))
    return fade(lp(s, 7000), 0.02, 0.1)

def bloom(dur=1.6, body=110):
    """Soft, low, non-tonal bloom (noise through a gentle low band) with an airy top."""
    n = int(dur * SR)
    low = shaped_noise(dur, lambda u: body * 1.6, lambda u: 1.2, gain=lambda u: bell(u, 0.18, 1.4))
    air = shaped_noise(dur, lambda u: 9000, lambda u: 1.2, gain=lambda u: bell(u, 0.25, 2.5))
    return fade(norm(low + 0.18 * air), 0.03, 0.2)

def whoosh(dur=1.2, f0=400, f1=2400, pan=(0, 0), body=0.35, peak=0.55):
    s = shaped_noise(dur, lambda u: f0 * (f1 / f0) ** u, lambda u: 1.5 - 0.5 * u, gain=lambda u: bell(u, peak, 1.8),
                     pan=lambda u: pan[0] + (pan[1] - pan[0]) * u)
    sub = hp(shaped_noise(dur, lambda u: 140, lambda u: 1.2, gain=lambda u: bell(u, peak, 1.6)), 70)
    return fade(norm(s + body * sub), 0.01, 0.12)

def wind_reveal(dur=3.0):
    """The world opening: a wide, slow air swell with a low ground."""
    s = shaped_noise(dur, lambda u: 500 * (5 ** u), lambda u: 2.2, gain=lambda u: bell(u, 0.45, 1.4), decor=0.6)
    ground = shaped_noise(dur, lambda u: 90, lambda u: 1.5, gain=lambda u: bell(u, 0.35, 1.2), decor=0.6)
    return fade(norm(s + 0.22 * hp(ground, 60)), 0.05, 0.4)

def grass(dur=2.0):
    """Foreground grass rising: fine rustle, high and sparse."""
    n = int(dur * SR)
    x = rng.standard_normal((n, 2)) * (rng.random((n, 2)) < 0.02)
    x = bp(x, 2500, 9000)
    u = np.linspace(0, 1, n)[:, None]
    return fade(norm(x * bell(u, 0.5, 1.5)), 0.05, 0.3)

def tap(body=170, click=1400, soft=1.0, dur=0.22):
    """Tactile press on a felt-covered surface: impulse into two damped resonances, no system click."""
    n = int(dur * SR)
    imp = np.zeros(n); imp[0] = 1.0
    imp[:int(0.002 * SR)] += rng.standard_normal(int(0.002 * SR)) * 0.3
    b1 = signal.lfilter(*signal.iirpeak(body, 3, SR), imp) * env(n, 0.001, 0.05)
    b2 = signal.lfilter(*signal.iirpeak(click, 4, SR), imp) * env(n, 0.0005, 0.012)
    m = norm(b1) * 1.0 + norm(b2) * 0.35 * soft
    m = lp(m, 5000)
    return fade(np.stack([m, m * 0.96], 1), 0.0005, 0.05)

def paper(dur=0.16, bright=4200):
    """A card set down on paper: short soft 'ff' with a tiny low weight."""
    n = int(dur * SR)
    s = shaped_noise(dur, lambda u: bright, lambda u: 1.8, gain=lambda u: np.exp(-u * 5) * min(1, u * 30))
    thump = tap(body=120, click=900, soft=0.2, dur=dur)[:n]
    return fade(norm(s * 0.8 + thump * 0.6), 0.001, 0.03)

def tick(dur=0.05, f=3200):
    n = int(dur * SR)
    imp = np.zeros(n); imp[0] = 1
    m = signal.lfilter(*signal.iirpeak(f, 6, SR), imp) * env(n, 0.0003, 0.006)
    m = lp(m, 7000)
    return fade(norm(np.stack([m, m], 1)), 0.0003, 0.01)

def slide(dur=0.45, pan=(0, 0), c=1500):
    s = shaped_noise(dur, lambda u: c * (1 + 0.4 * u), lambda u: 1.4, gain=lambda u: bell(u, 0.35, 1.6),
                     pan=lambda u: pan[0] + (pan[1] - pan[0]) * u)
    return fade(lp(s, 6500), 0.01, 0.06)

def rise_puff(dur=0.32):
    """Very small air for a word rising into place."""
    return fade(shaped_noise(dur, lambda u: 2200 + 1200 * u, lambda u: 1.3, gain=lambda u: bell(u, 0.4, 2)), 0.01, 0.05)

def press_button():
    return norm(tap(body=150, click=1100, soft=0.8) + 0.4 * paper(0.12, 3000)[: int(0.22 * SR)] if True else 0)

# ---------- cue sheet (frames from src/timing.ts / scenes) ----------
def cues():
    C = []
    add = lambda frame, fx, gain_db, name: C.append((frame, fx, gain_db, name))
    # S1 — the opening
    add(8, line_stroke(1.45, 2400, 4200, pan=(0, 0)), -14, "line draws (centre-out)")
    add(30, breath(2.2, 1600), -26, "breath travels along the line")
    for i, f in enumerate([44, 53, 62, 71]):
        add(f, rise_puff(), -30, f"word rises {i}")
    add(97, bloom(1.8, 105), -12, "«үні» — the voice lifts the line")
    # S2 — the idea
    add(148, line_stroke(1.1, 1800, 3400, pan=(-0.2, 0.2)), -18, "line widens into a horizon")
    add(158, wind_reveal(3.4), -11, "the world opens under the line")
    add(178, grass(2.6), -24, "foreground grass rises")
    for i, f in enumerate([216, 246]):
        add(f, rise_puff(0.45), -27, f"sky text {i}")
    add(266, paper(0.2, 3600), -16, "«Алма» card settles in the valley")
    add(296, whoosh(0.7, 1400, 600, body=0.2, peak=0.5), -24, "text and card sink away")
    # S3 — introducing Söyle
    add(322, rise_puff(0.6), -22, "logo rises in the sky")
    add(326, line_stroke(0.6, 1800, 4000), -18, "line lifts from the horizon")
    add(338, line_stroke(1.5, 3000, 4600, pan=(-0.1, -0.85)), -19, "outline draws left")
    add(338, line_stroke(1.5, 3000, 4600, pan=(0.1, 0.85)), -19, "outline draws right")
    add(364, bloom(1.5, 220), -21, "window fills")
    add(404, whoosh(0.5, 900, 2600, pan=(0.1, -0.5), body=0.1, peak=0.6), -22, "logo flies into the window")
    add(439, tap(body=190, click=1500, soft=0.6), -15, "logo lands in its place")
    add(444, whoosh(1.5, 300, 2800, body=0.5, peak=0.85), -12, "camera pushes into the product")
    # S4 — learning
    add(500, line_stroke(1.1, 2600, 3800, pan=(-0.7, 0.7)), -20, "ground line draws")
    for i, f in enumerate([502, 566, 636]):
        add(f, rise_puff(0.5), -26, f"caption {i}")
    add(498, slide(0.5, (0.4, 0.2)), -22, "lesson panel arrives")
    add(529, tap(), -13, "apple pressed")
    add(534, tick(0.06, 2600), -26, "answer confirmed")
    add(548, slide(0.55, (0.1, -0.6)), -23, "lesson leaves")
    add(558, slide(0.5, (0.4, 0.2)), -23, "plan panel arrives")
    for i, f in enumerate([568, 576, 584]):
        add(f, paper(0.14, 3800), -22, f"task row {i}")
    add(590, slide(0.5, (0.6, 0.3), 1900), -24, "task detail slides in")
    add(616, slide(0.5, (0.1, -0.6)), -23, "plan leaves")
    for i, f in enumerate([630, 638, 646]):
        add(f, whoosh(0.55, 700, 1800, pan=(-0.3 + 0.3 * i, -0.3 + 0.3 * i), body=0.1, peak=0.45), -23, f"story panel {i} reveals")
    add(672, slide(0.55, (0.3, 0.1), 1200), -24, "story panels leave")
    for i, f in enumerate([694, 700, 706]):
        add(f, paper(0.18, 3400), -17, f"communication card {i} lands")
    add(722, tap(body=160, click=1300), -10, "«Алма» card pressed")
    add(731, tick(0.05, 2900), -23, "check mark")
    add(738, whoosh(0.75, 1100, 2400, pan=(0.0, -0.45), body=0.05, peak=0.5), -20, "«Алма» lifts out of the card")
    add(759, tap(body=200, click=1800, soft=0.4, dur=0.15), -21, "«Алма» lands in the phrase")
    for i, f in enumerate([752, 760]):
        add(f, rise_puff(0.3), -27, f"phrase word {i}")
    add(764, paper(0.12, 3000), -24, "speak button appears")
    add(774, tap(body=140, click=1000, soft=0.7), -12, "«Дыбыстау» pressed")
    # S5 — parents and specialists
    add(796, whoosh(0.7, 1600, 700, body=0.15, peak=0.45), -24, "board lifts away")
    add(800, line_stroke(1.7, 1600, 3200, pan=(0.2, 0.5)), -19, "line becomes the spine")
    add(812, slide(0.6, (-0.4, -0.3), 1300), -21, "parent cabinet arrives")
    add(820, rise_puff(0.5), -26, "headline")
    add(850, whoosh(1.0, 700, 1700, pan=(-0.4, 0.4), body=0.08, peak=0.55), -21, "specialist advice lifts out")
    add(886, paper(0.16, 3600), -21, "advice settles")
    add(874, tick(0.05, 3000), -27, "node «Маманға»")
    add(892, whoosh(1.0, 700, 1700, pan=(-0.4, 0.4), body=0.08, peak=0.55), -21, "parent note lifts out")
    add(928, paper(0.16, 3600), -21, "note settles")
    add(916, tick(0.05, 3000), -27, "node «Ата-анаға»")
    # S6 — the brand reveal
    add(982, whoosh(0.8, 1400, 500, body=0.25, peak=0.45), -23, "product sinks into the valley")
    add(998, wind_reveal(2.6), -15, "the hills return")
    add(1028, whoosh(2.0, 300, 1500, body=0.5, peak=0.6), -18, "camera tilts to the sky")
    add(1040, line_stroke(1.2, 2000, 3000), -21, "line calms")
    add(1070, line_stroke(1.25, 2600, 5200, pan=(-0.3, 0.3), brightness=1.2), -16, "line curls into the S")
    add(1099, bloom(2.4, 95), -11, "the S fills — signature")
    add(1106, line_stroke(0.95, 3200, 5600, pan=(-0.1, 0.4)), -24, "wordmark reveals")
    add(1122, rise_puff(0.6), -27, "final headline")
    add(1142, rise_puff(0.5), -30, "supporting line")
    return C

def build():
    n = int(DUR * SR)
    mix = np.zeros((n, 2))
    sheet = []
    for frame, fx, gdb, name in cues():
        s = int(t_of(frame) * SR)
        x = fx * 10 ** (gdb / 20)
        e = min(n, s + len(x))
        mix[s:e] += x[: e - s]
        sheet.append({"frame": frame, "time": round(t_of(frame), 3), "gain_db": gdb, "name": name})
    mix = hp(mix, 55, 2)
    return mix, sheet

def write(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    sf.write(path, x.astype(np.float32), SR, subtype="PCM_24")

if __name__ == "__main__":
    mix, sheet = build()
    peak = np.max(np.abs(mix))
    mix = mix / peak * 10 ** (-3 / 20)  # headroom; final loudness is set in the mix
    write(os.path.join(ROOT, "audio/stems/sfx.wav"), mix)
    json.dump(sheet, open(os.path.join(ROOT, "audio/stems/sfx-cues.json"), "w"), ensure_ascii=False, indent=1)
    # review samples, one per family
    samples = {
        "01-line-stroke": line_stroke(1.45, 2400, 4200),
        "02-voice-bloom": bloom(1.8, 105),
        "03-world-reveal": wind_reveal(3.4),
        "04-card-paper": paper(0.2, 3600),
        "05-tactile-press": tap(body=160, click=1300),
        "06-word-lift-swish": whoosh(0.75, 1100, 2400, pan=(0.0, -0.45), body=0.05, peak=0.5),
        "07-camera-push": whoosh(1.5, 300, 2800, body=0.5, peak=0.85),
        "08-outline-split": line_stroke(1.5, 3000, 4600, pan=(-0.1, -0.85)) + line_stroke(1.5, 3000, 4600, pan=(0.1, 0.85)),
        "09-logo-signature": bloom(2.4, 95),
    }
    for k, v in samples.items():
        pad = np.zeros((int(0.25 * SR), 2))
        write(os.path.join(HERE, "samples", k + ".wav"), np.concatenate([pad, norm(v, 0.5), pad]))
    print("cues:", len(sheet), "peak before norm:", round(float(peak), 3))
