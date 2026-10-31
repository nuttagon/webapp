"""WN theme — a soft original piano loop (no samples, no licence needed).
F major, 72 bpm: Fmaj7 · Am7 · Dm7 · B♭maj7, two bars each, played twice; a music-box melody joins the second pass.
python3 tools/music/make_theme.py  →  assets/audio/wn-theme.wav  (then ffmpeg → .mp3, see README)"""
import numpy as np, os, wave
SR = 32000; BPM = 72; BEAT = 60 / BPM; BAR = 4 * BEAT
rng = np.random.default_rng(16012027)
def hz(n): return 440 * 2 ** ((n - 69) / 12)
F, A, C, D, E, G, Bb = 65, 69, 72, 74, 76, 79, 70
CHORDS = [[53, 57, 60, 64], [57, 60, 64, 67], [50, 53, 57, 60], [46, 50, 53, 57]]   # Fmaj7 Am7 Dm7 B♭maj7 (low voicing)
MELODY = [(0, 81), (2, 79), (3, 76), (4, 77), (6, 76), (7, 72), (8, 74), (10, 72), (11, 69), (12, 70), (14, 72), (15, 74)]   # (beat in 4-bar phrase, note)
def tone(freq, dur, vel, bright=1.0):
    n = int((dur + 2.5) * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for k in range(1, 8):
        amp = vel / k ** (1.9 - .35 * bright); dec = np.exp(-t * (0.9 + 0.55 * k))
        for det in (-0.6, 0.6):
            out += .5 * amp * dec * np.sin(2 * np.pi * freq * k * (1 + det / 1200) * t + rng.uniform(0, 6.28))
    att = np.minimum(1, t / .006); rel = np.where(t > dur, np.exp(-(t - dur) * 3.0), 1)
    return out * att * rel
def render(cycles=3):
    L = 16 * BAR; total = int((cycles * L + 4) * SR); mix = np.zeros((2, total))
    def add(sig, start, pan):
        i = max(0, int(start * SR)); j = min(total, i + len(sig)); s = sig[: j - i]
        mix[0, i:j] += s * (1 - pan) ; mix[1, i:j] += s * (1 + pan)
    for c in range(cycles):
        for bar in range(16):
            ch = CHORDS[(bar // 2) % 4]; t0 = c * L + bar * BAR
            add(tone(hz(ch[0] - 12), BAR * .95, .55, .6), t0, -.1)                          # soft bass on beat 1
            pat = [ch[0], ch[2], ch[3] + 12 - 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[3], ch[2]]
            for e, note in enumerate(pat):                                                # flowing eighth-note arpeggio
                tt = t0 + e * BEAT / 2 + rng.normal(0, .006)
                add(tone(hz(note), BEAT * .9, .32 * rng.uniform(.85, 1.05), .8), tt, .25 * np.sin(e))
            if bar >= 8:                                                                  # music-box melody on the second pass
                phrase_bar = (bar - 8) % 4
                for beat, note in MELODY:
                    if beat // 4 == phrase_bar: add(tone(hz(note), BEAT * 1.4, .2, 1.4), t0 + (beat % 4) * BEAT + rng.normal(0, .008), .35)
    return mix, L
def reverb(x, secs=2.6):
    n = int(secs * SR); t = np.arange(n) / SR; out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.normal(0, 1, n) * np.exp(-t * 3.2); ir[0] = 0; ir /= np.sqrt((ir ** 2).sum())
        size = 1 << int(np.ceil(np.log2(x.shape[1] + n)))
        out[ch] = np.fft.irfft(np.fft.rfft(x[ch], size) * np.fft.rfft(ir, size), size)[: x.shape[1]]
    return .72 * x + .55 * out
mix, L = render(3); wet = reverb(mix)
loop = wet[:, int(L * SR): int(2 * L * SR)]                      # middle cycle: tails from the previous pass make it loop seamlessly
lp = np.copy(loop)
for ch in range(2):                                              # gentle low-pass (one-pole) to keep it warm and quiet
    a = .35; y = 0.0; arr = lp[ch]
    for i in range(arr.size): y += a * (arr[i] - y); arr[i] = y
loop = lp / np.abs(lp).max() * .5
out = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'audio', 'wn-theme.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((loop.T * 32767).astype('<i2').tobytes())
print('wrote', out, round(loop.shape[1] / SR, 1), 's')
