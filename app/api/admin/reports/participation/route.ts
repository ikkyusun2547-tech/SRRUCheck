import ExcelJS from "exceljs";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS } from "@/lib/labels";

// GET routes with no dynamic path segment default toward static
// optimization in Next.js — force dynamic so session/auth-scoped data is
// never cached or served stale across users.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 403 });

  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const activities = await prisma.activity.findMany({
    where: {
      ...(startDate ? { startTime: { gte: new Date(startDate) } } : {}),
      ...(endDate ? { endTime: { lte: new Date(endDate) } } : {}),
    },
    orderBy: { startTime: "asc" },
    include: {
      attendances: {
        where: { status: "auto_approved" },
        include: { user: { include: { faculty: true } } },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();

  const byActivity = workbook.addWorksheet("ตามกิจกรรม");
  byActivity.columns = [
    { header: "รหัสกิจกรรม", key: "code", width: 15 },
    { header: "ชื่อกิจกรรม", key: "title", width: 30 },
    { header: "หมวดหมู่", key: "category", width: 20 },
    { header: "วันที่", key: "date", width: 15 },
    { header: "จำนวนผู้เช็คชื่อสำเร็จ", key: "count", width: 18 },
  ];
  for (const a of activities) {
    byActivity.addRow({
      code: a.activityCode,
      title: a.title,
      category: CATEGORY_LABELS[a.activityCategory],
      date: a.startTime.toLocaleDateString("th-TH"),
      count: a.attendances.length,
    });
  }

  const facultyCounts = new Map<string, { name: string; count: number; students: Set<string> }>();
  for (const a of activities) {
    for (const att of a.attendances) {
      const facultyName = att.user.faculty?.nameTh ?? "ไม่ระบุคณะ";
      const entry = facultyCounts.get(facultyName) ?? { name: facultyName, count: 0, students: new Set() };
      entry.count += 1;
      entry.students.add(att.userId);
      facultyCounts.set(facultyName, entry);
    }
  }

  const byFaculty = workbook.addWorksheet("ตามคณะ");
  byFaculty.columns = [
    { header: "คณะ", key: "faculty", width: 30 },
    { header: "จำนวนนักศึกษาที่เข้าร่วม (unique)", key: "students", width: 25 },
    { header: "จำนวนครั้งที่เช็คชื่อสำเร็จรวม", key: "count", width: 25 },
  ];
  for (const entry of facultyCounts.values()) {
    byFaculty.addRow({ faculty: entry.name, students: entry.students.size, count: entry.count });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="participation-report.xlsx"`,
    },
  });
}
