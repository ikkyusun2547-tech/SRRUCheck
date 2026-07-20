"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { REQUIRED_HEADERS_LABEL } from "./import-headers";
import { FilterSelect } from "@/components/admin/filter-select";
import { EmptyState } from "@/components/admin/empty-state";
import { Pagination } from "@/components/admin/pagination";

type Major = { id: string; nameTh: string; nameEn: string; facultyId: string };
type Faculty = { id: string; nameTh: string; nameEn: string; majors: Major[] };

type StudentRow = {
  id: string;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  currentYear: number | null;
  faculty: { nameTh: string; nameEn: string } | null;
  major: { nameTh: string; nameEn: string } | null;
};

export function StudentsClient({ faculties }: { faculties: Faculty[] }) {
  const t = useTranslations("adminStudents");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const name = (o: { nameTh: string; nameEn: string } | null) =>
    o ? (locale === "en" ? o.nameEn : o.nameTh) : t("noFacultyRestriction");

  const [search, setSearch] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: StudentRow[]; totalPages: number; total: number } | null>(
    null
  );
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    summary: { created: number; updated: number; skipped: number };
    results: { row: number; status: string; reason?: string }[];
  } | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, facultyId, majorId, currentYear]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), role: "student" });
    if (search) params.set("search", search);
    if (facultyId) params.set("facultyId", facultyId);
    if (majorId) params.set("majorId", majorId);
    if (currentYear) params.set("currentYear", currentYear);

    fetch(`/api/admin/students?${params}`)
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
  }, [search, facultyId, majorId, currentYear, page]);

  const majorsForFaculty = faculties.find((f) => f.id === facultyId)?.majors ?? [];

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await fetch("/api/admin/students/import", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        setPage(1);
      } else {
        setImportResult({ summary: { created: 0, updated: 0, skipped: 0 }, results: [{ row: 0, status: "skipped", reason: data.error }] });
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-foreground/10 bg-surface p-2 shadow-sm">
        <div className="relative flex-1 basis-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-foreground/35">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg bg-transparent py-2 pl-9 pr-3 text-sm outline-none placeholder:text-foreground/40"
          />
        </div>
        <div className="mx-1 h-6 w-px shrink-0 bg-foreground/10" aria-hidden />
        <FilterSelect
          value={facultyId}
          onChange={(v) => {
            setFacultyId(v);
            setMajorId("");
          }}
          placeholder={t("allFaculties")}
          options={faculties.map((f) => ({ value: f.id, label: name(f) }))}
        />
        <FilterSelect
          value={majorId}
          onChange={setMajorId}
          disabled={!facultyId}
          placeholder={facultyId ? t("allMajors") : t("selectFacultyFirst")}
          options={majorsForFaculty.map((m) => ({ value: m.id, label: name(m) }))}
        />
        <FilterSelect
          value={currentYear}
          onChange={setCurrentYear}
          placeholder={t("allYears")}
          align="right"
          options={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: t("year", { year: y }) }))}
        />
        <div className="mx-1 h-6 w-px shrink-0 bg-foreground/10" aria-hidden />
        <button
          type="button"
          onClick={() => setImportOpen((v) => !v)}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
            importOpen ? "bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10" : "text-foreground/65 hover:bg-foreground/5"
          }`}
        >
          <ImportIcon />
          {t("importButton")}
        </button>
      </div>

      {importOpen && (
        <form onSubmit={handleImport} className="space-y-3 rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm">
          <p className="text-xs text-foreground/55">{t("importHelperText", { headers: REQUIRED_HEADERS_LABEL })}</p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="text-sm text-foreground/70 file:mr-3 file:rounded-full file:border-0 file:bg-foreground/8 file:px-3.5 file:py-1.5 file:text-xs file:font-medium file:text-foreground/70 hover:file:bg-foreground/12"
            />
            <button
              type="submit"
              disabled={!importFile || importing}
              className="rounded-full bg-brand-emerald-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
            >
              {importing ? t("importing") : t("importSubmit")}
            </button>
          </div>
          {importResult && (
            <div className="rounded-lg bg-foreground/5 p-3 text-sm">
              <p className="font-medium text-foreground/80">
                {t("importSummary", {
                  created: importResult.summary.created,
                  updated: importResult.summary.updated,
                  skipped: importResult.summary.skipped,
                })}
              </p>
              {importResult.results
                .filter((r) => r.status === "skipped")
                .map((r) => (
                  <p key={r.row} className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {t("importRowError", { row: r.row, reason: r.reason ?? "" })}
                  </p>
                ))}
            </div>
          )}
        </form>
      )}

      {data?.items.length === 0 ? (
        <EmptyState icon={<SearchIcon size={22} />} message={tCommon("noResults")} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-foreground/10 bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-foreground/10 text-xs uppercase tracking-wide text-foreground/45">
                <tr>
                  <th className="py-3 pl-4 pr-4 font-medium">{t("tableStudentId")}</th>
                  <th className="py-3 pr-4 font-medium">{t("tableName")}</th>
                  <th className="py-3 pr-4 font-medium">{t("tableFacultyMajor")}</th>
                  <th className="py-3 pr-4 font-medium">{t("tableYear")}</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((s) => {
                  const fullName = [s.firstName, s.lastName].filter(Boolean).join(" ") || s.email;
                  const initial = fullName.trim().charAt(0).toUpperCase() || "?";
                  return (
                    <tr key={s.id} className="border-b border-foreground/5 transition-colors last:border-0 hover:bg-foreground/[0.02]">
                      <td className="py-2.5 pl-4 pr-4 font-mono text-xs text-foreground/50">{s.studentId ?? "-"}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple-400 to-brand-emerald-400 text-xs font-bold text-brand-purple-950">
                            {initial}
                          </span>
                          <span className="font-medium text-foreground">{fullName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-foreground/60">
                        {name(s.faculty)} / {name(s.major)}
                      </td>
                      <td className="py-2.5 pr-4 text-foreground/60">{s.currentYear ?? "-"}</td>
                      <td className="py-2.5 pr-4 text-right">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-purple-600 hover:underline"
                        >
                          {t("viewLink")}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
    </div>
  );
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2.5V10.5M8 10.5L5 7.5M8 10.5L11 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 12.5V13.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
