import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { activitySchema } from "@/lib/admin/activities";
import { nextActivityCodeCandidate } from "@/lib/admin/activity-code";
import { parseCoverImageDataUrl } from "@/lib/admin/activity-cover";
import { parseThaiLocalDateTime } from "@/lib/admin/datetime";
import { notifyMany } from "@/lib/notifications/dispatch";
import { getEligibleStudentIds } from "@/lib/notifications/eligibility";
import { STORAGE_BUCKETS } from "@/lib/supabase/server";
import { removeFromBucket, uploadToBucket } from "@/lib/supabase/storage";

const MAX_CODE_ATTEMPTS = 5;

// GET routes with no dynamic path segment default toward static
// optimization in Next.js — force dynamic so session/auth-scoped data is
// never cached or served stale across users.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const activities = await prisma.activity.findMany({
    where: status ? { status: status as "open" | "closed" | "cancelled" } : undefined,
    orderBy: { startTime: "desc" },
    take: 200,
  });
  return NextResponse.json({ activities });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = activitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
  // activityCode is server-generated (see lib/admin/activity-code.ts) and
  // removeCoverImage is meaningless for a brand-new activity — both
  // excluded from `data` so they can't leak into the Prisma create() call
  // below as stray/incorrect fields.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { restrictions, description, locationName, coverImageDataUrl, removeCoverImage, activityCode: _ignored, ...data } =
    parsed.data;

  let coverImagePath: string | null = null;
  if (coverImageDataUrl) {
    const cover = parseCoverImageDataUrl(coverImageDataUrl);
    if (!cover) {
      return NextResponse.json({ error: "ไฟล์รูปปกไม่ถูกต้อง กรุณาแนบรูปภาพใหม่" }, { status: 400 });
    }
    // Named independently of activityCode (generated further below, possibly
    // after a retry) so the upload doesn't need to wait on that.
    coverImagePath = `${crypto.randomUUID()}.${cover.extension}`;
    await uploadToBucket(STORAGE_BUCKETS.activityCovers, coverImagePath, cover.buffer, cover.contentType);
  }

  try {
    let activity: Awaited<ReturnType<typeof prisma.activity.create>> | undefined;
    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
      const activityCode = await nextActivityCodeCandidate(
        data.activityCategory,
        data.academicYear,
        data.level,
        attempt
      );
      try {
        activity = await prisma.$transaction(async (tx) => {
          const created = await tx.activity.create({
            data: {
              ...data,
              description: description || null,
              locationName: locationName || null,
              locationLat: data.locationLat ?? null,
              locationLng: data.locationLng ?? null,
              allowedRadius: data.allowedRadius ?? null,
              coverImagePath,
              activityCode,
              startTime: parseThaiLocalDateTime(data.startTime),
              endTime: parseThaiLocalDateTime(data.endTime),
            },
          });
          if (restrictions.length > 0) {
            await tx.activityRestriction.createMany({
              data: restrictions.map((r) => ({
                activityId: created.id,
                facultyId: r.facultyId || null,
                majorId: r.majorId || null,
                yearLevel: r.yearLevel ?? null,
              })),
            });
          }
          return created;
        });
        break;
      } catch (err) {
        const isCodeCollision = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!isCodeCollision || attempt === MAX_CODE_ATTEMPTS) throw err;
        // Another activity was created concurrently and claimed this exact
        // sequence number — retry with the next one.
      }
    }
    if (!activity) throw new Error("ไม่สามารถสร้างรหัสกิจกรรมได้");

    await logAudit({
      actorId: session.user.id,
      action: "activity.create",
      targetType: "Activity",
      targetId: activity.id,
      changes: { title: activity.title, activityCode: activity.activityCode },
    });

    if (activity.status === "open") {
      const eligibleIds = await getEligibleStudentIds(activity.id);
      await notifyMany(
        eligibleIds.map((userId) => ({
          userId,
          type: "activity_new",
          title: `กิจกรรมใหม่: ${activity.title}`,
          body: "มีกิจกรรมใหม่ที่ตรงกับสิทธิ์ของคุณ ดูรายละเอียดและเช็คชื่อได้แล้ว",
          data: { activityId: activity.id },
        }))
      );
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err) {
    if (coverImagePath) {
      await removeFromBucket(STORAGE_BUCKETS.activityCovers, coverImagePath).catch(() => {});
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "สร้างรหัสกิจกรรมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 409 });
    }
    throw err;
  }
}
