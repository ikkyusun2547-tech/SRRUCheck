"use client";

import { useEffect, useState } from "react";
import { ATTENDANCE_STATUS_LABELS, FLAG_REASON_LABELS, REQUEST_STATUS_LABELS } from "@/lib/labels";

type Tab = "attendance" | "external" | "credit-transfer" | "late-checkin";

const TAB_LABELS: Record<Tab, string> = {
  attendance: "การเช็คชื่อ",
  external: "กิจกรรมภายนอก",
  "credit-transfer": "เทียบชั่วโมงผู้นำ",
  "late-checkin": "เช็คชื่อย้อนหลัง",
};

type AttendanceItem = {
  id: string;
  checkinTime: string;
  checkinMethod: string;
  status: "auto_approved" | "flagged" | "rejected";
  flagReason: string | null;
  distanceMeters: number | null;
  activity: { title: string; activityCode: string; creditHours: number };
};

type RequestItem = {
  id: string;
  title?: string;
  reason?: string;
  hoursRequested?: number;
  hoursApproved?: number | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  activity?: { title: string; activityCode: string };
};

export function HistoryClient() {
  const [tab, setTab] = useState<Tab>("attendance");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: (AttendanceItem | RequestItem)[]; totalPages: number } | null>(
    null
  );

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    // Guard against a slow, stale request (e.g. from a tab switched away
    // from) resolving after a newer one and clobbering it with wrong data.
    let cancelled = false;
    setData(null);
    const url =
      tab === "attendance"
        ? `/api/attendance/mine?page=${page}`
        : `/api/requests/mine?type=${tab}&page=${page}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData({ items: d.items, totalPages: d.totalPages });
      })
      .catch(() => {
        if (!cancelled) setData({ items: [], totalPages: 1 });
      });
    return () => {
      cancelled = true;
    };
  }, [tab, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-foreground/10 pb-2">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              tab === t ? "bg-brand-purple-600 text-white" : "border border-foreground/20"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {!data && <p className="text-sm text-foreground/50">กำลังโหลด...</p>}
      {data?.items.length === 0 && <p className="text-sm text-foreground/50">ยังไม่มีข้อมูล</p>}

      <ul className="space-y-2">
        {tab === "attendance"
          ? (data?.items as AttendanceItem[] | undefined)?.map((item) => (
              <li key={item.id} className="rounded-md border border-foreground/10 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.activity.title}</p>
                    <p className="mt-0.5 text-xs text-foreground/50">
                      {new Date(item.checkinTime).toLocaleString("th-TH")} · {item.activity.creditHours} ชม.
                      {item.distanceMeters != null && ` · ระยะ ${Math.round(item.distanceMeters)} ม.`}
                    </p>
                    {item.flagReason && (
                      <p className="mt-1 text-xs text-amber-600">
                        {item.flagReason
                          .split(",")
                          .map((r) => FLAG_REASON_LABELS[r] ?? r)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={item.status} labels={ATTENDANCE_STATUS_LABELS} />
                </div>
              </li>
            ))
          : (data?.items as RequestItem[] | undefined)?.map((item) => (
              <li key={item.id} className="rounded-md border border-foreground/10 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {item.title ?? item.activity?.title ?? item.reason}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground/50">
                      {new Date(item.createdAt).toLocaleString("th-TH")}
                      {item.hoursRequested != null && ` · ขอ ${item.hoursRequested} ชม.`}
                      {item.hoursApproved != null && ` · อนุมัติ ${item.hoursApproved} ชม.`}
                    </p>
                  </div>
                  <StatusBadge status={item.status} labels={REQUEST_STATUS_LABELS} />
                </div>
              </li>
            ))}
      </ul>

      {data && data.totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-foreground/20 px-3 py-1 disabled:opacity-40"
          >
            ก่อนหน้า
          </button>
          <span>
            หน้า {page} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-foreground/20 px-3 py-1 disabled:opacity-40"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge<T extends string>({ status, labels }: { status: T; labels: Record<T, string> }) {
  const tone =
    status === "auto_approved" || status === "approved"
      ? "bg-brand-emerald-500/15 text-brand-emerald-600"
      : status === "rejected"
        ? "bg-red-500/15 text-red-600"
        : status === "cancelled"
          ? "bg-foreground/10 text-foreground/50"
          : "bg-amber-500/15 text-amber-600";

  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${tone}`}>{labels[status]}</span>;
}
