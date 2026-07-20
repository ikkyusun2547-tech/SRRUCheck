import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/admin/page-hero";
import { FacultiesClient } from "./faculties-client";

export default async function AdminFacultiesPage() {
  const t = await getTranslations("adminFaculties");
  const faculties = await prisma.faculty.findMany({
    orderBy: { nameTh: "asc" },
    include: { majors: { orderBy: { nameTh: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        stats={[{ label: t("totalLabel"), value: faculties.length, tone: "emerald" }]}
      />
      <FacultiesClient initialFaculties={faculties} />
    </div>
  );
}
