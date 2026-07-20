import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PageHero } from "@/components/admin/page-hero";
import { StudentsClient } from "./students-client";

export default async function AdminStudentsPage() {
  const t = await getTranslations("adminStudents");
  const [faculties, totalCount] = await Promise.all([
    prisma.faculty.findMany({
      orderBy: { nameTh: "asc" },
      include: { majors: { orderBy: { nameTh: "asc" } } },
    }),
    prisma.user.count({ where: { role: "student" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        stats={[{ label: t("totalLabel"), value: totalCount, tone: "emerald" }]}
      />
      <StudentsClient faculties={faculties} />
    </div>
  );
}
