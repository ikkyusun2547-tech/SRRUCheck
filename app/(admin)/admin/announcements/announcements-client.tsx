"use client";

import { useState } from "react";

type Major = { id: string; nameTh: string; facultyId: string };
type Faculty = { id: string; nameTh: string; majors: Major[] };

export function AnnouncementsClient({ faculties }: { faculties: Faculty[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const majorsForFaculty = faculties.find((f) => f.id === facultyId)?.majors ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          facultyId: facultyId || undefined,
          majorId: majorId || undefined,
          currentYear: currentYear || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ส่งประกาศไม่สำเร็จ");
        return;
      }
      setResult(`ส่งถึง ${data.recipients} คน (สำเร็จ ${data.sent}, ล้มเหลว ${data.failed})`);
      setTitle("");
      setBody("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-3">
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {result && (
        <p className="rounded-md border border-brand-emerald-500/40 bg-brand-emerald-500/10 px-3 py-2 text-sm text-brand-emerald-600">
          {result}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">หัวข้อ</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">เนื้อหา</label>
        <textarea
          required
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">กลุ่มเป้าหมาย (ไม่เลือก = นักศึกษาทั้งหมด)</p>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={facultyId}
            onChange={(e) => {
              setFacultyId(e.target.value);
              setMajorId("");
            }}
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="">ทุกคณะ</option>
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
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm disabled:opacity-50"
          >
            <option value="">ทุกสาขา</option>
            {majorsForFaculty.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nameTh}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(e.target.value)}
            className="rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="">ทุกชั้นปี</option>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>
                ปี {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-emerald-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "กำลังส่ง..." : "ส่งประกาศ"}
      </button>
    </form>
  );
}
