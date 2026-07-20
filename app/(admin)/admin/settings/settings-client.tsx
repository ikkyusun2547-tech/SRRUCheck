"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/admin/section-heading";
import type { GraduationCriteria, ProgramCriteria } from "@/lib/passport/criteria";

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-purple-600/40";

function ProgramFields({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: ProgramCriteria;
  onChange: (v: ProgramCriteria) => void;
}) {
  const t = useTranslations("adminSettings");
  return (
    <div className="space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
      <SectionHeading icon={icon}>{label}</SectionHeading>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs text-foreground/55">{t("requiredActivities")}</label>
          <input
            type="number"
            value={value.requiredActivities}
            onChange={(e) => onChange({ ...value, requiredActivities: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-foreground/55">{t("requiredHours")}</label>
          <input
            type="number"
            value={value.requiredHours}
            onChange={(e) => onChange({ ...value, requiredHours: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-foreground/55">{t("yearlyTargets")}</label>
        <div className="grid grid-cols-4 gap-2">
          {value.yearlyHourTargets.map((tv, i) => (
            <div key={i}>
              <input
                type="number"
                value={tv}
                onChange={(e) => {
                  const next = [...value.yearlyHourTargets] as ProgramCriteria["yearlyHourTargets"];
                  next[i] = Number(e.target.value);
                  onChange({ ...value, yearlyHourTargets: next });
                }}
                className={`${inputClass} px-2.5 text-center`}
              />
              <p className="mt-1 text-center text-[11px] text-foreground/40">{t("yearLabel", { year: i + 1 })}</p>
            </div>
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
  const t = useTranslations("adminSettings");
  const tCommon = useTranslations("common");
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
        setError(data.error ?? t("saveFailed"));
        return;
      }
      setSuccess(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-xl border border-brand-emerald-500/30 bg-brand-emerald-50 px-4 py-2.5 text-sm text-brand-emerald-700 dark:bg-brand-emerald-500/10 dark:text-brand-emerald-400">
          {t("saveSuccess")}
        </p>
      )}

      <ProgramFields
        icon={<CapIcon />}
        label={t("normalProgram")}
        value={criteria.normal}
        onChange={(v) => setCriteria((c) => ({ ...c, normal: v }))}
      />
      <ProgramFields
        icon={<StarIcon />}
        label={t("specialProgram")}
        value={criteria.special}
        onChange={(v) => setCriteria((c) => ({ ...c, special: v }))}
      />

      <div className="space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
        <SectionHeading icon={<ClockIcon />}>{t("requestCaps")}</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-foreground/55">{t("externalCapLabel")}</label>
            <input type="number" value={externalCap} onChange={(e) => setExternalCap(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/55">{t("creditTransferCapLabel")}</label>
            <input
              type="number"
              value={creditTransferCap}
              onChange={(e) => setCreditTransferCap(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="rounded-full bg-brand-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
      >
        {pending ? tCommon("saving") : t("saveButton")}
      </button>
    </div>
  );
}

function CapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 3 1.5 6.2 8 9.4l6.5-3.2L8 3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4 7.8V11c0 1 1.8 2 4 2s4-1 4-2V7.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14 6.5v3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.8 9.8 5.9l4.4.4-3.3 3 1 4.3L8 11.4l-3.9 2.2 1-4.3-3.3-3 4.4-.4L8 1.8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.8V8.3L10.3 9.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
