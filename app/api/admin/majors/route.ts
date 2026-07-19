import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { majorSchema } from "@/lib/admin/faculties";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = majorSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const faculty = await prisma.faculty.findUnique({ where: { id: parsed.data.facultyId } });
  if (!faculty) {
    return NextResponse.json({ error: "ไม่พบคณะที่เลือก" }, { status: 400 });
  }

  const major = await prisma.major.create({ data: parsed.data });
  await logAudit({
    actorId: session.user.id,
    action: "major.create",
    targetType: "Major",
    targetId: major.id,
    changes: parsed.data,
  });

  return NextResponse.json({ major }, { status: 201 });
}
