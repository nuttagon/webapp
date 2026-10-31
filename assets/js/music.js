/* WN background music — plays softly after the guest's first tap (browsers and iPhone block sound before that).
   A small ♪ button turns it off/on and the choice is remembered. Song file and volume: window.WEDDING.music in config.js */
(() => {
  const M = (window.WEDDING || {}).music || {}; if (!M.src) return;
  const me = document.currentScript; const base = (me && me.dataset.base) || '';
  const pos = (me && me.dataset.pos) || 'bottom';
  const css = document.createElement('style');
  css.textContent = `.wn-music{position:fixed;${pos === 'top' ? 'top:max(12px,env(safe-area-inset-top,0px))' : 'bottom:max(16px,env(safe-area-inset-bottom,0px))'};right:max(14px,env(safe-area-inset-right,0px));z-index:70;width:42px;height:42px;border-radius:50%;border:1px solid rgba(43,41,37,.25);background:rgba(248,241,228,.92);color:#2B2925;display:grid;place-items:center;cursor:pointer;box-shadow:0 6px 18px -8px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:0}
.wn-music svg{width:18px;height:18px;fill:currentColor}
.wn-music .bars{display:none;gap:2px;align-items:flex-end;height:14px}.wn-music .bars i{width:3px;background:currentColor;border-radius:1px;animation:wnb 1s ease-in-out infinite}
.wn-music .bars i:nth-child(2){animation-delay:-.35s}.wn-music .bars i:nth-child(3){animation-delay:-.7s}
.wn-music.on .bars{display:flex}.wn-music.on svg{display:none}
@keyframes wnb{0%,100%{height:4px}50%{height:14px}}
@media (prefers-reduced-motion:reduce){.wn-music .bars i{animation:none;height:9px}}`;
  document.head.appendChild(css);
  const a = new Audio(); a.src = base + M.src; a.loop = true; a.preload = 'none';
  const TARGET = M.volume || .35;
  // iPhone ignores audio.volume, so volume runs through a Web Audio gain node when available
  let ctx = null, gain = null;
  const setupGraph = () => { if (ctx) return; try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); gain = ctx.createGain(); gain.gain.value = 0; ctx.createMediaElementSource(a).connect(gain).connect(ctx.destination); } catch (e) { ctx = null; gain = null; } };
  const vol = () => (gain ? gain.gain.value : a.volume);
  let want = true; try { want = localStorage.getItem('wn-music') !== 'off'; } catch (e) {}
  const save = () => { try { localStorage.setItem('wn-music', want ? 'on' : 'off'); } catch (e) {} };
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'wn-music';
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v10.6A4 4 0 1 0 14 17V8h4V3h-6z"/></svg><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>';
  const label = () => { const on = !a.paused; btn.classList.toggle('on', on); btn.setAttribute('aria-label', on ? 'ปิดเพลง' : 'เปิดเพลง'); btn.title = (on ? 'ปิดเพลง' : 'เปิดเพลง') + (M.title ? ' · ' + M.title : ''); };
  let fadeT = 0;
  const fade = (to, d, done) => {
    if (gain && ctx) { const g = gain.gain, now = ctx.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(to, now + d / 1000); clearTimeout(fadeT); if (done) fadeT = setTimeout(done, d); return; }
    cancelAnimationFrame(fadeT); const from = a.volume, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / d); a.volume = from + (to - from) * k; if (k < 1) fadeT = requestAnimationFrame(step); else if (done) done(); }; fadeT = requestAnimationFrame(step); };
  const play = () => {
    setupGraph(); if (ctx && ctx.state === 'suspended') ctx.resume();
    if (gain) gain.gain.value = TARGET * .45; else a.volume = TARGET * .45;          // audible at once, then settle to the target
    const p = a.play(); if (p && p.then) p.then(() => { fade(TARGET, 500); label(); }).catch(() => label()); else label(); };
  const stop = () => fade(0, 600, () => { a.pause(); label(); });
  btn.addEventListener('click', (e) => { e.stopPropagation(); if (a.paused) { want = true; play(); } else { want = false; stop(); } save(); });
  const evs = ['click', 'touchend', 'keydown'];
  const first = (e) => { if (e.target && e.target.closest && e.target.closest('.wn-music')) return; evs.forEach((t) => document.removeEventListener(t, first, true)); if (want && a.paused) play(); };
  evs.forEach((t) => document.addEventListener(t, first, true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!a.paused) { a.pause(); a.dataset.resume = '1'; } } else if (a.dataset.resume) { delete a.dataset.resume; play(); } });
  // fetch the song quietly once the page has loaded, so it is ready the moment the guest taps
  const warm = () => { if (!want) return; a.preload = 'auto'; try { a.load(); } catch (e) {} };
  if (document.readyState === 'complete') setTimeout(warm, 600); else window.addEventListener('load', () => setTimeout(warm, 600));
  label(); (document.body || document.documentElement).appendChild(btn);
})();
