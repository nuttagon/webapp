// SVG → PNG 300 dpi (190 x 262 mm = 2244 x 3094 px) สำหรับโหลดเข้า WN Liner Maker หรือพิมพ์ตรง
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const dir = path.join(__dirname, '..', 'out', 'liner'); const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 2244, height: 3094 } });
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8').replace(/width="190mm" height="262mm"/, 'width="2244" height="3094"');
    await pg.setContent(`<html><body style="margin:0">${svg}</body></html>`); await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.join(dir, f.replace('.svg', '_300dpi.png')), clip: { x: 0, y: 0, width: 2244, height: 3094 } });
    console.log('png', f);
  }
  await b.close();
})();
