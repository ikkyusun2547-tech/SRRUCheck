# SRRU Check — Mobile (React Native / Expo)

Student-only feature set, calling the same Next.js API routes under `app/api/` as the web
client — no business logic is duplicated here.

## สถานะ: เฟส 6 (บางส่วน) — auth + dashboard

**ทำแล้ว:** เข้าสู่ระบบ (dev-login shortcut, เหมือนฝั่งเว็บ), แดชบอร์ด Activity Passport (ชั่วโมง/
กิจกรรมสะสม แยกตามหมวด) ดึงข้อมูลจริงจาก API เดียวกับเว็บ — ยืนยันด้วย E2E ผ่าน Expo web build จริง
(11/11 scenario ผ่าน)

**ยังไม่ทำ:** เช็คชื่อ (กล้อง/GPS/QR), คำร้อง 3 ประเภท, ประวัติกิจกรรม, การแจ้งเตือน, โปรไฟล์, และ
Google Sign-In จริง (ตอนนี้เป็นปุ่ม placeholder — ต้องตั้งค่า Google OAuth client สำหรับมือถือก่อน ดู
หัวข้อด้านล่าง)

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
