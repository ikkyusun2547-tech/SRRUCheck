import { Suspense } from "react";
import { CheckinFlow } from "./checkin-flow";

export default function CheckinPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e0b47] via-brand-purple-800 to-brand-purple-600 px-7 py-9 text-white shadow-xl shadow-brand-purple-950/30 sm:px-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-[90px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-brand-emerald-400/25 blur-[90px]" />
        <div className="relative">
          <p className="text-sm font-medium text-white/70">กองพัฒนานักศึกษา</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">เช็คชื่อกิจกรรม</h1>
          <p className="mt-1 text-sm text-white/70">สแกน QR หน้างาน หรือเลือกกิจกรรมที่เปิดรับเช็คชื่อ</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Suspense fallback={<p className="text-sm text-foreground/50">กำลังโหลด...</p>}>
          <CheckinFlow />
        </Suspense>
      </div>
    </div>
  );
}
