# การ์ดดอกไม้ QR · เวอร์ชันสีเขียว (เข้าชุดแท็กดอกโบตั๋น)

สีเขียว `#5F6B55` วัดจากไฟล์พิมพ์แท็ก · ใช้เส้นตัดเดิม `WN_FLOWERQR_A4x6_cut_only.svg` (6 ดอก/A4 ขนาดดอก 88 × 84.6 มม.) จึงใช้ไฟล์ตัดเดิมใน Bambu Suite ได้เลย
QR เป็น PromptPay payload เดียวกับชุดแดง (ตรวจแล้วถอดรหัสได้ครบ 6/6 ดอกจาก PDF ที่ 400 dpi)

## ไฟล์ใน `print/out/flower-green/`
| ไฟล์ | ใช้เมื่อ |
|---|---|
| `WN_FLOWERQR_GREEN_1SIDED_A4x6_print.pdf` | **พิมพ์หน้าเดียว** (แนะนำ): ดอกเขียว + WN ขาว + แผ่นขาว QR/ชื่อบัญชี + วันที่ → พิมพ์ 1 ครั้ง ตัด 1 ครั้ง ไม่ต้องกลับหน้า |
| `WN_FLOWERQR_GREEN_2SIDED_A4x6_1_FRONT_print.pdf` | แบบสองหน้า หน้าแรก: ดอกเขียว WN ขาว + วันที่ (เหมือนชุดแดง) |
| `WN_FLOWERQR_GREEN_2SIDED_A4x6_2_BACK_flipLongEdge.pdf` | หน้าหลัง (ขาว หมึกเขียว): QR GIFT · ช่องชื่อ/เวลาโอน · QR · PROMPTPAY · ขอบคุณ — ใส่กระดาษกลับด้านยาว (flip long edge) |
| `WN_FLOWERQR_A4x6_cut_only.svg` | เส้นตัดสำหรับ A2L (ตำแหน่งตรงกับ PDF ทุกไฟล์) |
| `preview_*.png` | ภาพตัวอย่างแต่ละแผ่น |

## พิมพ์
Epson L3250 · กระดาษ matte 200–250 แกรม · ตั้ง **100% / Actual size** ห้าม fit to page · เปิด print background
สีพื้นเลยเส้นตัด 3 มม. ตัวหนังสือและ QR ห่างเส้นตัด ≥ 5 มม. จึงตัดคลาดได้ 2–3 มม. โดยไม่เสีย

## สร้างใหม่ (หลังแก้ค่า)
```
pip install shapely segno pillow          # opencv-python-headless ถ้าจะตรวจ QR
python3 print/flower/make_flower_green.py # → HTML
node print/flower/render.js               # → PDF + PNG (Playwright)
```
ค่าที่แก้ได้บนหัวไฟล์ `make_flower_green.py`: สี (`GREEN`, `GREEN_INK`), `QR_PAYLOAD`, ขนาด QR, ชื่อบัญชี, วันที่, ความกว้าง WN
ฟอนต์อยู่ใน `fonts/` (Cormorant Garamond, Montserrat, Noto Serif Thai · OFL) ใช้ทั้งวัดความกว้างและฝังตอนพิมพ์
