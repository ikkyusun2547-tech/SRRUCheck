"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth, unstable_update } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema, type ProfileInput } from "@/lib/validation/profile";

export async function submitProfile(input: ProfileInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  }
  const data = parsed.data;

  const major = await prisma.major.findUnique({ where: { id: data.majorId } });
  if (!major || major.facultyId !== data.facultyId) {
    throw new Error("สาขาที่เลือกไม่ตรงกับคณะ กรุณาเลือกใหม่");
  }

  try {
    await prisma.user.update({
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
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("รหัสนักศึกษานี้ถูกใช้ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง");
    }
    throw err;
  }

  // JWT sessions don't auto-refresh on a DB write — push the updated
  // profileCompleted flag into the session cookie now, otherwise the
  // middleware's stale token bounces the user straight back here.
  await unstable_update({});

  redirect("/dashboard");
}
