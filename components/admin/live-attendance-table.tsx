"use client";

import { useCallback, useEffect, useState } from "react";
import { ATTENDANCE_STATUS_LABELS, FLAG_REASON_LABELS } from "@/lib/labels";

type AttendanceRow = {
  id: string;
  status: "auto_approved" | "flagged" | "rejected";
  flagReason: string | null;
  distanceMeters: number | null;
  checkinTime: string;
  checkinMethod: string;
  user: { firstName: string | null; lastName: string | null; email: string; studentId: string | null };
};

const POLL_INTERVAL_MS = 5000;

export function LiveAttendanceTable({ activityId }: { activityId: string }) {
  const [rows, setRows] = useState<AttendanceRow[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/live/${activityId}/attendances`)
      .then((r) => r.json())
      .then((d) => setRows(d.attendances ?? []))
      .catch(() => {});
  }, [activityId]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const flaggedRows = rows?.filter((r) => r.status === "flagged") ?? [];

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkApprove() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/live/${activityId}/bulk-approve`, { method: "POST" });
      const data = await res.json();
      setMessage(res.ok ? `แจ้งเตือนแล้ว ${data.notified}/${data.total} คน` : (data.error ?? "ทำรายการไม่สำเร็จ"));
    } finally {
      setBusy(false);
    }
  }

  async function handleForceApprove() {
    if (selected.size === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/live/${activityId}/force-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`บังคับอนุมัติแล้ว ${data.approved} รายการ`);
        setSelected(new Set());
        load();
      } else {
        setMessage(data.error ?? "ทำรายการไม่สำเร็จ");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleBulkApprove}
          disabled={busy}
          className="rounded-full bg-brand-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          แจ้งเตือนผู้ที่อนุมัติอัตโนมัติทั้งหมด
        </button>
        <button
          type="button"
          onClick={handleForceApprove}
          disabled={busy || selected.size === 0}
          className="rounded-full border border-foreground/20 px-4 py-1.5 text-sm disabled:opacity-40"
        >
          บังคับอนุมัติที่เลือก ({selected.size})
        </button>
        <a
          href={`/api/admin/live/${activityId}/export`}
          className="rounded-full border border-foreground/20 px-4 py-1.5 text-sm"
        >
          Export Excel
        </a>
        {message && <span className="text-sm text-foreground/60">{message}</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-foreground/10 text-foreground/60">
            <tr>
              <th className="py-2 pr-4"></th>
              <th className="py-2 pr-4">นักศึกษา</th>
              <th className="py-2 pr-4">เวลา</th>
              <th className="py-2 pr-4">สถานะ</th>
              <th className="py-2 pr-4">ระยะห่าง</th>
              <th className="py-2 pr-4">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className="border-b border-foreground/5">
                <td className="py-2 pr-4">
                  {r.status === "flagged" && (
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                    />
                  )}
                </td>
                <td className="py-2 pr-4">
                  {[r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || r.user.email}
                  <span className="ml-1 text-xs text-foreground/50">({r.user.studentId ?? "-"})</span>
                </td>
                <td className="py-2 pr-4">{new Date(r.checkinTime).toLocaleTimeString("th-TH")}</td>
                <td className="py-2 pr-4">{ATTENDANCE_STATUS_LABELS[r.status]}</td>
                <td className="py-2 pr-4">
                  {r.distanceMeters != null ? `${Math.round(r.distanceMeters)} ม.` : "-"}
                </td>
                <td className="py-2 pr-4 text-xs text-amber-600">
                  {r.flagReason
                    ?.split(",")
                    .map((f) => FLAG_REASON_LABELS[f] ?? f)
                    .join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows?.length === 0 && <p className="py-4 text-sm text-foreground/50">ยังไม่มีผู้เช็คชื่อ</p>}
      </div>

      {flaggedRows.length > 0 && (
        <p className="text-xs text-foreground/50">
          เคล็ดลับ: ติ๊กเลือกรายการที่ถูก flag แล้วกด &quot;บังคับอนุมัติที่เลือก&quot;
          สำหรับกรณี เช่น GPS คลาดเคลื่อนทั้งอาคาร
        </p>
      )}
    </div>
  );
}
