import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { facultySchema } from "@/lib/admin/faculties";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = facultySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  try {
    const faculty = await prisma.faculty.update({ where: { id }, data: parsed.data });
    await logAudit({
      actorId: session.user.id,
      action: "faculty.update",
      targetType: "Faculty",
      targetId: id,
      changes: parsed.data,
    });
    return NextResponse.json({ faculty });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "ไม่พบคณะนี้" }, { status: 404 });
    }
    throw err;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    await prisma.faculty.delete({ where: { id } });
    await logAudit({
      actorId: session.user.id,
      action: "faculty.delete",
      targetType: "Faculty",
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") return NextResponse.json({ error: "ไม่พบคณะนี้" }, { status: 404 });
      if (err.code === "P2003" || err.code === "P2014") {
        return NextResponse.json(
          { error: "ลบไม่ได้ เพราะยังมีนักศึกษาหรือสาขาผูกกับคณะนี้อยู่" },
          { status: 409 }
        );
      }
    }
    throw err;
  }
}
