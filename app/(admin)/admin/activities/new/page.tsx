import { prisma } from "@/lib/prisma";
import { ActivityForm } from "@/components/admin/activity-form";

export default async function NewActivityPage() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { nameTh: "asc" },
    include: { majors: { orderBy: { nameTh: "asc" } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">สร้างกิจกรรมใหม่</h1>
      <ActivityForm faculties={faculties} />
    </div>
  );
}
