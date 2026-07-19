import { prisma } from "@/lib/prisma";
import { StudentsClient } from "./students-client";

export default async function AdminStudentsPage() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { nameTh: "asc" },
    include: { majors: { orderBy: { nameTh: "asc" } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">ข้อมูลนักศึกษาในระบบ</h1>
      <StudentsClient faculties={faculties} />
    </div>
  );
}
