import { getGraduationCriteria } from "@/lib/passport/criteria";
import { getExternalActivityHourCap, getCreditTransferHourCap } from "@/lib/requests/caps";
import { SettingsClient } from "./settings-client";

export default async function AdminSettingsPage() {
  const [criteria, externalActivityHourCap, creditTransferHourCap] = await Promise.all([
    getGraduationCriteria(),
    getExternalActivityHourCap(),
    getCreditTransferHourCap(),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">ตั้งค่าเกณฑ์การจบ</h1>
      <SettingsClient
        initialCriteria={criteria}
        initialExternalCap={externalActivityHourCap}
        initialCreditTransferCap={creditTransferHourCap}
      />
    </div>
  );
}
