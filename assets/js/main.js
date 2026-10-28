/* WN wedding site — reads window.WEDDING, window.TABLES, window.ZONES, window.GUESTS */
(() => {
  const W = window.WEDDING, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement; html.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const params = new URLSearchParams(location.search);
  const toName = (params.get('to') || '').trim().slice(0, 60);
  const PH = /\[[^\]]*\]/;                                  // ข้อความในวงเล็บเหลี่ยม = ยังเป็นตัวอย่าง
  const clean = (s) => String(s || '').replace(/\s*\[[^\]]*\]\s*/g, ' ').replace(/\s+/g, ' ').trim();

  // ---------- monogram ----------
  $$('svg[data-wn]').forEach((svg) => { svg.setAttribute('viewBox', '0 0 1420 1040'); svg.innerHTML = `<path fill-rule="evenodd" d="${window.WN_PATH}"/>`; });

  // ---------- text fills from config ----------
  const C = W.couple;
  $$('[data-fill]').forEach((el) => {
    const map = {
      namesEn: `${C.bride.en} <span class="amp">&amp;</span> ${C.groom.en}`,
      namesTh: `${C.bride.th} · ${C.groom.th}`,
      dateShort: W.date.short, dateTh: W.date.th, dateEn: W.date.en,
      venue: W.venue.name, venueEn: W.venue.nameEn, address: clean(W.venue.address),
      hashtag: C.hashtag, theme: C.theme, themeTh: C.themeTh,
      parking: W.venue.parking, transit: W.venue.transit, hotel: W.venue.hotelDeal, venueNotes: W.venue.notes,
      rsvpDeadline: W.rsvp.deadline, giftNote: W.gift.note, promptpayName: W.gift.promptpayName,
      dressTitle: W.dressCode.title, dressDesc: W.dressCode.desc, capacity: W.venue.capacity,
      blessing: C.blessing, inviteText: C.inviteText, apology: C.apology, province: W.venue.province || '',
      brideEn: C.bride.en, groomEn: C.groom.en, brideFull: C.bride.full, groomFull: C.groom.full,
      brideNick: C.bride.nick ? `(${C.bride.nick})` : '', groomNick: C.groom.nick ? `(${C.groom.nick})` : '',
      brideParents: (C.bride.parents || []).map(esc).join('<br>'), groomParents: (C.groom.parents || []).map(esc).join('<br>'),
      startTime: (W.schedule[0] || {}).time || '',
    };
    if (!(el.dataset.fill in map)) return;
    const v = map[el.dataset.fill];
    if (typeof v === 'string' && PH.test(v)) { const row = el.closest('dl > div, li') || el; row.hidden = true; return; }   // ซ่อนข้อมูลที่ยังไม่ได้กรอก
    el.innerHTML = v;
  });
  $$('a[data-href="map"]').forEach((a) => (a.href = W.venue.mapUrl));
  $$('a[data-href="ecard"]').forEach((a) => (a.href = W.site.ecardUrl));
  if ($('#giftQr')) $('#giftQr').src = W.gift.promptpayQr;

  // ---------- intro envelope ----------
  const intro = $('#intro'), env = $('#env');
  let seen = false; try { seen = sessionStorage.getItem('wn-intro') === '1'; } catch (e) {}
  const dismiss = () => { intro.classList.add('gone'); document.body.classList.remove('intro-open'); try { sessionStorage.setItem('wn-intro', '1'); } catch (e) {} };
  const skipIntro = params.has('from') || !!toName || location.hash.length > 1;   // มาจาก e-card หรือลิงก์ตรง → ไม่ต้องเปิดซองซ้ำ
  if (!intro) {} else if (seen || reduce || skipIntro) { intro.remove(); } else {
    document.body.classList.add('intro-open'); window.scrollTo(0, 0);
    let opened = false;
    const open = () => { if (opened) return; opened = true; env.classList.add('open'); setTimeout(dismiss, 2100); };
    env.addEventListener('click', open);
    env.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    $('#skipIntro').addEventListener('click', dismiss);
    setTimeout(open, 1600);
  }

  // ---------- countdown ----------
  const cd = $('#countdown');
  if (cd) {
    const target = new Date(W.date.startLocal).getTime();
    const cells = ['d', 'h', 'm', 's'].map((k) => cd.querySelector(`[data-cd="${k}"]`));
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      if (diff === 0) { cd.innerHTML = '<div class="done">Today is the day</div>'; return; }
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5); diff -= h * 36e5;
      const m = Math.floor(diff / 6e4); const s = Math.floor((diff - m * 6e4) / 1e3);
      [d, h, m, s].forEach((v, i) => (cells[i].textContent = String(v).padStart(2, '0')));
      setTimeout(tick, 1000);
    };
    tick();
  }

  // ---------- calendar ----------
  const pad = (n) => String(n).padStart(2, '0');
  const fmtUtc = (iso) => { const d = new Date(iso); return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`; };
  const fmtLocal = (iso) => iso.replace(/[-:]/g, '').slice(0, 15);
  const title = `งานแต่งงาน ${C.bride.en} & ${C.groom.en}`;
  const desc = `${W.date.th} · ${W.venue.name}\n${W.site.url}`;
  const gcal = $('#gcal');
  if (gcal) gcal.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmtUtc(W.date.startLocal)}/${fmtUtc(W.date.endLocal)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(clean(W.venue.name + ' ' + W.venue.address))}&ctz=Asia/Bangkok`;
  const ics = $('#ics');
  if (ics) ics.addEventListener('click', () => {
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WN//Wedding//TH', 'BEGIN:VEVENT', `UID:wn-${W.date.iso}@wedding`, `DTSTAMP:${fmtUtc(new Date().toISOString())}`,
      `DTSTART;TZID=Asia/Bangkok:${fmtLocal(W.date.startLocal)}`, `DTEND;TZID=Asia/Bangkok:${fmtLocal(W.date.endLocal)}`, `SUMMARY:${title}`,
      `LOCATION:${clean(W.venue.name + ' ' + W.venue.address)}`, `DESCRIPTION:${desc.replace(/\n/g, '\\n')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = 'WN-wedding.ics'; document.body.appendChild(a); a.click(); a.remove();
  });

  // ---------- petals ----------
  const cv = $('#petals');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d'); const colors = ['#EBD0DF', '#F2C5CE', '#E7B7C8', '#BCDCCB', '#D9C29A'];
    let w = 0, h = 0, petals = [], raf = 0;
    const mk = (first) => ({ x: Math.random() * w, y: first ? Math.random() * h : -20, r: 5 + Math.random() * 7, a: Math.random() * 6.28, va: (Math.random() - .5) * .03, vy: .25 + Math.random() * .5, sway: Math.random() * 6.28, c: colors[Math.floor(Math.random() * colors.length)] });
    const resize = () => { const p = cv.parentElement; w = cv.width = p.clientWidth; h = cv.height = p.clientHeight; petals = Array.from({ length: Math.min(34, Math.round(w / 32)) }, () => mk(true)); };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.y += p.vy; p.sway += .012; p.x += Math.sin(p.sway) * .35; p.a += p.va;
        if (p.y > h + 20) Object.assign(p, mk(false));
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = .75; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .55, 0, 0, 6.283); ctx.fill(); ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    new ResizeObserver(resize).observe(cv.parentElement);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else draw(); });
  }

  // ---------- story / schedule / dress / faq / steps ----------
  const story = $('#storyList');
  if (story) story.innerHTML = W.story.filter((s) => !PH.test(s.year + s.title + s.text)).map((s) => `<div class="item reveal pending"><div class="year">${esc(s.year)}</div><div class="dot"></div><div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></div>`).join('');
  const sched = $('#scheduleList');
  if (sched) sched.innerHTML = W.schedule.map((s) => `<div class="row reveal pending"><time>${esc(s.time)}</time><div><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></div></div>`).join('');
  const sw = (list) => (list || []).map((c) => `<i style="background:${c.hex}" title="${esc(c.name)}"></i>`).join('');
  $$('[data-swatches="ladies"]').forEach((el) => (el.innerHTML = sw(W.dressCode.ladies)));
  $$('[data-swatches="gentlemen"]').forEach((el) => (el.innerHTML = sw(W.dressCode.gentlemen)));
  const grid = $('#schedGrid');
  if (grid) grid.innerHTML = W.schedule.map((s) => `<div><b>${esc(s.time)} น.</b><span>${esc(s.title)}</span></div>`).join('');
  // cross-stitch rose ornaments (9x9 pixel map · x = stitch)
  const ROSE = ['....gg...', '...g.gg..', '..ppp.g..', '.prrrp.g.', 'prRRRrp..', '.prRrp.g.', '..ppp.gg.', '...g.g...', '..gg.....'];
  const COL = { g: '#8E9E86', p: '#E7B7C8', r: '#C98A9A', R: '#A86370' };
  $$('svg.stitch').forEach((svg) => {
    svg.setAttribute('viewBox', '0 0 90 90'); let d = '';
    ROSE.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') d += `<path d="M${x * 10 + 2},${y * 10 + 2}l6,6m0,-6l-6,6" stroke="${COL[ch]}" stroke-width="2.2" stroke-linecap="round"/>`; }));
    svg.innerHTML = d;
  });
  const faq = $('#faqList');
  if (faq) faq.innerHTML = W.faq.map((f) => `<details><summary>${esc(f.q)}</summary><div class="a">${esc(f.a)}</div></details>`).join('');

  // ---------- seating plan ----------
  const plan = $('#plan');
  const T = window.TABLES || [], Z = window.ZONES || [], G = window.GUESTS || [];
  const X = (x) => 500 + x * 20, Y = (z) => 470 - z * 20;
  const byId = Object.fromEntries(T.map((t) => [String(t.id), t]));
  if (plan) {
    let s = '';
    // ground
    s += `<rect x="0" y="0" width="1000" height="940" fill="#EEF0E6"/>`;
    for (let i = 0; i < 16; i++) s += `<rect x="${i * 62.5}" y="0" width="31" height="940" fill="rgba(255,255,255,.14)"/>`;
    for (const z of Z) {
      const cx = X(z.x), cy = Y(z.z);
      if (z.kind === 'tree') { s += `<circle cx="${cx}" cy="${cy}" r="${z.r * 20}" fill="#9DB08A" opacity=".55"/><circle cx="${cx - 4}" cy="${cy - 5}" r="${z.r * 12}" fill="#B5C49E" opacity=".6"/>`; if (z.label) s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10" fill="#4C5B3F">${esc(z.label)}</text>`; continue; }
      if (z.kind === 'aisle') { s += `<rect x="${cx - z.w * 10}" y="${Y(14.2)}" width="${z.w * 20}" height="${(14.2 + 13.8) * 20}" fill="#F2ECE1"/><text x="${cx}" y="${Y(-12.6)}" text-anchor="middle" font-size="10" fill="#8A7650" transform="rotate(-90 ${cx} ${Y(-12.6)})">${esc(z.label)}</text>`; continue; }
      const w = z.w * 20, h = z.h * 20;
      const fill = z.kind === 'building' ? '#DCD6CA' : z.id === 'backdrop' ? '#C4858F' : z.id === 'sweet' ? '#F4EEE3' : '#FBF9F5';
      s += `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="rgba(61,59,56,.25)"/>`;
      const vertical = h > w * 1.6;
      s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" fill="${z.id === 'backdrop' ? '#fff' : '#3D3B38'}"${vertical ? ` transform="rotate(-90 ${cx} ${cy})"` : ''}>${esc(z.label)}</text>`;
    }
    s += `<text x="500" y="${Y(20.4)}" text-anchor="middle" font-size="10" fill="#fff" font-family="Montserrat" letter-spacing="3">WANIDA &amp; NATTAKORN</text>`;
    for (const t of T) {
      const cx = X(t.x), cy = Y(t.z), lbl = `${t.label} · ${t.group} · ${t.seats} ที่`;
      s += `<g class="tbl" data-id="${t.id}" tabindex="0" role="button" aria-label="${esc(lbl)}"><title>${esc(lbl)}</title>`;
      if (t.kind === 'long') {
        const L = t.len * 20;
        for (let i = 0; i < 25; i++) { const y = cy - L / 2 + 6 + i * 12; s += `<circle cx="${cx - 20}" cy="${y}" r="3.2" fill="#E9E4D9" stroke="#8A8275" stroke-width=".6"/><circle cx="${cx + 20}" cy="${y}" r="3.2" fill="#E9E4D9" stroke="#8A8275" stroke-width=".6"/>`; }
        s += `<rect class="top" x="${cx - 12}" y="${cy - L / 2}" width="24" height="${L}" rx="2" fill="#FFFFFF" stroke="#3D3B38" stroke-width="1.2"/>`;
        s += `<text class="lbl" x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" font-family="Montserrat" fill="#3D3B38" transform="rotate(-90 ${cx} ${cy})">${esc(t.label)}</text>`;
      } else {
        for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + .314; s += `<circle cx="${cx + Math.cos(a) * 27}" cy="${cy + Math.sin(a) * 27}" r="3.6" fill="${t.kind === 'vip' ? '#E6CDD6' : '#E9E4D9'}" stroke="#8A8275" stroke-width=".6"/>`; }
        if (t.kind === 'vip') s += `<circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="#C9AB78" stroke-width="2"/>`;
        s += `<circle class="top" cx="${cx}" cy="${cy}" r="18" fill="#FFFFFF" stroke="#3D3B38" stroke-width="1.2"/>`;
        s += `<text class="lbl" x="${cx}" y="${cy + 4.5}" text-anchor="middle" font-size="13" font-family="Montserrat" fill="#3D3B38">${t.id}</text>`;
      }
      s += `</g>`;
    }
    s += `<circle id="ping" class="ping" cx="-100" cy="-100" r="24" style="display:none"/>`;
    s += `<text x="12" y="928" font-size="10" fill="#6B665D">ด้านบน = เนิน backdrop · ด้านล่าง = อาคารที่พัก · VIP วงทอง · ผังตามแบบ Garden Reception v3</text>`;
    plan.innerHTML = s;
    const list = $('#tableList');
    if (list) list.innerHTML = T.map((t) => `<div><b>${esc(t.label)}</b><span>${esc(t.group)}</span></div>`).join('');
  }
  const result = $('#seatResult'), input = $('#seatInput'), sug = $('#suggest');
  const norm = (s) => String(s).toLowerCase().replace(/^คุณ\s*/, '').replace(/\s+/g, ' ').trim();
  const highlight = (id, text) => {
    $$('.plan .tbl').forEach((g) => g.classList.toggle('hit', String(g.dataset.id) === String(id)));
    const t = byId[String(id)]; const ping = $('#ping');
    if (t && ping) { ping.setAttribute('cx', X(t.x)); ping.setAttribute('cy', Y(t.z)); ping.style.display = reduce ? 'none' : ''; }
    if (result) result.innerHTML = text;
  };
  const showGuest = (g, opts = {}) => {
    const t = byId[String(g.table)];
    highlight(g.table, `<b>${esc(g.name)}</b><span class="tbl">${esc(t ? t.label : 'โต๊ะ ' + g.table)}</span>${t ? esc(t.group) : ''} · ${g.side === 'bride' ? 'ฝั่งเจ้าสาว' : g.side === 'groom' ? 'ฝั่งเจ้าบ่าว' : 'เพื่อนบ่าวสาว'}<br><a class="btn gold" style="margin-top:12px" href="garden/?guest=1&table=${encodeURIComponent(g.table)}&name=${encodeURIComponent(g.name.replace(/^คุณ\s*/, ''))}">เดินไปดูโต๊ะใน 3D</a>`);
    if (input) input.value = g.name; sug.hidden = true;
    const r = $('.plan-wrap').getBoundingClientRect(); if (!opts.quiet && (r.top < 0 || r.bottom > innerHeight)) $('.plan-wrap').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  };
  if (input) {
    let matches = [];
    input.addEventListener('input', () => {
      const q = norm(input.value);
      if (q.length < 2) { sug.hidden = true; return; }
      matches = G.filter((g) => norm(g.name).includes(q)).slice(0, 7);
      if (!matches.length) { sug.innerHTML = `<button type="button" disabled>ไม่พบชื่อ ลองพิมพ์เฉพาะชื่อจริง หรือสอบถามที่จุดลงทะเบียน</button>`; sug.hidden = false; return; }
      sug.innerHTML = matches.map((g, i) => { const t = byId[String(g.table)]; return `<button type="button" data-i="${i}"><span>${esc(g.name)}</span><small>${esc(t ? t.label : g.table)}</small></button>`; }).join('');
      sug.hidden = false;
    });
    sug.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (b) showGuest(matches[+b.dataset.i]); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (matches[0]) showGuest(matches[0]); } if (e.key === 'Escape') sug.hidden = true; });
    document.addEventListener('click', (e) => { if (!e.target.closest('.seat-search')) sug.hidden = true; });
    if (toName) { const q = norm(toName); const hit = G.find((g) => norm(g.name) === q) || G.find((g) => norm(g.name).includes(q)); if (hit) showGuest(hit, { quiet: true }); else input.value = toName; }
  }
  if (plan) plan.addEventListener('click', (e) => {
    const g = e.target.closest('.tbl'); if (!g) return; const t = byId[g.dataset.id];
    const names = G.filter((x) => String(x.table) === String(t.id)).map((x) => x.name);
    highlight(t.id, `<b>${esc(t.label)}</b><span class="tbl">${t.seats} ที่นั่ง</span>${esc(t.group)}${names.length ? ' · ' + esc(names.slice(0, 6).join(', ')) + (names.length > 6 ? ' …' : '') : ''}`);
  });
  if (plan) plan.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tbl')) { e.preventDefault(); e.target.click(); } });

  // ---------- RSVP ----------
  const form = $('#rsvpForm');
  if (form) {
    const guestSel = $('#rsvpName');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries()); data.at = new Date().toISOString(); data.from = toName; data.ua = navigator.userAgent;
      const status = $('#rsvpStatus'); status.textContent = 'กำลังส่งคำตอบ…';
      try {
        if (W.rsvp.webhookUrl) { await fetch(W.rsvp.webhookUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(data) }); }
        else if (W.rsvp.formUrl) { window.open(W.rsvp.formUrl, '_blank', 'noopener'); }
        else { try { const all = JSON.parse(localStorage.getItem('wn-rsvp') || '[]'); all.push(data); localStorage.setItem('wn-rsvp', JSON.stringify(all)); } catch (err) {} }
        form.hidden = true; const th = $('#rsvpThanks'); th.hidden = false;
        th.querySelector('[data-name]').textContent = data.name || '';
        th.querySelector('[data-msg]').textContent = data.attending === 'yes' ? 'เราเก็บที่นั่งไว้ให้แล้ว แล้วพบกันในสวน' : 'ขอบคุณที่แจ้งให้ทราบ เราจะคิดถึงคุณในวันนั้น';
        if (!W.rsvp.webhookUrl && !W.rsvp.formUrl) {   // ยังไม่ตั้งปลายทาง → ให้แขกส่งสรุปคำตอบทาง LINE แทน ไม่ให้คำตอบหาย
          const sum = `RSVP งานแต่ง ${C.bride.nick} & ${C.groom.nick}\nชื่อ: ${data.name}\nมาร่วมงาน: ${data.attending === 'yes' ? 'มา' : 'ไม่มา'}\nผู้ใหญ่ ${data.adults} · เด็ก ${data.kids}\nอาหาร: ${data.diet || 'ทานได้ทุกอย่าง'}\nหมายเหตุ: ${data.note || '-'}`;
          const fb = th.querySelector('[data-demo]'); fb.hidden = false;
          fb.innerHTML = `<span>ระบบรับคำตอบอัตโนมัติยังไม่เปิด กรุณาส่งข้อความนี้ให้เราทาง LINE</span><br><a class="btn" style="margin-top:10px" target="_blank" rel="noopener" href="https://line.me/R/share?text=${encodeURIComponent(sum)}">ส่งคำตอบทาง LINE</a>`;
        }
        th.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      } catch (err) { status.textContent = 'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง หรือแจ้งทาง LINE / โทร ' + (W.rsvp.phone || ''); }
    });
    if (guestSel) { guestSel.setAttribute('list', 'guestNames'); if (toName && !guestSel.value) guestSel.value = toName; }   // เติมชื่อจาก e-card (?to=)
    const dl = $('#guestNames'); if (dl) dl.innerHTML = G.map((g) => `<option value="${esc(g.name)}"></option>`).join('');
  }

  // ---------- reveal on scroll ----------
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    revealEls.forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) el.classList.add('pending'); else el.classList.remove('pending'); });
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.remove('pending'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
    setTimeout(() => revealEls.forEach((el) => el.classList.remove('pending')), 4000);
  } else revealEls.forEach((el) => el.classList.remove('pending'));

  // ---------- nav current ----------
  const links = $$('.nav a[href^="#"]'); const secs = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if (secs.length && 'IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) links.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false')); }), { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach((s) => io2.observe(s));
  }
})();
