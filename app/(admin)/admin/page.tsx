import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const [
    studentCount,
    openActivityCount,
    pendingExternal,
    pendingCreditTransfer,
    pendingLateCheckIn,
    flaggedAttendanceCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "student" } }),
    prisma.activity.count({ where: { status: "open" } }),
    prisma.externalActivityRequest.count({ where: { status: "pending" } }),
    prisma.creditTransferRequest.count({ where: { status: "pending" } }),
    prisma.lateCheckInRequest.count({ where: { status: "pending" } }),
    prisma.attendance.count({ where: { status: "flagged" } }),
  ]);

  const pendingRequests = pendingExternal + pendingCreditTransfer + pendingLateCheckIn;

  const cards = [
    { label: "นักศึกษาทั้งหมด", value: studentCount, href: "/admin/students" },
    { label: "กิจกรรมที่เปิดอยู่", value: openActivityCount, href: "/admin/activities" },
    { label: "คำร้องรอดำเนินการ", value: pendingRequests, href: "/admin/requests" },
    { label: "เช็คชื่อที่ถูก flag", value: flaggedAttendanceCount, href: "/admin/live" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">ภาพรวมระบบ</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-foreground/10 p-4 transition-colors hover:border-brand-purple-600/40"
          >
            <p className="text-sm text-foreground/60">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
