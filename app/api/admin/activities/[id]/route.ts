import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { activitySchema } from "@/lib/admin/activities";
import { parseCoverImageDataUrl } from "@/lib/admin/activity-cover";
import { parseThaiLocalDateTime } from "@/lib/admin/datetime";
import { notifyMany } from "@/lib/notifications/dispatch";
import { getEligibleStudentIds } from "@/lib/notifications/eligibility";
import { STORAGE_BUCKETS } from "@/lib/supabase/server";
import { getSignedUrl, removeFromBucket, uploadToBucket } from "@/lib/supabase/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { restrictions: true },
  });
  if (!activity) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

  const coverImageUrl = activity.coverImagePath
    ? await getSignedUrl(STORAGE_BUCKETS.activityCovers, activity.coverImagePath).catch(() => null)
    : null;

  return NextResponse.json({ activity: { ...activity, coverImageUrl } });
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
  const { restrictions, description, locationName, coverImageDataUrl, removeCoverImage, ...data } = parsed.data;

  const existing = await prisma.activity.findUnique({ where: { id }, select: { coverImagePath: true } });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  }

  let newCoverImagePath: string | null | undefined; // undefined = leave untouched
  if (coverImageDataUrl) {
    const cover = parseCoverImageDataUrl(coverImageDataUrl);
    if (!cover) {
      return NextResponse.json({ error: "ไฟล์รูปปกไม่ถูกต้อง กรุณาแนบรูปภาพใหม่" }, { status: 400 });
    }
    newCoverImagePath = `${crypto.randomUUID()}.${cover.extension}`;
    await uploadToBucket(STORAGE_BUCKETS.activityCovers, newCoverImagePath, cover.buffer, cover.contentType);
  } else if (removeCoverImage) {
    newCoverImagePath = null;
  }

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
          ...(newCoverImagePath !== undefined ? { coverImagePath: newCoverImagePath } : {}),
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

    // Old file is only orphaned once the new state is durably saved — clean
    // it up now that the transaction has committed, not before.
    if (newCoverImagePath !== undefined && existing.coverImagePath && existing.coverImagePath !== newCoverImagePath) {
      await removeFromBucket(STORAGE_BUCKETS.activityCovers, existing.coverImagePath).catch(() => {});
    }

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
    // The transaction never committed — the newly uploaded file (if any) is
    // orphaned, not the still-current one, so only clean up the new one.
    if (coverImageDataUrl && newCoverImagePath) {
      await removeFromBucket(STORAGE_BUCKETS.activityCovers, newCoverImagePath).catch(() => {});
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }, { status: 409 });
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
    const deleted = await prisma.activity.delete({ where: { id }, select: { coverImagePath: true } });
    if (deleted.coverImagePath) {
      await removeFromBucket(STORAGE_BUCKETS.activityCovers, deleted.coverImagePath).catch(() => {});
    }
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
