"use client";

import { useEffect, useState } from "react";
import { fileToDataUrl } from "@/lib/file-to-data-url";
import { CATEGORY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/labels";
import { FilterSelect } from "@/components/admin/filter-select";
import { SectionHeading } from "@/components/admin/section-heading";
import { EmptyState } from "@/components/admin/empty-state";
import { Pagination } from "@/components/admin/pagination";
import { DocumentIcon, HistoryIcon } from "@/components/student/nav-icons";

type ClosedActivity = { id: string; title: string; activityCode: string };

type Tab = "external" | "credit-transfer" | "late-checkin" | "mine";

const TAB_LABELS: Record<Tab, string> = {
  external: "กิจกรรมภายนอก",
  "credit-transfer": "เทียบชั่วโมงผู้นำ",
  "late-checkin": "เช็คชื่อย้อนหลัง",
  mine: "คำร้องของฉัน",
};

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-purple-600/40";

export function RequestsClient({ closedActivities }: { closedActivities: ClosedActivity[] }) {
  const [tab, setTab] = useState<Tab>("external");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
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
  icon,
  title,
  children,
  error,
  success,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  error: string | null;
  success: string | null;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
      <SectionHeading icon={icon}>{title}</SectionHeading>
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-xl border border-brand-emerald-500/30 bg-brand-emerald-50 px-4 py-2.5 text-sm text-brand-emerald-700 dark:bg-brand-emerald-500/10 dark:text-brand-emerald-400">
          {success}
        </p>
      )}
      {children}
    </div>
  );
}

const fileInputClass =
  "w-full text-sm text-foreground/70 file:mr-3 file:rounded-full file:border-0 file:bg-foreground/8 file:px-3.5 file:py-1.5 file:text-xs file:font-medium file:text-foreground/70 hover:file:bg-foreground/12";

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
    <FormShell icon={<DocumentIcon className="h-[15px] w-[15px]" />} title="ยื่นคำร้องกิจกรรมภายนอก" error={error} success={success}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">ชื่อกิจกรรม</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">หมวดหมู่</label>
          <div className="rounded-lg border border-foreground/15">
            <FilterSelect
              required
              fullWidth
              value={category}
              onChange={setCategory}
              placeholder="เลือกหมวดหมู่"
              options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">จำนวนชั่วโมงที่ขอเทียบ</label>
          <input
            required
            type="number"
            min="0"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">หลักฐาน (รูปภาพหรือ PDF)</label>
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={fileInputClass}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
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
    <FormShell icon={<CapIcon />} title="ยื่นคำร้องเทียบชั่วโมงผู้นำ" error={error} success={success}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">ตำแหน่ง/เหตุผลที่ขอเทียบชั่วโมง</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">จำนวนชั่วโมงที่ขอเทียบ</label>
          <input
            required
            type="number"
            min="0"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">หลักฐาน (รูปภาพหรือ PDF)</label>
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={fileInputClass}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
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
    <FormShell icon={<HistoryIcon className="h-[15px] w-[15px]" />} title="ยื่นคำร้องเช็คชื่อย้อนหลัง" error={error} success={success}>
      {closedActivities.length === 0 ? (
        <p className="text-sm text-foreground/50">ยังไม่มีกิจกรรมที่ปิดรับเช็คชื่อแล้วให้ยื่นคำร้อง</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/80">กิจกรรม</label>
            <div className="rounded-lg border border-foreground/15">
              <FilterSelect
                required
                fullWidth
                value={activityId}
                onChange={setActivityId}
                placeholder="เลือกกิจกรรมที่ปิดรับเช็คชื่อแล้ว"
                options={closedActivities.map((a) => ({ value: a.id, label: a.title }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/80">เหตุผลที่เช็คชื่อไม่ทัน</label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-brand-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
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

const STATUS_DOT: Record<string, string> = {
  approved: "bg-brand-emerald-500",
  pending: "bg-amber-500",
  rejected: "bg-red-500",
  cancelled: "bg-foreground/30",
};

function MyRequestsList({ refreshKey }: { refreshKey: number }) {
  const [type, setType] = useState<MyRequestType>("external");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: RequestItem[]; total: number; totalPages: number } | null>(null);
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
        if (!cancelled) setData({ items: [], total: 0, totalPages: 1 });
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
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-foreground/10 bg-surface p-2 shadow-sm">
        {(["external", "credit-transfer", "late-checkin"] as MyRequestType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              type === t
                ? "bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400"
                : "text-foreground/60 hover:bg-foreground/5"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {!data && <p className="py-8 text-center text-sm text-foreground/50">กำลังโหลด...</p>}
      {data?.items.length === 0 && <EmptyState icon={<DocumentIcon className="h-[22px] w-[22px]" />} message="ยังไม่มีคำร้อง" />}

      <ul className="space-y-2.5">
        {data?.items.map((item) => (
          <li key={item.id} className="rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="min-w-0 truncate font-medium text-foreground">
                  {item.title ?? item.activity?.title ?? item.reason}
                </p>
                <p className="mt-0.5 text-xs text-foreground/50">
                  {item.hoursRequested != null && `ขอ ${item.hoursRequested} ชม.`}
                  {item.hoursApproved != null && ` · อนุมัติ ${item.hoursApproved} ชม.`}
                  {item.activityCategory && ` · ${CATEGORY_LABELS[item.activityCategory as keyof typeof CATEGORY_LABELS]}`}
                </p>
                {item.adminComment && (
                  <p className="mt-1.5 text-xs text-foreground/60">หมายเหตุ: {item.adminComment}</p>
                )}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[item.status] ?? "bg-foreground/30"}`} />
                <span
                  className={
                    item.status === "approved"
                      ? "text-brand-emerald-700 dark:text-brand-emerald-400"
                      : item.status === "rejected"
                        ? "text-red-700 dark:text-red-400"
                        : item.status === "cancelled"
                          ? "text-foreground/50"
                          : "text-amber-700 dark:text-amber-400"
                  }
                >
                  {REQUEST_STATUS_LABELS[item.status]}
                </span>
              </span>
            </div>
            {item.status === "pending" && type !== "late-checkin" && (
              <button
                type="button"
                onClick={() => handleCancel(item.id)}
                disabled={cancellingId === item.id}
                className="mt-2.5 rounded-full border border-foreground/15 px-3.5 py-1.5 text-xs font-medium text-foreground/65 transition-colors hover:border-red-500/30 hover:text-red-600 disabled:opacity-60 dark:hover:text-red-400"
              >
                {cancellingId === item.id ? "กำลังยกเลิก..." : "ยกเลิกคำร้อง"}
              </button>
            )}
          </li>
        ))}
      </ul>

      {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
    </div>
  );
}

function CapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 3 1.5 6.2 8 9.4l6.5-3.2L8 3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4 7.8V11c0 1 1.8 2 4 2s4-1 4-2V7.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14 6.5v3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
