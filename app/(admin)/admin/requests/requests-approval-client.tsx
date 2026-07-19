"use client";

import { useEffect, useState } from "react";
import { CATEGORY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/labels";

type RequestType = "external" | "credit-transfer" | "late-checkin";

const TYPE_LABELS: Record<RequestType, string> = {
  external: "กิจกรรมภายนอก",
  "credit-transfer": "เทียบชั่วโมงผู้นำ",
  "late-checkin": "เช็คชื่อย้อนหลัง",
};

type RequestItem = {
  id: string;
  title?: string;
  reason?: string;
  activityCategory?: string;
  hoursRequested?: number;
  hoursApproved?: number | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  adminComment?: string | null;
  evidenceUrl?: string | null;
  createdAt: string;
  user: { firstName: string | null; lastName: string | null; email: string; studentId: string | null };
  activity?: { title: string; activityCode: string };
};

export function RequestsApprovalClient() {
  const [type, setType] = useState<RequestType>("external");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "cancelled">("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: RequestItem[]; totalPages: number; total: number } | null>(
    null
  );

  useEffect(() => {
    setPage(1);
  }, [type, status]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/requests?type=${type}&status=${status}&page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData({ items: [], totalPages: 1, total: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [type, status, page]);

  function refresh() {
    setData(null);
    fetch(`/api/admin/requests?type=${type}&status=${status}&page=${page}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ items: [], totalPages: 1, total: 0 }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-foreground/10 pb-2">
        {(Object.keys(TYPE_LABELS) as RequestType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              type === t ? "bg-brand-purple-600 text-white" : "border border-foreground/20"
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="flex gap-2 text-sm">
        {(["pending", "approved", "rejected", "cancelled"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 ${
              status === s ? "bg-brand-emerald-500 text-white" : "border border-foreground/20"
            }`}
          >
            {REQUEST_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {!data && <p className="text-sm text-foreground/50">กำลังโหลด...</p>}
      {data?.items.length === 0 && <p className="text-sm text-foreground/50">ไม่มีคำร้อง</p>}

      <div className="space-y-3">
        {data?.items.map((item) => (
          <RequestCard key={item.id} type={type} item={item} onDecided={refresh} />
        ))}
      </div>

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
            หน้า {page} / {data.totalPages} (ทั้งหมด {data.total})
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

function RequestCard({
  type,
  item,
  onDecided,
}: {
  type: RequestType;
  item: RequestItem;
  onDecided: () => void;
}) {
  const [hoursApproved, setHoursApproved] = useState(String(item.hoursRequested ?? ""));
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "approved" | "rejected") {
    setPending(true);
    setError(null);
    try {
      const endpoint =
        type === "external"
          ? `/api/admin/requests/external/${item.id}`
          : type === "credit-transfer"
            ? `/api/admin/requests/credit-transfer/${item.id}`
            : `/api/admin/requests/late-checkin/${item.id}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          hoursApproved: type !== "late-checkin" ? Number(hoursApproved) : undefined,
          adminComment: comment || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ดำเนินการไม่สำเร็จ");
        return;
      }
      onDecided();
    } finally {
      setPending(false);
    }
  }

  const studentName =
    [item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || item.user.email;

  return (
    <div className="rounded-lg border border-foreground/10 p-4 text-sm">
      <p className="font-medium">{item.title ?? item.activity?.title ?? item.reason}</p>
      <p className="mt-0.5 text-xs text-foreground/50">
        {studentName} ({item.user.studentId ?? "-"}) ·{" "}
        {new Date(item.createdAt).toLocaleString("th-TH")}
        {item.hoursRequested != null && ` · ขอ ${item.hoursRequested} ชม.`}
        {item.activityCategory &&
          ` · ${CATEGORY_LABELS[item.activityCategory as keyof typeof CATEGORY_LABELS]}`}
      </p>
      {item.reason && item.activity && <p className="mt-1 text-xs text-foreground/70">เหตุผล: {item.reason}</p>}
      {item.evidenceUrl && (
        <a
          href={item.evidenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-brand-purple-600"
        >
          ดูหลักฐานแนบ
        </a>
      )}

      {item.status !== "pending" ? (
        <p className="mt-2 text-xs text-foreground/60">
          ผล: {REQUEST_STATUS_LABELS[item.status]}
          {item.hoursApproved != null && ` (${item.hoursApproved} ชม.)`}
          {item.adminComment && ` — ${item.adminComment}`}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-foreground/10 pt-3">
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
          {type !== "late-checkin" && (
            <div>
              <label className="mb-1 block text-xs text-foreground/60">ชั่วโมงที่อนุมัติ</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={hoursApproved}
                onChange={(e) => setHoursApproved(e.target.value)}
                className="w-24 rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm"
              />
            </div>
          )}
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1 block text-xs text-foreground/60">หมายเหตุ</label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => decide("approved")}
            className="rounded-full bg-brand-emerald-500 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
          >
            อนุมัติ
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => decide("rejected")}
            className="rounded-full border border-red-500/40 px-3 py-1 text-xs text-red-600 disabled:opacity-60"
          >
            ปฏิเสธ
          </button>
        </div>
      )}
    </div>
  );
}
