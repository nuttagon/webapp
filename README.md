# WN · Wanida & Nattakorn · 16 · 01 · 2027

เว็บไซต์งานแต่ง e-card ไฟล์การ์ดสำหรับพิมพ์ และของชำร่วยพิมพ์ 3D สำหรับงานเลี้ยงในสวน บ้านเคียงสะหวัน
ทุกอย่างอ่านข้อมูลจากไฟล์เดียว: **`assets/js/config.js`** (วัน เวลา สถานที่ กำหนดการ dress code RSVP) และผังโต๊ะจาก **`assets/js/guests.js`**

| โฟลเดอร์ | อะไร |
|---|---|
| `index.html` | เว็บไซต์งานตามดีไซน์ Canva ของวนิดา (ฟอนต์ Pinyon Script · Quattrocento · Roboto Mono): รูปเต็มจอ แถวรูปบนพื้นขาวดำเบลอ การ์ดหน้า-หลัง Program/Reception ของขวัญ RSVP Contact Us · ไม่มีค้นหาโต๊ะ (แขกรับที่หน้างาน) |
| `ecard/` | e-card ส่วนตัว `ecard/?to=ชื่อแขก` — แตะครั่ง เปิดฝา การ์ดเลื่อนออก พลิกดูรายละเอียด แชร์ LINE |
| `garden/` | สวน 3D (three.js) ของงาน — `garden/?guest=1&table=9&name=ชื่อ` = Guest Journey: กล้องเดินจากทางเข้าไปหยุดที่โต๊ะของแขก มีวงแหวน+ป้ายชื่อบอกโต๊ะ เลือกเวลา กลางวัน/แสงเย็น/หัวค่ำ และเดินดู backdrop/บาร์/ขนม (ลิงก์จากผลค้นหาที่นั่งและส่วนสถานที่) ไลบรารีอยู่ใน `garden/vendor/` ไม่ต้องพึ่ง CDN |
| `tools/ecard-links.html` | สร้างลิงก์ e-card รายคนจากรายชื่อแขก + ข้อความ LINE สำเร็จรูป + ตั๋ว Admit One พร้อม QR ส่วนตัวใส่ซอง (A4 10 ใบ) ทำงานในเครื่อง |
| `tools/rsvp-apps-script.gs` | สคริปต์รับ RSVP ลง Google Sheet — วางใน Apps Script ของชีต แล้วใส่ URL ใน `config.js` (rsvp.webhookUrl) |
| `assets/img/og.jpg` | รูปพรีวิวลิงก์ 1200×630 สำหรับ LINE/Facebook (สร้างใหม่ได้จาก e-card หน้าการ์ด) |
| `print/liner/` | ลายซับในซอง 3 แบบ (ข้าวหลามตัดจิตรกรรม · กระเบื้องตึกแถว · แถบฟิล์ม) `python3 print/liner/make_liners.py && node print/liner/render.js` → `print/out/liner/` PNG 300 dpi |
| `print/photo-prints/` | รูปฟิล์ม 54 × 86 มม. 9 ใบ/A4 ใส่ซอง → `print/out/WN_film_prints_54x86_A4.pdf` |
| `print/invitation.html` | การ์ดเชิญ 127 × 178 มม. (+ตัดตก 3 มม.) หน้า/หลัง → `print/out/*.pdf`, PNG 300 dpi |
| `print/inserts.html` | A4: การ์ดที่นั่ง 85 × 55, แท็กของชำร่วย 40 × 70, สติกเกอร์ครั่ง Ø30/Ø25 + ไฟล์ตัด `seal-cut-A4.svg` สำหรับ A2L |
| `favors/` | STL 8 ชิ้นสำหรับ Bambu Lab A2L + สคริปต์ `generate.js` + คู่มือพิมพ์ |
| `docs/guest-experience.md` | ประสบการณ์แขก: ไทม์ไลน์ ในซองมีอะไร ลำดับการเปิด หน้างาน และสิ่งที่ยังต้องกรอก |
| `.claude/` | SessionStart hook สำหรับ Claude Code cloud session |

## เปิดดู / เผยแพร่
- เปิด `index.html` ตรง ๆ ได้ (ไม่ต้อง build) หรือ `python3 -m http.server` แล้วเข้า `http://localhost:8000/`
- เผยแพร่ด้วย GitHub Pages: Settings → Pages → branch `main` / root → `https://nuttagon.github.io/webapp/` (QR ในการ์ดชี้ URL นี้)

## สร้างไฟล์พิมพ์ใหม่ (หลังแก้ config)
```
node print/render.js        # ใช้ Playwright สร้าง PDF/PNG ใน print/out/
```

## RSVP
ตั้งค่าใน `config.js` อย่างใดอย่างหนึ่ง: `rsvp.formUrl` (Google Form), `rsvp.webhookUrl` (Google Apps Script → Sheet) ถ้าว่างทั้งคู่จะเป็นโหมดสาธิต

ชุดออกแบบเดิมในบัญชี Claude: WN Invitation Suite Mockup · WN Envelope · WN Liner Maker · WN Garden Reception
