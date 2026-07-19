"use client";

import { useEffect, useState } from "react";
import { fileToDataUrl } from "@/lib/file-to-data-url";
import { CATEGORY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/labels";

type ClosedActivity = { id: string; title: string; activityCode: string };

type Tab = "external" | "credit-transfer" | "late-checkin" | "mine";

const TAB_LABELS: Record<Tab, string> = {
  external: "กิจกรรมภายนอก",
  "credit-transfer": "เทียบชั่วโมงผู้นำ",
  "late-checkin": "เช็คชื่อย้อนหลัง",
  mine: "คำร้องของฉัน",
};

export function RequestsClient({ closedActivities }: { closedActivities: ClosedActivity[] }) {
  const [tab, setTab] = useState<Tab>("external");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
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

      {tab === "external" && (
        <ExternalActivityForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
      )}
      {tab === "credit-transfer" && (
        <CreditTransferForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
      )}
      {tab === "late-checkin" && (
        <LateCheckInForm
          closedActivities={closedActivities}
          onSubmitted={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {tab === "mine" && <MyRequestsList refreshKey={refreshKey} />}
    </div>
  );
}

function FormShell({
  children,
  error,
  success,
}: {
  children: React.ReactNode;
  error: string | null;
  success: string | null;
}) {
  return (
    <div className="max-w-md space-y-3">
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md border border-brand-emerald-500/40 bg-brand-emerald-500/10 px-3 py-2 text-sm text-brand-emerald-600">
          {success}
        </p>
      )}
      {children}
    </div>
  );
}

function ExternalActivityForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [hours, setHours] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("กรุณาแนบหลักฐาน");
      return;
    }
    setPending(true);
    try {
      const evidenceDataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/requests/external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          activityCategory: category,
          hoursRequested: Number(hours),
          evidenceDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ยื่นคำร้องไม่สำเร็จ");
        return;
      }
      setSuccess("ยื่นคำร้องสำเร็จ รอแอดมินตรวจสอบ");
      setTitle("");
      setCategory("");
      setHours("");
      setFile(null);
      onSubmitted();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  return (
    <FormShell error={error} success={success}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">ชื่อกิจกรรม</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">หมวดหมู่</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="" disabled>
              เลือกหมวดหมู่
            </option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">จำนวนชั่วโมงที่ขอเทียบ</label>
          <input
            required
            type="number"
            min="0"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">หลักฐาน (รูปภาพหรือ PDF)</label>
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-emerald-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "กำลังส่ง..." : "ยื่นคำร้อง"}
        </button>
      </form>
    </FormShell>
  );
}

function CreditTransferForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError("กรุณาแนบหลักฐาน");
      return;
    }
    setPending(true);
    try {
      const evidenceDataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/requests/credit-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, hoursRequested: Number(hours), evidenceDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ยื่นคำร้องไม่สำเร็จ");
        return;
      }
      setSuccess("ยื่นคำร้องสำเร็จ รอแอดมินตรวจสอบ");
      setTitle("");
      setHours("");
      setFile(null);
      onSubmitted();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  return (
    <FormShell error={error} success={success}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">ตำแหน่ง/เหตุผลที่ขอเทียบชั่วโมง</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">จำนวนชั่วโมงที่ขอเทียบ</label>
          <input
            required
            type="number"
            min="0"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">หลักฐาน (รูปภาพหรือ PDF)</label>
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-emerald-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "กำลังส่ง..." : "ยื่นคำร้อง"}
        </button>
      </form>
    </FormShell>
  );
}

function LateCheckInForm({
  closedActivities,
  onSubmitted,
}: {
  closedActivities: ClosedActivity[];
  onSubmitted: () => void;
}) {
  const [activityId, setActivityId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const res = await fetch("/api/requests/late-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ยื่นคำร้องไม่สำเร็จ");
        return;
      }
      setSuccess("ยื่นคำร้องสำเร็จ รอแอดมินตรวจสอบ");
      setActivityId("");
      setReason("");
      onSubmitted();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  return (
    <FormShell error={error} success={success}>
      {closedActivities.length === 0 ? (
        <p className="text-sm text-foreground/60">ยังไม่มีกิจกรรมที่ปิดรับเช็คชื่อแล้วให้ยื่นคำร้อง</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">กิจกรรม</label>
            <select
              required
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
            >
              <option value="" disabled>
                เลือกกิจกรรมที่ปิดรับเช็คชื่อแล้ว
              </option>
              {closedActivities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">เหตุผลที่เช็คชื่อไม่ทัน</label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-brand-emerald-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "กำลังส่ง..." : "ยื่นคำร้อง"}
          </button>
        </form>
      )}
    </FormShell>
  );
}

type MyRequestType = "external" | "credit-transfer" | "late-checkin";

type RequestItem = {
  id: string;
  title?: string;
  reason?: string;
  activityCategory?: string;
  hoursRequested?: number;
  hoursApproved?: number | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  adminComment?: string | null;
  createdAt: string;
  activity?: { title: string; activityCode: string };
};

function MyRequestsList({ refreshKey }: { refreshKey: number }) {
  const [type, setType] = useState<MyRequestType>("external");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: RequestItem[]; totalPages: number } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [type]);

  useEffect(() => {
    // Guard against a slow, stale request (e.g. from a tab switched away
    // from) resolving after a newer one and clobbering it with wrong data.
    let cancelled = false;
    setData(null);
    fetch(`/api/requests/mine?type=${type}&page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData({ items: [], totalPages: 1 });
      });
    return () => {
      cancelled = true;
    };
  }, [type, page, refreshKey]);

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      const endpoint = type === "external" ? "external" : "credit-transfer";
      const res = await fetch(`/api/requests/${endpoint}/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((it) => (it.id === id ? { ...it, status: "cancelled" } : it)),
              }
            : prev
        );
      }
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        {(["external", "credit-transfer", "late-checkin"] as MyRequestType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1 ${
              type === t ? "bg-brand-purple-600 text-white" : "border border-foreground/20"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {!data && <p className="text-sm text-foreground/50">กำลังโหลด...</p>}
      {data?.items.length === 0 && <p className="text-sm text-foreground/50">ยังไม่มีคำร้อง</p>}

      <ul className="space-y-2">
        {data?.items.map((item) => (
          <li key={item.id} className="rounded-md border border-foreground/10 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{item.title ?? item.activity?.title ?? item.reason}</p>
                <p className="mt-0.5 text-xs text-foreground/50">
                  {item.hoursRequested != null && `ขอ ${item.hoursRequested} ชม.`}
                  {item.hoursApproved != null && ` · อนุมัติ ${item.hoursApproved} ชม.`}
                  {item.activityCategory && ` · ${CATEGORY_LABELS[item.activityCategory as keyof typeof CATEGORY_LABELS]}`}
                </p>
                {item.adminComment && (
                  <p className="mt-1 text-xs text-foreground/60">หมายเหตุ: {item.adminComment}</p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  item.status === "approved"
                    ? "bg-brand-emerald-500/15 text-brand-emerald-600"
                    : item.status === "rejected"
                      ? "bg-red-500/15 text-red-600"
                      : item.status === "cancelled"
                        ? "bg-foreground/10 text-foreground/50"
                        : "bg-amber-500/15 text-amber-600"
                }`}
              >
                {REQUEST_STATUS_LABELS[item.status]}
              </span>
            </div>
            {item.status === "pending" && type !== "late-checkin" && (
              <button
                type="button"
                onClick={() => handleCancel(item.id)}
                disabled={cancellingId === item.id}
                className="mt-2 rounded-md border border-foreground/20 px-3 py-1 text-xs disabled:opacity-60"
              >
                {cancellingId === item.id ? "กำลังยกเลิก..." : "ยกเลิกคำร้อง"}
              </button>
            )}
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
