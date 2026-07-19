import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LiveQrDisplay } from "@/components/checkin/live-qr-display";

export default async function AdminLivePage({
  searchParams,
}: {
  searchParams: Promise<{ activityId?: string }>;
}) {
  const { activityId } = await searchParams;

  const activities = await prisma.activity.findMany({
    where: { status: "open", checkinMethod: "realtime" },
    orderBy: { startTime: "asc" },
    select: { id: true, title: true, activityCode: true },
  });

  const selected = activityId ? activities.find((a) => a.id === activityId) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Live Event Control</h1>
        <p className="mt-1 text-sm text-foreground/60">
          QR หมุนรหัสสำหรับเช็คชื่อสดหน้างาน — ตารางผู้เช็คชื่อ, bulk/force approve และ export
          มาในเฟส 4
        </p>
      </div>

      {activities.length === 0 && (
        <p className="text-sm text-foreground/60">ไม่มีกิจกรรมแบบ realtime ที่เปิดอยู่ตอนนี้</p>
      )}

      <div className="flex flex-wrap gap-2">
        {activities.map((a) => (
          <Link
            key={a.id}
            href={`/admin/live?activityId=${a.id}`}
            className={`rounded-full px-4 py-1.5 text-sm ${
              a.id === activityId
                ? "bg-brand-purple-600 text-white"
                : "border border-foreground/20"
            }`}
          >
            {a.title}
          </Link>
        ))}
      </div>

      {selected && (
        <div>
          <h2 className="mb-3 text-center text-lg font-medium">{selected.title}</h2>
          <LiveQrDisplay activityId={selected.id} />
        </div>
      )}
    </div>
  );
}
