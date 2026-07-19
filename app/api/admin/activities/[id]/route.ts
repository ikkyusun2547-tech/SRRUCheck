import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { activitySchema } from "@/lib/admin/activities";
import { parseThaiLocalDateTime } from "@/lib/admin/datetime";
import { notifyMany } from "@/lib/notifications/dispatch";
import { getEligibleStudentIds } from "@/lib/notifications/eligibility";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { restrictions: true },
  });
  if (!activity) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  return NextResponse.json({ activity });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = activitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
  const { restrictions, description, locationName, ...data } = parsed.data;

  try {
    const activity = await prisma.$transaction(async (tx) => {
      const updated = await tx.activity.update({
        where: { id },
        data: {
          ...data,
          description: description || null,
          locationName: locationName || null,
          locationLat: data.locationLat ?? null,
          locationLng: data.locationLng ?? null,
          allowedRadius: data.allowedRadius ?? null,
          startTime: parseThaiLocalDateTime(data.startTime),
          endTime: parseThaiLocalDateTime(data.endTime),
          importantUpdatedAt: new Date(),
        },
      });
      await tx.activityRestriction.deleteMany({ where: { activityId: id } });
      if (restrictions.length > 0) {
        await tx.activityRestriction.createMany({
          data: restrictions.map((r) => ({
            activityId: id,
            facultyId: r.facultyId || null,
            majorId: r.majorId || null,
            yearLevel: r.yearLevel ?? null,
          })),
        });
      }
      return updated;
    });

    await logAudit({
      actorId: session.user.id,
      action: "activity.update",
      targetType: "Activity",
      targetId: id,
      changes: { title: activity.title, status: activity.status },
    });

    // Notify anyone currently eligible plus anyone who already checked in
    // (their eligibility may have changed along with the restrictions edit,
    // but they still need to know the activity they attended/plan to was
    // just edited).
    const [eligibleIds, attendees] = await Promise.all([
      getEligibleStudentIds(id),
      prisma.attendance.findMany({ where: { activityId: id }, select: { userId: true } }),
    ]);
    const recipientIds = [...new Set([...eligibleIds, ...attendees.map((a) => a.userId)])];
    await notifyMany(
      recipientIds.map((userId) => ({
        userId,
        type: "activity_updated",
        title: `กิจกรรม "${activity.title}" มีการแก้ไข`,
        body: "รายละเอียดกิจกรรมมีการเปลี่ยนแปลง กรุณาตรวจสอบอีกครั้ง",
        data: { activityId: id },
      }))
    );

    return NextResponse.json({ activity });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json({ error: "รหัสกิจกรรมนี้ถูกใช้แล้ว กรุณาใช้รหัสอื่น" }, { status: 409 });
      }
      if (err.code === "P2025") {
        return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
      }
    }
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    await prisma.activity.delete({ where: { id } });
    await logAudit({
      actorId: session.user.id,
      action: "activity.delete",
      targetType: "Activity",
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
    }
    throw err;
  }
}
