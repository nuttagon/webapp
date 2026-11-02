"""ลายซับในซอง WN · ธีมรูป pre-wedding (เมืองเก่ากรุงเทพฯ บนฟิล์ม)
สร้าง SVG ขนาดพิมพ์ 190 x 262 มม. (ครอบซับในซอง 184 x 133 + ฝา 115 มม. พร้อมเผื่อ) แล้ว render.js แปลงเป็น PNG 300 dpi
A  mural-harlequin  ข้าวหลามตัดฟ้าจิตรกรรมจีน + ดาวแดงโคมเต็งลั้ง (แรงบันดาลใจจากรูปตัวอย่างที่ชอบ)
B  shophouse-tile   กระเบื้องตึกแถวชิโน-โปรตุกีส ฟ้าคราม เขียวหยก แดงโคม
C  contact-sheet    แถบฟิล์มรูป pre-wedding ขาวดำโทนอุ่นบนพื้นดำ
"""
import base64, io, math, os, sys
from PIL import Image, ImageOps
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'print', 'out', 'liner'); os.makedirs(OUT, exist_ok=True)
W, H = 190, 262                      # มม.
CREAM, PAPER = '#F2EADB', '#F7F2E8'
MURAL, MURAL_PALE, MURAL_MID = '#3C5A8C', '#AFC0DA', '#8EA5C9'
LANTERN, JADE, TUNGSTEN, FILM = '#A8372A', '#2F5446', '#C8893B', '#141312'

def star8(cx, cy, r, ri, fill):
    pts = []
    for i in range(16):
        a = math.pi / 8 * i - math.pi / 2; rr = r if i % 2 == 0 else ri
        pts.append(f'{cx + rr * math.cos(a):.2f},{cy + rr * math.sin(a):.2f}')
    return f'<polygon points="{" ".join(pts)}" fill="{fill}"/>'

PAPER_FILTER = '''<filter id="paint" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".08" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.1"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .3 0 0 0 0 .25 0 0 0 0 .2 0 0 0 .10 0"/></filter>'''

def harlequin_tile(tw=31, th=44, painted=True):
    """one repeat: pale-blue diamond on cream, red rule through the touching points, 8-point star at each touch"""
    f = ' filter="url(#paint)"' if painted else ''
    s = f'<rect width="{tw}" height="{th}" fill="{CREAM}"/>'
    s += f'<polygon points="{tw/2},0 {tw},{th/2} {tw/2},{th} 0,{th/2}" fill="{MURAL_PALE}" stroke="{MURAL_MID}" stroke-width=".35"{f}/>'
    s += f'<polygon points="{tw/2},{th*.16} {tw*.84},{th/2} {tw/2},{th*.84} {tw*.16},{th/2}" fill="none" stroke="#FFFFFF" stroke-opacity=".45" stroke-width=".3"/>'
    for x in (0, tw):
        s += f'<line x1="{x}" y1="0" x2="{x}" y2="{th}" stroke="{LANTERN}" stroke-width="1.1"/>'
        s += star8(x, th / 2, 6.8, 2.1, LANTERN)
        s += f'<circle cx="{x}" cy="{th/2}" r="1" fill="{TUNGSTEN}"/>'
    return s

def svg_harlequin():
    tw, th = 31, 44
    body = f'<defs>{PAPER_FILTER}<pattern id="p" width="{tw}" height="{th}" patternUnits="userSpaceOnUse" x="{(W % tw)/2 - tw/2}" y="0">{harlequin_tile(tw, th)}</pattern></defs>'
    body += f'<rect width="{W}" height="{H}" fill="url(#p)"/><rect width="{W}" height="{H}" filter="url(#grain)"/>'
    return body

def svg_tile():
    t = 38; c = t / 2
    tile = f'<rect width="{t}" height="{t}" fill="{CREAM}"/>'
    for (x, y) in ((0, 0), (t, 0), (0, t), (t, t)):                        # quarter circles → full jade rounds where 4 tiles meet
        tile += f'<circle cx="{x}" cy="{y}" r="8.2" fill="{JADE}"/><circle cx="{x}" cy="{y}" r="5.4" fill="none" stroke="{CREAM}" stroke-width=".6"/><circle cx="{x}" cy="{y}" r="2.1" fill="{LANTERN}"/>'
    tile += f'<rect x="1.4" y="1.4" width="{t-2.8}" height="{t-2.8}" fill="none" stroke="{MURAL}" stroke-width=".55" rx="1"/>'
    for a in (0, 90):                                                        # four-petal flower, mural blue
        tile += f'<ellipse cx="{c}" cy="{c-5.6}" rx="3.3" ry="5.6" fill="{MURAL}" transform="rotate({a} {c} {c})"/><ellipse cx="{c}" cy="{c+5.6}" rx="3.3" ry="5.6" fill="{MURAL}" transform="rotate({a} {c} {c})"/>'
        tile += f'<ellipse cx="{c}" cy="{c-5.6}" rx="1.3" ry="3.4" fill="{MURAL_PALE}" transform="rotate({a} {c} {c})"/><ellipse cx="{c}" cy="{c+5.6}" rx="1.3" ry="3.4" fill="{MURAL_PALE}" transform="rotate({a} {c} {c})"/>'
    for a in (45, 135, 225, 315):                                            # jade leaves on the diagonals
        tile += f'<ellipse cx="{c}" cy="{c-8.6}" rx="1.5" ry="3.2" fill="{JADE}" transform="rotate({a} {c} {c})"/>'
    tile += f'<circle cx="{c}" cy="{c}" r="2.6" fill="{LANTERN}"/><circle cx="{c}" cy="{c}" r="1" fill="{TUNGSTEN}"/>'
    body = f'<defs>{PAPER_FILTER}<pattern id="p" width="{t}" height="{t}" patternUnits="userSpaceOnUse" x="{(W % t)/2}" y="0"><g filter="url(#paint)">{tile}</g></pattern></defs>'
    body += f'<rect width="{W}" height="{H}" fill="url(#p)"/><rect width="{W}" height="{H}" filter="url(#grain)"/>'
    return body

def photo_b64(name, w, h):
    im = Image.open(os.path.join(ROOT, 'assets', 'img', 'photos', name + '.jpg')).convert('L')
    im = ImageOps.fit(im, (w, h), Image.LANCZOS); im = ImageOps.autocontrast(im, cutoff=1)
    warm = ImageOps.colorize(im, black='#17130F', white='#F4EEE2', mid='#8C8070')
    b = io.BytesIO(); warm.save(b, 'JPEG', quality=86); return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

def svg_contact():
    cols, colw = 4, W / 4; fw, fh, gap = 33, 49.5, 6.5                       # 2:3 frames on 35mm-like strips
    order = ['pw-01', 'pw-02', 'pw-03', 'pw-04', 'pw-05']
    imgs = {n: photo_b64(n, 660, 990) for n in order}
    s = f'<rect width="{W}" height="{H}" fill="{FILM}"/>'
    k = 0
    for ci in range(cols):
        x0 = ci * colw; fx = x0 + (colw - fw) / 2; yoff = -12 + (ci % 2) * 26
        s += f'<rect x="{x0+1.2}" y="0" width="{colw-2.4}" height="{H}" fill="#1E1B18"/>'
        for y in range(-6, H + 6, 4):                                          # sprocket holes both edges
            for hx in (x0 + 2.6, x0 + colw - 4.6):
                s += f'<rect x="{hx:.2f}" y="{y}" width="2" height="2.6" rx=".5" fill="{FILM}"/>'
        y = yoff; k = ci * 3 + 1
        while y < H:
            n = order[k % len(order)]; k += 1
            s += f'<image href="{imgs[n]}" x="{fx:.2f}" y="{y:.2f}" width="{fw}" height="{fh}" preserveAspectRatio="xMidYMid slice"/>'
            s += f'<text x="{x0+colw-1.6:.2f}" y="{y+fh/2:.2f}" transform="rotate(90 {x0+colw-1.6:.2f} {y+fh/2:.2f})" font-family="Courier New, monospace" font-size="2.1" fill="{TUNGSTEN}" text-anchor="middle" letter-spacing=".4">WN 400 · {k:02d} ▸ {k:02d}A</text>'
            s += f'<text x="{x0+1.2:.2f}" y="{y+fh/2:.2f}" transform="rotate(-90 {x0+1.2:.2f} {y+fh/2:.2f})" font-family="Courier New, monospace" font-size="2.1" fill="{TUNGSTEN}" text-anchor="middle" letter-spacing=".4">16·01·2027  #ETERNALLYWN</text>'
            y += fh + gap
    return f'<defs>{PAPER_FILTER}</defs>' + s + f'<rect width="{W}" height="{H}" filter="url(#grain)" opacity=".6"/>'

def wrap(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">{body}</svg>'

if __name__ == '__main__':
    for name, fn in [('A_mural-harlequin', svg_harlequin), ('B_shophouse-tile', svg_tile), ('C_contact-sheet', svg_contact)]:
        open(os.path.join(OUT, f'WN_liner_{name}.svg'), 'w').write(wrap(fn()))
        print('wrote', name)
    # small seamless tile for the website (no displacement, so it repeats cleanly)
    tw, th = 31, 44
    web = f'<svg xmlns="http://www.w3.org/2000/svg" width="{tw}" height="{th}" viewBox="0 0 {tw} {th}">{harlequin_tile(tw, th, painted=False)}</svg>'
    open(os.path.join(ROOT, 'assets', 'img', 'liner-harlequin.svg'), 'w').write(web)
    print('wrote web tile')
