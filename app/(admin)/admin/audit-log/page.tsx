import Link from "next/link";
import { getAuditLogPage } from "@/lib/audit/log";

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const { items, total, totalPages } = await getAuditLogPage(page, 30);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Audit Log</h1>
      <p className="mb-4 text-sm text-foreground/60">ทั้งหมด {total} รายการ</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-foreground/10 text-foreground/60">
            <tr>
              <th className="py-2 pr-4">เวลา</th>
              <th className="py-2 pr-4">ผู้ทำรายการ</th>
              <th className="py-2 pr-4">การกระทำ</th>
              <th className="py-2 pr-4">เป้าหมาย</th>
              <th className="py-2 pr-4">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {items.map((log) => (
              <tr key={log.id} className="border-b border-foreground/5 align-top">
                <td className="py-2 pr-4 whitespace-nowrap">{log.createdAt.toLocaleString("th-TH")}</td>
                <td className="py-2 pr-4">
                  {log.actor
                    ? [log.actor.firstName, log.actor.lastName].filter(Boolean).join(" ") ||
                      log.actor.email
                    : "ระบบ"}
                </td>
                <td className="py-2 pr-4">{log.action}</td>
                <td className="py-2 pr-4">
                  {log.targetType}
                  {log.targetId ? ` #${log.targetId.slice(-6)}` : ""}
                </td>
                <td className="py-2 pr-4 max-w-xs truncate text-xs text-foreground/60">
                  {log.changes ? JSON.stringify(log.changes) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="py-4 text-sm text-foreground/50">ยังไม่มี audit log</p>}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <Link
            href={`/admin/audit-log?page=${Math.max(1, page - 1)}`}
            className="rounded-md border border-foreground/20 px-3 py-1"
          >
            ก่อนหน้า
          </Link>
          <span>
            หน้า {page} / {totalPages}
          </span>
          <Link
            href={`/admin/audit-log?page=${Math.min(totalPages, page + 1)}`}
            className="rounded-md border border-foreground/20 px-3 py-1"
          >
            ถัดไป
          </Link>
        </div>
      )}
    </div>
  );
}
