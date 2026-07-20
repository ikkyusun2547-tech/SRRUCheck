import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ActivityForm } from "@/components/admin/activity-form";
import { DeleteActivityButton } from "@/components/admin/delete-activity-button";
import { PageHero } from "@/components/admin/page-hero";
import { toThaiDatetimeLocalValue } from "@/lib/admin/datetime";
import { STORAGE_BUCKETS } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/supabase/storage";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("adminAttendees");
  const tActivities = await getTranslations("adminActivities");

  const [activity, faculties] = await Promise.all([
    prisma.activity.findUnique({
      where: { id },
      include: { restrictions: true, _count: { select: { attendances: true } } },
    }),
    prisma.faculty.findMany({
      orderBy: { nameTh: "asc" },
      include: { majors: { orderBy: { nameTh: "asc" } } },
    }),
  ]);

  if (!activity) notFound();

  const coverImageUrl = activity.coverImagePath
    ? await getSignedUrl(STORAGE_BUCKETS.activityCovers, activity.coverImagePath).catch(() => null)
    : null;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/activities"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/50 transition-colors hover:text-brand-purple-600"
      >
        <BackIcon />
        {t("backToActivities")}
      </Link>

      <PageHero eyebrow={tActivities("eyebrow")} title={t("editPageTitle")} subtitle={activity.title} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-foreground/10 bg-surface p-3 shadow-sm">
        <span className="px-2 font-mono text-xs text-foreground/40">{activity.activityCode}</span>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/activities/${activity.id}/attendees`}
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600"
          >
            <UsersIcon />
            {t("viewAttendeesButton", { count: activity._count.attendances })}
          </Link>
          <DeleteActivityButton activityId={activity.id} attendeeCount={activity._count.attendances} />
        </div>
      </div>

      <ActivityForm
        faculties={faculties}
        initial={{
          id: activity.id,
          title: activity.title,
          description: activity.description,
          level: activity.level,
          activityCategory: activity.activityCategory,
          activityType: activity.activityType,
          academicYear: activity.academicYear,
          semester: activity.semester,
          startTime: toThaiDatetimeLocalValue(activity.startTime),
          endTime: toThaiDatetimeLocalValue(activity.endTime),
          locationLat: activity.locationLat,
          locationLng: activity.locationLng,
          allowedRadius: activity.allowedRadius,
          locationName: activity.locationName,
          creditHours: activity.creditHours,
          checkinMethod: activity.checkinMethod,
          requiresGps: activity.requiresGps,
          activityCode: activity.activityCode,
          status: activity.status,
          restrictions: activity.restrictions,
          coverImageUrl,
        }}
      />
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

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.8 13.5c0-2.3 1.9-4 4.2-4s4.2 1.7 4.2 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.8 4.2a2.2 2.2 0 0 1 0 4.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 9.6c1.9.3 3.3 1.8 3.3 3.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
