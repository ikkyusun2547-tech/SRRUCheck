import ExcelJS from "exceljs";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { ATTENDANCE_STATUS_LABELS, FLAG_REASON_LABELS } from "@/lib/labels";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 403 });

  const { activityId } = await params;
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) return new Response("ไม่พบกิจกรรม", { status: 404 });

  const attendances = await prisma.attendance.findMany({
    where: { activityId },
    orderBy: { checkinTime: "asc" },
    include: { user: { select: { firstName: true, lastName: true, studentId: true, email: true } } },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance");
  sheet.columns = [
    { header: "รหัสนักศึกษา", key: "studentId", width: 15 },
    { header: "ชื่อ-นามสกุล", key: "name", width: 25 },
    { header: "อีเมล", key: "email", width: 25 },
    { header: "เวลาเช็คชื่อ", key: "checkinTime", width: 20 },
    { header: "วิธีเช็คชื่อ", key: "method", width: 15 },
    { header: "สถานะ", key: "status", width: 15 },
    { header: "เหตุผลที่ถูก flag", key: "flagReason", width: 30 },
    { header: "ระยะห่าง (ม.)", key: "distance", width: 12 },
  ];

  for (const a of attendances) {
    sheet.addRow({
      studentId: a.user.studentId ?? "",
      name: [a.user.firstName, a.user.lastName].filter(Boolean).join(" ") || a.user.email,
      email: a.user.email,
      checkinTime: a.checkinTime.toLocaleString("th-TH"),
      method: a.checkinMethod,
      status: ATTENDANCE_STATUS_LABELS[a.status],
      flagReason: a.flagReason
        ? a.flagReason
            .split(",")
            .map((r) => FLAG_REASON_LABELS[r] ?? r)
            .join(", ")
        : "",
      distance: a.distanceMeters != null ? Math.round(a.distanceMeters) : "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance-${activity.activityCode}.xlsx"`,
    },
  });
}
