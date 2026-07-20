"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/admin/section-heading";

export function ReportsClient() {
  const t = useTranslations("adminReports");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const participationUrl = (() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const qs = params.toString();
    return `/api/admin/reports/participation${qs ? `?${qs}` : ""}`;
  })();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
        <div className="mb-3">
          <SectionHeading icon={<PdfIcon />}>{t("graduationTitle")}</SectionHeading>
        </div>
        <p className="mb-4 text-sm text-foreground/55">{t("graduationDescription")}</p>
        <a
          href="/api/admin/reports/graduation"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600"
        >
          <DownloadIcon />
          {t("graduationDownload")}
        </a>
      </div>

      <div className="rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
        <div className="mb-3">
          <SectionHeading icon={<SheetIcon />}>{t("participationTitle")}</SectionHeading>
        </div>
        <p className="mb-4 text-sm text-foreground/55">{t("participationDescription")}</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-foreground/55">{t("fromDateLabel")}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-foreground/15 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-brand-purple-600/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground/55">{t("toDateLabel")}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-foreground/15 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-brand-purple-600/40"
            />
          </div>
        </div>
        <a
          href={participationUrl}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600"
        >
          <DownloadIcon />
          {t("participationDownload")}
        </a>
      </div>
    </div>
  );
}

function PdfIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 2.5h7l3 3v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7 11.5h1.3a1.2 1.2 0 0 0 0-2.4H7v4.8M11 9.1v4.8h1a1.6 1.6 0 0 0 0-3.2h-.8M14.5 9.1v4.8M14.5 11.3h1.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SheetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8H17M8 3V17" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 12.5H17" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2.5V10.5M8 10.5L5 7.5M8 10.5L11 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 12.5V13.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
