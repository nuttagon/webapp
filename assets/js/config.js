// ===============================================================
//  ตั้งค่าข้อมูลงานแต่ง WN — แก้ไฟล์นี้ไฟล์เดียว ทุกหน้า (เว็บ, e-card, ไฟล์พิมพ์) จะอัปเดตตาม
//  ข้อมูลถอดจากการ์ดเชิญจริง · ค่าที่ยังเป็น [ตัวอย่าง] โปรดแก้ให้ตรง
// ===============================================================
window.WEDDING = {
  couple: {
    bride: { th: "วนิดา", en: "Wanida", nick: "อีฟ", full: "ทันตแพทย์หญิงวนิดา อัครโชติสกุล", surname: "อัครโชติสกุล", initial: "W",
             fullEn: "Dr. Wanida Akarachotsakul, DDS",   // ใช้ในหน้า EN ของ e-card — โปรดตรวจการสะกดนามสกุลภาษาอังกฤษ
             parents: ["นายสหชัย อัครโชติสกุล", "นางวรินทร อัครโชติสกุล"] },
    groom: { th: "ณัฐกรณ์", en: "Nattakorn", nick: "บ็อบ", full: "เภสัชกรณัฐกรณ์ ศรีบุรมย์", surname: "ศรีบุรมย์", initial: "N",
             fullEn: "Nattakorn Sriburom, B.Pharm.",     // โปรดตรวจการสะกด
             parents: ["นายเสรี ศรีบุรมย์", "นางนันทวัน ศรีบุรมย์"] },
    blessing: "สมสทฺธา สมสีลา สมจาคา สมปญฺญา",   // สมชีวิธรรม (อํ.จตุกฺก. 21/55) สะกดบาลีตามการ์ด
    inviteText: "มีความยินดีขอเรียนเชิญท่านเพื่อเป็นเกียรติ และร่วมเป็นสักขีพยานในพิธีมงคลสมรส ระหว่าง",
    inviteTextEn: "together with their parents, joyfully request the honour of your presence at the wedding of",
    apology: "(ขออภัยหากมิได้เรียนเชิญด้วยตนเอง)",
    apologyEn: "(We apologise if this invitation did not reach you in person)",
    hashtag: "#EternallyWN",
    storyText: "",            // ย่อหน้าใต้รูป "Our love for gardens (and each other)" เล่าเรื่องของเราสั้น ๆ ว่างไว้ = ไม่แสดง
    theme: "Lumière de l'Amour",
    themeTh: "แสงสว่างแห่งความรัก",
  },
  date: {
    iso: "2027-01-16",
    startLocal: "2027-01-16T14:30:00+07:00",
    endLocal:   "2027-01-16T22:00:00+07:00",
    th: "วันเสาร์ที่ 16 มกราคม พ.ศ. 2570",
    en: "Saturday, 16 January 2027",
    short: "16 · 01 · 2027",
  },
  // กำหนดการตามการ์ดเชิญ
  schedule: [
    { time: "14:30", title: "พิธีแห่ขันหมาก", titleEn: "Khan Maak procession", desc: "ขบวนขันหมากฝ่ายเจ้าบ่าวเดินทางมาถึง ประตูเงินประตูทอง" },
    { time: "15:30", title: "พิธียกน้ำชา", titleEn: "Tea ceremony", desc: "คู่บ่าวสาวยกน้ำชาและรับพรจากผู้ใหญ่ทั้งสองฝ่าย" },
    { time: "16:30", title: "พิธีกล่าวคำมั่นสัญญา", titleEn: "Vows in the garden", desc: "บน backdrop ผ้าดราปในสวน ช่วงแสงเย็น" },
    { time: "17:30", title: "ฉลองมงคลสมรส", titleEn: "Reception & dinner", desc: "งานเลี้ยงในสวน ดินเนอร์ ดนตรีสด จนถึงประมาณ 22:00 น." },
  ],
  venue: {
    name: "บ้านเคียงสะหวัน",
    nameEn: "Baan Kiang Sawan",
    province: "จังหวัดมุกดาหาร",
    // ที่อยู่ตามเว็บ baankiengsawan.com (ริมโขง หน้าหาดมโนภิรมย์) — โปรดยืนยันบ้านเลขที่/หมู่กับทางสถานที่
    address: "ต.ชะโนด อ.หว้านใหญ่ จ.มุกดาหาร 49150 (ริมแม่น้ำโขง หน้าหาดมโนภิรมย์)",
    phone: "088-855-5464",
    mapUrl: "https://maps.google.com/?q=บ้านเคียงสะหวัน+หว้านใหญ่+มุกดาหาร",
    capacity: 400,
    // ข้อความที่ยังมี [วงเล็บเหลี่ยม] จะไม่แสดงให้แขกเห็นจนกว่าจะแก้ให้เป็นข้อความจริง
    parking: "[กรอก] เช่น จอดรถในสนามด้านหน้า มีเจ้าหน้าที่โบกรถ ตั้งแต่ 14:00 น.",
    transit: "ประมาณ 15 นาทีจากตัวอำเภอหว้านใหญ่ อยู่ริมแม่น้ำโขง หน้าหาดมโนภิรมย์ แนะนำรถส่วนตัว ระบุจุดส่ง “บ้านเคียงสะหวัน”",
    hotelDeal: "[กรอก] เช่น แขกต่างจังหวัดจองที่พักในตัวเมืองมุกดาหาร หรือบ้านพักริมโขงในบริเวณงาน (โทร 088-855-5464)",
    notes: "งานจัดกลางแจ้งบนสนามหญ้า แนะนำรองเท้าส้นหนาหรือรองเท้าหุ้มส้น มีเต็นท์สำรองกรณีฝน",
  },
  dressCode: {
    title: "Blush, Sage & Champagne Glam",
    desc: "ชุดไทยหรือชุดราตรีก็ได้ ขอเว้นสีขาวล้วนไว้ให้เจ้าสาว",
    descEn: "Thai traditional or evening wear. Kindly leave all-white to the bride.",
    ladies:    [{ hex: "#F5CED2", name: "Blush" }, { hex: "#C78F99", name: "Dusty rose" }, { hex: "#AEBA9D", name: "Sage" }, { hex: "#A7AF74", name: "Olive" }, { hex: "#FADFA2", name: "Champagne" }],   // ค่าสีตามข้อความสเปกส่งโรงพิมพ์
    gentlemen: [{ hex: "#264592", name: "Navy" }, { hex: "#636566", name: "Charcoal" }, { hex: "#C7B68F", name: "Gold" }],
    colors: [{ hex: "#F3CDD6", name: "Blush" }, { hex: "#C98A9A", name: "Dusty rose" }, { hex: "#9DB08F", name: "Sage" }, { hex: "#7E8A5F", name: "Olive" }, { hex: "#E8D48E", name: "Champagne" }, { hex: "#1E3A8A", name: "Navy" }],
  },
  rsvp: {
    deadline: "16 ธันวาคม 2569",
    // ปลายทางคำตอบ: ชีต "RSVP · Wedding Wanida & Nattakorn" ใน Google Drive ของคุณ
    // https://docs.google.com/spreadsheets/d/1tPee8t414VWTpN1WpQ5UjdiYRADNUVfGVjYlgmpBoRk/edit
    // ทำตาม tools/rsvp-apps-script.gs แล้ววาง URL ของเว็บแอป (ลงท้าย /exec) ตรงนี้
    webhookUrl: "https://script.google.com/macros/s/AKfycbwwsCuHCGRTkBxwDfQ8zZxPz0ALSJ_EBiJdJGpDV2i9G6JPWge9AtIILCgWPMj5DcEq/exec",
    formUrl: "",              // ทางเลือกสำรอง: ลิงก์ Google Form (ถ้าไม่ใช้ webhook)
    lineUrl: "",              // ลิงก์ LINE ของผู้ประสานงาน เช่น https://line.me/ti/p/~yourid (ใช้เป็นช่องทางสำรองตอบรับ)
    phone: "",                // เบอร์ผู้ประสานงาน (ว่างไว้ = ไม่แสดง)
  },
  // เพลงคลอเบา ๆ — เริ่มเล่นหลังแขกแตะหน้าจอครั้งแรก มีปุ่ม ♪ ปิดได้ · เปลี่ยนเพลง: ใส่ไฟล์ .mp3 ใน assets/audio/ แล้วแก้ src
  // wn-theme.mp3 เป็นเพลงเปียโนที่แต่งขึ้นใหม่ (tools/music/make_theme.py) ไม่ติดลิขสิทธิ์ · ว่าง src = ปิดเพลงทั้งเว็บ
  // ตัวเลือก: wn-rhodes2.mp3 (lo-fi jazz มีทำนอง hook) · wn-rhodes.mp3 (lo-fi jazz) · wn-bossa.mp3 (bossa nova) · wn-indie.mp3 (indie folk) · wn-theme.mp3 (เปียโน)
  music: { src: "assets/audio/wn-rhodes2.mp3", volume: 0.35, title: "Late Night Rhodes II" },
  // คำอวยพรตัวอย่าง: แสดงเฉพาะตอนที่ยังไม่ได้ใส่ rsvp.webhookUrl พอใส่ URL แล้ว เว็บจะดึงคำอวยพรจริงจากชีต
  sampleWishes: [
    { name: "ตัวอย่าง · เพื่อนสมัยมหาลัย", wish: "ดีใจกับสองคนที่สุดเลย ขอให้รักกันแบบนี้ไปทุกวัน" },
    { name: "ตัวอย่าง · Auntie May", wish: "Wishing you a lifetime of late-night walks and morning coffee together." },
    { name: "ตัวอย่าง · ทีมห้องยา", wish: "จากเพื่อนร่วมงานที่เห็นมาตั้งแต่วันแรก ยินดีด้วยนะ" },
    { name: "ตัวอย่าง · คุณยาย", wish: "ขอให้มีความสุข สุขภาพแข็งแรง อยู่ด้วยกันจนแก่เฒ่า" },
  ],
  // ส่วน Contact Us ท้ายเว็บ — ช่องที่ว่างจะไม่แสดง
  contact: { phone: "", line: "", lineUrl: "", instagram: "", email: "" },
  gift: {
    note: "การมาร่วมงานคือของขวัญที่ดีที่สุดสำหรับเรา หากประสงค์จะร่วมแสดงความยินดี สามารถใส่ซองที่จุดลงทะเบียน หรือสแกน QR PromptPay (บัญชี ณัฐกรณ์ & วนิดา) ในการ์ดดอกไม้ที่มาพร้อมซองเชิญ",
    promptpayName: "ณัฐกรณ์ & วนิดา",
    promptpayQr: "assets/img/qr-promptpay.svg",
  },
  site: { url: "https://nuttagon.github.io/webapp/", ecardUrl: "https://nuttagon.github.io/webapp/ecard/", ogImage: "https://nuttagon.github.io/webapp/assets/img/og.jpg" },
  story: [
    { year: "[ปี]", title: "พบกันครั้งแรก", text: "[เล่าสั้น ๆ ว่าเจอกันที่ไหน ใครทักก่อน จำอะไรได้บ้าง]" },
    { year: "[ปี]", title: "ทริปแรกด้วยกัน", text: "[ที่ไหน และรู้ตอนไหนว่าเดินทางด้วยกันได้ดี]" },
    { year: "[ปี]", title: "Marry me! Yes, I will!", text: "[ที่ไหน อย่างไร]" },
    { year: "2027", title: "วันของเรา", text: "ขอเชิญทุกท่านที่เรารักมาร่วมเป็นสักขีพยานในสวนบ้านเคียงสะหวัน" },
  ],
  faq: [
    { q: "สภาพอากาศวันงาน", a: "กลางเดือนมกราคมที่มุกดาหารเป็นหน้าหนาว อากาศแห้ง ฝนแทบไม่ตก กลางวันประมาณ 29–32°C พอตกค่ำอุณหภูมิลดลงเร็ว ช่วงงานเลี้ยงราว 20–24°C และดึกอาจเหลือ 17°C ริมแม่น้ำโขงมีลมเย็น แนะนำพกเสื้อคลุม ผ้าคลุมไหล่ หรือแจ็กเก็ตบาง ๆ มาด้วย" },
  ],
};
