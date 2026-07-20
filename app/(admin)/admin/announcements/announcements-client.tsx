"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FilterSelect } from "@/components/admin/filter-select";
import { SectionHeading } from "@/components/admin/section-heading";

type Major = { id: string; nameTh: string; nameEn: string; facultyId: string };
type Faculty = { id: string; nameTh: string; nameEn: string; majors: Major[] };

export function AnnouncementsClient({ faculties }: { faculties: Faculty[] }) {
  const t = useTranslations("adminAnnouncements");
  const locale = useLocale();
  const name = (o: { nameTh: string; nameEn: string }) => (locale === "en" ? o.nameEn : o.nameTh);

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
        setError(data.error ?? t("sendFailed"));
        return;
      }
      setResult(t("sendResult", { recipients: data.recipients, sent: data.sent, failed: data.failed }));
      setTitle("");
      setBody("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
      <SectionHeading icon={<MegaphoneIcon />}>{t("composeCardTitle")}</SectionHeading>
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}
      {result && (
        <p className="rounded-xl border border-brand-emerald-500/30 bg-brand-emerald-50 px-4 py-2.5 text-sm text-brand-emerald-700 dark:bg-brand-emerald-500/10 dark:text-brand-emerald-400">
          {result}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">{t("titleFieldLabel")}</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-purple-600/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">{t("bodyFieldLabel")}</label>
        <textarea
          required
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-purple-600/40"
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground/80">{t("targetGroupLabel")}</p>
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-foreground/10 p-1.5">
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
            placeholder={t("allMajors")}
            options={majorsForFaculty.map((m) => ({ value: m.id, label: name(m) }))}
          />
          <FilterSelect
            value={currentYear}
            onChange={setCurrentYear}
            placeholder={t("allYears")}
            options={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: t("year", { year: y }) }))}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
      >
        {pending ? t("sending") : t("sendButton")}
      </button>
    </form>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 6.5v3a1 1 0 0 0 1 1h1.2l6.3 3V2.5l-6.3 3H3a1 1 0 0 0-1 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M13 6a2.2 2.2 0 0 1 0 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.5 10.5 5.3 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
