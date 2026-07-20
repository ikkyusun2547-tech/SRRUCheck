# SRRU Check — Mobile (React Native / Expo)

Student-only feature set, calling the same Next.js API routes under `app/api/` as the web
client — no business logic is duplicated here.

## สถานะ: เฟส 6 (เกือบครบ) — เหลือแค่ Google Sign-In จริง

**ทำแล้ว — ครบทุกฟีเจอร์ฝั่งนักศึกษา:**
- เข้าสู่ระบบ (dev-login shortcut, เหมือนฝั่งเว็บ)
- แดชบอร์ด Activity Passport (ชั่วโมง/กิจกรรมสะสม แยกตามหมวด) ดึงข้อมูลจริงจาก API เดียวกับเว็บ
- เช็คชื่อ: สแกน QR (กล้องหลัง, `expo-camera`'s barcode scanner) หรือแนบหลักฐานด้วยตนเองสำหรับ
  กิจกรรม self-report, ยืนยันตำแหน่ง GPS เมื่อกิจกรรมต้องการ (`expo-location`), ถ่ายเซลฟียืนยันตัวตน
  ด้วยกล้องหน้า (ไม่มีทางเลือกอัปโหลดจากคลังภาพ เหมือนฝั่งเว็บ)
- คำร้อง 3 ประเภท (กิจกรรมภายนอก/เทียบชั่วโมงผู้นำ/เช็คชื่อย้อนหลัง) — ฟอร์มยื่นคำร้องพร้อมแนบหลักฐาน
  (รูปภาพ/PDF ผ่าน `expo-document-picker`), รายการคำร้องของตัวเองแบบแบ่งหน้า, ยกเลิกคำร้องที่รอตรวจสอบ
- ประวัติกิจกรรม (การเช็คชื่อ + คำร้องทั้ง 3 ประเภท แบบแบ่งหน้า)
- การแจ้งเตือน (รายการ + กดอ่าน)
- โปรไฟล์ (ดู/แก้ไขข้อมูลนักศึกษา รวมทั้ง flow กรอกโปรไฟล์ครั้งแรกที่ redirect อัตโนมัติเหมือนเว็บ)

ยืนยันด้วย E2E ผ่าน Expo web build จริง (คลิกจริง ไม่ใช่แค่เปิดหน้า): ล็อกอิน+แดชบอร์ด 11/11, เช็คชื่อ
แบบ self-report ครบวงจร (ถ่ายเซลฟีจริงผ่าน fake camera stream → ส่งจริงไป API) 8/8, คำร้อง+ประวัติ+
แจ้งเตือน+โปรไฟล์ 10/10 (รวมยื่นคำร้องจริงพร้อมไฟล์แนบผ่าน native file chooser แล้วยกเลิก), flow กรอก
โปรไฟล์ครั้งแรก 4/4 (auto-redirect → กรอก → บันทึก → auto-redirect กลับแดชบอร์ด)

**ยังไม่ทำ:** Google Sign-In จริง (ตอนนี้เป็นปุ่ม placeholder — ต้องตั้งค่า Google OAuth client สำหรับ
มือถือก่อน ดูหัวข้อด้านล่าง)

## สถาปัตยกรรม auth สำหรับมือถือ

เว็บใช้ NextAuth v5 session cookie ซึ่งแอปมือถือใช้ไม่ได้ (ไม่มี cookie jar ของเบราว์เซอร์) แทนที่ด้วย
Bearer token flow แยกต่างหาก โดยไม่ซ้ำ business logic กับฝั่งเว็บ:

- `POST /api/mobile/auth/dev-login` (dev เท่านั้น เหมือน `/api/dev/login/[userId]` ของเว็บ — 404
  ทันทีเมื่อ `NODE_ENV !== "development"`) และ `POST /api/mobile/auth/google` (verify Google ID
  token ผ่าน JWKS ด้วย `jose`, เรียก `findOrCreateUserByEmail` ตัวเดียวกับที่ web signIn callback ใช้)
  ทั้งคู่คืนค่า custom JWT (HS256, เซ็นด้วย `AUTH_SECRET` ตัวเดียวกับ NextAuth, อายุ 30 วัน) ผ่าน
  `lib/auth/mobile-token.ts`
- `lib/auth/session.ts`'s `getSession(request)` แทนที่ `await auth()` ใน API route ที่ฝั่งนักศึกษาใช้
  ทั้งหมด (14 routes) — ลองอ่าน session cookie ก่อน (เว็บ), ถ้าไม่มีค่อย fallback ไปตรวจ Bearer token
  (มือถือ) โดย re-verify สถานะ ban/role จาก DB ทุกครั้ง (ไม่เชื่อ claim เก่าใน token 30 วัน)
- `lib/auth/auth.config.ts`'s `authorized()` callback (ต้อง edge-safe เพราะใช้ร่วมกับ middleware) เพิ่ม
  branch ตรวจ Bearer token แบบ signature/expiry เท่านั้น (ไม่แตะ DB) เพื่อให้ request ของมือถือผ่าน
  middleware ไปถึง route handler ได้ — DB check ตัวจริงยังอยู่ที่ `getSession()`
- CORS: routes ที่มือถือ/เว็บข้าม origin เรียกได้ (14 routes + `/api/mobile/auth/*` +
  `/api/passport/mine`) มี `Access-Control-Allow-Origin: *` จาก `next.config.ts`'s `headers()` +
  `OPTIONS` handler ต่อไฟล์ (ปลอดภัยเพราะ routes เหล่านี้ไม่พึ่ง cookie สำหรับ auth — ไม่มี
  `Access-Control-Allow-Credentials` ตั้งไว้)
- `/api/passport/mine` (ใหม่) — เว็บอ่าน Activity Passport ผ่านการเรียกฟังก์ชัน server-side ตรงๆ
  (`getPassportSummary()` ใน React Server Component) ไม่มี REST endpoint เดิม เพิ่ม route นี้เพื่อให้
  มือถือเรียกได้ โดยยังใช้ฟังก์ชันคำนวณตัวเดียวกัน

## เช็คชื่อบนมือถือ

`app/checkin.tsx` เป็น state machine เดียวมิเรอร์ `app/(student)/checkin/checkin-flow.tsx` ของเว็บทุก
ขั้นตอน (เลือกกิจกรรม → สแกน QR/แนบหลักฐาน → GPS ถ้าต้องการ → เซลฟี → ส่ง → ผลลัพธ์) ตรรกะที่ปลอดภัย
ให้ใช้ฝั่ง client ถูก duplicate มาเป็นไฟล์แยกใน `mobile/lib/` เพราะ HMAC signing/verification (ต้องใช้
Node's `crypto`) รันได้แค่ฝั่ง server เท่านั้น — ไม่มีทางแชร์โค้ดข้าม runtime ได้จริง:

- `mobile/lib/qr-token.ts`'s `extractActivityIdFromToken` — pure string parsing ไม่มี crypto มิเรอร์
  `lib/checkin/qr-token.ts` ของเว็บ (verify ตัวจริงเกิดที่ server เสมอ ฟังก์ชันนี้ใช้แค่บอก UI ว่าจะโหลด
  ข้อมูลกิจกรรมไหนต่อ)
- `mobile/lib/device-id.ts` — UUID ต่ออุปกรณ์ที่ persist ผ่าน `lib/storage.ts` (เทียบเท่า
  `lib/checkin/device-id.ts`'s localStorage บนเว็บ)

**บั๊กที่เจอและแก้ระหว่างทาง (กระทบทั้งเว็บและมือถือ):** QR ที่จอโปรเจกเตอร์เข้ารหัสเป็น URL เต็ม
(`buildCheckinUrl()`) ไม่ใช่ bare token เปล่าๆ แต่ `extractActivityIdFromToken` เดิมของเว็บรองรับแค่
bare token — แปลว่าการสแกน QR ผ่านกล้องในแอป (ตรงข้ามกับการเปิดลิงก์ตรงๆ ที่ query string ถูก parse
ให้แล้ว) จะขึ้น error "QR นี้ไม่ใช่ QR ของระบบ SRRU Check" ทุกครั้งทั้งที่ QR ถูกต้อง แก้แล้วทั้งสอง
ฝั่งให้รองรับทั้ง bare token และ URL เต็ม (ดึง `?token=` ออกมาก่อนถ้าเป็น URL) มี unit test ครอบคลุมใน
`lib/checkin/qr-token.test.ts`

## คำร้อง/ประวัติ/แจ้งเตือน/โปรไฟล์บนมือถือ

`app/requests.tsx`, `app/history.tsx`, `app/notifications.tsx`, `app/profile.tsx` มิเรอร์หน้าเว็บ
เดียวกันทุกประการ (`requests-client.tsx`, `history-client.tsx`, `notifications-client.tsx`) — ยกเว้น
โปรไฟล์ ซึ่งเว็บมีแค่ first-time setup flow (`/setup-profile`, Server Action) ไม่มีหน้าดู/แก้ไข
โปรไฟล์ทีหลังเลย ต้องเพิ่ม backend ใหม่ 3 routes เพราะมือถือเรียก Server Component/Server Action ตรงๆ
ไม่ได้:

- `GET /api/activities/closed` — คนละ query กับ `/api/activities/open` (`status: "closed"` แทน
  `"open"`) ใช้เป็น activity picker ของฟอร์มเช็คชื่อย้อนหลัง มิเรอร์ query เดิมที่ web server component
  ทำอยู่แล้ว
- `GET /api/faculties` — คนละ endpoint กับ `GET /api/admin/faculties` ที่ gate เฉพาะ admin (403 ถ้า
  นักศึกษาเรียก) query เดียวกันแค่ไม่เช็ค role เพราะชื่อคณะ/สาขาไม่ใช่ข้อมูลลับ
- `GET`/`POST /api/profile` — พอร์ต `app/setup-profile/actions.ts`'s `submitProfile` Server Action
  มาเป็น REST route ใช้ `profileSchema` ตัวเดิมจาก `lib/validation/profile.ts` ไม่ซ้ำ validation logic
  ต่างจากเว็บตรงที่ endpoint นี้เรียกซ้ำได้ (เว็บ redirect ออกจาก `/setup-profile` ทันทีที่
  `profileCompleted` เป็น true ใช้ครั้งเดียว) เพราะมือถือใช้ endpoint เดียวกันทั้ง setup ครั้งแรกและ
  แก้ไขทีหลัง

**บั๊กที่เจอและแก้ระหว่างทาง (React Native Web เท่านั้น):** `Alert.alert()` ของ react-native-web คือ
`static alert() {}` — ฟังก์ชันว่างเปล่า ไม่ทำอะไรเลย ทั้งที่ `app.json` ประกาศรองรับ web ทุกจุดที่เรียก
`Alert.alert(...)` (แจ้งเตือน error ตอนล็อกอินไม่สำเร็จ, ขออนุญาตกล้องไม่ผ่าน, และที่ร้ายแรงสุด — กด
"บันทึกโปรไฟล์สำเร็จ" แล้วค้างอยู่หน้าเดิมตลอดไปเพราะปุ่ม "ตกลง" ที่ควรพา redirect ไปแดชบอร์ดไม่เคยถูก
แสดงเลย) แก้ด้วย `lib/notify.ts` (สลับไปใช้ `window.alert()` บน web) และ `app/profile.tsx` เปลี่ยนจาก
รอ user กดปุ่มใน Alert เป็นโชว์ข้อความสำเร็จ inline แล้ว auto-redirect หลัง 900ms แทน (ทำงานเหมือนกัน
ทุก platform ไม่ต้องพึ่ง Alert เลย) มี E2E ยืนยันว่า redirect เกิดขึ้นจริงหลังบันทึกโปรไฟล์

**บั๊กที่เจอและแก้ (seed data):** `prisma/seed.ts`'s student2 ("Deliberately incomplete profile —
exercises the /setup-profile redirect") ใช้ `update: {}` เหมือนกิจกรรมสาธิต — พอ test session ไหนกรอก
โปรไฟล์ให้ student2 เสร็จ การ seed ซ้ำก็ไม่รีเซ็ตกลับไปเป็น "ยังไม่กรอก" อีกเลย ทำให้ทดสอบ first-time
setup gate ไม่ได้อีกต่อไป แก้ให้ reset ฟิลด์โปรไฟล์ทั้งหมดกลับเป็น `null`/`profileCompleted: false`
ทุกครั้งที่ seed

## เริ่มต้นใช้งาน

```bash
cd mobile
cp .env.example .env   # ตั้ง EXPO_PUBLIC_API_BASE_URL ให้ตรงกับ platform ที่จะรัน (ดูใน .env.example)
npm install
npm run web       # ทดสอบเร็วที่สุด — เปิดใน browser ที่ localhost:8081
npm run android   # ต้องมี Android emulator/เครื่องจริง
npm run ios       # ต้องใช้ macOS
```

ต้องรัน `npm run dev` ที่ root ของ repo (Next.js) ควบคู่กันด้วย เพราะแอปมือถือเรียก API ของมันโดยตรง

## ⚠️ เรื่องที่ควรรู้

- **`expo-secure-store` ไม่รองรับ web** (`ExpoSecureStore.web.js` เป็น stub ว่างเปล่า — เรียกแล้ว throw
  runtime error) ทั้งที่ `app.json` ประกาศรองรับ web ไว้ แก้ด้วย `lib/storage.ts` ที่สลับไปใช้
  `localStorage` บน web โดยอัตโนมัติ (`Platform.OS === "web"`) — ปลอดภัยน้อยกว่า native keychain
  (ไม่เข้ารหัส เสี่ยง XSS) แต่เป็นวิธีมาตรฐานสำหรับ Expo web ที่ไม่มี server session ให้พึ่งพา
- **ปุ่ม Google Sign-In ยังเป็น placeholder** — `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` ที่ root `.env`
  ยังว่างอยู่ (เหมือนตอนตั้งค่าเว็บ) การเชื่อม `expo-auth-session` จริงต้องรอ Google Cloud Console
  client ID สำหรับมือถือก่อน — backend (`/api/mobile/auth/google`) เขียนไว้พร้อมใช้แล้ว (verify ผ่าน
  JWKS) แค่ยังไม่มี client ID จริงมาทดสอบ
