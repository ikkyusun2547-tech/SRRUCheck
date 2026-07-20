"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FilterSelect } from "@/components/admin/filter-select";
import { EmptyState } from "@/components/admin/empty-state";

type StudentRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  studentId: string | null;
  email: string;
  faculty: { id: string; nameTh: string; nameEn: string } | null;
  major: { nameTh: string; nameEn: string } | null;
};

export function MissingStudentsList({ students, eligibleTotal }: { students: StudentRow[]; eligibleTotal: number }) {
  const t = useTranslations("adminMissingStudents");
  const locale = useLocale();

  const [query, setQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");

  const facultyName = (f: { nameTh: string; nameEn: string } | null) =>
    f ? (locale === "en" ? f.nameEn : f.nameTh) : t("noRestrictionNote");

  const faculties = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      if (s.faculty) map.set(s.faculty.id, facultyName(s.faculty));
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const name = [s.firstName, s.lastName].filter(Boolean).join(" ");
      if (q && !name.toLowerCase().includes(q) && !(s.studentId ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (facultyFilter && s.faculty?.id !== facultyFilter) return false;
      return true;
    });
  }, [students, query, facultyFilter]);

  if (eligibleTotal === 0) {
    return <EmptyState icon={<CheckIcon />} message={t("noEligibleMessage")} />;
  }

  if (students.length === 0) {
    return <EmptyState icon={<CheckIcon />} message={t("allAttendedMessage")} hint={t("allAttendedHint")} />;
  }

  return (
    <div className="space-y-5">
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
        {faculties.length > 1 && (
          <>
            <div className="mx-1 h-6 w-px shrink-0 bg-foreground/10" aria-hidden />
            <FilterSelect value={facultyFilter} onChange={setFacultyFilter} placeholder={t("allFaculties")} options={faculties} />
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<SearchIcon size={22} />} message={t("noSearchResults")} hint={t("noSearchResultsHint", { query })} />
      ) : (
        <ul className="grid grid-cols-1 gap-2.5">
          {filtered.map((s) => {
            const name = [s.firstName, s.lastName].filter(Boolean).join(" ") || s.email;
            const initial = name.trim().charAt(0).toUpperCase() || "?";
            return (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-xl border border-foreground/10 bg-surface p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple-400 to-brand-emerald-400 text-sm font-bold text-brand-purple-950">
                  {initial}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="min-w-0 truncate font-semibold text-foreground">{name}</p>
                    {s.studentId && <span className="shrink-0 font-mono text-[11px] text-foreground/35">{s.studentId}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/50">
                    <span>{facultyName(s.faculty)}</span>
                    {s.major && (
                      <>
                        <Dot />
                        <span>{locale === "en" ? s.major.nameEn : s.major.nameTh}</span>
                      </>
                    )}
                    <Dot />
                    <span className="min-w-0 truncate">{s.email}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Dot() {
  return <span className="h-0.5 w-0.5 rounded-full bg-foreground/25" aria-hidden />;
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 11.3L9.8 14L15 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
