import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation/profile";

// REST port of app/setup-profile/actions.ts's submitProfile Server Action
// — mobile has no equivalent to Server Actions, so this exposes the same
// validation (profileSchema, unchanged) and update logic over HTTP. Unlike
// the web flow (one-time-only, redirects to /dashboard, refreshes the
// session cookie via unstable_update), this is a plain read/write pair
// mobile can call both for first-time setup and to edit an already-
// completed profile later — the web has no such edit UI yet, but nothing
// here prevents re-submission.
export const dynamic = "force-dynamic";

const PROFILE_SELECT = {
  id: true,
  email: true,
  title: true,
  firstName: true,
  lastName: true,
  studentId: true,
  enrollmentYear: true,
  currentYear: true,
  programType: true,
  facultyId: true,
  majorId: true,
  profileCompleted: true,
  role: true,
} satisfies Prisma.UserSelect;

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: PROFILE_SELECT,
  });
  if (!user) {
    return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const major = await prisma.major.findUnique({ where: { id: data.majorId } });
  if (!major || major.facultyId !== data.facultyId) {
    return NextResponse.json({ error: "สาขาที่เลือกไม่ตรงกับคณะ กรุณาเลือกใหม่" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        title: data.title,
        firstName: data.firstName,
        lastName: data.lastName,
        studentId: data.studentId,
        enrollmentYear: data.enrollmentYear,
        currentYear: data.currentYear,
        programType: data.programType,
        facultyId: data.facultyId,
        majorId: data.majorId,
        profileCompleted: true,
      },
      select: PROFILE_SELECT,
    });
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "รหัสนักศึกษานี้ถูกใช้ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง" },
        { status: 409 }
      );
    }
    throw err;
  }
}
