import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyMany } from "@/lib/notifications/dispatch";
import { getEligibleStudentIds } from "@/lib/notifications/eligibility";

export const dynamic = "force-dynamic";

// Triggered by Vercel Cron (see vercel.json) every hour. Vercel automatically
// sends `Authorization: Bearer <CRON_SECRET>` when the CRON_SECRET env var is
// set on the project — this checks that header so nobody else can hit it.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const endedActivities = await prisma.activity.findMany({
    where: { status: "open", endTime: { lt: now } },
  });

  let notifiedTotal = 0;

  for (const activity of endedActivities) {
    const eligibleIds = await getEligibleStudentIds(activity.id);

    const attended = await prisma.attendance.findMany({
      where: { activityId: activity.id, userId: { in: eligibleIds } },
      select: { userId: true },
    });
    const attendedSet = new Set(attended.map((a) => a.userId));
    const missedIds = eligibleIds.filter((id) => !attendedSet.has(id));

    await prisma.activity.update({ where: { id: activity.id }, data: { status: "closed" } });

    const { sent } = await notifyMany(
      missedIds.map((userId) => ({
        userId,
        type: "activity_missed",
        title: `พลาดกิจกรรม "${activity.title}"`,
        body: "กิจกรรมนี้ปิดรับเช็คชื่อแล้วโดยไม่มีการเช็คชื่อของคุณ หากมีเหตุผลสามารถยื่นคำร้องเช็คชื่อย้อนหลังได้ที่หน้าคำร้อง",
        data: { activityId: activity.id },
      }))
    );
    notifiedTotal += sent;
  }

  return NextResponse.json({ closed: endedActivities.length, notified: notifiedTotal });
}
