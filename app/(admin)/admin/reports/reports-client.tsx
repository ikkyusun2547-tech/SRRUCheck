"use client";

import { useState } from "react";

export function ReportsClient() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const participationUrl = (() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString();
    return `/api/admin/reports/participation${qs ? `?${qs}` : ""}`;
  })();

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-lg border border-foreground/10 p-4">
        <h2 className="mb-2 font-medium">รายงานนักศึกษาพร้อมยื่นจบ (PDF)</h2>
        <p className="mb-3 text-sm text-foreground/60">
          รายชื่อนักศึกษาชั้นปีที่ 4 ที่ผ่านเกณฑ์กิจกรรมครบถ้วน สำหรับส่งสำนักทะเบียน
        </p>
        <a
          href="/api/admin/reports/graduation"
          className="inline-block rounded-full bg-brand-emerald-500 px-4 py-2 text-sm font-medium text-white"
        >
          ดาวน์โหลด PDF
        </a>
      </div>

      <div className="rounded-lg border border-foreground/10 p-4">
        <h2 className="mb-2 font-medium">รายงานการเข้าร่วม (Excel)</h2>
        <p className="mb-3 text-sm text-foreground/60">แยกตามกิจกรรมและคณะ เลือกช่วงเวลาได้ (ไม่บังคับ)</p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-foreground/60">ตั้งแต่</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/60">ถึง</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <a
          href={participationUrl}
          className="inline-block rounded-full bg-brand-emerald-500 px-4 py-2 text-sm font-medium text-white"
        >
          ดาวน์โหลด Excel
        </a>
      </div>
    </div>
  );
}
