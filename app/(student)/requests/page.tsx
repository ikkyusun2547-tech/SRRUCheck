import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { RequestsClient } from "./requests-client";

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const closedActivities = await prisma.activity.findMany({
    where: { status: "closed" },
    orderBy: { endTime: "desc" },
    take: 50,
    select: { id: true, title: true, activityCode: true },
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e0b47] via-brand-purple-800 to-brand-purple-600 px-7 py-9 text-white shadow-xl shadow-brand-purple-950/30 sm:px-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-[90px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-brand-emerald-400/25 blur-[90px]" />
        <div className="relative">
          <p className="text-sm font-medium text-white/70">กองพัฒนานักศึกษา</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">คำร้อง</h1>
          <p className="mt-1 text-sm text-white/70">ยื่นคำร้องกิจกรรมภายนอก เทียบชั่วโมงผู้นำ หรือเช็คชื่อย้อนหลัง</p>
        </div>
      </div>

      <RequestsClient closedActivities={closedActivities} />
    </div>
  );
}
