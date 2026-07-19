import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { userManageSchema } from "@/lib/admin/students";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = userManageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
  const { role, banned, facultyId, majorId } = parsed.data;

  if (id === session.user.id && (role === "student" || banned === true)) {
    return NextResponse.json(
      { error: "ไม่สามารถลดสิทธิ์หรือระงับบัญชีตัวเองได้" },
      { status: 400 }
    );
  }

  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(banned !== undefined ? { bannedAt: banned ? new Date() : null } : {}),
        ...(facultyId !== undefined ? { facultyId } : {}),
        ...(majorId !== undefined ? { majorId } : {}),
      },
    });

    await logAudit({
      actorId: session.user.id,
      action: "user.manage",
      targetType: "User",
      targetId: id,
      changes: {
        before: { role: before.role, bannedAt: before.bannedAt, facultyId: before.facultyId, majorId: before.majorId },
        after: { role: updated.role, bannedAt: updated.bannedAt, facultyId: updated.facultyId, majorId: updated.majorId },
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }
    throw err;
  }
}
