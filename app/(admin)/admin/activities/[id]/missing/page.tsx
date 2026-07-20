import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getEligibleStudentIds } from "@/lib/notifications/eligibility";
import { PageHero } from "@/components/admin/page-hero";
import { MissingStudentsList } from "./missing-students-list";

export default async function MissingStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("adminMissingStudents");

  const activity = await prisma.activity.findUnique({
    where: { id },
    select: { id: true, title: true, activityCode: true },
  });
  if (!activity) notFound();

  const eligibleIds = await getEligibleStudentIds(id);
  const attendedIds = new Set(
    (
      await prisma.attendance.findMany({
        where: { activityId: id, userId: { in: eligibleIds } },
        select: { userId: true },
      })
    ).map((a) => a.userId)
  );
  const missingIds = eligibleIds.filter((uid) => !attendedIds.has(uid));

  const missingStudents = await prisma.user.findMany({
    where: { id: { in: missingIds } },
    include: { faculty: true, major: true },
    orderBy: [{ firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/activities/${activity.id}/attendees`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/50 transition-colors hover:text-brand-purple-600"
      >
        <BackIcon />
        {t("backToActivity")}
      </Link>

      <PageHero
        eyebrow={activity.title}
        title={t("title")}
        subtitle={activity.activityCode}
        stats={[
          { label: t("eligibleTotal"), value: eligibleIds.length },
          { label: t("attendedCount"), value: attendedIds.size, tone: "emerald" },
          { label: t("missingCount"), value: missingIds.length, tone: "amber" },
        ]}
      />

      <MissingStudentsList
        eligibleTotal={eligibleIds.length}
        students={missingStudents.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          studentId: s.studentId,
          email: s.email,
          faculty: s.faculty,
          major: s.major,
        }))}
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
