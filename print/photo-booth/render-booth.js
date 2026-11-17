// Photo booth templates for Oboun Photo Booth (print 300 dpi, PNG with transparent photo windows)
//   node print/photo-booth/render-booth.js
// Writes print/photo-booth/out/:
//   WN_booth_<layout>_<colour>.png          overlay for the shop: frame + text, photo windows transparent
//   preview_<layout>_<colour>.jpg            the same frame with sample pre-wedding photos in the windows
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const WN = fs.readFileSync(path.join(ROOT, 'assets/js/monogram.js'), 'utf8').match(/WN_PATH\s*=\s*"([^"]+)"/)[1];
const photo = (n) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'assets/img/photos', n + '.jpg')).toString('base64');

const COLOURS = {
  ivory: { paper: '#F8F1E4', ink: '#2B2925', soft: '#8A817A', rule: 'rgba(43,41,37,.22)' },
  film: { paper: '#1E1C19', ink: '#EADFCB', soft: 'rgba(234,223,203,.62)', rule: 'rgba(234,223,203,.25)' },
};

// every size at 300 dpi; windows are [x, y, w, h]
const LAYOUTS = {
  // 4x6 landscape, one pose: closest to the reference (cream border, date and hashtag in the top corners, names below)
  '4x6-1pose': { w: 1800, h: 1200, wins: [[60, 92, 1680, 900]], photos: ['pw-13'],
    top: { y: 58, size: 26, inset: 64 }, foot: { y: 992, h: 208, names: 92, sub: 22, mono: 0 } },
  // 4x6 portrait, two poses (shop layout K)
  '4x6-2pose': { w: 1200, h: 1800, wins: [[60, 92, 1080, 720], [60, 836, 1080, 720]], photos: ['pw-11@50% 38%', 'pw-06'],
    top: { y: 58, size: 24, inset: 64 }, foot: { y: 1556, h: 244, names: 96, sub: 22, mono: 0 } },
  // 2x6 strip, three poses (shop layouts A/B). The shop prints two strips side by side on one 4x6.
  '2x6-3pose': { w: 600, h: 1800, wins: [[34, 64, 532, 400], [34, 484, 532, 400], [34, 904, 532, 400]], photos: ['pw-13', 'pw-11@50% 38%', 'pw-06'],
    top: { y: 42, size: 19, inset: 36 }, foot: { y: 1304, h: 496, names: 70, sub: 18, mono: 132 } },
};

const page = (L, C, withPhotos) => {
  const holes = L.wins.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h-${w}z`).join('');
  const pics = withPhotos ? L.wins.map(([x, y, w, h], i) => { const [n, pos] = L.photos[i].split('@'); return `<img src="${photo(n)}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;object-fit:cover;object-position:${pos || '50% 50%'}">`; }).join('') : '';
  const F = L.foot, T = L.top;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Quattrocento:wght@400&family=Roboto+Mono:wght@300;400&display=block">
<style>html,body{margin:0;background:transparent}
#c{position:relative;width:${L.w}px;height:${L.h}px;overflow:hidden}
.t{position:absolute;font-family:'Roboto Mono',monospace;font-weight:300;letter-spacing:.24em;color:${C.soft};white-space:nowrap}
.foot{position:absolute;left:0;right:0;top:${F.y}px;height:${F.h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(F.sub * .55)}px;color:${C.ink};text-align:center}
.names{font-family:'Pinyon Script',cursive;font-size:${F.names}px;line-height:1.05}
.sub{font-family:'Roboto Mono',monospace;font-weight:300;font-size:${F.sub}px;letter-spacing:.32em;color:${C.soft};padding-left:.32em}
.mono{width:${F.mono}px;fill:${C.ink};opacity:.9}
.rule{width:${Math.round(F.names * 1.1)}px;height:1px;background:${C.rule}}
</style></head><body><div id="c">
${pics}
<svg width="${L.w}" height="${L.h}" style="position:absolute;inset:0"><path fill="${C.paper}" fill-rule="evenodd" d="M0 0H${L.w}V${L.h}H0z${holes}"/></svg>
<div class="t" style="left:${T.inset}px;top:${T.y - T.size * .6}px;font-size:${T.size}px">16 · 01 · 27</div>
<div class="t" style="right:${T.inset}px;top:${T.y - T.size * .6}px;font-size:${T.size}px;letter-spacing:.14em">#EternallyWN</div>
<div class="foot">
  ${F.mono ? `<svg class="mono" viewBox="0 0 1420 1040"><path fill-rule="evenodd" d="${WN}"/></svg>` : ''}
  <div class="names">${F.mono ? 'Wanida<br>&amp; Nattakorn' : 'Wanida &amp; Nattakorn'}</div>
  <div class="rule"></div>
  <div class="sub">${F.mono ? 'MUKDAHAN' : 'BAAN KIANG SAWAN · MUKDAHAN'}</div>
</div>
</div></body></html>`;
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1900, height: 1900 } });
  for (const [ln, L] of Object.entries(LAYOUTS)) for (const [cn, C] of Object.entries(COLOURS)) {
    for (const withPhotos of [false, true]) {
      await p.setContent(page(L, C, withPhotos), { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      const el = await p.$('#c');
      const file = withPhotos ? `preview_${ln}_${cn}.jpg` : `WN_booth_${ln}_${cn}.png`;
      await el.screenshot({ path: path.join(OUT, file), omitBackground: !withPhotos, ...(withPhotos ? { type: 'jpeg', quality: 88 } : {}) });
      console.log(file);
    }
  }
  await b.close();
})();
