# WN · Wanida & Nattakorn · 16 · 01 · 2027

เว็บไซต์งานแต่ง e-card ไฟล์การ์ดสำหรับพิมพ์ และของชำร่วยพิมพ์ 3D สำหรับงานเลี้ยงในสวน บ้านเคียงสะหวัน
ทุกอย่างอ่านข้อมูลจากไฟล์เดียว: **`assets/js/config.js`** (วัน เวลา สถานที่ กำหนดการ dress code RSVP) และผังโต๊ะจาก **`assets/js/guests.js`**

| โฟลเดอร์ | อะไร |
|---|---|
| `index.html` | เว็บไซต์งานตามดีไซน์การ์ดจริง: หน้าการ์ดปั๊มนูน + คำอวยพร, ซองลูกไม้บนดอยลี่หัวใจ, คำเชิญแบบหลังการ์ด (พ่อแม่ ชื่อเต็ม กำหนดการ dress code QR แผนที่), Marry me!, ล็อกเก็ตหัวใจ + เรื่องราว, กรอบเงิน/photobooth, สถานที่, ก่อนมางาน + FAQ, **หาโต๊ะบนผังสวน**, ของขวัญ (PromptPay จริง), RSVP บนรูปขาวดำ · รูปจริงใส่ที่ `assets/img/photos/` |
| `ecard/` | e-card ส่วนตัว `ecard/?to=ชื่อแขก` — แตะครั่ง เปิดฝา การ์ดเลื่อนออก พลิกดูรายละเอียด แชร์ LINE |
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
