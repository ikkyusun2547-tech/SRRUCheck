"use client";

import { useTranslations } from "next-intl";

// Shared pager — used by every admin list that paginates over a fetched API
// page (requests, students, users, audit log). Renders nothing for a single
// page so callers can render it unconditionally.
export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const t = useTranslations("common");
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-surface px-4 py-2.5 text-sm">
      <span className="text-foreground/50">
        {t("pageOf", { page, totalPages })} · {t("totalCount", { total })}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/65 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600 disabled:opacity-35 disabled:hover:border-foreground/15 disabled:hover:text-foreground/65"
        >
          <ChevronLeftIcon />
          {t("previous")}
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/65 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600 disabled:opacity-35 disabled:hover:border-foreground/15 disabled:hover:text-foreground/65"
        >
          {t("next")}
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M10 3.5L5 8L10 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 3.5L11 8L6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
