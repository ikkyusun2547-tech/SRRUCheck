"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type AttendanceRow = {
  id: string;
  status: "auto_approved" | "flagged" | "rejected";
  flagReason: string | null;
  distanceMeters: number | null;
  checkinTime: string;
  checkinMethod: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    studentId: string | null;
    faculty: { nameTh: string; nameEn: string } | null;
    major: { nameTh: string; nameEn: string } | null;
  };
};

const POLL_INTERVAL_MS = 5000;

const STATUS_DOT: Record<AttendanceRow["status"], string> = {
  auto_approved: "bg-brand-emerald-500",
  flagged: "bg-amber-500",
  rejected: "bg-red-500",
};

const STATUS_TEXT: Record<AttendanceRow["status"], string> = {
  auto_approved: "text-brand-emerald-700 dark:text-brand-emerald-400",
  flagged: "text-amber-700 dark:text-amber-400",
  rejected: "text-red-700 dark:text-red-400",
};

const FLAG_REASON_KEYS = [
  "GPS_OUT_OF_BOUNDS",
  "DEVICE_SHARING_SUSPECTED",
  "PRINTED_QR_USED",
  "SELF_REPORTED",
] as const;

function isFlagReasonKey(k: string): k is (typeof FLAG_REASON_KEYS)[number] {
  return (FLAG_REASON_KEYS as readonly string[]).includes(k);
}

export function LiveAttendanceTable({ activityId }: { activityId: string }) {
  const t = useTranslations("adminLive");
  const tStatus = useTranslations("attendanceStatus");
  const tFlagReasons = useTranslations("flagReasons");
  const locale = useLocale();
  const orgName = (o: { nameTh: string; nameEn: string } | null) => (o ? (locale === "en" ? o.nameEn : o.nameTh) : "-");

  const [rows, setRows] = useState<AttendanceRow[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

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
      setMessage(
        res.ok
          ? { text: t("notifiedMessage", { notified: data.notified, total: data.total }), tone: "success" }
          : { text: data.error ?? t("actionFailed"), tone: "error" }
      );
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
        setMessage({ text: t("forceApprovedMessage", { count: data.approved }), tone: "success" });
        setSelected(new Set());
        load();
      } else {
        setMessage({ text: data.error ?? t("actionFailed"), tone: "error" });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleBulkApprove}
          disabled={busy}
          className="rounded-full bg-brand-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
        >
          {t("notifyAllButton")}
        </button>
        <button
          type="button"
          onClick={handleForceApprove}
          disabled={busy || selected.size === 0}
          className="rounded-full border border-foreground/15 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600 disabled:opacity-40"
        >
          {t("forceApproveButton", { count: selected.size })}
        </button>
        <a
          href={`/api/admin/live/${activityId}/export`}
          className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600"
        >
          <ExportIcon />
          {t("exportButton")}
        </a>
        {message && (
          <span
            className={`text-sm font-medium ${message.tone === "success" ? "text-brand-emerald-600 dark:text-brand-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {message.text}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-foreground/10 text-xs uppercase tracking-wide text-foreground/45">
            <tr>
              <th className="py-2 pr-4"></th>
              <th className="py-2 pr-4 font-medium">{t("tableStudentId")}</th>
              <th className="py-2 pr-4 font-medium">{t("tableStudent")}</th>
              <th className="py-2 pr-4 font-medium">{t("tableFaculty")}</th>
              <th className="py-2 pr-4 font-medium">{t("tableMajor")}</th>
              <th className="py-2 pr-4 font-medium">{t("tableTime")}</th>
              <th className="py-2 pr-4 font-medium">{t("tableStatus")}</th>
              <th className="py-2 pr-4 font-medium">{t("tableDistance")}</th>
              <th className="py-2 pr-4 font-medium">{t("tableNote")}</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => {
              const displayName = [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || r.user.email;
              const initial = displayName.trim().charAt(0).toUpperCase() || "?";
              return (
                <tr key={r.id} className="border-b border-foreground/5 transition-colors hover:bg-foreground/[0.02]">
                  <td className="py-2.5 pr-4">
                    {r.status === "flagged" && (
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggle(r.id)}
                        className="accent-brand-purple-600"
                      />
                    )}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-foreground/50">{r.user.studentId ?? "-"}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple-400 to-brand-emerald-400 text-xs font-bold text-brand-purple-950">
                        {initial}
                      </span>
                      <p className="min-w-0 truncate font-medium text-foreground">{displayName}</p>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-foreground/60">{orgName(r.user.faculty)}</td>
                  <td className="py-2.5 pr-4 text-foreground/60">{orgName(r.user.major)}</td>
                  <td className="py-2.5 pr-4 text-foreground/60">
                    {new Date(r.checkinTime).toLocaleTimeString("th-TH")}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${STATUS_TEXT[r.status]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[r.status]}`} />
                      {tStatus(r.status)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-foreground/60">
                    {r.distanceMeters != null ? t("distanceUnit", { meters: Math.round(r.distanceMeters) }) : "-"}
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-amber-600 dark:text-amber-400">
                    {r.flagReason
                      ?.split(",")
                      .map((f) => (isFlagReasonKey(f) ? tFlagReasons(f) : f))
                      .join(", ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows?.length === 0 && <p className="py-6 text-center text-sm text-foreground/50">{t("noAttendees")}</p>}
      </div>

      {flaggedRows.length > 0 && <p className="text-xs text-foreground/45">{t("bulkApproveTip")}</p>}
    </div>
  );
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 10.5V2.5M8 10.5L5 7.5M8 10.5L11 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 10.5V12.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
