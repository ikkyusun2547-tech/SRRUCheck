import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { facultySchema } from "@/lib/admin/faculties";

// GET routes with no dynamic path segment default toward static
// optimization in Next.js — force dynamic so session/auth-scoped data is
// never cached or served stale across users.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const faculties = await prisma.faculty.findMany({
    orderBy: { nameTh: "asc" },
    include: { majors: { orderBy: { nameTh: "asc" } } },
  });
  return NextResponse.json({ faculties });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = facultySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const faculty = await prisma.faculty.create({ data: parsed.data });
  await logAudit({
    actorId: session.user.id,
    action: "faculty.create",
    targetType: "Faculty",
    targetId: faculty.id,
    changes: parsed.data,
  });

  return NextResponse.json({ faculty }, { status: 201 });
}
