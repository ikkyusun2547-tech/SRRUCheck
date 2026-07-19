import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS } from "@/lib/labels";

const STATUS_LABELS: Record<string, string> = { open: "เปิด", closed: "ปิด", cancelled: "ยกเลิก" };

export default async function AdminActivitiesPage() {
  const activities = await prisma.activity.findMany({
    orderBy: { startTime: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">จัดการกิจกรรม</h1>
        <Link
          href="/admin/activities/new"
          className="rounded-full bg-brand-emerald-500 px-4 py-2 text-sm font-medium text-white"
        >
          + สร้างกิจกรรมใหม่
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-foreground/10 text-foreground/60">
            <tr>
              <th className="py-2 pr-4">รหัส</th>
              <th className="py-2 pr-4">ชื่อกิจกรรม</th>
              <th className="py-2 pr-4">หมวดหมู่</th>
              <th className="py-2 pr-4">เริ่ม</th>
              <th className="py-2 pr-4">สถานะ</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-b border-foreground/5">
                <td className="py-2 pr-4">{a.activityCode}</td>
                <td className="py-2 pr-4">{a.title}</td>
                <td className="py-2 pr-4">{CATEGORY_LABELS[a.activityCategory]}</td>
                <td className="py-2 pr-4">{a.startTime.toLocaleString("th-TH")}</td>
                <td className="py-2 pr-4">{STATUS_LABELS[a.status]}</td>
                <td className="py-2 pr-4">
                  <Link href={`/admin/activities/${a.id}/edit`} className="text-brand-purple-600">
                    แก้ไข
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {activities.length === 0 && (
          <p className="py-4 text-sm text-foreground/50">ยังไม่มีกิจกรรม</p>
        )}
      </div>
    </div>
  );
}
