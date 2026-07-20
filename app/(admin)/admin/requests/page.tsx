import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/admin/page-hero";
import { RequestsApprovalClient } from "./requests-approval-client";

export default async function AdminRequestsPage() {
  const t = await getTranslations("adminRequests");
  return (
    <div className="space-y-6">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <RequestsApprovalClient />
    </div>
  );
}
