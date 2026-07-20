import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/admin/page-hero";
import { ReportsClient } from "./reports-client";

export default async function AdminReportsPage() {
  const t = await getTranslations("adminReports");
  return (
    <div className="space-y-6">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <ReportsClient />
    </div>
  );
}
