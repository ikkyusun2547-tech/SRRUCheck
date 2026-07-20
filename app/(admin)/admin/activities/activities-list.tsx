"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { CATEGORY_LABELS } from "@/lib/labels";
import { FilterSelect } from "@/components/admin/filter-select";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteActivityButton } from "@/components/admin/delete-activity-button";
import { CATEGORY_DOT, CATEGORY_TEXT } from "@/lib/admin/category-colors";

type ActivityRow = {
  id: string;
  activityCode: string;
  title: string;
  activityCategory: keyof typeof CATEGORY_LABELS;
  level: "university" | "faculty";
  academicYear: number;
  startTime: Date;
  status: "open" | "closed" | "cancelled";
  creditHours: number;
  checkinMethod: "realtime" | "self_report";
  locationName: string | null;
  _count: { attendances: number };
};

// Status is the only place color carries meaning (good / neutral / bad) —
// everything else in this list stays on the brand's own two colors
// (purple, emerald) plus neutral grays, deliberately not a rainbow of
// per-category hues that have no relationship to the rest of the product.
const STATUS_DOT: Record<ActivityRow["status"], string> = {
  open: "bg-brand-emerald-500",
  closed: "bg-foreground/30",
  cancelled: "bg-red-500",
};

const STATUS_TEXT: Record<ActivityRow["status"], string> = {
  open: "text-brand-emerald-700 dark:text-brand-emerald-400",
  closed: "text-foreground/55",
  cancelled: "text-red-700 dark:text-red-400",
};

export function ActivitiesList({ activities }: { activities: ActivityRow[] }) {
  const t = useTranslations("adminActivities");
  const tCategories = useTranslations("categories");
  const locale = useLocale();

  const LEVEL_LABELS: Record<ActivityRow["level"], string> = {
    university: t("levelUniversity"),
    faculty: t("levelFaculty"),
  };
  const STATUS_LABELS: Record<ActivityRow["status"], string> = {
    open: t("statusOpen"),
    closed: t("statusClosed"),
    cancelled: t("statusCancelled"),
  };
  const CHECKIN_LABELS: Record<ActivityRow["checkinMethod"], string> = {
    realtime: t("checkinRealtime"),
    self_report: t("checkinSelfReport"),
  };
  const CATEGORY_LABELS_T: Record<ActivityRow["activityCategory"], string> = {
    culture: tCategories("culture"),
    academic: tCategories("academic"),
    sports: tCategories("sports"),
    volunteer: tCategories("volunteer"),
    ethics: tCategories("ethics"),
  };

  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const years = useMemo(
    () => Array.from(new Set(activities.map((a) => a.academicYear))).sort((a, b) => b - a),
    [activities]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q) && !a.activityCode.toLowerCase().includes(q)) {
        return false;
      }
      if (yearFilter && String(a.academicYear) !== yearFilter) return false;
      if (levelFilter && a.level !== levelFilter) return false;
      if (categoryFilter && a.activityCategory !== categoryFilter) return false;
      return true;
    });
  }, [activities, query, yearFilter, levelFilter, categoryFilter]);

  const hasActiveFilters = Boolean(yearFilter || levelFilter || categoryFilter);

  return (
    <div className="space-y-5">
      {/* One cohesive toolbar instead of separately-styled floating
          controls — every control here shares the same height, radius,
          and focus treatment so it reads as a single designed unit. Search
          and filters are visually split into their own groups (icon +
          divider) so the row reads as organized zones, not a flat row of
          look-alike controls. */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-foreground/10 bg-surface p-2 shadow-sm">
        <div className="relative flex-1 basis-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-foreground/35">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg bg-transparent py-2 pl-9 pr-3 text-sm outline-none placeholder:text-foreground/40"
          />
        </div>

        <div className="mx-1 h-6 w-px shrink-0 bg-foreground/10" aria-hidden />

        <span className="flex shrink-0 items-center pl-1 pr-0.5 text-foreground/30">
          <FilterIcon />
        </span>
        <FilterSelect
          value={yearFilter}
          onChange={setYearFilter}
          placeholder={t("allYears")}
          options={years.map((y) => ({ value: String(y), label: t("academicYear", { year: y }) }))}
        />
        <FilterSelect
          value={levelFilter}
          onChange={setLevelFilter}
          placeholder={t("allLevels")}
          options={Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          placeholder={t("allCategories")}
          align="right"
          options={Object.entries(CATEGORY_LABELS_T).map(([value, label]) => ({ value, label }))}
        />

        {hasActiveFilters && (
          <>
            <div className="mx-1 h-6 w-px shrink-0 bg-foreground/10" aria-hidden />
            <button
              type="button"
              onClick={() => {
                setYearFilter("");
                setLevelFilter("");
                setCategoryFilter("");
              }}
              className="ml-auto flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-foreground/45 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <ClearIcon />
              {t("clearFilters")}
            </button>
          </>
        )}
      </div>

      {activities.length === 0 ? (
        <EmptyState icon={<CalendarIcon size={22} />} message={t("emptyNoActivities")} hint={t("emptyNoActivitiesHint")} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={22} />}
          message={t("emptyNoResults")}
          hint={query ? t("emptyNoResultsHintSearch", { query }) : t("emptyNoResultsHintFilter")}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5">
          {filtered.map((a) => (
            <li key={a.id} className="group relative">
              <Link
                href={`/admin/activities/${a.id}/attendees`}
                className="absolute inset-0 z-0 rounded-xl"
                aria-label={`${t("viewAttendeesLabel")}: ${a.title}`}
              />
              <div className="pointer-events-none flex flex-col gap-3 rounded-xl border border-foreground/10 bg-surface p-4 transition-all group-hover:border-brand-purple-600/30 group-hover:shadow-[0_4px_20px_-4px_rgba(124,58,237,0.15)] sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400">
                  <CategoryIcon category={a.activityCategory} />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="min-w-0 truncate font-semibold text-foreground group-hover:text-brand-purple-600">
                      {a.title}
                    </p>
                    <span className="shrink-0 font-mono text-[11px] text-foreground/35">{a.activityCode}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/50">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${CATEGORY_TEXT[a.activityCategory]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[a.activityCategory]}`} />
                      {CATEGORY_LABELS_T[a.activityCategory]}
                    </span>
                    <Dot />
                    <span>{t("academicYear", { year: a.academicYear })}</span>
                    <Dot />
                    <MetaItem icon={<CalendarIcon />}>
                      {a.startTime.toLocaleString(locale === "en" ? "en-US" : "th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </MetaItem>
                    <MetaItem icon={<ClockIcon />}>{t("creditHours", { hours: a.creditHours })}</MetaItem>
                    <MetaItem icon={a.checkinMethod === "realtime" ? <QrIcon /> : <UploadIcon />}>
                      {CHECKIN_LABELS[a.checkinMethod]}
                    </MetaItem>
                    {a.locationName && <MetaItem icon={<PinIcon />}>{a.locationName}</MetaItem>}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span
                    aria-label={t("attendeeCount", { count: a._count.attendances })}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/50"
                  >
                    <UsersIcon />
                    {a._count.attendances}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_TEXT[a.status]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                    {STATUS_LABELS[a.status]}
                  </span>
                  <Link
                    href={`/admin/activities/${a.id}/edit`}
                    className="pointer-events-auto relative z-10 hidden items-center gap-1 rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/65 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600 sm:flex"
                  >
                    {t("editLink")}
                    <ChevronIcon />
                  </Link>
                  <span className="pointer-events-auto relative z-10">
                    <DeleteActivityButton activityId={a.id} attendeeCount={a._count.attendances} compact />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Dot() {
  return <span className="h-0.5 w-0.5 rounded-full bg-foreground/25" aria-hidden />;
}

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-foreground/30">{icon}</span>
      {children}
    </span>
  );
}

function CategoryIcon({ category }: { category: ActivityRow["activityCategory"] }) {
  const props = { width: 18, height: 18, viewBox: "0 0 18 18", fill: "none" as const, "aria-hidden": true as const };
  switch (category) {
    case "culture":
      return (
        <svg {...props}>
          <path d="M9 2L15.5 6V7.5H2.5V6L9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M3.5 7.5V14.5M6 7.5V14.5M9 7.5V14.5M12 7.5V14.5M14.5 7.5V14.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2.5 14.5H15.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "academic":
      return (
        <svg {...props}>
          <path d="M9 3L16 6.5L9 10L2 6.5L9 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M5 8.2V12c0 1.1 1.8 2 4 2s4-.9 4-2V8.2" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "sports":
      return (
        <svg {...props}>
          <path
            d="M6 3h6v4a3 3 0 0 1-3 3a3 3 0 0 1-3-3V3Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M4 4H6v2a2 2 0 0 1-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M14 4h-2v2a2 2 0 0 0 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M9 10v2.5M6.5 15h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M7 12.5h4v1.3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-1.3Z" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "volunteer":
      return (
        <svg {...props}>
          <path
            d="M9 15.2S2.8 11.4 2.8 6.9a3.3 3.3 0 0 1 6.2-1.6a3.3 3.3 0 0 1 6.2 1.6c0 4.5-6.2 8.3-6.2 8.3Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "ethics":
      return (
        <svg {...props}>
          <path
            d="M9 2 3.5 4v4.2c0 3.6 2.4 6.4 5.5 7.3 3.1-.9 5.5-3.7 5.5-7.3V4L9 2z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M6.5 9L8.3 10.8L11.5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 3.5h12M4.5 8h7M6.7 12.5h2.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
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

function CalendarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.8V8L10.2 9.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9.5" y="2" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="9.5" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5H12M13.5 9.5H14M9.5 12H10.5M12 12H14M9.5 14H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 10.5V2.5M8 2.5L5 5.5M8 2.5L11 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 10.5V12.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 14.5s5-4.2 5-8.2a5 5 0 0 0-10 0c0 4 5 8.2 5 8.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.3" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.8 13.5c0-2.3 1.9-4 4.2-4s4.2 1.7 4.2 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.8 4.2a2.2 2.2 0 0 1 0 4.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 9.6c1.9.3 3.3 1.8 3.3 3.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 3.5L10.5 8L6 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
