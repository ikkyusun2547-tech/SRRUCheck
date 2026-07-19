import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { activitySchema } from "@/lib/admin/activities";
import { parseThaiLocalDateTime } from "@/lib/admin/datetime";

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
  const { restrictions, description, locationName, ...data } = parsed.data;

  try {
    const activity = await prisma.$transaction(async (tx) => {
      const created = await tx.activity.create({
        data: {
          ...data,
          description: description || null,
          locationName: locationName || null,
          locationLat: data.locationLat ?? null,
          locationLng: data.locationLng ?? null,
          allowedRadius: data.allowedRadius ?? null,
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

    await logAudit({
      actorId: session.user.id,
      action: "activity.create",
      targetType: "Activity",
      targetId: activity.id,
      changes: { title: activity.title, activityCode: activity.activityCode },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "รหัสกิจกรรมนี้ถูกใช้แล้ว กรุณาใช้รหัสอื่น" }, { status: 409 });
    }
    throw err;
  }
}
