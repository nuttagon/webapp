#!/usr/bin/env node
/**
 * สร้างไฟล์ STL ของชำร่วย/ของใช้ในงาน WN สำหรับพิมพ์บน Bambu Lab A2L (เตียง 330 × 320 มม.)
 * ใช้: npm install @jscad/modeling @jscad/stl-serializer @jscad/svg-deserializer   แล้ว   node favors/generate.js [--all-tables]
 * ทุกชิ้นวางราบบนเตียง ไม่ต้องใช้ support · หน่วยเป็นมิลลิเมตร
 */
const fs = require('fs'), path = require('path');
const m = require('@jscad/modeling');
const { cuboid, cylinder, roundedCuboid, sphere } = m.primitives;
const { translate, rotateX, rotateZ, scale, mirrorX, center, align } = m.transforms;
const { union, subtract, intersect } = m.booleans;
const { extrudeLinear } = m.extrusions;
const { expand } = m.expansions;
const { vectorText } = m.text;
const { geom2, path2 } = m.geometries;
const { measureBoundingBox } = m.measurements;
const stl = require('@jscad/stl-serializer');
const OUT = path.join(__dirname, 'stl'); fs.mkdirSync(OUT, { recursive: true });

// ---------- helpers ----------
function heart2d(width) {
  // รูปหัวใจจากสมการพาราเมตริก ปรับสัดส่วนให้กว้าง = width (ลบจุดซ้ำใกล้ปลายแหลม)
  const raw = [];
  for (let i = 0; i < 200; i++) {
    const t = (i / 200) * Math.PI * 2;
    raw.push([16 * Math.pow(Math.sin(t), 3), 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)]);
  }
  const pts = raw.filter((p, i) => i === 0 || Math.hypot(p[0] - raw[i - 1][0], p[1] - raw[i - 1][1]) > 0.15);
  const g = geom2.fromPoints(pts.reverse());
  const bb = measureBoundingBox(g); const s = width / (bb[1][0] - bb[0][0]);
  return center({ relativeTo: [0, 0, 0] }, scale([s, s, 1], g));
}
function textGeom(str, height, strokeW) {
  // ตัวอักษรแบบเส้น (vector font) → ขยายเส้นเป็นแถบหนา strokeW
  const segs = vectorText({ height, letterSpacing: 0.05, align: 'center' }, str);
  const parts = [];
  for (const seg of segs) {
    const pts = seg.filter((p, i) => i === 0 || Math.hypot(p[0] - seg[i - 1][0], p[1] - seg[i - 1][1]) > 1e-4);
    if (pts.length < 2) continue;
    parts.push(expand({ delta: strokeW / 2, corners: 'round', segments: 12 }, path2.fromPoints({ closed: false }, pts)));
  }
  return center({ relativeTo: [0, 0, 0] }, union(...parts));
}
// ---------- โมโนแกรม WN จาก SVG (คำสั่ง M / C / Z แบบ absolute) → geom2 พร้อมรู ----------
function svgPathToContours(d) {
  const toks = d.match(/[MCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi); const contours = []; let cur = null, i = 0, cmd = '';
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    const t = toks[i];
    if (/^[MCZ]$/i.test(t)) { cmd = t.toUpperCase(); i++; if (cmd === 'Z') { if (cur && cur.length > 2) contours.push(cur); cur = null; } continue; }
    if (cmd === 'M') { cur = [[num(), -num()]]; cmd = 'L'; }
    else if (cmd === 'L') { cur.push([num(), -num()]); }
    else if (cmd === 'C') {
      const p0 = cur[cur.length - 1], c1 = [num(), -num()], c2 = [num(), -num()], p3 = [num(), -num()];
      const n = Math.max(2, Math.ceil(Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) / 6));
      for (let k = 1; k <= n; k++) { const u = k / n, v = 1 - u; cur.push([v * v * v * p0[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p3[1]]); }
    }
  }
  if (cur && cur.length > 2) contours.push(cur);
  return contours.map((c) => {
    const pts = c.filter((p, j) => j === 0 || Math.hypot(p[0] - c[j - 1][0], p[1] - c[j - 1][1]) > 1e-3);
    if (Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1e-3) pts.pop();
    let area = 0; for (let j = 0; j < pts.length; j++) { const a = pts[j], b = pts[(j + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
    return { pts: area < 0 ? pts.reverse() : pts, area: Math.abs(area) / 2 };
  });
}
let MONO = null;
try {
  const svg = fs.readFileSync(path.join(__dirname, '..', 'assets', 'img', 'wn-monogram.svg'), 'utf8');
  const d = svg.match(/ d="([^"]+)"/)[1];
  const cs = svgPathToContours(d).sort((a, b) => b.area - a.area);
  const outer = geom2.fromPoints(cs[0].pts); const holes = cs.slice(1).map((c) => geom2.fromPoints(c.pts));
  MONO = center({ relativeTo: [0, 0, 0] }, holes.length ? subtract(outer, ...holes) : outer);
  console.log('monogram contours:', cs.length, 'outlines after subtract:', geom2.toOutlines(MONO).length);
} catch (e) { console.warn('อ่านโมโนแกรมไม่ได้ ใช้ตัวอักษร W&N แทน:', e.message); }
function monogram(width) {
  if (!MONO) return textGeom('W&N', width * 0.45, width * 0.06);
  const bb = measureBoundingBox(MONO); const s = width / (bb[1][0] - bb[0][0]);
  return scale([s, s, 1], MONO);
}
function save(name, geom) {
  const data = stl.serialize({ binary: true }, geom);
  const buf = Buffer.concat(data.map((d) => Buffer.from(d)));
  fs.writeFileSync(path.join(OUT, name), buf);
  const bb = measureBoundingBox(geom).map((v) => v.map((n) => +n.toFixed(1)));
  console.log(`✓ ${name}  ${(buf.length / 1024).toFixed(0)} KB  bbox ${bb[0]} → ${bb[1]}`);
}
const onBed = (g) => { const bb = measureBoundingBox(g); return translate([0, 0, -bb[0][2]], g); };

// ---------- 1. พวงกุญแจหัวใจ WN (ของชำร่วยหลัก ใส่ซองได้ หนา 4 มม.) ----------
function keychain() {
  const T = 4, body = extrudeLinear({ height: T }, heart2d(44));
  const hole = translate([-11, 11, 0], cylinder({ radius: 2.4, height: T * 3, segments: 32 }));
  const ring = translate([-11, 11, 0], subtract(cylinder({ radius: 4.6, height: T, segments: 40 }), cylinder({ radius: 2.4, height: T * 3, segments: 32 })));
  const engrave = translate([1.5, -2.5, T - 0.8], extrudeLinear({ height: 2 }, monogram(22)));
  return onBed(subtract(union(body, translate([0, 0, T / 2], ring)), hole, engrave));
}
// ---------- 2. ที่ตั้งการ์ดชื่อ (place card holder) ฐานหัวใจ มีร่องเสียบการ์ด ----------
function placecard() {
  const T = 7, base = extrudeLinear({ height: T }, heart2d(52));
  const slot = translate([0, -3, T], rotateX(Math.PI / 180 * 12, cuboid({ size: [34, 1.3, 9] })));
  const engrave = translate([0, -16, T - 0.6], extrudeLinear({ height: 2 }, monogram(12)));
  return onBed(subtract(base, slot, engrave));
}
// ---------- 3. ถาดใส่แหวน/เครื่องประดับ หัวใจ 70 มม. ----------
function ringDish() {
  const outer = extrudeLinear({ height: 12 }, heart2d(72));
  const inner = translate([0, 0, 2.2], extrudeLinear({ height: 12 }, expand({ delta: -2, corners: 'round', segments: 16 }, heart2d(72))));
  const engrave = translate([0, -4, 2.2 - 0.6], extrudeLinear({ height: 2 }, monogram(22)));
  return onBed(subtract(outer, inner, engrave));
}
// ---------- 4. หัวตราปั๊มครั่ง WN Ø30 มม. (กลับด้านโมโนแกรม) + ด้ามจับ ----------
function waxStamp() {
  // หัวตรา: หน้าประทับอยู่ด้านบน (พิมพ์หงาย ลายคม) ใต้หัวมีร่องกลม Ø18.4 ลึก 1.6 สำหรับติดกาวกับฐานด้าม
  const head = cylinder({ radius: 15, height: 6, segments: 96 });
  const rim = translate([0, 0, 3.4], subtract(cylinder({ radius: 15, height: 0.8, segments: 96 }), cylinder({ radius: 13.6, height: 2, segments: 96 })));
  const relief = translate([0, 0, 3.4], extrudeLinear({ height: 0.8 }, mirrorX(monogram(17))));
  const socket = translate([0, 0, -3 + 0.8], cylinder({ radius: 9.2, height: 1.6, segments: 96 }));
  // ด้าม: ฐานแบน Ø18 วางบนเตียง ก้าน Ø12 ยาว 28 ปลายเป็นลูกกลม Ø16 พิมพ์ตั้งโดยไม่ต้องใช้ support
  const handle = union(
    cylinder({ radius: 9, height: 3, segments: 64, center: [0, 0, 1.5] }),
    cylinder({ radius: 6, height: 28, segments: 48, center: [0, 0, 3 + 14] }),
    sphere({ radius: 8, segments: 40, center: [0, 0, 3 + 28 + 5] }),
  );
  return { head: onBed(subtract(union(head, rim, relief), socket)), handle: onBed(handle) };
}
// ---------- 5. พิมพ์กดคุกกี้หัวใจ 65 มม. (ของชำร่วยคู่กับคุกกี้ในซอง) ----------
function cookieCutter() {
  const h = heart2d(65);
  const wall = subtract(extrudeLinear({ height: 18 }, expand({ delta: 0.9, corners: 'round', segments: 12 }, h)), extrudeLinear({ height: 18 }, h));
  const flange = translate([0, 0, 16.4], subtract(extrudeLinear({ height: 1.6 }, expand({ delta: 5, corners: 'round', segments: 12 }, h)), extrudeLinear({ height: 1.6 }, h)));
  return onBed(union(wall, flange));
}
// ---------- 6. ป้ายเลขโต๊ะตั้งโต๊ะ (ตัวเลขนูน) ----------
function tableNumber(label) {
  const plate = roundedCuboid({ size: [70, 3, 90], roundRadius: 1.2, segments: 16 });
  const foot = translate([0, 9, -45 + 2], roundedCuboid({ size: [70, 22, 4], roundRadius: 1.2, segments: 16 }));
  const num = translate([0, -1.5, 8], rotateX(Math.PI / 2, extrudeLinear({ height: 1.4 }, textGeom(String(label), 34, 4.2))));
  const mono = translate([0, -1.5, -28], rotateX(Math.PI / 2, extrudeLinear({ height: 1 }, monogram(16))));
  return onBed(union(plate, foot, num, mono));
}
// ---------- 7. ที่วางโทรศัพท์ WN (ของชำร่วยใช้จริง) ----------
function phoneStand() {
  const base = roundedCuboid({ size: [64, 72, 3.2], roundRadius: 1.5, segments: 16 });
  const back = translate([0, 20, 30], rotateX(-Math.PI / 180 * 18, roundedCuboid({ size: [64, 3.2, 62], roundRadius: 1.2, segments: 16 })));
  const lip = translate([0, -30, 6], roundedCuboid({ size: [64, 3.2, 9], roundRadius: 1, segments: 12 }));
  const chargeGap = translate([0, -30, 6], cuboid({ size: [16, 6, 20] }));
  const engrave = translate([0, 14, 3.2 - 0.6], extrudeLinear({ height: 2 }, monogram(22)));
  return onBed(subtract(union(base, back, lip), chargeGap, engrave));
}

// ---------- run ----------
save('wn-keychain-heart.stl', keychain());
save('wn-placecard-holder.stl', placecard());
save('wn-ring-dish.stl', ringDish());
const ws = waxStamp(); save('wn-wax-seal-stamp-head.stl', ws.head); save('wn-wax-seal-stamp-handle.stl', ws.handle);
save('wn-cookie-cutter-heart.stl', cookieCutter());
save('wn-phone-stand.stl', phoneStand());
save('wn-table-number-12.stl', tableNumber(12));
if (process.argv.includes('--all-tables')) {
  for (const l of ['A', 'B', ...Array.from({ length: 30 }, (_, i) => i + 1)]) save(`tables/wn-table-${l}.stl`, tableNumber(l));
}
