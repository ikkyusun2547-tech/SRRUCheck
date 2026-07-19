# SRRU Check

ระบบบริหารจัดการและเช็คชื่อกิจกรรมนักศึกษา — Next.js 15 (App Router) + TypeScript + Prisma + Supabase (Postgres + Storage) + Auth.js

Monorepo: เว็บอยู่ที่ root, แอปมือถือ (React Native/Expo) อยู่ที่ `mobile/` (มาในเฟสหลัง — ยังว่างอยู่)

## สถานะปัจจุบัน: เฟส 4 — ฝั่งแอดมิน

เฟส 0-4 เสร็จแล้ว ครอบคลุมทั้งฝั่งนักศึกษา (auth, profile, เช็คชื่อสามประสาน, Activity Passport,
คำร้อง 3 ประเภท) และฝั่งแอดมิน (จัดการกิจกรรมพร้อมปักหมุด GPS บนแผนที่, Live Event Control เต็ม
รูปแบบ, อนุมัติคำร้อง, จัดการผู้ใช้/สิทธิ์, audit log แบบ paginate ที่ database, ตั้งค่าเกณฑ์การจบ,
จัดการคณะ/สาขา, นำเข้านักศึกษาจาก Excel, ประกาศ, รายงาน PDF/Excel) ทดสอบ end-to-end กับ Supabase
จริงทั้งใน dev และ production build (`next build && next start`) ยังไม่มี notification แบบ
async เต็มรูปแบบ/i18n/dark-light/PWA/auto-close cron — มาในเฟส 5

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
5. Cross-cutting: notification (async แบบเต็ม — ตอนนี้มี in-app + fault-isolated dispatch แล้ว
   ยังไม่มี email/push), i18n, dark/light mode, PWA, auto-close cron
6. แอปมือถือ (React Native/Expo)
