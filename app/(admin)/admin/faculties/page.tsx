import { prisma } from "@/lib/prisma";
import { FacultiesClient } from "./faculties-client";

export default async function AdminFacultiesPage() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { nameTh: "asc" },
    include: { majors: { orderBy: { nameTh: "asc" } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">จัดการคณะ/สาขา</h1>
      <FacultiesClient initialFaculties={faculties} />
    </div>
  );
}
