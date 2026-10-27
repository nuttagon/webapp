#!/usr/bin/env python3
"""
WN · การ์ดดอกไม้ QR เวอร์ชันสีเขียว (เข้าชุดกับแท็กดอกโบตั๋น)
----------------------------------------------------------------
ใช้เส้นตัดเดิมจากไฟล์ WN_FLOWERQR_A4x6_cut_only.svg (6 ดอกต่อ A4) จึงใช้ไฟล์ตัดเดิมกับ A2L ได้เลย

สร้าง 2 แบบ:
  A) ONE-SIDED  พิมพ์หน้าเดียว: ดอกเขียว + WN ขาว + วันที่ + QR PromptPay ในแผ่นขาวมุมมนกลางดอก
     → พิมพ์ 1 ครั้ง ตัด 1 ครั้ง ไม่ต้องกลับหน้า   (แนะนำ)
  B) TWO-SIDED  หน้า = ดอกเขียว WN ขาวแบบเดิม · หลัง = ขาว ตัวหนังสือเขียว + QR (กลับกระดาษด้านยาว)

รัน:  python3 print/flower/make_flower_green.py   → print/out/flower-green/
ต้องมี: shapely, segno, playwright (เบราว์เซอร์ Chromium)  ·  ตรวจ QR ด้วย opencv ถ้ามี
"""
import os, re, json, math, subprocess, sys
import numpy as np
from shapely.geometry import Polygon, box, Point
from shapely.ops import polylabel, unary_union
from shapely import affinity
import segno

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "print", "out", "flower-green")
CUT_SVG = os.path.join(HERE, "WN_FLOWERQR_A4x6_cut_only.svg")

# ───────── พารามิเตอร์ (แก้ได้) ─────────
GREEN      = "#5F6B55"     # สีเขียวของแท็กดอกโบตั๋น (วัดจากไฟล์พิมพ์ WN_TAG)
GREEN_INK  = "#46503F"     # หมึกเขียวเข้มสำหรับตัวหนังสือด้านหลัง / QR
PAPER      = "#FFFFFF"
QR_PAYLOAD = "00020101021129390016A000000677010111031500499925251856753037645802TH6304A315"  # PromptPay จาก make_red_suite.py
QR_SIZE    = 17.5          # mm
QR_QUIET   = 2.0           # mm ขอบขาวรอบ QR
ACCOUNT_TH = "ณัฐกรณ์ & วนิดา"
DATE       = "16 · 01 · 2027"
BLEED      = 3.0           # mm สีพื้นเลยเส้นตัด
SAFE       = 5.0           # mm งานพิมพ์สำคัญห่างจากเส้นตัด
WN_W_1S    = 24.0          # mm ความกว้าง WN (แบบหน้าเดียว)
WN_W_2S    = 34.0          # mm ความกว้าง WN (แบบสองหน้า เหมือนเดิม)
# ────────────────────────────────────────

def parse_paths(svg_text):
    return [Polygon([tuple(map(float, p.split(','))) for p in re.findall(r'[ML]([\d.\-]+,[\d.\-]+)', d)]).buffer(0)
            for d in re.findall(r'<path d="([^"]+)"', svg_text)]

def poly_d(P, fmt="{:.3f}"):
    def ring(coords):
        pts = list(coords)
        return "M" + " L".join(f"{fmt.format(x)},{fmt.format(y)}" for x, y in pts[:-1]) + "Z"
    polys = P.geoms if P.geom_type == "MultiPolygon" else [P]
    return " ".join(ring(p.exterior.coords) + "".join(ring(i.coords) for i in p.interiors) for p in polys)

WN_D = re.search(r' d="([^"]+)"', open(os.path.join(ROOT, "assets", "img", "wn-monogram.svg"), encoding="utf-8").read()).group(1)
WN_VB = (1420.0, 1040.0)
WN_BBOX = (36.2, 40.7, 1387.0, 1005.6)   # กรอบจริงของตัวอักษรใน viewBox

def wn_el(cx, cy, width, color):
    """โมโนแกรมกว้าง width มม. กึ่งกลางที่ (cx, cy) · คืน (svg, box)"""
    s = width / (WN_BBOX[2] - WN_BBOX[0]); h = (WN_BBOX[3] - WN_BBOX[1]) * s
    bx = cx - width / 2 - WN_BBOX[0] * s; by = cy - h / 2 - WN_BBOX[1] * s
    el = f'<path transform="translate({bx:.3f},{by:.3f}) scale({s:.6f})" d="{WN_D}" fill="{color}" fill-rule="evenodd"/>'
    return el, box(cx - width / 2, cy - h / 2, cx + width / 2, cy + h / 2)

def qr_el(cx, cy, size, ink):
    q = segno.make(QR_PAYLOAD, error="m", micro=False)
    m = q.matrix; n = len(m); cell = size / n
    x0, y0 = cx - size / 2, cy - size / 2
    d = ""
    for r, row in enumerate(m):
        for c, v in enumerate(row):
            if v: d += f"M{x0 + c * cell:.3f},{y0 + r * cell:.3f}h{cell:.3f}v{cell:.3f}h-{cell:.3f}z"
    return f'<path d="{d}" fill="{ink}"/>', box(x0, y0, x0 + size, y0 + size), n

def text_el(txt, x, y, size, color, family, weight=400, style="normal", tracking=0, anchor="middle", est_w=None):
    """SVG text (มม.) · คืน (svg, box โดยประมาณ)"""
    ls = f' letter-spacing="{tracking}"' if tracking else ""
    el = (f'<text x="{x:.3f}" y="{y:.3f}" font-family="{family}" font-size="{size:.3f}" font-weight="{weight}" font-style="{style}" '
          f'fill="{color}" text-anchor="{anchor}"{ls}>{txt}</text>')
    w = est_w if est_w is not None else len(txt) * size * 0.55 + tracking * len(txt)
    bx = box(x - w / 2, y - size * 0.75, x + w / 2, y + size * 0.25) if anchor == "middle" else box(x, y - size * 0.75, x + w, y + size * 0.25)
    return el, bx

CAPS = "'Cormorant Garamond', serif"
ITAL = "'Cormorant Garamond', serif"
THAI = "'Noto Serif Thai', serif"
SANS = "'Montserrat', sans-serif"

def check_inside(label, boxes, P, safe):
    inner = P.buffer(-safe)
    bad = [b for b in boxes if not inner.contains(b)]
    gap = min(P.exterior.distance(b) for b in boxes)
    print(f"  {label}: {len(boxes)} items · ระยะใกล้เส้นตัดสุด {gap:.1f} mm · {'OK' if not bad else 'ล้ำพื้นที่ปลอดภัย %d ชิ้น' % len(bad)}")
    return not bad

def flower_frames(P):
    """ศูนย์กลาง 'ใจดอก' และรัศมีวงกลมใหญ่สุดที่ซ่อนในดอก"""
    c = polylabel(P, 0.2); R = P.exterior.distance(c)
    return c, R

def front_one_sided(P):
    """หน้าเดียว: พื้นเขียว · WN ขาวด้านบนของใจดอก · แผ่น QR ขาวด้านล่าง · วันที่"""
    c, R = flower_frames(P)
    els, boxes = [], []
    els.append(f'<path d="{poly_d(P.buffer(BLEED, join_style=1))}" fill="{GREEN}"/>')
    scale = 1.0
    while True:
        wnw = WN_W_1S * scale; qr = max(16.0, QR_SIZE * scale); panel = qr + 2 * QR_QUIET
        wn_c = (c.x, c.y - R * 0.43 * scale)
        qr_c = (c.x, c.y + R * 0.30)
        el, bwn = wn_el(wn_c[0], wn_c[1], wnw, PAPER)
        bpanel = box(qr_c[0] - panel / 2, qr_c[1] - panel / 2, qr_c[0] + panel / 2, qr_c[1] + panel / 2)
        date_y = qr_c[1] + panel / 2 + 4.6
        _, bdate = text_el(DATE, c.x, date_y, 3.0, PAPER, CAPS, tracking=0.9, est_w=28)
        inner = P.buffer(-SAFE)
        if all(inner.contains(b) for b in (bwn, bpanel, bdate)) or scale < 0.72:
            break
        scale -= 0.04
    els.append(el); boxes.append(bwn)
    # แผ่นขาวมุมมน + QR
    els.append(f'<rect x="{bpanel.bounds[0]:.3f}" y="{bpanel.bounds[1]:.3f}" width="{panel:.3f}" height="{panel:.3f}" rx="2.2" fill="{PAPER}"/>')
    qel, bq, n = qr_el(qr_c[0], qr_c[1], qr, GREEN_INK); els.append(qel); boxes.append(bpanel)
    # ป้ายเล็กบนแผ่นขาว
    lab, bl = text_el("QR GIFT · PROMPTPAY", c.x, bpanel.bounds[1] - 1.6, 1.9, PAPER, SANS, weight=500, tracking=0.45, est_w=26)
    els.append(lab); boxes.append(bl)
    nm, bn = text_el(ACCOUNT_TH, c.x, bpanel.bounds[3] + 3.4 + 2.2, 2.6, PAPER, THAI, est_w=26)
    del_, bdate = text_el(DATE, c.x, bpanel.bounds[3] + 3.4 + 2.2 + 4.6, 2.6, PAPER, CAPS, tracking=0.8, est_w=24)
    els += [nm, del_]; boxes += [bn, bdate]
    ok = check_inside("FRONT (one-sided)", boxes, P, SAFE)
    return "".join(els), ok, dict(scale=scale, wn=wnw, qr=qr, modules=n, R=R)

def front_two_sided(P):
    c, R = flower_frames(P)
    els, boxes = [], []
    els.append(f'<path d="{poly_d(P.buffer(BLEED, join_style=1))}" fill="{GREEN}"/>')
    el, b = wn_el(c.x, c.y - 4.0, WN_W_2S, PAPER); els.append(el); boxes.append(b)
    d, bd = text_el(DATE, c.x, c.y + 16.5 + 2.6, 3.6, PAPER, CAPS, tracking=1.0, est_w=34); els.append(d); boxes.append(bd)
    ok = check_inside("FRONT (two-sided)", boxes, P, SAFE)
    return "".join(els), ok

def back_two_sided(P):
    """ด้านหลังสีขาว หมึกเขียว · วางบนดอกที่กลับซ้าย-ขวา (พิมพ์กลับกระดาษด้านยาว)"""
    c, R = flower_frames(P)
    els, boxes = [], []
    ax = c.x - 3.0; y0 = c.y
    t, b = text_el("QR GIFT", ax, y0 - 18.3, 2.4, GREEN_INK, CAPS, tracking=0.95, est_w=14); els.append(t); boxes.append(b)
    els.append(f'<path d="M{ax - 3.2:.2f},{y0 - 16.0:.2f} L{ax + 3.2:.2f},{y0 - 16.0:.2f}" stroke="{GREEN}" stroke-width="0.22"/>')
    for en, th, yy in (("NAME", "ชื่อ", -11.0), ("TIME", "เวลาโอน", -5.2)):
        half = 17.6; xa = ax - half
        t1, b1 = text_el(f"{en} / ", xa, y0 + yy, 2.2, GREEN_INK, SANS, anchor="start", tracking=0.15, est_w=7.5)
        t2, b2 = text_el(f"{th} :", xa + 7.5, y0 + yy, 2.4, GREEN_INK, THAI, anchor="start", est_w=9)
        xs = xa + 7.5 + 9 + 1.2
        els += [t1, t2, f'<path d="M{xs:.2f},{y0 + yy + 0.5:.2f} L{ax + half:.2f},{y0 + yy + 0.5:.2f}" stroke="{GREEN}" stroke-width="0.25"/>']
        boxes += [b1, b2, box(xs, y0 + yy, ax + half, y0 + yy + 0.8)]
    qel, bq, n = qr_el(ax, y0 - 1.4 + QR_SIZE / 2, QR_SIZE, GREEN_INK); els.append(qel); boxes.append(bq)
    t, b = text_el("PROMPTPAY", ax, bq.bounds[3] + 2.9, 1.7, GREEN_INK, CAPS, tracking=0.55, est_w=12); els.append(t); boxes.append(b)
    t, b = text_el(ACCOUNT_TH, ax, bq.bounds[3] + 6.4, 2.4, GREEN_INK, THAI, est_w=22); els.append(t); boxes.append(b)
    t, b = text_el("Thank you for your", ax, bq.bounds[3] + 10.6, 2.75, GREEN_INK, ITAL, style="italic", est_w=24); els.append(t); boxes.append(b)
    t, b = text_el("love and support", ax, bq.bounds[3] + 14.0, 2.75, GREEN_INK, ITAL, style="italic", est_w=22); els.append(t); boxes.append(b)
    ok = check_inside("BACK (two-sided)", boxes, P, 6.0)
    return "".join(els), ok

def sheet_html(title, bodies, bg=PAPER):
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@400;500&family=Noto+Serif+Thai:wght@400;500&display=swap">
<style>@page{{size:A4;margin:0}}html,body{{margin:0;background:{bg}}}svg{{display:block;width:210mm;height:297mm}}</style></head>
<body><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297">{"".join(bodies)}</svg></body></html>"""

def main():
    os.makedirs(OUT, exist_ok=True)
    flowers = parse_paths(open(CUT_SVG, encoding="utf-8").read())
    print(f"ดอกไม้ {len(flowers)} ดอกจากไฟล์ตัด · ขนาดดอก {np.ptp(np.array(flowers[0].exterior.coords), axis=0).round(1)} mm")
    c, R = flower_frames(flowers[0]); print(f"  ใจดอก {c.x:.1f},{c.y:.1f} · รัศมีวงในสุด {R:.1f} mm")
    A_front = [];  B_front = []; B_back = []
    ok_all = True
    for i, P in enumerate(flowers):
        s, ok, info = front_one_sided(P); A_front.append(s); ok_all &= ok
        if i == 0: print("  one-sided layout:", {k: (round(v, 1) if isinstance(v, float) else v) for k, v in info.items()})
        s, ok = front_two_sided(P); B_front.append(s); ok_all &= ok
        Pm = affinity.scale(P, -1, 1, origin=(105, 0))      # กลับซ้าย-ขวาบนหน้ากระดาษ (flip long edge)
        s, ok = back_two_sided(Pm); B_back.append(s); ok_all &= ok
    pages = {
        "WN_FLOWERQR_GREEN_1SIDED_A4x6_print.html": sheet_html("WN flower QR green one-sided", A_front),
        "WN_FLOWERQR_GREEN_2SIDED_A4x6_1_FRONT_print.html": sheet_html("WN flower QR green front", B_front),
        "WN_FLOWERQR_GREEN_2SIDED_A4x6_2_BACK_flipLongEdge.html": sheet_html("WN flower QR green back", B_back),
    }
    for name, html in pages.items():
        open(os.path.join(OUT, name), "w", encoding="utf-8").write(html)
    import shutil; shutil.copy(CUT_SVG, os.path.join(OUT, "WN_FLOWERQR_A4x6_cut_only.svg"))
    print("HTML พร้อม →", OUT, "· ทุกชิ้นในพื้นที่ปลอดภัย:", ok_all)
    return list(pages)

if __name__ == "__main__":
    if "--green" in sys.argv: GREEN = sys.argv[sys.argv.index("--green") + 1]
    main()
