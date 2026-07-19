"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Major = { id: string; nameTh: string; nameEn: string; facultyId: string };
type Faculty = { id: string; nameTh: string; nameEn: string; majors: Major[] };

export function FacultiesClient({ initialFaculties }: { initialFaculties: Faculty[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [newFacultyTh, setNewFacultyTh] = useState("");
  const [newFacultyEn, setNewFacultyEn] = useState("");
  const [addingMajorFor, setAddingMajorFor] = useState<string | null>(null);
  const [newMajorTh, setNewMajorTh] = useState("");
  const [newMajorEn, setNewMajorEn] = useState("");
  const [pending, setPending] = useState(false);

  async function refresh() {
    router.refresh();
  }

  async function handleAddFaculty(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/faculties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameTh: newFacultyTh, nameEn: newFacultyEn }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เพิ่มคณะไม่สำเร็จ");
        return;
      }
      setNewFacultyTh("");
      setNewFacultyEn("");
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteFaculty(id: string) {
    if (!confirm("ยืนยันการลบคณะนี้?")) return;
    setError(null);
    const res = await fetch(`/api/admin/faculties/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await refresh();
  }

  async function handleAddMajor(e: React.FormEvent, facultyId: string) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/majors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId, nameTh: newMajorTh, nameEn: newMajorEn }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เพิ่มสาขาไม่สำเร็จ");
        return;
      }
      setNewMajorTh("");
      setNewMajorEn("");
      setAddingMajorFor(null);
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteMajor(id: string) {
    if (!confirm("ยืนยันการลบสาขานี้?")) return;
    setError(null);
    const res = await fetch(`/api/admin/majors/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleAddFaculty} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-foreground/60">ชื่อคณะ (ไทย)</label>
          <input
            required
            value={newFacultyTh}
            onChange={(e) => setNewFacultyTh(e.target.value)}
            className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/60">ชื่อคณะ (อังกฤษ)</label>
          <input
            required
            value={newFacultyEn}
            onChange={(e) => setNewFacultyEn(e.target.value)}
            className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          เพิ่มคณะ
        </button>
      </form>

      <div className="space-y-4">
        {initialFaculties.map((f) => (
          <div key={f.id} className="rounded-lg border border-foreground/10 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {f.nameTh} <span className="text-xs text-foreground/50">({f.nameEn})</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddingMajorFor(addingMajorFor === f.id ? null : f.id)}
                  className="rounded-md border border-foreground/20 px-2 py-1 text-xs"
                >
                  + สาขา
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFaculty(f.id)}
                  className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-600"
                >
                  ลบคณะ
                </button>
              </div>
            </div>

            <ul className="mt-3 space-y-1">
              {f.majors.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span>
                    {m.nameTh} <span className="text-xs text-foreground/50">({m.nameEn})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMajor(m.id)}
                    className="text-xs text-red-600"
                  >
                    ลบ
                  </button>
                </li>
              ))}
              {f.majors.length === 0 && (
                <li className="text-sm text-foreground/40">ยังไม่มีสาขา</li>
              )}
            </ul>

            {addingMajorFor === f.id && (
              <form
                onSubmit={(e) => handleAddMajor(e, f.id)}
                className="mt-3 flex flex-wrap items-end gap-2 border-t border-foreground/10 pt-3"
              >
                <input
                  required
                  placeholder="ชื่อสาขา (ไทย)"
                  value={newMajorTh}
                  onChange={(e) => setNewMajorTh(e.target.value)}
                  className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
                />
                <input
                  required
                  placeholder="ชื่อสาขา (อังกฤษ)"
                  value={newMajorEn}
                  onChange={(e) => setNewMajorEn(e.target.value)}
                  className="rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-full bg-brand-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  บันทึก
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
