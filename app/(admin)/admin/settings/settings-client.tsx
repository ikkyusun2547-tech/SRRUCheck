"use client";

import { useState } from "react";
import type { GraduationCriteria, ProgramCriteria } from "@/lib/passport/criteria";

function ProgramFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ProgramCriteria;
  onChange: (v: ProgramCriteria) => void;
}) {
  return (
    <div className="rounded-lg border border-foreground/10 p-4">
      <p className="mb-3 font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-foreground/60">จำนวนกิจกรรมที่ต้องผ่าน</label>
          <input
            type="number"
            value={value.requiredActivities}
            onChange={(e) => onChange({ ...value, requiredActivities: Number(e.target.value) })}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/60">ชั่วโมงรวมที่ต้องผ่าน</label>
          <input
            type="number"
            value={value.requiredHours}
            onChange={(e) => onChange({ ...value, requiredHours: Number(e.target.value) })}
            className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs text-foreground/60">
          เป้าหมายชั่วโมงสะสมภายในสิ้นปีที่ 1–4
        </label>
        <div className="grid grid-cols-4 gap-2">
          {value.yearlyHourTargets.map((t, i) => (
            <input
              key={i}
              type="number"
              value={t}
              onChange={(e) => {
                const next = [...value.yearlyHourTargets] as ProgramCriteria["yearlyHourTargets"];
                next[i] = Number(e.target.value);
                onChange({ ...value, yearlyHourTargets: next });
              }}
              className="w-full rounded-md border border-foreground/20 bg-transparent px-2 py-1.5 text-sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsClient({
  initialCriteria,
  initialExternalCap,
  initialCreditTransferCap,
}: {
  initialCriteria: GraduationCriteria;
  initialExternalCap: number;
  initialCreditTransferCap: number;
}) {
  const [criteria, setCriteria] = useState(initialCriteria);
  const [externalCap, setExternalCap] = useState(String(initialExternalCap));
  const [creditTransferCap, setCreditTransferCap] = useState(String(initialCreditTransferCap));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setPending(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria,
          externalActivityHourCap: Number(externalCap),
          creditTransferHourCap: Number(creditTransferCap),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setSuccess(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md border border-brand-emerald-500/40 bg-brand-emerald-500/10 px-3 py-2 text-sm text-brand-emerald-600">
          บันทึกสำเร็จ
        </p>
      )}

      <ProgramFields
        label="เกณฑ์ภาคปกติ (normal)"
        value={criteria.normal}
        onChange={(v) => setCriteria((c) => ({ ...c, normal: v }))}
      />
      <ProgramFields
        label="เกณฑ์ กศ.บป. (special)"
        value={criteria.special}
        onChange={(v) => setCriteria((c) => ({ ...c, special: v }))}
      />

      <div className="rounded-lg border border-foreground/10 p-4">
        <p className="mb-3 font-medium">เพดานชั่วโมง/ปีของคำร้อง</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-foreground/60">กิจกรรมภายนอก (ชม./ปี)</label>
            <input
              type="number"
              value={externalCap}
              onChange={(e) => setExternalCap(e.target.value)}
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/60">เทียบชั่วโมงผู้นำ (ชม./ปี)</label>
            <input
              type="number"
              value={creditTransferCap}
              onChange={(e) => setCreditTransferCap(e.target.value)}
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="rounded-full bg-brand-emerald-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </button>
    </div>
  );
}
