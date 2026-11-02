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
 *
 * ลิงก์สั้นของแขกแต่ละคน (…/?g=k7m2) — แท็บ "รายชื่อแขก"
 *  - อัปเดตสคริปต์ที่ deploy แล้ว โดยให้ URL เดิมใช้ต่อได้: วางไฟล์นี้ทับ → บันทึก → Deploy → "จัดการการทำให้ใช้งานได้"
 *    (Manage deployments) → ไอคอนดินสอ → เวอร์ชัน: "เวอร์ชันใหม่" (New version) → Deploy
 *    (ห้ามกด "การทำให้ใช้งานได้รายการใหม่" เพราะจะได้ URL ใหม่)
 *  - รีเฟรชหน้าชีต จะมีแท็บ "รายชื่อแขก" และเมนู "💌 ลิงก์แขก"
 *  - พิมพ์หรือวางชื่อแขกในคอลัมน์ "ชื่อบนซอง" ทีละแถว รหัสและลิงก์จะขึ้นเอง
 *    (ถ้าไม่ขึ้น กดเมนู 💌 ลิงก์แขก → สร้างรหัสและลิงก์)
 *  - ช่อง H1 คือที่อยู่เว็บ เปลี่ยนตรงนี้ช่องเดียว ลิงก์ทุกแถวเปลี่ยนตาม
 *  - "เปิดซองครั้งแรก" บันทึกเวลาที่แขกเปิดลิงก์ครั้งแรก, "ตอบ RSVP" บันทึกคำตอบล่าสุดของแขกคนนั้น
 */
const SHEET_NAME = 'RSVP';     // ชื่อแท็บ ถ้าไม่มีจะใช้แท็บแรก
const NOTIFY_EMAIL = '';       // ใส่อีเมลถ้าอยากได้แจ้งเตือนทุกครั้งที่มีคนตอบ
const HEADERS = ['เวลาที่ตอบ', 'ชื่อ-นามสกุล', 'มาร่วมงาน', 'ผู้ใหญ่', 'เด็ก', 'อาหาร', 'หมายเหตุถึงบ่าวสาว', 'มาจาก e-card ของ', 'อุปกรณ์', 'คำอวยพร', 'แสดงบนเว็บ'];
const COL_WISH = 10, COL_SHOW = 11;
const GUEST_SHEET = 'รายชื่อแขก';
const SITE_URL = 'https://stirring-cranachan-3381f2.netlify.app/';   // ค่าเริ่มต้นของช่อง H1 ในแท็บรายชื่อแขก
const G_HEAD = ['รหัส', 'ชื่อบนซอง', 'ลิงก์ส่วนตัว', 'เปิดซองครั้งแรก', 'ตอบ RSVP'];
const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';   // ไม่มี i l o 0 1 ที่อ่านสับสน

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const head = sh.getRange(1, 1, 1, HEADERS.length);
  const cur = head.getValues()[0];
  if (cur.join('') === '' || cur[COL_WISH - 1] === '' || cur[COL_SHOW - 1] === '') { head.setValues([HEADERS]); head.setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}

function guests_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(GUEST_SHEET);
  if (!sh) {
    sh = ss.insertSheet(GUEST_SHEET);
    sh.getRange(1, 1, 1, G_HEAD.length).setValues([G_HEAD]).setFontWeight('bold'); sh.setFrozenRows(1);
    sh.getRange('G1').setValue('เว็บ:').setFontWeight('bold'); sh.getRange('H1').setValue(SITE_URL);
    sh.setColumnWidth(1, 70); sh.setColumnWidth(2, 260); sh.setColumnWidth(3, 330); sh.setColumnWidth(4, 150); sh.setColumnWidth(5, 200);
  }
  return sh;
}

// แถวที่มีชื่อแต่ยังไม่มีรหัส → สร้างรหัส 4 ตัว (ไม่ซ้ำ) และสูตรลิงก์ที่อ้างช่อง H1
function fillCodes_(sh, r0, n) {
  const last = sh.getLastRow(); if (last < 2) return 0;
  const used = {}; sh.getRange(2, 1, last - 1, 1).getValues().forEach((r) => { if (r[0]) used[String(r[0])] = 1; });
  const from = Math.max(2, r0 || 2), to = Math.min(last, n ? from + n - 1 : last); if (to < from) return 0;
  const rows = sh.getRange(from, 1, to - from + 1, 2).getValues(); let made = 0;
  rows.forEach((r, i) => {
    if (!String(r[1]).trim() || String(r[0]).trim()) return;
    let c; do { c = ''; for (let k = 0; k < 4; k++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]; } while (used[c]);
    used[c] = 1; const row = from + i;
    sh.getRange(row, 1).setValue(c);
    sh.getRange(row, 3).setFormula(`=IF(A${row}="","",$H$1&"?g="&A${row})`);
    made++;
  });
  CacheService.getScriptCache().remove('guests');
  return made;
}

// รหัส → { name, row } (แคช 5 นาที; แก้ชีตแล้วล้างแคชทันที)
function guestMap_() {
  const cache = CacheService.getScriptCache(); const hit = cache.get('guests'); if (hit) return JSON.parse(hit);
  const sh = guests_(); const last = sh.getLastRow(); const map = {};
  if (last > 1) sh.getRange(2, 1, last - 1, 2).getValues().forEach((r, i) => { const c = String(r[0]).trim().toLowerCase(); if (c && String(r[1]).trim()) map[c] = { name: String(r[1]).trim(), row: i + 2 }; });
  cache.put('guests', JSON.stringify(map), 300); return map;
}

// หาแถวของรหัส และตรวจซ้ำว่าแถวนั้นยังเป็นรหัสเดิม (เผื่อมีการเรียงแถวใหม่)
function guestRow_(code) {
  const sh = guests_(); let g = guestMap_()[code];
  if (g && String(sh.getRange(g.row, 1).getValue()).trim().toLowerCase() !== code) { CacheService.getScriptCache().remove('guests'); g = guestMap_()[code]; }
  return g ? { sh, row: g.row, name: g.name } : null;
}

function onOpen() {
  guests_();
  SpreadsheetApp.getUi().createMenu('💌 ลิงก์แขก').addItem('สร้างรหัสและลิงก์', 'makeLinks').addToUi();
}
function makeLinks() { const n = fillCodes_(guests_()); SpreadsheetApp.getActiveSpreadsheet().toast(n ? `สร้างลิงก์ใหม่ ${n} คน` : 'ทุกคนมีลิงก์แล้ว', '💌 ลิงก์แขก'); }
function onEdit(e) {
  const sh = e && e.range && e.range.getSheet(); if (!sh || sh.getName() !== GUEST_SHEET) return;
  CacheService.getScriptCache().remove('guests');
  if (e.range.getColumn() <= 2 && e.range.getLastColumn() >= 2) fillCodes_(sh, e.range.getRow(), e.range.getNumRows());
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
  if (e && e.parameter && e.parameter.g) {   // ลิงก์สั้น: รหัส → ชื่อบนซอง และบันทึกเวลาที่เปิดครั้งแรก
    const code = String(e.parameter.g).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    const g = code && guestRow_(code); if (!g) return json_({ name: '' });
    try { const cell = g.sh.getRange(g.row, 4); if (!cell.getValue()) { const lock = LockService.getScriptLock(); if (lock.tryLock(3000)) { if (!cell.getValue()) cell.setValue(new Date()); lock.releaseLock(); } } } catch (err) {}
    return json_({ name: g.name });
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
      String(d.diet || ''), String(d.note || ''), String(d.from || '') + (d.code ? ' · ' + String(d.code).slice(0, 12) : ''), String(d.ua || '').slice(0, 120), wish, wish ? d.show !== 'no' : false]);
    sh.getRange(sh.getLastRow(), COL_SHOW).insertCheckboxes().setValue(wish ? d.show !== 'no' : false);
    CacheService.getScriptCache().remove('wishes');
    if (d.code) { try { const g = guestRow_(String(d.code).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12));
      if (g) g.sh.getRange(g.row, 5).setValue(`${attending} · ผู้ใหญ่ ${Number(d.adults || 0)} · เด็ก ${Number(d.kids || 0)}`); } catch (err) {} }
    if (NOTIFY_EMAIL) MailApp.sendEmail(NOTIFY_EMAIL, `RSVP: ${d.name || '-'} · ${attending}`,
      `ชื่อ: ${d.name}\nมาร่วมงาน: ${attending}\nผู้ใหญ่ ${d.adults} · เด็ก ${d.kids}\nอาหาร: ${d.diet || '-'}\nหมายเหตุ: ${d.note || '-'}\nคำอวยพร: ${wish || '-'}`);
    return json_({ ok: true });
  } catch (err) { return json_({ ok: false, error: String(err) }); }
  finally { lock.releaseLock(); }
}
