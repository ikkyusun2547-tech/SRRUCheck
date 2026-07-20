import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, faculties] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
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
        role: true,
        faculty: { select: { nameTh: true, nameEn: true } },
        major: { select: { nameTh: true, nameEn: true } },
      },
    }),
    prisma.faculty.findMany({
      orderBy: { nameTh: "asc" },
      include: { majors: { orderBy: { nameTh: "asc" } } },
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <ProfileClient user={user} faculties={faculties} />
    </div>
  );
}
