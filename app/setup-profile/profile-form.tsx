"use client";

import { useMemo, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { submitProfile } from "./actions";
import { TITLE_OPTIONS } from "@/lib/validation/profile";

type Faculty = { id: string; nameTh: string; nameEn: string };
type Major = { id: string; facultyId: string; nameTh: string; nameEn: string };

const CURRENT_YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const currentBuddhistYear = new Date().getFullYear() + 543;
const ENROLLMENT_YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => currentBuddhistYear - i);

export function ProfileForm({
  faculties,
  majors,
  defaultEmail,
}: {
  faculties: Faculty[];
  majors: Major[];
  defaultEmail: string;
}) {
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [enrollmentYear, setEnrollmentYear] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [programType, setProgramType] = useState<"normal" | "special">("normal");
  const [facultyId, setFacultyId] = useState("");
  const [majorId, setMajorId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredMajors = useMemo(
    () => majors.filter((m) => m.facultyId === facultyId),
    [majors, facultyId]
  );

  function handleFacultyChange(nextFacultyId: string) {
    setFacultyId(nextFacultyId);
    setMajorId(""); // cascading: reset major whenever faculty changes
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await submitProfile({
          title,
          firstName,
          lastName,
          studentId,
          enrollmentYear: Number(enrollmentYear),
          currentYear: Number(currentYear),
          programType,
          facultyId,
          majorId,
        });
      } catch (err) {
        // Let redirect()'s internal throw from a successful submit pass
        // through untouched; only real errors reach setError below.
        unstable_rethrow(err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-5">
      <div>
        <p className="text-sm text-foreground/60">{defaultEmail}</p>
      </div>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">คำนำหน้า</label>
          <select
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="" disabled>
              เลือก
            </option>
            {TITLE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">ชื่อ</label>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium">นามสกุล</label>
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">รหัสนักศึกษา (11 หลัก)</label>
        <input
          required
          inputMode="numeric"
          pattern="\d{11}"
          maxLength={11}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value.replace(/\D/g, "").slice(0, 11))}
          className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">ปีที่เข้าศึกษา (พ.ศ.)</label>
          <select
            required
            value={enrollmentYear}
            onChange={(e) => setEnrollmentYear(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="" disabled>
              เลือก
            </option>
            {ENROLLMENT_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ชั้นปีปัจจุบัน</label>
          <select
            required
            value={currentYear}
            onChange={(e) => setCurrentYear(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="" disabled>
              เลือก
            </option>
            {CURRENT_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                ปี {y}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-foreground/50">
            เลือกเองตามจริง (รองรับกรณีซ้ำชั้น/ลาพัก)
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">ประเภทหลักสูตร</label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="programType"
              checked={programType === "normal"}
              onChange={() => setProgramType("normal")}
            />
            ภาคปกติ
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="programType"
              checked={programType === "special"}
              onChange={() => setProgramType("special")}
            />
            กศ.บป.
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">คณะ</label>
          <select
            required
            value={facultyId}
            onChange={(e) => handleFacultyChange(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="" disabled>
              เลือกคณะ
            </option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nameTh}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">สาขา</label>
          <select
            required
            disabled={!facultyId}
            value={majorId}
            onChange={(e) => setMajorId(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 disabled:opacity-50"
          >
            <option value="" disabled>
              {facultyId ? "เลือกสาขา" : "เลือกคณะก่อน"}
            </option>
            {filteredMajors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nameTh}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-brand-emerald-500 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
      >
        {isPending ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
      </button>
    </form>
  );
}
