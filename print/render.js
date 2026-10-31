const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const out = '' + __dirname + '/out'; fs.mkdirSync(out, { recursive: true }); const errs = [];
  const pg = await b.newPage({ viewport: { width: 900, height: 1200 } });
  pg.on('pageerror', (e) => errs.push(e.message));
  // invitation 133x184 mm (incl. 3 mm bleed)
  await pg.goto('file://' + __dirname + '/invitation.html'); await pg.waitForTimeout(1500); await pg.evaluate(() => document.fonts.ready);
  await pg.emulateMedia({ media: 'print' });
  await pg.pdf({ path: out + '/WN_invitation_127x178_bleed3.pdf', width: '133mm', height: '184mm', printBackground: true, preferCSSPageSize: true });
  // PNG 300 dpi per side
  await pg.emulateMedia({ media: 'screen' });
  const sheets = await pg.$$('.sheet');
  for (const [i, sh] of sheets.entries()) {
    const mmToPx = 300 / 25.4; const w = Math.round(133 * mmToPx), h = Math.round(184 * mmToPx);
    const box = await sh.boundingBox(); const scale = w / box.width;
    const p2 = await b.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: scale });
    await p2.goto('file://' + __dirname + '/invitation.html'); await p2.waitForTimeout(1500); await p2.evaluate(() => document.fonts.ready);
    const el = (await p2.$$('.sheet'))[i]; await el.screenshot({ path: `${out}/WN_invitation_${i === 0 ? 'front' : 'back'}_300dpi.png` }); await p2.close();
  }
  // inserts A4
  await pg.goto('file://' + __dirname + '/inserts.html'); await pg.waitForTimeout(1500); await pg.evaluate(() => document.fonts.ready);
  await pg.emulateMedia({ media: 'print' });
  await pg.pdf({ path: out + '/WN_inserts_A4.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  await pg.emulateMedia({ media: 'screen' });
  for (const [i, name] of ['seat-cards', 'favor-tags', 'seal-stickers'].entries()) { const el = (await pg.$$('.sheet'))[i]; await el.screenshot({ path: `${out}/preview_${name}.png` }); }
  // website previews for docs
  console.log('errors:', errs.length ? errs : 'none'); await b.close();
})();
