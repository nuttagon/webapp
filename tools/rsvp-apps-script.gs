/**
 * RSVP → Google Sheet  (Wedding Wanida & Nattakorn · 16 ม.ค. 2570)
 * ------------------------------------------------------------------
 * วิธีติดตั้ง (ทำครั้งเดียว ประมาณ 3 นาที)
 *  1. เปิดชีต "RSVP · Wedding Wanida & Nattakorn" ใน Google Drive (สร้างไว้ให้แล้ว)
 *  2. เมนู ส่วนขยาย (Extensions) → Apps Script → ลบโค้ดเดิม วางไฟล์นี้ทั้งไฟล์ → บันทึก
 *  3. ปุ่ม "ทำให้ใช้งานได้" (Deploy) → การทำให้ใช้งานได้ใหม่ (New deployment)
 *       ประเภท: เว็บแอป (Web app)
 *       เรียกใช้ในฐานะ: ฉัน (Me)
 *       ผู้ที่มีสิทธิ์เข้าถึง: ทุกคน (Anyone)      ← สำคัญ ไม่งั้นฟอร์มส่งไม่ได้
 *     กด Deploy → อนุญาตสิทธิ์ (Authorize) → คัดลอก "URL ของเว็บแอป" (ลงท้าย /exec)
 *  4. วาง URL นั้นใน assets/js/config.js → rsvp.webhookUrl: "https://script.google.com/macros/s/…/exec"
 *  5. (ไม่บังคับ) ใส่อีเมลใน NOTIFY_EMAIL ด้านล่าง จะได้อีเมลทุกครั้งที่มีคนตอบ
 *
 * ทดสอบ: เปิด URL /exec ในเบราว์เซอร์ ต้องเห็นข้อความ "WN RSVP endpoint OK"
 */
const SHEET_NAME = 'RSVP';          // ชื่อแท็บ ถ้าไม่มีจะสร้างให้
const NOTIFY_EMAIL = '';            // เช่น 'nsriburom@gmail.com' ว่างไว้ = ไม่ส่งอีเมล

function doGet() {
  return ContentService.createTextOutput('WN RSVP endpoint OK').setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}';
    let d = {};
    try { d = JSON.parse(raw); } catch (err) { d = (e && e.parameter) || {}; }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    if (sh.getLastRow() === 0) {
      sh.appendRow(['เวลาที่ตอบ', 'ชื่อ-นามสกุล', 'มาร่วมงาน', 'ผู้ใหญ่', 'เด็ก', 'อาหาร', 'หมายเหตุ / คำอวยพร', 'มาจาก e-card ของ', 'อุปกรณ์']);
      sh.getRange(1, 1, 1, 9).setFontWeight('bold');
    }
    const attending = d.attending === 'yes' ? 'มา' : d.attending === 'no' ? 'ไม่มา' : (d.attending || '');
    sh.appendRow([
      new Date(), String(d.name || '').trim(), attending, Number(d.adults || 0), Number(d.kids || 0),
      String(d.diet || ''), String(d.note || ''), String(d.from || ''), String(d.ua || '').slice(0, 120),
    ]);
    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, `RSVP: ${d.name || '-'} · ${attending}`,
        `ชื่อ: ${d.name}\nมาร่วมงาน: ${attending}\nผู้ใหญ่ ${d.adults} · เด็ก ${d.kids}\nอาหาร: ${d.diet || '-'}\nหมายเหตุ: ${d.note || '-'}\n\n${ss.getUrl()}`);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
