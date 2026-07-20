"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FilterSelect } from "@/components/admin/filter-select";

const ACTION_KEYS = [
  "activity.create",
  "activity.update",
  "activity.delete",
  "faculty.create",
  "faculty.update",
  "faculty.delete",
  "major.create",
  "major.update",
  "major.delete",
  "settings.update",
  "announcement.send",
  "user.manage",
  "attendance.forceApprove",
  "attendance.bulkApproveNotify",
] as const;

export function AuditLogFilters({ initialAction, initialActor }: { initialAction: string; initialActor: string }) {
  const t = useTranslations("adminAuditLog");
  const router = useRouter();
  const [actor, setActor] = useState(initialActor);

  function navigate(nextAction: string, nextActor: string) {
    const params = new URLSearchParams();
    if (nextAction) params.set("action", nextAction);
    if (nextActor) params.set("actor", nextActor);
    router.push(`/admin/audit-log${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-foreground/10 bg-surface p-2 shadow-sm">
      <div className="relative flex-1 basis-64">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-foreground/35">
          <SearchIcon />
        </span>
        <input
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate(initialAction, actor);
          }}
          onBlur={() => navigate(initialAction, actor)}
          placeholder={t("searchActorPlaceholder")}
          className="w-full rounded-lg bg-transparent py-2 pl-9 pr-3 text-sm outline-none placeholder:text-foreground/40"
        />
      </div>
      <div className="mx-1 h-6 w-px shrink-0 bg-foreground/10" aria-hidden />
      <FilterSelect
        value={initialAction}
        onChange={(v) => navigate(v, actor)}
        placeholder={t("allActions")}
        align="right"
        options={ACTION_KEYS.map((k) => ({ value: k, label: t(`actions.${k.replace(".", "_")}`) }))}
      />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
