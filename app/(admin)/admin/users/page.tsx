import { prisma } from "@/lib/prisma";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { nameTh: "asc" },
    include: { majors: { orderBy: { nameTh: "asc" } } },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">จัดการผู้ใช้/สิทธิ์</h1>
      <UsersClient faculties={faculties} />
    </div>
  );
}
