import { prisma } from "@/lib/prisma";
import { AnnouncementsClient } from "./announcements-client";

export default async function AdminAnnouncementsPage() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { nameTh: "asc" },
    include: { majors: { orderBy: { nameTh: "asc" } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">ประกาศ</h1>
      <AnnouncementsClient faculties={faculties} />
    </div>
  );
}
