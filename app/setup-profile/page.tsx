import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";

export default async function SetupProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.profileCompleted) {
    redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
  }

  const [faculties, majors] = await Promise.all([
    prisma.faculty.findMany({ orderBy: { nameTh: "asc" } }),
    prisma.major.findMany({ orderBy: { nameTh: "asc" } }),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold">กรอกโปรไฟล์ครั้งแรก</h1>
        <p className="mt-2 max-w-md text-foreground/70">
          กรอกข้อมูลให้ครบก่อนเริ่มใช้งานระบบ
        </p>
      </div>
      <ProfileForm faculties={faculties} majors={majors} defaultEmail={session.user.email ?? ""} />
    </div>
  );
}
