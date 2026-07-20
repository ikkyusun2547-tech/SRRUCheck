import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/admin/page-hero";
import { ActivitiesList } from "./activities-list";

export default async function AdminActivitiesPage() {
  const t = await getTranslations("adminActivities");
  const [activities, totalCount, openCount, closedCount] = await Promise.all([
    prisma.activity.findMany({
      orderBy: { startTime: "desc" },
      take: 200,
      select: {
        id: true,
        activityCode: true,
        title: true,
        activityCategory: true,
        level: true,
        academicYear: true,
        startTime: true,
        status: true,
        creditHours: true,
        checkinMethod: true,
        locationName: true,
        _count: { select: { attendances: true } },
      },
    }),
    prisma.activity.count(),
    prisma.activity.count({ where: { status: "open" } }),
    prisma.activity.count({ where: { status: "closed" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        cta={{ href: "/admin/activities/new", label: t("createNew") }}
        stats={[
          { label: t("statTotal"), value: totalCount },
          { label: t("statOpen"), value: openCount, tone: "emerald" },
          { label: t("statClosed"), value: closedCount },
        ]}
      />

      <ActivitiesList activities={activities} />
    </div>
  );
}
