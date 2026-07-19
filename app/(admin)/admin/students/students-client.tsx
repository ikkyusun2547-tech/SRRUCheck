"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { REQUIRED_HEADERS_LABEL } from "./import-headers";

type Major = { id: string; nameTh: string; facultyId: string };
type Faculty = { id: string; nameTh: string; majors: Major[] };

type StudentRow = {
  id: string;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  currentYear: number | null;
  faculty: { nameTh: string } | null;
  major: { nameTh: string } | null;
};

export function StudentsClient({ faculties }: { faculties: Faculty[] }) {
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-foreground/60">ค้นหา (ชื่อ/รหัส/อีเมล)</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/60">คณะ</label>
          <select
            value={facultyId}
            onChange={(e) => {
              setFacultyId(e.target.value);
              setMajorId("");
            }}
            className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="">ทุกคณะ</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nameTh}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/60">สาขา</label>
          <select
            value={majorId}
            disabled={!facultyId}
            onChange={(e) => setMajorId(e.target.value)}
            className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <option value="">ทุกสาขา</option>
            {majorsForFaculty.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nameTh}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/60">ชั้นปี</label>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(e.target.value)}
            className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="">ทุกชั้นปี</option>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>
                ปี {y}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setImportOpen((v) => !v)}
          className="ml-auto rounded-full border border-foreground/20 px-4 py-1.5 text-sm"
        >
          นำเข้าจาก Excel
        </button>
      </div>

      {importOpen && (
        <form onSubmit={handleImport} className="space-y-2 rounded-lg border border-foreground/10 p-4">
          <p className="text-xs text-foreground/60">
            ไฟล์ .xlsx แถวแรกเป็นหัวตาราง (ไทย): {REQUIRED_HEADERS_LABEL}
          </p>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <button
            type="submit"
            disabled={!importFile || importing}
            className="rounded-full bg-brand-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {importing ? "กำลังนำเข้า..." : "นำเข้า"}
          </button>
          {importResult && (
            <div className="text-sm">
              <p>
                สร้างใหม่ {importResult.summary.created} · อัปเดต {importResult.summary.updated} · ข้าม{" "}
                {importResult.summary.skipped}
              </p>
              {importResult.results
                .filter((r) => r.status === "skipped")
                .map((r) => (
                  <p key={r.row} className="text-xs text-red-600">
                    แถว {r.row}: {r.reason}
                  </p>
                ))}
            </div>
          )}
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-foreground/10 text-foreground/60">
            <tr>
              <th className="py-2 pr-4">รหัสนักศึกษา</th>
              <th className="py-2 pr-4">ชื่อ-นามสกุล</th>
              <th className="py-2 pr-4">คณะ/สาขา</th>
              <th className="py-2 pr-4">ชั้นปี</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((s) => (
              <tr key={s.id} className="border-b border-foreground/5">
                <td className="py-2 pr-4">{s.studentId ?? "-"}</td>
                <td className="py-2 pr-4">
                  {[s.firstName, s.lastName].filter(Boolean).join(" ") || s.email}
                </td>
                <td className="py-2 pr-4">
                  {s.faculty?.nameTh ?? "-"} / {s.major?.nameTh ?? "-"}
                </td>
                <td className="py-2 pr-4">{s.currentYear ?? "-"}</td>
                <td className="py-2 pr-4">
                  <Link href={`/admin/students/${s.id}`} className="text-brand-purple-600">
                    ดูข้อมูล
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items.length === 0 && <p className="py-4 text-sm text-foreground/50">ไม่พบข้อมูล</p>}
      </div>

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
            หน้า {page} / {data.totalPages} (ทั้งหมด {data.total})
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
