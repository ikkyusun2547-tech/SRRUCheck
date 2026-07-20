"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TITLE_OPTIONS } from "@/lib/validation/profile";
import { FilterSelect } from "@/components/admin/filter-select";
import { SectionHeading } from "@/components/admin/section-heading";
import { UserIcon } from "@/components/student/nav-icons";

type Major = { id: string; nameTh: string; nameEn: string; facultyId: string };
type Faculty = { id: string; nameTh: string; nameEn: string; majors: Major[] };

type UserData = {
  id: string;
  email: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  studentId: string | null;
  enrollmentYear: number | null;
  currentYear: number | null;
  programType: "normal" | "special" | null;
  facultyId: string | null;
  majorId: string | null;
  role: "student" | "admin";
  faculty: { nameTh: string; nameEn: string } | null;
  major: { nameTh: string; nameEn: string } | null;
};

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-purple-600/40";

const CURRENT_YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const currentBuddhistYear = new Date().getFullYear() + 543;
const ENROLLMENT_YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => currentBuddhistYear - i);

export function ProfileClient({ user, faculties }: { user: UserData; faculties: Faculty[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const displayName = [user.title, user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e0b47] via-brand-purple-800 to-brand-purple-600 px-7 py-8 text-white shadow-xl shadow-brand-purple-950/30 sm:px-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-[90px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-brand-emerald-400/25 blur-[90px]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-bold backdrop-blur-sm">
              {initial}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold sm:text-2xl">{displayName}</h1>
              <p className="mt-1 text-sm text-white/70">
                {user.studentId ?? "ยังไม่กรอกรหัสนักศึกษา"} · {user.email}
              </p>
            </div>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-purple-800 shadow-sm transition-transform hover:scale-[1.03] hover:shadow-md active:scale-[0.98]"
            >
              <EditIcon />
              แก้ไขโปรไฟล์
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <ProfileEditForm
          user={user}
          faculties={faculties}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      ) : (
        <ProfileView user={user} />
      )}
    </>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-foreground/50">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function ProfileView({ user }: { user: UserData }) {
  const programLabel = user.programType === "special" ? "กศ.บป." : user.programType === "normal" ? "ภาคปกติ" : "-";
  return (
    <div className="space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
      <SectionHeading icon={<UserIcon className="h-[15px] w-[15px]" />}>ข้อมูลส่วนตัว</SectionHeading>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoField label="รหัสนักศึกษา" value={user.studentId ?? "-"} />
        <InfoField label="ประเภทหลักสูตร" value={programLabel} />
        <InfoField label="คณะ" value={user.faculty?.nameTh ?? "-"} />
        <InfoField label="สาขา" value={user.major?.nameTh ?? "-"} />
        <InfoField label="ปีที่เข้าศึกษา (พ.ศ.)" value={user.enrollmentYear ? String(user.enrollmentYear) : "-"} />
        <InfoField label="ชั้นปีปัจจุบัน" value={user.currentYear ? `ปี ${user.currentYear}` : "-"} />
      </div>
    </div>
  );
}

function ProfileEditForm({
  user,
  faculties,
  onCancel,
  onSaved,
}: {
  user: UserData;
  faculties: Faculty[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(user.title ?? "");
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [studentId, setStudentId] = useState(user.studentId ?? "");
  const [enrollmentYear, setEnrollmentYear] = useState(user.enrollmentYear ? String(user.enrollmentYear) : "");
  const [currentYear, setCurrentYear] = useState(user.currentYear ? String(user.currentYear) : "");
  const [programType, setProgramType] = useState<"normal" | "special">(user.programType ?? "normal");
  const [facultyId, setFacultyId] = useState(user.facultyId ?? "");
  const [majorId, setMajorId] = useState(user.majorId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const majorsForFaculty = useMemo(
    () => faculties.find((f) => f.id === facultyId)?.majors ?? [],
    [faculties, facultyId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          firstName,
          lastName,
          studentId,
          enrollmentYear: Number(enrollmentYear),
          currentYear: Number(currentYear),
          programType,
          facultyId,
          majorId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      onSaved();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
      <SectionHeading icon={<UserIcon className="h-[15px] w-[15px]" />}>แก้ไขข้อมูลส่วนตัว</SectionHeading>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">คำนำหน้า</label>
          <div className="rounded-lg border border-foreground/15">
            <FilterSelect
              required
              fullWidth
              value={title}
              onChange={setTitle}
              placeholder="เลือก"
              options={TITLE_OPTIONS.map((t) => ({ value: t, label: t }))}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">ชื่อ</label>
          <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">นามสกุล</label>
          <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">รหัสนักศึกษา (11 หลัก)</label>
        <input
          required
          inputMode="numeric"
          pattern="\d{11}"
          maxLength={11}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value.replace(/\D/g, "").slice(0, 11))}
          className={`${inputClass} font-mono`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">ปีที่เข้าศึกษา (พ.ศ.)</label>
          <div className="rounded-lg border border-foreground/15">
            <FilterSelect
              required
              fullWidth
              value={enrollmentYear}
              onChange={setEnrollmentYear}
              placeholder="เลือก"
              options={ENROLLMENT_YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) }))}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">ชั้นปีปัจจุบัน</label>
          <div className="rounded-lg border border-foreground/15">
            <FilterSelect
              required
              fullWidth
              value={currentYear}
              onChange={setCurrentYear}
              placeholder="เลือก"
              options={CURRENT_YEAR_OPTIONS.map((y) => ({ value: String(y), label: `ปี ${y}` }))}
            />
          </div>
          <p className="mt-1 text-xs text-foreground/50">เลือกเองตามจริง (รองรับกรณีซ้ำชั้น/ลาพัก)</p>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">ประเภทหลักสูตร</label>
        <div className="flex gap-2">
          {(["normal", "special"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProgramType(p)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                programType === p
                  ? "border-brand-purple-600/30 bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400"
                  : "border-foreground/15 text-foreground/60 hover:bg-foreground/5"
              }`}
            >
              {p === "normal" ? "ภาคปกติ" : "กศ.บป."}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">คณะ</label>
          <div className="rounded-lg border border-foreground/15">
            <FilterSelect
              required
              fullWidth
              value={facultyId}
              onChange={(v) => {
                setFacultyId(v);
                setMajorId("");
              }}
              placeholder="เลือกคณะ"
              options={faculties.map((f) => ({ value: f.id, label: f.nameTh }))}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">สาขา</label>
          <div className="rounded-lg border border-foreground/15">
            <FilterSelect
              required
              fullWidth
              disabled={!facultyId}
              value={majorId}
              onChange={setMajorId}
              placeholder={facultyId ? "เลือกสาขา" : "เลือกคณะก่อน"}
              options={majorsForFaculty.map((m) => ({ value: m.id, label: m.nameTh }))}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-foreground/15 px-6 py-2.5 text-sm font-medium text-foreground/65 transition-colors hover:bg-foreground/5"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M11 2.5 13.5 5 5 13.5H2.5V11L11 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
