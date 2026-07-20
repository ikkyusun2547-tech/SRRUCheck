"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pagination } from "@/components/admin/pagination";
import { EmptyState } from "@/components/admin/empty-state";

type RequestType = "external" | "credit-transfer" | "late-checkin";
type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

type RequestItem = {
  id: string;
  title?: string;
  reason?: string;
  activityCategory?: string;
  hoursRequested?: number;
  hoursApproved?: number | null;
  status: RequestStatus;
  adminComment?: string | null;
  evidenceUrl?: string | null;
  createdAt: string;
  user: { firstName: string | null; lastName: string | null; email: string; studentId: string | null };
  activity?: { title: string; activityCode: string };
};

const STATUS_DOT: Record<RequestStatus, string> = {
  pending: "bg-amber-500",
  approved: "bg-brand-emerald-500",
  rejected: "bg-red-500",
  cancelled: "bg-foreground/30",
};

const STATUS_TEXT: Record<RequestStatus, string> = {
  pending: "text-amber-700 dark:text-amber-400",
  approved: "text-brand-emerald-700 dark:text-brand-emerald-400",
  rejected: "text-red-700 dark:text-red-400",
  cancelled: "text-foreground/55",
};

export function RequestsApprovalClient() {
  const t = useTranslations("adminRequests");
  const tStatus = useTranslations("requestStatus");
  const tCategories = useTranslations("categories");

  const TYPE_LABELS: Record<RequestType, string> = {
    external: t("typeExternal"),
    "credit-transfer": t("typeCreditTransfer"),
    "late-checkin": t("typeLateCheckin"),
  };

  const [type, setType] = useState<RequestType>("external");
  const [status, setStatus] = useState<RequestStatus>("pending");
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-foreground/10 bg-surface p-2 shadow-sm">
        {(Object.keys(TYPE_LABELS) as RequestType[]).map((rt) => (
          <button
            key={rt}
            type="button"
            onClick={() => setType(rt)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              type === rt
                ? "bg-brand-purple-600 text-white shadow-sm"
                : "text-foreground/65 hover:bg-brand-purple-50 hover:text-brand-purple-600 dark:hover:bg-brand-purple-400/10"
            }`}
          >
            {TYPE_LABELS[rt]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["pending", "approved", "rejected", "cancelled"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              status === s
                ? "border-transparent bg-foreground/8 text-foreground"
                : "border-foreground/10 text-foreground/50 hover:bg-foreground/5"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />
            {tStatus(s)}
          </button>
        ))}
      </div>

      {!data ? (
        <p className="py-8 text-center text-sm text-foreground/50">{t("loadingMessage")}</p>
      ) : data.items.length === 0 ? (
        <EmptyState icon={<InboxIcon />} message={t("emptyMessage")} />
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => (
            <RequestCard
              key={item.id}
              type={type}
              item={item}
              onDecided={refresh}
              t={t}
              tCategories={tCategories}
              statusDot={STATUS_DOT}
              statusText={STATUS_TEXT}
              statusLabel={tStatus(item.status)}
            />
          ))}
        </div>
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
    </div>
  );
}

type TFunc = (key: string, values?: Record<string, string | number>) => string;

function RequestCard({
  type,
  item,
  onDecided,
  t,
  tCategories,
  statusDot,
  statusText,
  statusLabel,
}: {
  type: RequestType;
  item: RequestItem;
  onDecided: () => void;
  t: TFunc;
  tCategories: TFunc;
  statusDot: Record<RequestStatus, string>;
  statusText: Record<RequestStatus, string>;
  statusLabel: string;
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
        setError(data.error ?? t("actionFailed"));
        return;
      }
      onDecided();
    } finally {
      setPending(false);
    }
  }

  const studentName =
    [item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || item.user.email;
  const initial = studentName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple-400 to-brand-emerald-400 text-sm font-bold text-brand-purple-950">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{item.title ?? item.activity?.title ?? item.reason}</p>
              <p className="mt-0.5 text-xs text-foreground/50">
                {studentName} ({item.user.studentId ?? "-"}) · {new Date(item.createdAt).toLocaleString("th-TH")}
                {item.hoursRequested != null && ` · ${t("hoursRequested", { hours: item.hoursRequested })}`}
                {item.activityCategory && ` · ${tCategories(item.activityCategory)}`}
              </p>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${statusText[item.status]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot[item.status]}`} />
              {statusLabel}
            </span>
          </div>

          {item.reason && item.activity && (
            <p className="mt-1.5 text-xs text-foreground/60">{t("reasonLabel", { reason: item.reason })}</p>
          )}
          {item.evidenceUrl && (
            <a
              href={item.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-purple-600 hover:underline"
            >
              {t("evidenceLink")}
            </a>
          )}

          {item.status !== "pending" ? (
            (item.hoursApproved != null || item.adminComment) && (
              <p className="mt-2 text-xs text-foreground/50">
                {item.hoursApproved != null && t("hoursApprovedSuffix", { hours: item.hoursApproved })}
                {item.adminComment && ` — ${item.adminComment}`}
              </p>
            )
          ) : (
            <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-foreground/10 pt-3">
              {error && <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>}
              {type !== "late-checkin" && (
                <div>
                  <label className="mb-1 block text-xs text-foreground/50">{t("hoursApprovedFieldLabel")}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hoursApproved}
                    onChange={(e) => setHoursApproved(e.target.value)}
                    className="w-24 rounded-lg border border-foreground/15 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-brand-purple-600/40"
                  />
                </div>
              )}
              <div className="min-w-[150px] flex-1">
                <label className="mb-1 block text-xs text-foreground/50">{t("commentFieldLabel")}</label>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-lg border border-foreground/15 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-brand-purple-600/40"
                />
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => decide("approved")}
                className="rounded-full bg-brand-emerald-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
              >
                {t("approveButton")}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => decide("rejected")}
                className="rounded-full border border-red-500/30 px-4 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                {t("rejectButton")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InboxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path
        d="M3 12.5L5.5 4.5h11l2.5 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M3 12.5H8a1 1 0 0 1 1 1v.5a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-.5a1 1 0 0 1 1-1h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
