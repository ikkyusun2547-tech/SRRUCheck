import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { getPassportSummary } from "@/lib/passport/service";
import { CATEGORY_ORDER } from "@/lib/admin/category-colors";
import { CategoryBreakdown } from "@/components/admin/category-breakdown";
import { CalendarIcon } from "@/components/student/nav-icons";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const summary = await getPassportSummary(session.user.id);
  const t = await getTranslations();
  const tCategories = await getTranslations("categories");

  if (!summary) {
    return <p className="text-sm text-foreground/60">{t("dashboard.noUser")}</p>;
  }

  const hoursPct = Math.min(100, Math.round((summary.totalHours / summary.requiredHours) * 100));
  const activitiesPct = Math.min(
    100,
    Math.round((summary.totalActivitiesCount / summary.requiredActivities) * 100)
  );
  const categoryData = CATEGORY_ORDER.map((category) => ({
    category,
    label: tCategories(category),
    count: summary.categoryHours[category],
  }));

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e0b47] via-brand-purple-800 to-brand-purple-600 px-7 py-9 text-white shadow-xl shadow-brand-purple-950/30 sm:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-[90px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-brand-emerald-400/25 blur-[90px]" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{t("dashboard.eyebrow")}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{t("dashboard.title")}</h1>
            <p className="mt-1 text-sm text-white/70">{t("dashboard.subtitle")}</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-sm ${
              summary.passed
                ? "border-brand-emerald-400/40 bg-brand-emerald-400/15 text-white"
                : "border-amber-300/40 bg-amber-400/15 text-white"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${summary.passed ? "bg-brand-emerald-400" : "bg-amber-300"}`} />
            {summary.passed ? t("dashboard.passed") : t("dashboard.notPassed")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProgressCard
          icon={<ClockIcon />}
          label={t("dashboard.totalHours")}
          value={summary.totalHours}
          target={summary.requiredHours}
          unit={t("dashboard.hoursUnit")}
          pct={hoursPct}
          barClassName="bg-brand-emerald-500"
          note={`${t("dashboard.yearlyTarget")}: ${summary.yearlyCumulativeTarget} ${t("dashboard.hoursUnit")}`}
        />
        <ProgressCard
          icon={<CalendarIcon />}
          label={t("dashboard.totalActivities")}
          value={summary.totalActivitiesCount}
          target={summary.requiredActivities}
          unit={t("dashboard.activitiesUnit")}
          pct={activitiesPct}
          barClassName="bg-brand-purple-600"
        />
      </div>

      <CategoryBreakdown title={t("dashboard.categoryBreakdown")} icon={<ChartIcon />} data={categoryData} />
    </div>
  );
}

function ProgressCard({
  icon,
  label,
  value,
  target,
  unit,
  pct,
  barClassName,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  target: number;
  unit: string;
  pct: number;
  barClassName: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400">
          {icon}
        </span>
        <p className="text-sm text-foreground/60">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums">
        {value}
        <span className="text-base font-normal text-foreground/40">
          {" "}
          / {target} {unit}
        </span>
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/8">
        <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${pct}%` }} />
      </div>
      {note && <p className="mt-2 text-xs text-foreground/45">{note}</p>}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9.5" r="6.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 6.2V9.5L11.5 11.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 1.7 9 3.3l2.5-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
