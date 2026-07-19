import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getPassportSummary } from "@/lib/passport/service";
import { CATEGORY_LABELS } from "@/lib/labels";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const summary = await getPassportSummary(session.user.id);
  if (!summary) {
    return <p className="text-sm text-foreground/60">ไม่พบข้อมูลผู้ใช้</p>;
  }

  const hoursPct = Math.min(100, Math.round((summary.totalHours / summary.requiredHours) * 100));
  const activitiesPct = Math.min(
    100,
    Math.round((summary.totalActivitiesCount / summary.requiredActivities) * 100)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Activity Passport</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            summary.passed
              ? "bg-brand-emerald-500/15 text-brand-emerald-600"
              : "bg-amber-500/15 text-amber-600"
          }`}
        >
          {summary.passed ? "ผ่านเกณฑ์แล้ว" : "ยังไม่ผ่านเกณฑ์"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60">ชั่วโมงสะสม</p>
          <p className="text-2xl font-bold">
            {summary.totalHours} <span className="text-base font-normal">/ {summary.requiredHours} ชม.</span>
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-foreground/10">
            <div
              className="h-2 rounded-full bg-brand-emerald-500"
              style={{ width: `${hoursPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-foreground/50">
            เป้าหมายสะสมภายในสิ้นปีนี้: {summary.yearlyCumulativeTarget} ชม.
          </p>
        </div>

        <div className="rounded-lg border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60">จำนวนกิจกรรม</p>
          <p className="text-2xl font-bold">
            {summary.totalActivitiesCount}{" "}
            <span className="text-base font-normal">/ {summary.requiredActivities} กิจกรรม</span>
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-foreground/10">
            <div
              className="h-2 rounded-full bg-brand-purple-600"
              style={{ width: `${activitiesPct}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground/70">ชั่วโมงแยกตามหมวดหมู่</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(summary.categoryHours).map(([category, hours]) => (
            <div key={category} className="rounded-lg border border-foreground/10 p-3 text-center">
              <p className="text-xs text-foreground/60">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              </p>
              <p className="mt-1 text-lg font-semibold">{hours} ชม.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
