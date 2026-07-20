import { getTranslations } from "next-intl/server";
import { getGraduationCriteria } from "@/lib/passport/criteria";
import { getExternalActivityHourCap, getCreditTransferHourCap } from "@/lib/requests/caps";
import { PageHero } from "@/components/admin/page-hero";
import { SettingsClient } from "./settings-client";

export default async function AdminSettingsPage() {
  const t = await getTranslations("adminSettings");
  const [criteria, externalActivityHourCap, creditTransferHourCap] = await Promise.all([
    getGraduationCriteria(),
    getExternalActivityHourCap(),
    getCreditTransferHourCap(),
  ]);

  return (
    <div className="space-y-6">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <SettingsClient
        initialCriteria={criteria}
        initialExternalCap={externalActivityHourCap}
        initialCreditTransferCap={creditTransferHourCap}
      />
    </div>
  );
}
