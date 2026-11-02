// แปลง HTML ใน print/out/flower-green → PDF A4 + PNG พรีวิว (Playwright/Chromium)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const dir = path.join(__dirname, '..', 'out', 'flower-green'); const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 794, height: 1123 } });
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    await pg.goto('file://' + path.join(dir, f)); await pg.waitForTimeout(600); await pg.evaluate(() => document.fonts.ready);
    const stem = f.replace(/\.html$/, '');
    await pg.pdf({ path: path.join(dir, stem + '.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
    await pg.screenshot({ path: path.join(dir, 'preview_' + stem + '.png'), fullPage: true });
    console.log('✓', stem + '.pdf');
  }
  await b.close();
})();
