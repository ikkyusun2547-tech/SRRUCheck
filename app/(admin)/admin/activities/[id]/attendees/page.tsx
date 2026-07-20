import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getMissingStudentIds } from "@/lib/admin/attendance-gap";
import { PageHero } from "@/components/admin/page-hero";
import { LiveAttendanceTable } from "@/components/admin/live-attendance-table";

export default async function ActivityAttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("adminAttendees");
  const tLive = await getTranslations("adminLive");

  const activity = await prisma.activity.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      activityCode: true,
      _count: { select: { attendances: true } },
    },
  });
  if (!activity) notFound();

  const missingCount = (await getMissingStudentIds(activity.id)).length;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/activities"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/50 transition-colors hover:text-brand-purple-600"
      >
        <BackIcon />
        {t("backToActivities")}
      </Link>

      <PageHero
        eyebrow={activity.title}
        title={t("title")}
        subtitle={activity.activityCode}
        stats={[{ label: t("totalLabel"), value: activity._count.attendances, tone: "emerald" }]}
      />

      <div className="space-y-4 rounded-2xl border border-foreground/10 bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground/70">{tLive("attendanceListLabel")}</h2>
          {missingCount > 0 ? (
            <Link
              href={`/admin/activities/${activity.id}/missing`}
              className="group inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 py-1.5 pl-3.5 pr-1.5 text-xs font-medium text-amber-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100 hover:shadow dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400 dark:hover:bg-amber-400/15"
            >
              <MissingUsersIcon />
              {tLive("missingStudentsLabel")}
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white transition-transform group-hover:scale-105 dark:bg-amber-400 dark:text-amber-950">
                {missingCount}
              </span>
            </Link>
          ) : (
            <Link
              href={`/admin/activities/${activity.id}/missing`}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-emerald-200 bg-brand-emerald-50 px-3.5 py-1.5 text-xs font-medium text-brand-emerald-700 transition-colors hover:bg-brand-emerald-100 dark:border-brand-emerald-400/20 dark:bg-brand-emerald-400/10 dark:text-brand-emerald-400 dark:hover:bg-brand-emerald-400/15"
            >
              <CheckIcon />
              {tLive("missingStudentsAllDone")}
            </Link>
          )}
        </div>
        <LiveAttendanceTable activityId={activity.id} />
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M10 3.5L5 8L10 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MissingUsersIcon() {
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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
