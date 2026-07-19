"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocationPickerMap } from "./location-picker-map";
import { CATEGORY_LABELS } from "@/lib/labels";

type Major = { id: string; nameTh: string; facultyId: string };
type Faculty = { id: string; nameTh: string; majors: Major[] };
type Restriction = { facultyId: string; majorId: string; yearLevel: string };

type InitialActivity = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  activityCategory: string;
  activityType: string;
  academicYear: number;
  semester: number;
  startTime: string;
  endTime: string;
  locationLat: number | null;
  locationLng: number | null;
  allowedRadius: number | null;
  locationName: string | null;
  creditHours: number;
  checkinMethod: string;
  requiresGps: boolean;
  activityCode: string;
  status: string;
  restrictions: { facultyId: string | null; majorId: string | null; yearLevel: number | null }[];
};

const currentBuddhistYear = new Date().getFullYear() + 543;

export function ActivityForm({
  faculties,
  initial,
}: {
  faculties: Faculty[];
  initial?: InitialActivity;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [level, setLevel] = useState(initial?.level ?? "university");
  const [category, setCategory] = useState(initial?.activityCategory ?? "");
  const [activityType, setActivityType] = useState(initial?.activityType ?? "mandatory_core");
  const [academicYear, setAcademicYear] = useState(String(initial?.academicYear ?? currentBuddhistYear));
  const [semester, setSemester] = useState(String(initial?.semester ?? 1));
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [lat, setLat] = useState<number | null>(initial?.locationLat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.locationLng ?? null);
  const [radius, setRadius] = useState(initial?.allowedRadius != null ? String(initial.allowedRadius) : "100");
  const [locationName, setLocationName] = useState(initial?.locationName ?? "");
  const [creditHours, setCreditHours] = useState(String(initial?.creditHours ?? ""));
  const [checkinMethod, setCheckinMethod] = useState(initial?.checkinMethod ?? "realtime");
  const [requiresGps, setRequiresGps] = useState(initial?.requiresGps ?? true);
  const [activityCode, setActivityCode] = useState(initial?.activityCode ?? "");
  const [status, setStatus] = useState(initial?.status ?? "open");
  const [restrictions, setRestrictions] = useState<Restriction[]>(
    initial?.restrictions.map((r) => ({
      facultyId: r.facultyId ?? "",
      majorId: r.majorId ?? "",
      yearLevel: r.yearLevel != null ? String(r.yearLevel) : "",
    })) ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function addRestriction() {
    setRestrictions((r) => [...r, { facultyId: "", majorId: "", yearLevel: "" }]);
  }
  function updateRestriction(index: number, patch: Partial<Restriction>) {
    setRestrictions((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function removeRestriction(index: number) {
    setRestrictions((rs) => rs.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const payload = {
        title,
        description,
        level,
        activityCategory: category,
        activityType,
        academicYear: Number(academicYear),
        semester: Number(semester),
        startTime,
        endTime,
        locationLat: lat ?? undefined,
        locationLng: lng ?? undefined,
        allowedRadius: radius ? Number(radius) : undefined,
        locationName,
        creditHours: Number(creditHours),
        checkinMethod,
        requiresGps,
        activityCode,
        status,
        restrictions: restrictions
          .filter((r) => r.facultyId || r.majorId || r.yearLevel)
          .map((r) => ({
            facultyId: r.facultyId || undefined,
            majorId: r.majorId || undefined,
            yearLevel: r.yearLevel ? Number(r.yearLevel) : undefined,
          })),
      };

      const url = initial ? `/api/admin/activities/${initial.id}` : "/api/admin/activities";
      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      router.push("/admin/activities");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">ชื่อกิจกรรม</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">รายละเอียด</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">ระดับ</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="university">มหาวิทยาลัย</option>
            <option value="faculty">คณะ</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">หมวดหมู่</label>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="" disabled>
              เลือกหมวดหมู่
            </option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">ลักษณะ</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="mandatory_core">บังคับแกน</option>
            <option value="mandatory_elective">บังคับเลือก</option>
            <option value="practice">ซ้อม</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ปีการศึกษา (พ.ศ.)</label>
          <input
            required
            type="number"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ภาคเรียน</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">ฤดูร้อน</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">เวลาเริ่ม</label>
          <input
            required
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">เวลาสิ้นสุด</label>
          <input
            required
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">รหัสกิจกรรม</label>
          <input
            required
            value={activityCode}
            onChange={(e) => setActivityCode(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ชั่วโมงที่ได้</label>
          <input
            required
            type="number"
            min="0"
            step="0.5"
            value={creditHours}
            onChange={(e) => setCreditHours(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">วิธีเช็คชื่อ</label>
          <select
            value={checkinMethod}
            onChange={(e) => setCheckinMethod(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="realtime">เช็คชื่อสดหน้างาน (QR)</option>
            <option value="self_report">แนบหลักฐานด้วยตนเอง</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">สถานะ</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
          >
            <option value="open">เปิด</option>
            <option value="closed">ปิด</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>
      </div>

      {checkinMethod === "realtime" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requiresGps}
            onChange={(e) => setRequiresGps(e.target.checked)}
          />
          ต้องยืนยันตำแหน่ง GPS
        </label>
      )}

      {checkinMethod === "realtime" && requiresGps && (
        <div className="space-y-2">
          <label className="mb-1 block text-sm font-medium">ปักหมุดตำแหน่งกิจกรรม (คลิกบนแผนที่)</label>
          <LocationPickerMap
            lat={lat}
            lng={lng}
            radius={radius ? Number(radius) : null}
            onChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-foreground/60">รัศมี (เมตร)</label>
              <input
                type="number"
                min="1"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground/60">ชื่อสถานที่</label>
              <input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
              />
            </div>
          </div>
          {lat != null && lng != null && (
            <p className="text-xs text-foreground/50">
              ตำแหน่งที่เลือก: {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          )}
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">จำกัดสิทธิ์ผู้เข้าร่วม (ไม่บังคับ)</label>
          <button
            type="button"
            onClick={addRestriction}
            className="rounded-md border border-foreground/20 px-2 py-1 text-xs"
          >
            + เพิ่มเงื่อนไข
          </button>
        </div>
        {restrictions.length === 0 && (
          <p className="text-xs text-foreground/50">ไม่จำกัด — นักศึกษาทุกคนเข้าร่วมได้</p>
        )}
        <div className="space-y-2">
          {restrictions.map((r, i) => {
            const majorsForFaculty = faculties.find((f) => f.id === r.facultyId)?.majors ?? [];
            return (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border border-foreground/10 p-2">
                <select
                  value={r.facultyId}
                  onChange={(e) => updateRestriction(i, { facultyId: e.target.value, majorId: "" })}
                  className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm"
                >
                  <option value="">ทุกคณะ</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nameTh}
                    </option>
                  ))}
                </select>
                <select
                  value={r.majorId}
                  disabled={!r.facultyId}
                  onChange={(e) => updateRestriction(i, { majorId: e.target.value })}
                  className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm disabled:opacity-50"
                >
                  <option value="">ทุกสาขา</option>
                  {majorsForFaculty.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nameTh}
                    </option>
                  ))}
                </select>
                <select
                  value={r.yearLevel}
                  onChange={(e) => updateRestriction(i, { yearLevel: e.target.value })}
                  className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm"
                >
                  <option value="">ทุกชั้นปี</option>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y}>
                      ปี {y}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeRestriction(i)}
                  className="text-xs text-red-600"
                >
                  ลบ
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-emerald-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
      </button>
    </form>
  );
}
