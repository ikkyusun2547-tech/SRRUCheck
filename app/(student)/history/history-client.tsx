"use client";

import { useEffect, useState } from "react";
import { ATTENDANCE_STATUS_LABELS, FLAG_REASON_LABELS, REQUEST_STATUS_LABELS } from "@/lib/labels";
import { EmptyState } from "@/components/admin/empty-state";
import { Pagination } from "@/components/admin/pagination";
import { HistoryIcon, DocumentIcon } from "@/components/student/nav-icons";

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
  const [data, setData] = useState<{ items: (AttendanceItem | RequestItem)[]; total: number; totalPages: number } | null>(
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
        if (!cancelled) setData({ items: d.items, total: d.total, totalPages: d.totalPages });
      })
      .catch(() => {
        if (!cancelled) setData({ items: [], total: 0, totalPages: 1 });
      });
    return () => {
      cancelled = true;
    };
  }, [tab, page]);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-foreground/10 bg-surface p-2 shadow-sm">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400"
                : "text-foreground/60 hover:bg-foreground/5"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {!data && <p className="py-8 text-center text-sm text-foreground/50">กำลังโหลด...</p>}
      {data?.items.length === 0 && <EmptyState icon={<HistoryIcon className="h-[22px] w-[22px]" />} message="ยังไม่มีข้อมูล" />}

      <ul className="space-y-2.5">
        {tab === "attendance"
          ? (data?.items as AttendanceItem[] | undefined)?.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400">
                  <HistoryIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-medium text-foreground">{item.activity.title}</p>
                    <StatusBadge status={item.status} labels={ATTENDANCE_STATUS_LABELS} />
                  </div>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    {new Date(item.checkinTime).toLocaleString("th-TH")} · {item.activity.creditHours} ชม.
                    {item.distanceMeters != null && ` · ระยะ ${Math.round(item.distanceMeters)} ม.`}
                  </p>
                  {item.flagReason && (
                    <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
                      {item.flagReason
                        .split(",")
                        .map((r) => FLAG_REASON_LABELS[r] ?? r)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </li>
            ))
          : (data?.items as RequestItem[] | undefined)?.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400">
                  <DocumentIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-medium text-foreground">
                      {item.title ?? item.activity?.title ?? item.reason}
                    </p>
                    <StatusBadge status={item.status} labels={REQUEST_STATUS_LABELS} />
                  </div>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    {new Date(item.createdAt).toLocaleString("th-TH")}
                    {item.hoursRequested != null && ` · ขอ ${item.hoursRequested} ชม.`}
                    {item.hoursApproved != null && ` · อนุมัติ ${item.hoursApproved} ชม.`}
                  </p>
                </div>
              </li>
            ))}
      </ul>

      {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
    </div>
  );
}

const STATUS_DOT: Record<string, string> = {
  auto_approved: "bg-brand-emerald-500",
  approved: "bg-brand-emerald-500",
  flagged: "bg-amber-500",
  pending: "bg-amber-500",
  rejected: "bg-red-500",
  cancelled: "bg-foreground/30",
};

function StatusBadge<T extends string>({ status, labels }: { status: T; labels: Record<T, string> }) {
  const tone =
    status === "auto_approved" || status === "approved"
      ? "text-brand-emerald-700 dark:text-brand-emerald-400"
      : status === "rejected"
        ? "text-red-700 dark:text-red-400"
        : status === "cancelled"
          ? "text-foreground/50"
          : "text-amber-700 dark:text-amber-400";

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-foreground/30"}`} />
      {labels[status]}
    </span>
  );
}
