# SRRU Check

ระบบบริหารจัดการและเช็คชื่อกิจกรรมนักศึกษา — Next.js 15 (App Router) + TypeScript + Prisma + Supabase (Postgres + Storage) + Auth.js

Monorepo: เว็บอยู่ที่ root, แอปมือถือ (React Native/Expo) อยู่ที่ `mobile/` (มาในเฟสหลัง — ยังว่างอยู่)

## สถานะปัจจุบัน: เฟส 2 — เช็คชื่อสามประสาน

เฟส 0 (bootstrap), เฟส 1 (auth + profile setup) และเฟส 2 (เช็คชื่อสามประสาน: QR หมุนรหัส + GPS +
เซลฟีกล้องหน้า + auto_approve/flag) เสร็จแล้ว ทดสอบ end-to-end กับ Supabase จริงผ่านหมดทุก
สถานการณ์ (auto_approved, self_report, GPS out of bounds, printed QR, duplicate check-in, closed
activity, expired token) ยังไม่มี UI ฝั่งแอดมินแบบเต็ม (bulk/force approve, ตารางเรียลไทม์,
export) — มาในเฟส 4

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
  (admin)/admin/     เส้นทางฝั่งแอดมิน (live = QR หมุนรหัสสำหรับโปรเจคเตอร์)
  api/               Route handlers (auth, dev-login, cron, qr-token, checkin, activities)
  login/, setup-profile/
lib/
  auth/              NextAuth config (auth.config.ts = edge-safe, auth.ts = full config + providers)
  checkin/           ตรรกะเช็คชื่อสามประสาน (qr-token, geo, evaluate, service) — pure functions มี test คู่
  supabase/          Supabase Storage client + upload/signed-url helpers
  prisma.ts          Prisma client singleton
components/
  checkin/           CameraCapture (เซลฟีกล้องหน้าเท่านั้น), QrScanner, LiveQrDisplay
prisma/
  schema.prisma      Data model เต็มตาม spec
  seed.ts            ข้อมูลตัวอย่าง (คณะ/สาขา placeholder + dev users + activity ตัวอย่าง 3 รายการ)
scripts/
  setup-storage.ts   สร้าง Supabase Storage bucket
mobile/              React Native/Expo app (ว่าง — มาในเฟส 6)
```

## แผนการพัฒนา (เฟส)

0. **Bootstrap** ✅ — โครงโปรเจค, schema, auth, route skeleton
1. **Auth + Profile setup + cascading faculty/major dropdown** ✅
2. **เช็คชื่อสามประสาน** ✅ — QR หมุนรหัส + GPS + กล้องหน้า + auto_approve/flag logic พร้อม unit tests
   (33 tests) และ E2E ผ่านจริงกับ Supabase
3. แดชบอร์ดนักศึกษา (Activity Passport) + คำร้องต่างๆ
4. ฝั่งแอดมิน (จัดการกิจกรรม, Live Event Control, อนุมัติคำร้อง, ผู้ใช้, audit log, รายงาน)
5. Cross-cutting: notification (async), i18n, dark/light mode, PWA, auto-close cron
6. แอปมือถือ (React Native/Expo)
