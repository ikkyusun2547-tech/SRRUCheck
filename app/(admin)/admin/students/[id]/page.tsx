import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPassportSummary } from "@/lib/passport/service";
import { CATEGORY_LABELS, ATTENDANCE_STATUS_LABELS, REQUEST_STATUS_LABELS } from "@/lib/labels";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          {[user.title, user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
        </h1>
        <p className="text-sm text-foreground/60">
          {user.studentId ?? "ไม่มีรหัสนักศึกษา"} · {user.email} · {user.faculty?.nameTh ?? "-"} /{" "}
          {user.major?.nameTh ?? "-"} · ปี {user.currentYear ?? "-"}
          {user.bannedAt && <span className="ml-2 text-red-600">(ถูกระงับบัญชี)</span>}
        </p>
      </div>

      {passport && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-foreground/10 p-3">
            <p className="text-xs text-foreground/60">ชั่วโมงสะสม</p>
            <p className="text-lg font-semibold">
              {passport.totalHours} / {passport.requiredHours}
            </p>
          </div>
          <div className="rounded-lg border border-foreground/10 p-3">
            <p className="text-xs text-foreground/60">จำนวนกิจกรรม</p>
            <p className="text-lg font-semibold">
              {passport.totalActivitiesCount} / {passport.requiredActivities}
            </p>
          </div>
          <div className="rounded-lg border border-foreground/10 p-3">
            <p className="text-xs text-foreground/60">สถานะ</p>
            <p className="text-lg font-semibold">{passport.passed ? "ผ่านเกณฑ์" : "ยังไม่ผ่าน"}</p>
          </div>
        </div>
      )}

      {passport && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.entries(passport.categoryHours).map(([cat, hrs]) => (
            <div key={cat} className="rounded-md border border-foreground/10 p-2 text-center text-xs">
              <p className="text-foreground/60">{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}</p>
              <p className="font-medium">{hrs} ชม.</p>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground/70">ประวัติเช็คชื่อ (ล่าสุด 20 รายการ)</h2>
        <ul className="space-y-1 text-sm">
          {attendances.map((a) => (
            <li key={a.id} className="flex justify-between border-b border-foreground/5 py-1">
              <span>{a.activity.title}</span>
              <span className="text-foreground/60">{ATTENDANCE_STATUS_LABELS[a.status]}</span>
            </li>
          ))}
          {attendances.length === 0 && <li className="text-foreground/50">ยังไม่มีการเช็คชื่อ</li>}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground/70">คำร้องกิจกรรมภายนอก/เทียบชั่วโมง</h2>
        <ul className="space-y-1 text-sm">
          {[...externalRequests, ...creditTransferRequests].map((r) => (
            <li key={r.id} className="flex justify-between border-b border-foreground/5 py-1">
              <span>{r.title}</span>
              <span className="text-foreground/60">{REQUEST_STATUS_LABELS[r.status]}</span>
            </li>
          ))}
          {externalRequests.length === 0 && creditTransferRequests.length === 0 && (
            <li className="text-foreground/50">ยังไม่มีคำร้อง</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground/70">คำร้องเช็คชื่อย้อนหลัง</h2>
        <ul className="space-y-1 text-sm">
          {lateCheckInRequests.map((r) => (
            <li key={r.id} className="flex justify-between border-b border-foreground/5 py-1">
              <span>{r.activity.title}</span>
              <span className="text-foreground/60">{REQUEST_STATUS_LABELS[r.status]}</span>
            </li>
          ))}
          {lateCheckInRequests.length === 0 && <li className="text-foreground/50">ยังไม่มีคำร้อง</li>}
        </ul>
      </section>
    </div>
  );
}
