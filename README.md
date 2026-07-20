# SRRU Check

ระบบบริหารจัดการและเช็คชื่อกิจกรรมนักศึกษา — Next.js 15 (App Router) + TypeScript + Prisma + Supabase (Postgres + Storage) + Auth.js

Monorepo: เว็บอยู่ที่ root, แอปมือถือ (React Native/Expo) อยู่ที่ [`mobile/`](mobile/README.md)
(เฟส 6 — เกือบครบ เหลือแค่ Google Sign-In จริง)

## สถานะปัจจุบัน: เฟส 6 (เกือบครบ) — แอปมือถือ ครบทุกฟีเจอร์ฝั่งนักศึกษา ยกเว้น Google Sign-In จริง

เฟส 0-5 เสร็จสมบูรณ์ ครอบคลุมทั้งฝั่งนักศึกษา (auth, profile, เช็คชื่อสามประสาน, Activity Passport,
คำร้อง 3 ประเภท) ฝั่งแอดมิน (จัดการกิจกรรมพร้อมปักหมุด GPS บนแผนที่, Live Event Control เต็ม
รูปแบบ, อนุมัติคำร้อง, จัดการผู้ใช้/สิทธิ์, audit log แบบ paginate ที่ database, ตั้งค่าเกณฑ์การจบ,
จัดการคณะ/สาขา, นำเข้านักศึกษาจาก Excel, ประกาศ, รายงาน PDF/Excel) และงาน cross-cutting (แจ้งเตือน
async แบบเต็ม — in-app + email ผ่าน Resend, fault-isolated ต่อ recipient — auto-close กิจกรรมที่หมด
เวลาผ่าน Vercel Cron รายชั่วโมง, i18n ไทย/อังกฤษ, dark/light mode แบบ persist, PWA ติดตั้งได้พร้อม
offline fallback) ทดสอบ end-to-end กับ Supabase จริงทั้งใน dev และ production build
(`next build && next start`)

เฟส 6 เกือบครบแล้ว: แอปมือถือเข้าสู่ระบบได้ (dev-login shortcut), แดชบอร์ด Activity Passport จริง,
เช็คชื่อครบ (สแกน QR/แนบหลักฐาน + GPS + เซลฟี), คำร้อง 3 ประเภท (พร้อมแนบไฟล์หลักฐาน + ยกเลิกคำร้อง),
ประวัติกิจกรรม, การแจ้งเตือน, และโปรไฟล์ (ดู/แก้ไข + first-time setup gate) — ทั้งหมดผ่าน Bearer-token
auth bridge เดียวกับเว็บ (ดู [`mobile/README.md`](mobile/README.md) สำหรับสถาปัตยกรรมและสิ่งที่เหลือ
— Google Sign-In จริงเท่านั้น)

## ⚠️ เรื่องที่ควรรู้ก่อนแก้โค้ดเฟส 6 (ปัญหาที่เจอจริงและวิธีแก้)

รายละเอียดสถาปัตยกรรม auth มือถือทั้งหมดอยู่ใน [`mobile/README.md`](mobile/README.md) — สรุปสั้นๆ
เฉพาะส่วนที่กระทบโค้ดฝั่งเว็บ:

- **`await auth()` ใน API route ฝั่งนักศึกษาต้องเปลี่ยนเป็น `getSession(request)`**
  (`lib/auth/session.ts`) ไม่งั้นแอปมือถือ (ที่ไม่มี session cookie) จะเรียก route นั้นไม่ได้เลย —
  ทำไปแล้วครบทั้ง 14 routes ที่ฝั่งนักศึกษาใช้ ถ้าเพิ่ม route ฝั่งนักศึกษาใหม่ในอนาคตต้องใช้ตัวนี้แทน
  `auth()` ตั้งแต่แรก
- **route ที่มือถือ/เว็บข้าม origin เรียกได้ ต้องมี `export function OPTIONS()`** คืน `204` เปล่าๆ
  (CORS headers จริงมาจาก `next.config.ts`'s `headers()` อัตโนมัติ) ไม่งั้น browser preflight (สำหรับ
  request ที่มี `Authorization` header หรือ `Content-Type: application/json`) จะพังทั้งที่ response
  headers ถูกต้อง
- **`authorized()` callback ใน `auth.config.ts` ต้อง return `true` ทันทีเมื่อ `request.method ===
  "OPTIONS"`** ก่อนเช็ค login เพราะ preflight request ไม่แนบ credential ใดๆ มาด้วยโดยธรรมชาติ —
  ไม่งั้น middleware จะ redirect preflight เป็น 307 แล้ว CORS จะพังทั้ง flow
- **`extractActivityIdFromToken` (`lib/checkin/qr-token.ts`) เดิมรองรับแค่ bare token** ทั้งที่ QR
  ของจอโปรเจกเตอร์เข้ารหัสเป็น URL เต็ม (`buildCheckinUrl()`) — บั๊กจริงที่มีมาตั้งแต่เฟส 2 ทำให้การ
  สแกน QR ผ่านกล้องในแอป (ต่างจากการเปิดลิงก์ตรงๆ ที่ query string ถูก parse ให้แล้วโดย browser) ขึ้น
  error "QR นี้ไม่ใช่ QR ของระบบ SRRU Check" ทุกครั้งแม้ QR จะถูกต้อง เจอตอนพอร์ตฟีเจอร์เช็คชื่อไปมือถือ
  แก้แล้วให้รองรับทั้งสองแบบ (มี test ใน `qr-token.test.ts`)
- **ข้อมูลสาธิต (ACT-DEMO-001/002/003, user student2) มีสถานะแบบ relative-to-seed-time หรือ "ใช้แล้ว
  จำครั้งเดียว"** — `startTime`/`endTime` ของกิจกรรมสาธิตจะเลยเวลาไปเองถ้าเปิด session ใหม่ห่างจากตอน
  seed หลายชั่วโมง/ข้ามวัน (ตามเวลาจริง ไม่ใช่บั๊ก) และ student2 ("Deliberately incomplete profile")
  ก็จะไม่ใช่ "โปรไฟล์ยังไม่กรอก" อีกต่อไปทันทีที่มี test session ไหนกรอกให้เสร็จ — ทั้งสองกรณีเกิดจาก
  `prisma/seed.ts`'s upsert เดิมใช้ `update: {}` (no-op บนแถวที่มีอยู่แล้ว) แก้ให้ทุก upsert ที่มีสถานะ
  แบบนี้ refresh field ที่เกี่ยวข้องจริงทุกครั้งที่ seed แทน — รัน `npm run prisma:seed` ซ้ำได้ตลอดเพื่อ
  รีเซ็ตข้อมูลสาธิตกลับมาใช้งานได้ โดยไม่กระทบข้อมูลจริงอื่นๆ
- **`Alert.alert()` เป็น no-op เปล่าๆ บน React Native Web** (`static alert() {}` ทั้งฟังก์ชัน) ทั้งที่
  `mobile/app.json` ประกาศรองรับ web — ทุกจุดที่เรียกจะไม่แสดงอะไรเลยบน web และปุ่ม/callback ที่ผูกไว้
  (เช่น "ตกลง" ที่ควร redirect) ไม่มีทางถูกกดเลย เจอตอนทดสอบหน้าโปรไฟล์บน Expo web build จริง (บันทึก
  สำเร็จแล้วค้างอยู่หน้าเดิมตลอดไป) แก้ด้วย `mobile/lib/notify.ts` (สลับไป `window.alert()` บน web)
  สำหรับกรณี error message ทั่วไป และเปลี่ยนกรณี "สำเร็จแล้ว redirect" ให้ใช้ inline message +
  `setTimeout` แทนการรอ user กดปุ่มใน Alert
- **route ใหม่ที่มือถือต้องใช้แต่เว็บไม่เคยมี REST endpoint** (เพราะเว็บอ่าน/เขียนผ่าน Server
  Component/Server Action ตรงๆ) ให้พอร์ต business logic เดิมมาเป็น route ใหม่โดยเรียก schema/query
  เดิมซ้ำ ไม่ใช่เขียนใหม่ — ตัวอย่างจริงคือ `GET /api/profile` + `POST /api/profile` (พอร์ต
  `submitProfile` Server Action พร้อม `profileSchema` เดิม) และ `GET /api/faculties` (query เดียวกับ
  `/api/admin/faculties` แค่ไม่ gate เฉพาะ admin) — ดู [`mobile/README.md`](mobile/README.md) สำหรับ
  รายละเอียด

## ⚠️ เรื่องที่ควรรู้ก่อนแก้โค้ดเฟส 5 (ปัญหาที่เจอจริงและวิธีแก้)

- **PWA static assets (`/manifest.json`, `/sw.js`, `/offline.html`) โดน middleware บล็อกเป็น 401/307
  redirect ไป `/login`** — เพราะ browser fetch ไฟล์พวกนี้แบบไม่ผ่าน auth cookie (register SW/ดู
  manifest ทำงานไม่ว่า login อยู่หรือไม่) ต้องเพิ่มเข้า allowlist `isPublic` ใน
  `lib/auth/auth.config.ts` ตรงๆ (ใส่ path เฉพาะ ไม่ใช่ negative-lookahead ของ middleware matcher
  ที่กันแค่ path มีนามสกุลรูปภาพ)
- **ปุ่มที่มี `aria-label` คงที่แต่ข้อความในปุ่มเปลี่ยนตาม state (เช่น language toggle: label
  "Switch language" เสมอ, ข้อความในปุ่มสลับ "EN"/"ไทย" ตาม locale)** — accessible name ที่
  Playwright/screen reader ใช้คือค่าจาก `aria-label` เสมอ ไม่ใช่ text content ต้อง query ด้วย label
  คงที่ ไม่ใช่ข้อความที่เห็น (เจอตอนเขียน E2E test คลิกปุ่มสลับภาษากลับ)
- **`@react-pdf/renderer` ใช้ไม่ได้ตรงๆ ใน Route Handler** — พังด้วย `React error #31` เพราะ
  reconciler ที่ bundle มาในแพ็กเกจชนกับ webpack ของ Next.js (ทดสอบแล้วว่า `serverExternalPackages`
  แก้ไม่ได้) วิธีแก้ที่ใช้จริง: ย้ายการ render ไปเป็น child process แยก
  (`scripts/render-pdf-worker.mjs`, plain `.mjs` ไม่ผ่าน webpack เลย) แล้วเรียกผ่าน
  `child_process.execFile` ใน route — ดู `app/api/admin/reports/graduation/route.ts`
  ต้องมี `outputFileTracingIncludes` ใน `next.config.ts` ด้วย เพราะไฟล์นี้ถูกเรียกแบบ dynamic
  (ไม่ได้ import ตรงๆ) Next จะ trace ไม่เจอตอน deploy จริงถ้าไม่ระบุไว้
- **GET route handler ที่ไม่มี dynamic path segment ต้องใส่ `export const dynamic = "force-dynamic"`**
  ไม่งั้น Next.js จะ static-optimize แล้ว cache ผลลัพธ์ตอน build (รวมถึง 403 จาก build-time ที่ไม่มี
  auth cookie!) แล้วเสิร์ฟ response เก่าซ้ำๆ ให้ทุก request — เจอบั๊กนี้จริงตอนทดสอบ
  `/api/admin/reports/graduation` ใน production ใส่ไว้แล้วในทุก GET route ที่ไม่มี `[param]` ในพาธ
- **`trustHost: true`** ใน `lib/auth/auth.config.ts` จำเป็นสำหรับรันจริงนอก Vercel (หรือแม้แต่
  `next start` local) — ไม่งั้น Auth.js จะ reject ทุก request ด้วย `UntrustedHost` error

### ขอบเขตที่ยังไม่ครบ (รู้ไว้ก่อนใช้งานจริง)

- **i18n ครอบคลุมไม่ทั้งหมด** — แปลแล้วเฉพาะ nav/shared chrome (header, sidebar, ปุ่มสลับภาษา/ธีม)
  และหน้า home/login/dashboard เท่านั้น ฟอร์ม CRUD ฝั่งแอดมินและหน้านักศึกษาอื่นๆ (checkin, requests,
  history, notifications, profile) ยังเป็นภาษาไทยล้วน — ขยายทีหลังได้ตามรูปแบบที่วางไว้ใน
  `messages/th.json` / `messages/en.json` + `getTranslations()`
- **หัวตาราง Excel/PDF ไม่ผูกกับภาษาที่เลือก** — รายงานการเข้าร่วม (Excel) ไม่ได้อ่าน locale cookie
  ส่วนรายงานยื่นจบ (PDF) ตั้งใจให้เป็นภาษาไทยเสมอตามสเปกอยู่แล้ว ไม่ถือเป็นบั๊ก

## ⚠️ เรื่องที่ควรรู้ก่อนแก้โค้ดเฟส 4 (ปัญหาที่เจอจริงและวิธีแก้)

- **`@react-pdf/renderer` ใช้ไม่ได้ตรงๆ ใน Route Handler** — พังด้วย `React error #31` เพราะ
  reconciler ที่ bundle มาในแพ็กเกจชนกับ webpack ของ Next.js (ทดสอบแล้วว่า `serverExternalPackages`
  แก้ไม่ได้) วิธีแก้ที่ใช้จริง: ย้ายการ render ไปเป็น child process แยก
  (`scripts/render-pdf-worker.mjs`, plain `.mjs` ไม่ผ่าน webpack เลย) แล้วเรียกผ่าน
  `child_process.execFile` ใน route — ดู `app/api/admin/reports/graduation/route.ts`
  ต้องมี `outputFileTracingIncludes` ใน `next.config.ts` ด้วย เพราะไฟล์นี้ถูกเรียกแบบ dynamic
  (ไม่ได้ import ตรงๆ) Next จะ trace ไม่เจอตอน deploy จริงถ้าไม่ระบุไว้
- **GET route handler ที่ไม่มี dynamic path segment ต้องใส่ `export const dynamic = "force-dynamic"`**
  ไม่งั้น Next.js จะ static-optimize แล้ว cache ผลลัพธ์ตอน build (รวมถึง 403 จาก build-time ที่ไม่มี
  auth cookie!) แล้วเสิร์ฟ response เก่าซ้ำๆ ให้ทุก request — เจอบั๊กนี้จริงตอนทดสอบ
  `/api/admin/reports/graduation` ใน production ใส่ไว้แล้วในทุก GET route ที่ไม่มี `[param]` ในพาธ
- **`trustHost: true`** ใน `lib/auth/auth.config.ts` จำเป็นสำหรับรันจริงนอก Vercel (หรือแม้แต่
  `next start` local) — ไม่งั้น Auth.js จะ reject ทุก request ด้วย `UntrustedHost` error

## เริ่มต้นใช้งาน

### 1. ตั้งค่า Supabase (จำเป็นก่อนรันจริง)

1. สมัคร/ล็อกอินที่ [supabase.com](https://supabase.com) แล้วสร้างโปรเจคใหม่
2. ไปที่ **Project Settings → Database** คัดลอก connection string สองแบบ:
   - **Connection pooling** (port 6543, `?pgbouncer=true`) → ใส่ใน `DATABASE_URL`
   - **Direct connection** (port 5432) → ใส่ใน `DIRECT_URL`
3. ไปที่ **Project Settings → API** คัดลอก `Project URL`, `anon public key`, `service_role key`
4. คัดลอก `.env.example` เป็น `.env` แล้วกรอกค่าทั้งหมดแทน placeholder

```bash
cp .env.example .env
```

### 2. ติดตั้ง dependency + เตรียมฐานข้อมูล

```bash
npm install
npm run prisma:migrate    # สร้างตารางตาม prisma/schema.prisma
npm run prisma:seed       # seed คณะ/สาขาตัวอย่าง + dev user (admin/student)
npm run storage:setup     # สร้าง Supabase Storage bucket (private): attendance-selfies, evidence-files
```

> ⚠️ รายชื่อคณะ/สาขาใน seed เป็นข้อมูลตัวอย่างชั่วคราว ให้แทนที่ด้วยข้อมูลจริงผ่านฟีเจอร์นำเข้า Excel/CSV (เฟส 4) เมื่อมีไฟล์รายชื่อจริง
>
> ⚠️ เพดานชั่วโมง/ปีของคำร้องกิจกรรมภายนอกและเทียบชั่วโมงผู้นำ (ตอนนี้ default 20 ชม./ปี ทั้งคู่ ใน
> `lib/requests/caps.ts`) เป็นค่าตั้งต้นชั่วคราวเช่นกัน — สเปกระบุแค่ว่าต้องมีเพดาน ไม่ได้ระบุตัวเลข
> ปรับได้ผ่าน `Setting` table (key: `external_activity_hour_cap_per_year`,
> `credit_transfer_hour_cap_per_year`) เมื่อมีหน้าตั้งค่า (เฟส 4) หรือแก้ตรงๆ ในฐานข้อมูลตอนนี้ก็ได้

### 3. รัน dev server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) — จะ redirect ไปหน้า `/login`

### Dev-only login shortcut

เมื่อ `NODE_ENV=development` หน้า `/login` จะมีลิสต์ user จาก seed ให้คลิกล็อกอินได้ทันทีโดยไม่ต้องผ่าน Google OAuth จริง (route `/api/dev/login/[userId]`) — route นี้ 404 ทันทีเมื่อ `NODE_ENV=production` (verified)

การล็อกอินจริงผ่าน Google ต้องตั้งค่า `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` ใน `.env` (จำกัดเฉพาะโดเมน `ALLOWED_EMAIL_DOMAIN`)

## Tech stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 6 → Supabase Postgres
- Auth.js (NextAuth v5) — Google OAuth, JWT session, custom `User` model (ไม่ใช้ Prisma adapter)
- Supabase Storage — private buckets, signed URL เท่านั้น
- `qrcode` (generate) + `jsqr` (decode) — QR หมุนรหัสทุก 15 วิ, HMAC-signed, verify ฝั่ง server เท่านั้น
- Resend — ส่งอีเมลแจ้งเตือน (no-op fallback ถ้าไม่ตั้งค่า `RESEND_API_KEY`)
- next-intl — i18n ไทย/อังกฤษ แบบ cookie-based (ไม่มี `/en/...` prefix ใน URL)
- Vercel Cron — auto-close กิจกรรมที่หมดเวลารายชั่วโมง (`app/api/cron/close-ended-activities`)
- Vitest สำหรับ unit/integration tests

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน dev server |
| `npm run build` / `npm run start` | build + รันโหมด production |
| `npm run prisma:migrate` | รัน migration ตาม schema |
| `npm run prisma:seed` | seed ข้อมูลตัวอย่าง |
| `npm run storage:setup` | สร้าง Supabase Storage bucket |
| `npm test` | รัน test suite (Vitest) |
| `npm run lint` | ESLint |

## โครงสร้างโปรเจค

```
app/
  (student)/        เส้นทางฝั่งนักศึกษา (dashboard, activities, checkin, requests, history, notifications, profile)
  (admin)/admin/     เส้นทางฝั่งแอดมิน (activities, live, requests, students, users, faculties, settings, audit-log, announcements, reports)
  api/               Route handlers — api/admin/* คือฝั่งแอดมินทั้งหมด, ที่เหลือคือฝั่งนักศึกษา
  login/, setup-profile/
lib/
  auth/              NextAuth config (auth.config.ts = edge-safe, auth.ts = full config + providers)
  checkin/           ตรรกะเช็คชื่อสามประสาน (qr-token, geo, evaluate, service) — pure functions มี test คู่
  passport/          คำนวณ Activity Passport (criteria, calculate = pure fn มี test, service = bulk query)
  requests/          คำร้องภายนอก/เทียบชั่วโมง/เช็คชื่อย้อนหลัง (validation, caps, evidence, service)
  admin/             ตรรกะฝั่งแอดมิน (activities, faculties, students, settings, request-decisions, datetime, student-import)
  audit/             เขียน/อ่าน audit log แบบ paginate ที่ database
  notifications/     dispatch แบบ fault-isolated (Promise.allSettled ต่อ recipient)
  reports/           ชนิดข้อมูลรายงาน (ตัวเรนเดอร์ PDF จริงอยู่ที่ scripts/render-pdf-worker.mjs)
  supabase/          Supabase Storage client + upload/signed-url helpers
  labels.ts          Thai label constants ใช้ร่วมกันทั้งระบบ
  prisma.ts          Prisma client singleton
components/
  checkin/           CameraCapture (เซลฟีกล้องหน้าเท่านั้น), QrScanner, LiveQrDisplay
  admin/             LocationPickerMap (Leaflet), ActivityForm, LiveAttendanceTable
prisma/
  schema.prisma      Data model เต็มตาม spec
  seed.ts            ข้อมูลตัวอย่าง (คณะ/สาขา placeholder + dev users + activity ตัวอย่าง 3 รายการ)
scripts/
  setup-storage.ts       สร้าง Supabase Storage bucket
  render-pdf-worker.mjs  เรนเดอร์ PDF รายงานยื่นจบ นอก webpack (ดูหัวข้อด้านบน)
mobile/              React Native/Expo app (ว่าง — มาในเฟส 6)
```

## แผนการพัฒนา (เฟส)

0. **Bootstrap** ✅ — โครงโปรเจค, schema, auth, route skeleton
1. **Auth + Profile setup + cascading faculty/major dropdown** ✅
2. **เช็คชื่อสามประสาน** ✅ — QR หมุนรหัส + GPS + กล้องหน้า + auto_approve/flag logic พร้อม unit tests
   และ E2E ผ่านจริงกับ Supabase
3. **แดชบอร์ดนักศึกษา (Activity Passport) + คำร้องต่างๆ** ✅ — คำนวณเกณฑ์ผ่าน/ชั่วโมงสะสมแยก 5
   หมวด (bulk query ไม่ query ทีละคน — ใช้ซ้ำได้ทั้งหน้า dashboard คนเดียวและรายงานเฟส 4), คำร้อง
   กิจกรรมภายนอก/เทียบชั่วโมงผู้นำ (มีเพดานชั่วโมง/ปี + ยกเลิกได้), เช็คชื่อย้อนหลัง (กันยื่นซ้ำ),
   ประวัติกิจกรรมแบบ paginate — พร้อม unit tests (49 tests รวมทุกเฟส) และ E2E ยืนยันตัวเลข
   dashboard ตรงกับคำนวณมือ 100%
4. **ฝั่งแอดมิน** ✅ — จัดการกิจกรรม (ปักหมุด GPS ด้วย Leaflet + จำกัดสิทธิ์คณะ/สาขา/ชั้นปี),
   Live Event Control (ตารางเรียลไทม์ + bulk/force approve + export Excel), อนุมัติคำร้องทั้ง 3
   ประเภท (อนุมัติเช็คชื่อย้อนหลังสร้าง Attendance จริงแบบ transaction), จัดการผู้ใช้/สิทธิ์ (กัน
   admin ระงับบัญชีตัวเอง), audit log แบบ paginate ที่ database, ตั้งค่าเกณฑ์การจบ/เพดานชั่วโมง,
   จัดการคณะ/สาขา, นำเข้านักศึกษาจาก Excel, ประกาศ, รายงานยื่นจบ (PDF ภาษาไทย) + รายงานการเข้าร่วม
   (Excel) — ยืนยันแล้วว่า PDF/route ที่ไม่มี dynamic segment/auth ทำงานถูกต้องทั้งใน dev และ
   production build จริง (ดูหัวข้อปัญหาที่เจอด้านบน)
5. **Cross-cutting** ✅ — แจ้งเตือน async แบบเต็ม (in-app + email ผ่าน Resend, fault-isolated
   ต่อ recipient ด้วย `Promise.allSettled`) ครอบคลุมทุก trigger ในสเปก (เช็คชื่อ, กิจกรรมใหม่/แก้ไข,
   อนุมัติ/ปฏิเสธคำร้องทั้ง 3 ประเภท, พลาดกิจกรรม), auto-close กิจกรรมที่หมดเวลาผ่าน Vercel Cron
   รายชั่วโมง (`vercel.json` + `CRON_SECRET` bearer auth), i18n ไทย/อังกฤษด้วย next-intl
   (nav/shared chrome + หน้า home/login/dashboard — ฟอร์มแอดมินและหน้านักศึกษาอื่นยังเป็นไทยล้วน),
   dark/light mode persist ผ่าน localStorage ไม่ผูกกับ OS preference, PWA (manifest + service worker
   + offline fallback page, installable) — ยืนยันด้วย E2E 20 scenario ผ่านหมดจริงกับ Supabase
6. **แอปมือถือ (React Native/Expo)** 🚧 — เกือบครบ: Bearer-token auth bridge ฝั่ง backend
   (dev-login + Google JWKS verify, ใช้ user-upsert/domain-check ตัวเดียวกับเว็บ), `getSession()`
   รองรับทั้ง cookie (เว็บ) และ Bearer token (มือถือ) ใน 14 API routes ฝั่งนักศึกษา + route ใหม่ 3 ตัว
   ที่มือถือต้องใช้แต่เว็บไม่เคยมี REST endpoint (`/api/activities/closed`, `/api/faculties`,
   `/api/profile`), CORS สำหรับ caller ข้าม origin แอป Expo (expo-router) มีครบ: เข้าสู่ระบบ
   (dev-login list), แดชบอร์ด Activity Passport, เช็คชื่อ (สแกน QR/แนบหลักฐาน + GPS + เซลฟี), คำร้อง
   3 ประเภท (พร้อมแนบไฟล์หลักฐาน + ยกเลิกคำร้อง), ประวัติกิจกรรม, การแจ้งเตือน, และโปรไฟล์ (ดู/แก้ไข +
   first-time setup gate) ทั้งหมดเรียก API เส้นทางเดียวกับเว็บ — ยืนยันด้วย E2E ผ่าน Expo web build
   จริงทุกฟีเจอร์ (auth+dashboard 11/11, เช็คชื่อ 8/8, คำร้อง+ประวัติ+แจ้งเตือน+โปรไฟล์ 10/10 รวมยื่น
   คำร้องจริงพร้อมไฟล์แนบผ่าน native file chooser, first-time profile setup 4/4) ยังไม่ทำ: Google
   Sign-In จริงบนมือถือ (ดู [`mobile/README.md`](mobile/README.md))
