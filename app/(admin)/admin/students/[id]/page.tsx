import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getPassportSummary } from "@/lib/passport/service";
import { CATEGORY_LABELS, ATTENDANCE_STATUS_LABELS, REQUEST_STATUS_LABELS } from "@/lib/labels";

const ATTENDANCE_DOT: Record<string, string> = {
  auto_approved: "bg-brand-emerald-500",
  flagged: "bg-amber-500",
  rejected: "bg-red-500",
};

const REQUEST_DOT: Record<string, string> = {
  pending: "bg-amber-500",
  approved: "bg-brand-emerald-500",
  rejected: "bg-red-500",
  cancelled: "bg-foreground/30",
};

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("adminStudentDetail");

  const user = await prisma.user.findUnique({
    where: { id },
    include: { faculty: true, major: true },
  });
  if (!user) notFound();

  const [passport, attendances, externalRequests, creditTransferRequests, lateCheckInRequests] =
    await Promise.all([
      getPassportSummary(id),
      prisma.attendance.findMany({
        where: { userId: id },
        orderBy: { checkinTime: "desc" },
        take: 20,
        include: { activity: { select: { title: true, creditHours: true } } },
      }),
      prisma.externalActivityRequest.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.creditTransferRequest.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.lateCheckInRequest.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { activity: { select: { title: true } } },
      }),
    ]);

  const displayName = [user.title, user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const combinedRequests = [...externalRequests, ...creditTransferRequests];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/50 transition-colors hover:text-brand-purple-600"
      >
        <BackIcon />
        {t("backToStudents")}
      </Link>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e0b47] via-brand-purple-800 to-brand-purple-600 px-7 py-8 text-white shadow-xl shadow-brand-purple-950/30 sm:px-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-[90px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-brand-emerald-400/25 blur-[90px]" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-bold backdrop-blur-sm">
            {initial}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{displayName}</h1>
            <p className="mt-1 text-sm text-white/70">
              {user.studentId ?? t("noStudentId")} · {user.email} · {user.faculty?.nameTh ?? "-"} / {user.major?.nameTh ?? "-"} · {user.currentYear ?? "-"}
              {user.bannedAt && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-200">
                  {t("banned")}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {passport && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm">
            <p className="text-xs text-foreground/55">{t("totalHours")}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {passport.totalHours}
              <span className="text-base font-normal text-foreground/40"> / {passport.requiredHours}</span>
            </p>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm">
            <p className="text-xs text-foreground/55">{t("totalActivities")}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {passport.totalActivitiesCount}
              <span className="text-base font-normal text-foreground/40"> / {passport.requiredActivities}</span>
            </p>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm">
            <p className="text-xs text-foreground/55">{t("status")}</p>
            <p
              className={`mt-1 inline-flex items-center gap-1.5 text-lg font-bold ${
                passport.passed ? "text-brand-emerald-600 dark:text-brand-emerald-400" : "text-amber-700 dark:text-amber-400"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${passport.passed ? "bg-brand-emerald-500" : "bg-amber-500"}`} />
              {passport.passed ? t("passed") : t("notPassed")}
            </p>
          </div>
        </div>
      )}

      {passport && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(passport.categoryHours).map(([cat, hrs]) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-surface px-3 py-1.5 text-xs text-foreground/65 shadow-sm"
            >
              {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
              <span className="font-semibold text-foreground">{hrs} ชม.</span>
            </span>
          ))}
        </div>
      )}

      <section className="rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground/70">{t("attendanceHistory")}</h2>
        <ul className="divide-y divide-foreground/5">
          {attendances.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 truncate text-foreground">{a.activity.title}</span>
              <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                a.status === "auto_approved" ? "text-brand-emerald-700 dark:text-brand-emerald-400" : a.status === "flagged" ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${ATTENDANCE_DOT[a.status]}`} />
                {ATTENDANCE_STATUS_LABELS[a.status]}
              </span>
            </li>
          ))}
          {attendances.length === 0 && <li className="py-3 text-sm text-foreground/45">{t("noAttendance")}</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground/70">{t("externalCreditRequests")}</h2>
        <ul className="divide-y divide-foreground/5">
          {combinedRequests.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 truncate text-foreground">{r.title}</span>
              <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                r.status === "pending" ? "text-amber-700 dark:text-amber-400" : r.status === "approved" ? "text-brand-emerald-700 dark:text-brand-emerald-400" : r.status === "rejected" ? "text-red-700 dark:text-red-400" : "text-foreground/55"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${REQUEST_DOT[r.status]}`} />
                {REQUEST_STATUS_LABELS[r.status]}
              </span>
            </li>
          ))}
          {combinedRequests.length === 0 && <li className="py-3 text-sm text-foreground/45">{t("noRequests")}</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground/70">{t("lateCheckinRequests")}</h2>
        <ul className="divide-y divide-foreground/5">
          {lateCheckInRequests.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 truncate text-foreground">{r.activity.title}</span>
              <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                r.status === "pending" ? "text-amber-700 dark:text-amber-400" : r.status === "approved" ? "text-brand-emerald-700 dark:text-brand-emerald-400" : r.status === "rejected" ? "text-red-700 dark:text-red-400" : "text-foreground/55"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${REQUEST_DOT[r.status]}`} />
                {REQUEST_STATUS_LABELS[r.status]}
              </span>
            </li>
          ))}
          {lateCheckInRequests.length === 0 && <li className="py-3 text-sm text-foreground/45">{t("noRequests")}</li>}
        </ul>
      </section>
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
