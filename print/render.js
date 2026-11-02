const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const http = require('http');
// the invitation page reads the card from ../index.html, so serve the repo over http instead of file://
const ROOT = path.resolve(__dirname, '..'); const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok)); const BASE = `http://127.0.0.1:${server.address().port}`;
  const b = await chromium.launch(); const out = '' + __dirname + '/out'; fs.mkdirSync(out, { recursive: true }); const errs = [];
  const pg = await b.newPage({ viewport: { width: 900, height: 1200 } });
  pg.on('pageerror', (e) => errs.push(e.message));
  // invitation 133x184 mm (incl. 3 mm bleed): front + back from the website's card, then the emboss plate
  const inv = async (page, q) => { await page.goto(BASE + '/print/invitation.html' + (q || '')); await page.waitForFunction(() => document.body.dataset.ready === '1'); };
  await inv(pg); await pg.emulateMedia({ media: 'print' });
  await pg.pdf({ path: out + '/WN_invitation_127x178_bleed3.pdf', width: '133mm', height: '184mm', printBackground: true, preferCSSPageSize: true });
  await inv(pg, '?plate=1');
  await pg.pdf({ path: out + '/WN_invitation_emboss-plate_front.pdf', width: '133mm', height: '184mm', printBackground: true, preferCSSPageSize: true });
  // PNG 300 dpi per side
  await pg.emulateMedia({ media: 'screen' });
  for (const [i, side] of ['front', 'back'].entries()) {
    const mmToPx = 300 / 25.4; const w = Math.round(133 * mmToPx);
    await inv(pg); const box = await (await pg.$$('.sheet'))[i].boundingBox();
    const p2 = await b.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: w / box.width }); await p2.emulateMedia({ media: 'print' });
    await inv(p2); await (await p2.$$('.sheet'))[i].screenshot({ path: `${out}/WN_invitation_${side}_300dpi.png` }); await p2.close();
  }
  // inserts A4
  await pg.goto('file://' + __dirname + '/inserts.html'); await pg.waitForTimeout(1500); await pg.evaluate(() => document.fonts.ready);
  await pg.emulateMedia({ media: 'print' });
  await pg.pdf({ path: out + '/WN_inserts_A4.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  await pg.emulateMedia({ media: 'screen' });
  for (const [i, name] of ['seat-cards', 'favor-tags', 'seal-stickers'].entries()) { const el = (await pg.$$('.sheet'))[i]; await el.screenshot({ path: `${out}/preview_${name}.png` }); }
  // website previews for docs
  console.log('errors:', errs.length ? errs : 'none'); await b.close(); server.close();
})();
