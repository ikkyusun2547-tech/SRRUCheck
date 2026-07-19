"use client";

import { useEffect, useState } from "react";

type Major = { id: string; nameTh: string; facultyId: string };
type Faculty = { id: string; nameTh: string; majors: Major[] };

type UserRow = {
  id: string;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: "student" | "admin";
  bannedAt: string | null;
  facultyId: string | null;
  majorId: string | null;
  faculty: { nameTh: string } | null;
  major: { nameTh: string } | null;
};

export function UsersClient({ faculties }: { faculties: Faculty[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: UserRow[]; totalPages: number; total: number } | null>(
    null
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
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
  }, [search, page]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-foreground/60">ค้นหา (ชื่อ/รหัส/อีเมล)</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
        />
      </div>

      <div className="space-y-3">
        {data?.items.map((u) => (
          <UserRowEditor key={u.id} user={u} faculties={faculties} />
        ))}
        {data?.items.length === 0 && <p className="text-sm text-foreground/50">ไม่พบข้อมูล</p>}
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

function UserRowEditor({ user, faculties }: { user: UserRow; faculties: Faculty[] }) {
  const [role, setRole] = useState(user.role);
  const [banned, setBanned] = useState(Boolean(user.bannedAt));
  const [facultyId, setFacultyId] = useState(user.facultyId ?? "");
  const [majorId, setMajorId] = useState(user.majorId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const majorsForFaculty = faculties.find((f) => f.id === facultyId)?.majors ?? [];

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          banned,
          facultyId: facultyId || null,
          majorId: majorId || null,
        }),
      });
      const data = await res.json();
      setMessage(res.ok ? "บันทึกแล้ว" : (data.error ?? "บันทึกไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-foreground/10 p-3">
      <p className="text-sm font-medium">
        {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
        <span className="ml-2 text-xs text-foreground/50">{user.email}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "student" | "admin")}
          className="rounded-md border border-foreground/20 bg-transparent px-2 py-1"
        >
          <option value="student">นักศึกษา</option>
          <option value="admin">แอดมิน</option>
        </select>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={banned} onChange={(e) => setBanned(e.target.checked)} />
          ระงับบัญชี
        </label>
        <select
          value={facultyId}
          onChange={(e) => {
            setFacultyId(e.target.value);
            setMajorId("");
          }}
          className="rounded-md border border-foreground/20 bg-transparent px-2 py-1"
        >
          <option value="">ไม่มีคณะ</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nameTh}
            </option>
          ))}
        </select>
        <select
          value={majorId}
          disabled={!facultyId}
          onChange={(e) => setMajorId(e.target.value)}
          className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 disabled:opacity-50"
        >
          <option value="">ไม่มีสาขา</option>
          {majorsForFaculty.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nameTh}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-brand-emerald-500 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        {message && <span className="text-xs text-foreground/60">{message}</span>}
      </div>
    </div>
  );
}
