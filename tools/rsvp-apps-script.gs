/**
 * RSVP + คำอวยพร → Google Sheet  (Wedding Wanida & Nattakorn · 16 ม.ค. 2570)
 * ------------------------------------------------------------------
 * ติดตั้งครั้งเดียว ประมาณ 2 นาที (ต้องทำจากบัญชีเจ้าของชีต เพราะ Google ให้เจ้าของอนุญาตเอง)
 *  1. เปิดชีต "RSVP · Wedding Wanida & Nattakorn" ใน Google Drive
 *  2. เมนู ส่วนขยาย (Extensions) → Apps Script → ลบโค้ดเดิมทั้งหมด วางไฟล์นี้ทั้งไฟล์ → กดบันทึก (ไอคอนแผ่นดิสก์)
 *  3. ปุ่มสีน้ำเงิน "ทำให้ใช้งานได้" (Deploy) → "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 *       รูปเฟือง → เลือก "เว็บแอป" (Web app)
 *       เรียกใช้ในฐานะ: ฉัน (Me)
 *       ผู้ที่มีสิทธิ์เข้าถึง: ทุกคน (Anyone)      ← สำคัญ ไม่งั้นแขกส่งไม่ได้
 *     กด "ทำให้ใช้งานได้" → "ให้สิทธิ์เข้าถึง" → เลือกบัญชีของคุณ → (ถ้าขึ้น "Google hasn't verified this app"
 *     กด "ขั้นสูง/Advanced" → "ไปที่ ... (ไม่ปลอดภัย)" เพราะเป็นสคริปต์ของคุณเอง) → "อนุญาต"
 *  4. คัดลอก "URL ของเว็บแอป" (ขึ้นต้น https://script.google.com/macros/s/ ลงท้าย /exec) ส่งให้ Claude
 *     หรือวางเองใน assets/js/config.js → rsvp.webhookUrl
 *
 * ทดสอบ: เปิด URL /exec ในเบราว์เซอร์ ต้องเห็น "WN RSVP endpoint OK"
 *        เปิด URL/exec?wishes=1 จะเห็นคำอวยพรที่แสดงบนเว็บ (รูปแบบ JSON)
 * ซ่อนคำอวยพรใด ๆ: เอาเครื่องหมายถูกในคอลัมน์ "แสดงบนเว็บ" ออก (เว็บอัปเดตภายใน 1 นาที)
 */
const SHEET_NAME = 'RSVP';     // ชื่อแท็บ ถ้าไม่มีจะใช้แท็บแรก
const NOTIFY_EMAIL = '';       // ใส่อีเมลถ้าอยากได้แจ้งเตือนทุกครั้งที่มีคนตอบ
const HEADERS = ['เวลาที่ตอบ', 'ชื่อ-นามสกุล', 'มาร่วมงาน', 'ผู้ใหญ่', 'เด็ก', 'อาหาร', 'หมายเหตุถึงบ่าวสาว', 'มาจาก e-card ของ', 'อุปกรณ์', 'คำอวยพร', 'แสดงบนเว็บ'];
const COL_WISH = 10, COL_SHOW = 11;

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const head = sh.getRange(1, 1, 1, HEADERS.length);
  const cur = head.getValues()[0];
  if (cur.join('') === '' || cur[COL_WISH - 1] === '' || cur[COL_SHOW - 1] === '') { head.setValues([HEADERS]); head.setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet(e) {
  if (e && e.parameter && e.parameter.wishes) {
    const cache = CacheService.getScriptCache(); const hit = cache.get('wishes');
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    const sh = sheet_(); const n = sh.getLastRow() - 1; let out = [];
    if (n > 0) {
      const rows = sh.getRange(2, 1, n, HEADERS.length).getValues();
      out = rows.filter((r) => String(r[COL_WISH - 1]).trim() && r[COL_SHOW - 1] === true)
        .map((r) => ({ name: String(r[1]).replace(/^คุณ\s*/, '').trim().slice(0, 60), wish: String(r[COL_WISH - 1]).trim().slice(0, 400) }));
    }
    const body = JSON.stringify({ wishes: out.slice(-300) }); cache.put('wishes', body, 60);
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('WN RSVP endpoint OK').setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.tryLock(10000);
  try {
    let d = {}; try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { d = (e && e.parameter) || {}; }
    const sh = sheet_();
    const attending = d.attending === 'yes' ? 'มา' : d.attending === 'no' ? 'ไม่มา' : String(d.attending || '');
    const wish = String(d.wish || '').trim();
    sh.appendRow([new Date(), String(d.name || '').trim(), attending, Number(d.adults || 0), Number(d.kids || 0),
      String(d.diet || ''), String(d.note || ''), String(d.from || ''), String(d.ua || '').slice(0, 120), wish, wish ? d.show !== 'no' : false]);
    sh.getRange(sh.getLastRow(), COL_SHOW).insertCheckboxes().setValue(wish ? d.show !== 'no' : false);
    CacheService.getScriptCache().remove('wishes');
    if (NOTIFY_EMAIL) MailApp.sendEmail(NOTIFY_EMAIL, `RSVP: ${d.name || '-'} · ${attending}`,
      `ชื่อ: ${d.name}\nมาร่วมงาน: ${attending}\nผู้ใหญ่ ${d.adults} · เด็ก ${d.kids}\nอาหาร: ${d.diet || '-'}\nหมายเหตุ: ${d.note || '-'}\nคำอวยพร: ${wish || '-'}`);
    return json_({ ok: true });
  } catch (err) { return json_({ ok: false, error: String(err) }); }
  finally { lock.releaseLock(); }
}
