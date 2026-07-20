import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS } from "@/lib/labels";
import { CATEGORY_DOT, CATEGORY_TEXT } from "@/lib/admin/category-colors";
import { EmptyState } from "@/components/admin/empty-state";
import { CalendarIcon, QrIcon } from "@/components/student/nav-icons";

export default async function ActivitiesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activities = await prisma.activity.findMany({
    where: { status: "open" },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      title: true,
      activityCode: true,
      activityCategory: true,
      checkinMethod: true,
      creditHours: true,
      locationName: true,
      startTime: true,
      endTime: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e0b47] via-brand-purple-800 to-brand-purple-600 px-7 py-9 text-white shadow-xl shadow-brand-purple-950/30 sm:px-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-[90px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-brand-emerald-400/25 blur-[90px]" />
        <div className="relative">
          <p className="text-sm font-medium text-white/70">กองพัฒนานักศึกษา</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">กิจกรรมที่เปิดรับเช็คชื่อ</h1>
          <p className="mt-1 text-sm text-white/70">รายการกิจกรรมทั้งหมดที่เปิดรับเช็คชื่ออยู่ตอนนี้</p>
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm">
              <span className="text-base font-bold tabular-nums">{activities.length}</span>
              <span className="text-xs text-white/80">กิจกรรมที่เปิดอยู่</span>
            </span>
          </div>
        </div>
      </div>

      {activities.length === 0 ? (
        <EmptyState icon={<CalendarIcon className="h-[22px] w-[22px]" />} message="ไม่มีกิจกรรมที่เปิดรับเช็คชื่ออยู่ในขณะนี้" />
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {activities.map((a) => (
            <li key={a.id} className="rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400">
                  <CalendarIcon />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="min-w-0 truncate font-semibold text-foreground">{a.title}</p>
                    <span className="shrink-0 font-mono text-[11px] text-foreground/35">{a.activityCode}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/50">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${CATEGORY_TEXT[a.activityCategory]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[a.activityCategory]}`} />
                      {CATEGORY_LABELS[a.activityCategory]}
                    </span>
                    <Dot />
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-foreground/30" />
                      {a.startTime.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    <Dot />
                    <span>{a.creditHours} ชม.</span>
                    {a.locationName && (
                      <>
                        <Dot />
                        <span className="min-w-0 truncate">{a.locationName}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {a.checkinMethod === "self_report" ? (
                    <a
                      href={`/checkin?activityId=${a.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600"
                    >
                      แนบหลักฐาน
                    </a>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/60">
                        <QrIcon className="h-3.5 w-3.5" />
                        สแกน QR หน้างาน
                      </span>
                      <a
                        href={`/api/qr-token/printed/${a.id}?download=1`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/65 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600"
                      >
                        QR สำรอง
                      </a>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Dot() {
  return <span className="h-0.5 w-0.5 rounded-full bg-foreground/25" aria-hidden />;
}
