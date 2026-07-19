import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { notifyMany } from "@/lib/notifications/dispatch";

const bodySchema = z.object({ attendanceIds: z.array(z.string()).min(1) });

// For cases like a building-wide GPS inaccuracy — admin overrides selected
// flagged check-ins to approved, regardless of why they were flagged.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { activityId } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

  const targets = await prisma.attendance.findMany({
    where: { id: { in: parsed.data.attendanceIds }, activityId },
    select: { id: true, userId: true },
  });

  await prisma.attendance.updateMany({
    where: { id: { in: targets.map((t) => t.id) } },
    data: { status: "auto_approved", flagReason: null, rejectReason: null },
  });

  await logAudit({
    actorId: session.user.id,
    action: "attendance.forceApprove",
    targetType: "Activity",
    targetId: activityId,
    changes: { attendanceIds: targets.map((t) => t.id) },
  });

  const { sent, failed } = await notifyMany(
    targets.map((t) => ({
      userId: t.userId,
      type: "attendance_approved",
      title: `เช็คชื่อกิจกรรม "${activity.title}" ได้รับการอนุมัติ (โดยเจ้าหน้าที่)`,
      data: { attendanceId: t.id, activityId },
    }))
  );

  return NextResponse.json({ approved: targets.length, notified: sent, failed });
}
