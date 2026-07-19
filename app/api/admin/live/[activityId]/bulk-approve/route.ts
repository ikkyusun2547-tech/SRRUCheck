import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { notifyMany } from "@/lib/notifications/dispatch";

// Notifies every currently auto_approved attendee for this activity in one
// click. Nothing here can block or fail the request as a whole — each
// recipient's notification write is isolated (see notifyMany) — matching
// the earlier incident where a synchronous bulk mail send timed out.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { activityId } = await params;
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

  const attendances = await prisma.attendance.findMany({
    where: { activityId, status: "auto_approved" },
    select: { id: true, userId: true },
  });

  // Skip attendees already notified for this activity (idempotent re-clicks).
  const alreadyNotified = await prisma.notification.findMany({
    where: {
      type: "attendance_approved",
      userId: { in: attendances.map((a) => a.userId) },
    },
    select: { userId: true, data: true },
  });
  const notifiedAttendanceIds = new Set(
    alreadyNotified
      .map((n) => (n.data as { attendanceId?: string } | null)?.attendanceId)
      .filter(Boolean)
  );

  const toNotify = attendances.filter((a) => !notifiedAttendanceIds.has(a.id));

  const { sent, failed } = await notifyMany(
    toNotify.map((a) => ({
      userId: a.userId,
      type: "attendance_approved",
      title: `เช็คชื่อกิจกรรม "${activity.title}" ได้รับการอนุมัติ`,
      data: { attendanceId: a.id, activityId },
    }))
  );

  await logAudit({
    actorId: session.user.id,
    action: "attendance.bulkApproveNotify",
    targetType: "Activity",
    targetId: activityId,
    changes: { notified: sent, failed, alreadyNotified: attendances.length - toNotify.length },
  });

  return NextResponse.json({ total: attendances.length, notified: sent, failed });
}
