import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getMissingStudentIds } from "@/lib/admin/attendance-gap";
import { PageHero } from "@/components/admin/page-hero";
import { LiveAttendanceTable } from "@/components/admin/live-attendance-table";

export default async function AdminLivePage({
  searchParams,
}: {
  searchParams: Promise<{ activityId?: string }>;
}) {
  const { activityId } = await searchParams;
  const t = await getTranslations("adminLive");

  const activities = await prisma.activity.findMany({
    where: { status: "open", checkinMethod: "realtime" },
    orderBy: { startTime: "asc" },
    select: { id: true, title: true, activityCode: true },
  });

  const selected = activityId ? activities.find((a) => a.id === activityId) : undefined;
  const missingCount = selected ? (await getMissingStudentIds(selected.id)).length : 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        stats={[{ label: t("openCount"), value: activities.length, tone: "emerald" }]}
      />

      {activities.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-foreground/15 bg-surface py-16 text-center">
          <div className="rounded-full bg-brand-purple-50 p-3 text-brand-purple-600 dark:bg-brand-purple-400/10">
            <LiveGlyph size={22} />
          </div>
          <p className="font-medium text-foreground/80">{t("noActivities")}</p>
          <p className="text-sm text-foreground/50">{t("noActivitiesHint")}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-foreground/10 bg-surface p-2 shadow-sm">
            {activities.map((a) => {
              const active = a.id === activityId;
              return (
                <Link
                  key={a.id}
                  href={`/admin/live?activityId=${a.id}`}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-purple-600 text-white shadow-sm"
                      : "text-foreground/65 hover:bg-brand-purple-50 hover:text-brand-purple-600 dark:hover:bg-brand-purple-400/10"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${active ? "bg-brand-emerald-300" : "bg-brand-emerald-500"}`}
                    aria-hidden
                  />
                  {a.title}
                </Link>
              );
            })}
          </div>

          {selected ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-surface p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-emerald-50 px-3 py-1 text-xs font-bold tracking-wide text-brand-emerald-600 dark:bg-brand-emerald-400/10 dark:text-brand-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-emerald-500" />
                    </span>
                    {t("liveBadge")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{selected.title}</p>
                    <p className="font-mono text-[11px] text-foreground/35">{selected.activityCode}</p>
                  </div>
                </div>
                <Link
                  href={`/live-display/${selected.id}`}
                  target="_blank"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-purple-700"
                >
                  <QrGlyph />
                  {t("openDisplayButton")}
                </Link>
              </div>

              <div className="space-y-4 rounded-2xl border border-foreground/10 bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground/70">{t("attendanceListLabel")}</h2>
                  {missingCount > 0 ? (
                    <Link
                      href={`/admin/activities/${selected.id}/missing`}
                      className="group inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 py-1.5 pl-3.5 pr-1.5 text-xs font-medium text-amber-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100 hover:shadow dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400 dark:hover:bg-amber-400/15"
                    >
                      <MissingUsersGlyph />
                      {t("missingStudentsLabel")}
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white transition-transform group-hover:scale-105 dark:bg-amber-400 dark:text-amber-950">
                        {missingCount}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/activities/${selected.id}/missing`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-emerald-200 bg-brand-emerald-50 px-3.5 py-1.5 text-xs font-medium text-brand-emerald-700 transition-colors hover:bg-brand-emerald-100 dark:border-brand-emerald-400/20 dark:bg-brand-emerald-400/10 dark:text-brand-emerald-400 dark:hover:bg-brand-emerald-400/15"
                    >
                      <CheckGlyph />
                      {t("missingStudentsAllDone")}
                    </Link>
                  )}
                </div>
                <LiveAttendanceTable activityId={selected.id} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-foreground/15 bg-surface py-16 text-center">
              <div className="rounded-full bg-brand-purple-50 p-3 text-brand-purple-600 dark:bg-brand-purple-400/10">
                <LiveGlyph size={22} />
              </div>
              <p className="font-medium text-foreground/80">{t("selectPrompt")}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LiveGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="2" fill="currentColor" />
      <path d="M5.5 5.5a5 5 0 0 0 0 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 5.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 3a8 8 0 0 0 0 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M15 3a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function QrGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9.5" y="2" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="9.5" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5H12M13.5 9.5H14M9.5 12H10.5M12 12H14M9.5 14H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MissingUsersGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5.5" r="2.2" strokeDasharray="1.6 1.6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M1.8 13.5c0-2.3 1.9-4 4.2-4s4.2 1.7 4.2 4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="1.6 1.6"
      />
      <path d="M10.8 4.2a2.2 2.2 0 0 1 0 4.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 9.6c1.9.3 3.3 1.8 3.3 3.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

