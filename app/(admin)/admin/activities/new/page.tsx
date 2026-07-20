import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/admin/page-hero";
import { ActivityForm } from "@/components/admin/activity-form";

export default async function NewActivityPage() {
  const t = await getTranslations("adminActivityForm");
  const tActivities = await getTranslations("adminActivities");
  const tAttendees = await getTranslations("adminAttendees");
  const faculties = await prisma.faculty.findMany({
    orderBy: { nameTh: "asc" },
    include: { majors: { orderBy: { nameTh: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/activities"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/50 transition-colors hover:text-brand-purple-600"
      >
        <BackIcon />
        {tAttendees("backToActivities")}
      </Link>

      <PageHero eyebrow={tActivities("eyebrow")} title={t("newTitle")} subtitle={t("newSubtitle")} />
      <ActivityForm faculties={faculties} />
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
