"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// Deleting an activity cascades to its attendances, restrictions, and late
// check-in requests (see prisma/schema.prisma onDelete: Cascade) — the
// confirmation message says so explicitly whenever there's attendance data
// at stake, since that's real, unrecoverable data loss, not just removing
// an empty draft.
export function DeleteActivityButton({
  activityId,
  attendeeCount,
  compact = false,
}: {
  activityId: string;
  attendeeCount: number;
  /** Icon-only variant for tight spaces like a list row — same delete logic, no label text. */
  compact?: boolean;
}) {
  const t = useTranslations("adminAttendees");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    const message =
      attendeeCount > 0 ? t("confirmDeleteWithAttendees", { count: attendeeCount }) : t("confirmDeleteNoAttendees");
    if (!confirm(message)) return;

    setPending(true);
    try {
      const res = await fetch(`/api/admin/activities/${activityId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/activities");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? t("deleteFailed"));
    } finally {
      setPending(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-label={t("deleteButton")}
        title={t("deleteButton")}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/35 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
      >
        <TrashIcon />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-500/10"
    >
      <TrashIcon />
      {pending ? t("deleting") : t("deleteButton")}
    </button>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 4.5H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 4.5V2.8a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4.5 4.6 13a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 7.3V11M9.5 7.3V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
