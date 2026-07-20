import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getAuditLogPage } from "@/lib/audit/log";
import { CATEGORY_ORDER } from "@/lib/admin/category-colors";
import { PageHero } from "@/components/admin/page-hero";
import { StatCard } from "@/components/admin/stat-card";
import { CategoryBreakdown } from "@/components/admin/category-breakdown";
import { OpenActivitiesCard } from "@/components/admin/open-activities-card";
import { RecentActivityFeed } from "@/components/admin/recent-activity-feed";
import { StudentsIcon, ActivitiesIcon, RequestsIcon, AuditIcon } from "@/components/admin/nav-icons";

export default async function AdminOverviewPage() {
  const t = await getTranslations("adminOverview");
  const tCategories = await getTranslations("categories");
  const locale = await getLocale();
  const dateLocale = locale === "en" ? "en-US" : "th-TH";

  const [
    studentCount,
    openActivityCount,
    pendingExternal,
    pendingCreditTransfer,
    pendingLateCheckIn,
    flaggedAttendanceCount,
    categoryGroups,
    openActivities,
    recentLog,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "student" } }),
    prisma.activity.count({ where: { status: "open" } }),
    prisma.externalActivityRequest.count({ where: { status: "pending" } }),
    prisma.creditTransferRequest.count({ where: { status: "pending" } }),
    prisma.lateCheckInRequest.count({ where: { status: "pending" } }),
    prisma.attendance.count({ where: { status: "flagged" } }),
    prisma.activity.groupBy({ by: ["activityCategory"], _count: { _all: true } }),
    prisma.activity.findMany({
      where: { status: "open" },
      orderBy: { startTime: "asc" },
      take: 5,
      select: { id: true, title: true, activityCategory: true, _count: { select: { attendances: true } } },
    }),
    getAuditLogPage(1, 5),
  ]);
  const pendingRequests = pendingExternal + pendingCreditTransfer + pendingLateCheckIn;

  const categoryData = CATEGORY_ORDER.map((category) => ({
    category,
    label: tCategories(category),
    count: categoryGroups.find((g) => g.activityCategory === category)?._count._all ?? 0,
  }));

  const openActivitiesData = openActivities.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.activityCategory,
    attendeeCount: a._count.attendances,
  }));

  const recentActivityData = recentLog.items.map((log) => ({
    id: log.id,
    action: log.action,
    createdAt: log.createdAt,
    actorName: log.actor
      ? [log.actor.firstName, log.actor.lastName].filter(Boolean).join(" ") || log.actor.email
      : t("systemActor"),
  }));

  return (
    <div className="space-y-6">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/admin/students"
          icon={<StudentsIcon className="h-5 w-5" />}
          label={t("students")}
          value={studentCount}
        />
        <StatCard
          href="/admin/activities"
          icon={<ActivitiesIcon className="h-5 w-5" />}
          label={t("openActivities")}
          value={openActivityCount}
        />
        <StatCard
          href="/admin/requests"
          icon={<RequestsIcon className="h-5 w-5" />}
          label={t("pendingRequests")}
          value={pendingRequests}
          note={pendingRequests > 0 ? t("needsAction") : undefined}
          noteTone="amber"
        />
        <StatCard
          href="/admin/live"
          icon={<FlagIcon className="h-5 w-5" />}
          label={t("flaggedAttendance")}
          value={flaggedAttendanceCount}
          note={flaggedAttendanceCount > 0 ? t("needsReview") : undefined}
          noteTone="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CategoryBreakdown title={t("categoryBreakdownTitle")} icon={<ChartIcon />} data={categoryData} />
        <OpenActivitiesCard
          title={t("openActivitiesListTitle")}
          icon={<ActivitiesIcon className="h-[15px] w-[15px]" />}
          items={openActivitiesData}
          emptyLabel={t("noOpenActivities")}
          viewAllHref="/admin/activities"
          viewAllLabel={t("viewAll")}
        />
        <RecentActivityFeed
          title={t("recentActivityTitle")}
          icon={<AuditIcon className="h-[15px] w-[15px]" />}
          items={recentActivityData}
          emptyLabel={t("noRecentActivity")}
          viewAllHref="/admin/audit-log"
          viewAllLabel={t("viewAll")}
          dateLocale={dateLocale}
        />
      </div>
    </div>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={className} aria-hidden>
      <path d="M4.5 2v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M4.5 3h8l-1.8 2.8L12.5 8.5h-8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 14V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M2 14H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.5 11.5V8.5M8 11.5V5.5M11.5 11.5V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
