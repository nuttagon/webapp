"""Three original background tracks for the WN site — synthesised from scratch (no samples, no licence needed).
A  late-night-rhodes : lo-fi jazz, swung, electric piano + upright bass + brushes + vinyl crackle
B  bossa-for-two     : bossa nova, nylon guitar comping + bass + rim clicks + shaker
C  indie-sunday      : indie folk, finger-picked guitar + soft kick/shaker + glockenspiel melody
python3 tools/music/make_options.py  →  assets/audio/wn-{rhodes,bossa,indie}.wav  (then ffmpeg → mp3)"""
import numpy as np, os, wave, sys
SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'audio')
def hz(n): return 440.0 * 2 ** ((n - 69) / 12)
def env_ad(n, att, dec):
    t = np.arange(n) / SR; return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t * dec)
def lowpass(x, cutoff, slope=2.0):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(x.size, 1 / SR); X *= 1 / (1 + (f / cutoff) ** (2 * slope)); return np.fft.irfft(X, x.size)
def highpass(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(x.size, 1 / SR); X *= 1 / (1 + (cutoff / np.maximum(f, 1)) ** 4); return np.fft.irfft(X, x.size)
def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(x.size, 1 / SR); X *= (1 / (1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / (1 + (f / hi) ** 4)); return np.fft.irfft(X, x.size)

class Song:
    def __init__(s, seed, bars, bpm, swing=0.0, cycles=3):
        s.rng = np.random.default_rng(seed); s.bpm = bpm; s.beat = 60 / bpm; s.bars = bars; s.swing = swing; s.cycles = cycles
        s.L = bars * 4 * s.beat; s.n = int((cycles * s.L + 4) * SR); s.dry = np.zeros((2, s.n)); s.wet = np.zeros((2, s.n))
    def t(s, cyc, bar, beat):                     # beat in quarter notes, swing applied to off-beat eighths
        frac = beat % 1; b = int(beat)
        if abs(frac - .5) < 1e-6: frac = .5 + s.swing * (1 / 6)
        return cyc * s.L + (bar * 4 + b + frac) * s.beat
    def add(s, sig, t, pan=0.0, rev=0.25, gain=1.0):
        i = max(0, int((t + s.rng.normal(0, .004)) * SR)); j = min(s.n, i + sig.size); x = sig[: j - i] * gain
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        s.dry[0, i:j] += x * l; s.dry[1, i:j] += x * r; s.wet[0, i:j] += x * l * rev; s.wet[1, i:j] += x * r * rev
    # ---- instruments ----
    def rhodes(s, note, dur, vel):
        f = hz(note); n = int((dur + 1.8) * SR); t = np.arange(n) / SR
        idx = 2.2 * np.exp(-t * 4) + .35; mod = np.sin(2 * np.pi * f * t) * idx
        car = np.sin(2 * np.pi * f * t + mod); tine = .18 * np.sin(2 * np.pi * f * 7.1 * t) * np.exp(-t * 14)
        rel = np.where(t > dur, np.exp(-(t - dur) * 5), 1)
        trem = 1 + .06 * np.sin(2 * np.pi * 4.6 * t)
        return vel * (car + tine) * env_ad(n, .004, 1.1) * rel * trem
    def bass(s, note, dur, vel):
        f = hz(note); n = int((dur + .6) * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) + .12 * np.sin(6 * np.pi * f * t)
        click = lowpass(s.rng.normal(0, 1, n), 900) * np.exp(-t * 60) * .25
        rel = np.where(t > dur, np.exp(-(t - dur) * 12), 1)
        return vel * (x * env_ad(n, .008, 2.2) + click) * rel
    def pluck(s, note, dur, vel, bright=.5, decay=.9975):
        f = hz(note); N = max(2, int(round(SR / f))); n = int((dur + 1.2) * SR)
        buf = s.rng.uniform(-1, 1, N); buf = bright * buf + (1 - bright) * np.convolve(buf, np.ones(4) / 4, 'same')
        out = np.empty(n + N); out[:N] = buf; prev = buf
        for st in range(N, n + N, N):
            nxt = decay * .5 * (prev + np.append(prev[1:], prev[-1])); k = min(N, n + N - st); out[st: st + k] = nxt[:k]; prev = nxt
        out = out[:n]; t = np.arange(n) / SR; rel = np.where(t > dur, np.exp(-(t - dur) * 8), 1)
        return vel * lowpass(out * rel, 3800 if bright < .7 else 6000)
    def glock(s, note, vel):
        f = hz(note); n = int(1.6 * SR); t = np.arange(n) / SR
        return vel * (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * env_ad(n, .002, 2.6)
    def kick(s, vel):
        n = int(.45 * SR); t = np.arange(n) / SR; f = 48 + 70 * np.exp(-t * 30)
        return vel * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    def brush(s, vel, long=False):
        n = int((.35 if long else .18) * SR); t = np.arange(n) / SR
        x = bandpass(s.rng.normal(0, 1, n), 1200, 7000); e = np.minimum(1, t / (.03 if long else .004)) * np.exp(-t * (9 if long else 28))
        return vel * x * e * .5
    def hat(s, vel):
        n = int(.06 * SR); t = np.arange(n) / SR; return vel * bandpass(s.rng.normal(0, 1, n), 6000, 12000) * np.exp(-t * 70) * .5
    def shaker(s, vel):
        n = int(.09 * SR); t = np.arange(n) / SR; return vel * bandpass(s.rng.normal(0, 1, n), 4000, 11000) * np.minimum(1, t / .02) * np.exp(-t * 45) * .4
    def rim(s, vel):
        n = int(.08 * SR); t = np.arange(n) / SR
        return vel * (np.sin(2 * np.pi * 1700 * t) * .6 + bandpass(s.rng.normal(0, 1, n), 2000, 6000) * .5) * np.exp(-t * 80)
    # ---- mixdown ----
    def render(s, name, lofi=False, cutoff=9000):
        n_ir = int(2.4 * SR); t = np.arange(n_ir) / SR; wet = np.zeros_like(s.wet)
        for ch in range(2):
            ir = s.rng.normal(0, 1, n_ir) * np.exp(-t * 3.4); ir[: int(.012 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum())
            size = 1 << int(np.ceil(np.log2(s.n + n_ir))); wet[ch] = np.fft.irfft(np.fft.rfft(s.wet[ch], size) * np.fft.rfft(ir, size), size)[: s.n]
        mix = s.dry + .6 * wet
        a, b = int(s.L * SR), int(2 * s.L * SR); loop = mix[:, a:b]           # middle cycle → seamless loop
        for ch in range(2): loop[ch] = highpass(lowpass(loop[ch], cutoff, 1.5), 75)   # phone speakers can't play sub-bass
        if lofi:
            m = loop.shape[1]; crack = np.zeros(m); pos = s.rng.integers(0, m, int(m / SR * 7)); crack[pos] = s.rng.uniform(-1, 1, pos.size)
            crack = bandpass(crack, 800, 5000) * .9 + lowpass(s.rng.normal(0, 1, m), 3000) * .006
            loop += crack * np.abs(loop).max() * .08
        loop = np.tanh(loop / np.abs(loop).max() * 1.4) ; loop = loop / np.abs(loop).max() * .55
        fl = int(.02 * SR); ramp = np.sin(np.linspace(0, np.pi / 2, fl)) ** 2           # 20 ms fades → no click at the loop point
        loop[:, :fl] *= ramp; loop[:, -fl:] *= ramp[::-1]
        path = os.path.join(OUT, f'wn-{name}.wav')
        with wave.open(path, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((loop.T * 32767).astype('<i2').tobytes())
        print('wrote', path, round(loop.shape[1] / SR, 1), 's'); sys.stdout.flush()

def song_rhodes():                                                    # A · lo-fi jazz in C, 76 bpm, swung
    S = Song(1, 16, 76, swing=1.0)
    CH = [(50, [53, 57, 60, 64]), (43, [53, 57, 59, 64]), (48, [52, 55, 59, 62]), (45, [55, 58, 61, 65]),   # Dm9  G13  Cmaj9  A7(b9)
          (50, [53, 57, 60, 64]), (43, [53, 56, 59, 64]), (52, [55, 59, 62, 66]), (45, [55, 57, 61, 64])]   # Dm9  G7(b9) Em9  A13
    MEL = {8: [(0, 76), (1.5, 74), (2, 72)], 9: [(0, 71), (2.5, 74)], 10: [(0, 76), (1.5, 79), (3, 76)], 11: [(1, 73)],
           12: [(0, 77), (1.5, 76), (2, 74)], 13: [(0.5, 72), (2, 71)], 14: [(0, 74), (1.5, 76), (2.5, 79)], 15: [(1, 81), (3, 79)]}
    for c in range(S.cycles):
        for bar in range(16):
            root, voic = CH[bar % 8]; v = S.rng.uniform(.8, 1)
            for beat, dur in ((0, 1.4), (1.5, 1.2)) if bar % 2 == 0 else ((0.5, 1.0), (2.5, 1.3)):
                for k, nn in enumerate(voic): S.add(S.rhodes(nn, dur * S.beat, .34 * v), S.t(c, bar, beat) + k * .012, -.2 + k * .12, .35)
            walk = [root, root + 7, root + 12 if bar % 2 else root + 10, CH[(bar + 1) % 8][0] + (1 if bar % 3 else -1)]
            for b4 in range(4): S.add(S.bass(walk[b4], S.beat * .9, .34 if b4 == 0 else .27), S.t(c, bar, b4), 0, .05)
            for b4 in (0, 2.5) if bar % 2 == 0 else (0, 1.5, 2.5): S.add(S.kick(.32), S.t(c, bar, b4), 0, 0)
            for b4 in (1, 3): S.add(S.brush(.55, long=True), S.t(c, bar, b4), .15, .25)
            for b8 in range(8): S.add(S.hat(.35 if b8 % 2 else .5), S.t(c, bar, b8 / 2), .35, .1)
            for b4, nn in MEL.get(bar, []): S.add(S.rhodes(nn, .9 * S.beat, .42), S.t(c, bar, b4), .1, .45)
    S.render('rhodes', lofi=True, cutoff=6500)

def song_bossa():                                                     # B · bossa nova in C, 132 bpm (felt in two)
    S = Song(2, 16, 132, swing=0.0)
    CH = [(48, [52, 55, 59, 62]), (45, [55, 58, 61, 64]), (50, [53, 57, 60, 64]), (43, [53, 57, 59, 64]),   # Cmaj9 A7b9 Dm9 G13
          (52, [55, 59, 62, 66]), (45, [55, 57, 61, 64]), (50, [53, 57, 60, 64]), (43, [53, 55, 60, 65])]   # Em9 A13 Dm9 G7sus
    COMP = [0, 1.5, 2.5, 3.5]                                                   # syncopated chord stabs
    for c in range(S.cycles):
        for bar in range(16):
            root, voic = CH[(bar // 2) % 8]
            for b4 in (0, 2): S.add(S.pluck(root - 12 + (7 if b4 == 2 else 0), S.beat * 1.6, .5, .35), S.t(c, bar, b4), -.15, .15)   # thumb bass
            for b4 in (COMP if bar % 2 == 0 else [0.5, 1.5, 3]):
                for k, nn in enumerate(voic): S.add(S.pluck(nn, S.beat * .7, .2, .55, .996), S.t(c, bar, b4) + k * .006, .2, .3)
            for b4 in ((0, 1.5, 3) if bar % 2 == 0 else (1, 2.5)): S.add(S.rim(.35), S.t(c, bar, b4), -.3, .15)
            for b16 in range(16): S.add(S.shaker(.35 if b16 % 4 == 2 else .2), S.t(c, bar, b16 / 4), .4, .1)
            S.add(S.kick(.22), S.t(c, bar, 0), 0, 0); S.add(S.kick(.16), S.t(c, bar, 2), 0, 0)
            if bar >= 8 and bar % 2 == 0: S.add(S.glock(voic[-1] + 12, .12), S.t(c, bar, 3.5), .3, .5)
    S.render('bossa', cutoff=8000)

def song_indie():                                                     # C · indie folk in G, 94 bpm, straight
    S = Song(3, 16, 94, swing=0.0)
    CH = [(43, [55, 59, 62, 67]), (47, [54, 57, 62, 66]), (40, [55, 59, 62, 67]), (48, [55, 59, 64, 67])]   # G  Bm7  Em7  Cmaj7
    MEL = [79, 78, 74, 76, 74, 71, 72, 74]
    for c in range(S.cycles):
        for bar in range(16):
            root, voic = CH[(bar // 2) % 4]
            pick = [root, voic[2], voic[1], voic[3], root + 7, voic[2], voic[1], voic[3]]   # Travis-style finger-picking
            for e, nn in enumerate(pick): S.add(S.pluck(nn, S.beat * 1.3, .38 * S.rng.uniform(.85, 1), .5, .9978), S.t(c, bar, e / 2), -.25 + .5 * (e % 2), .3)
            S.add(S.kick(.3), S.t(c, bar, 0), 0, 0); S.add(S.kick(.22), S.t(c, bar, 2.5 if bar % 2 else 2), 0, 0)
            for b8 in range(8): S.add(S.shaker(.4 if b8 % 2 else .25), S.t(c, bar, b8 / 2), .4, .1)
            for b4 in (1, 3): S.add(S.brush(.35), S.t(c, bar, b4), -.2, .2)
            if bar >= 8:
                for k in range(2): S.add(S.glock(MEL[((bar - 8) * 2 + k) % 8] + 12, .16), S.t(c, bar, k * 2), .25, .5)
    S.render('indie', cutoff=9500)

if __name__ == '__main__':
    which = sys.argv[1:] or ['rhodes', 'bossa', 'indie']
    for w in which: {'rhodes': song_rhodes, 'bossa': song_bossa, 'indie': song_indie}[w]()
