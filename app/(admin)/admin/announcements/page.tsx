import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/admin/page-hero";
import { AnnouncementsClient } from "./announcements-client";

export default async function AdminAnnouncementsPage() {
  const t = await getTranslations("adminAnnouncements");
  const faculties = await prisma.faculty.findMany({
    orderBy: { nameTh: "asc" },
    include: { majors: { orderBy: { nameTh: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <AnnouncementsClient faculties={faculties} />
    </div>
  );
}
