import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  changes?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      changes: params.changes,
    },
  });
}

/** Paginated at the database query (LIMIT/OFFSET) — never fetch-all-then-slice,
 * since this table only grows. */
export async function getAuditLogPage(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { actor: { select: { email: true, firstName: true, lastName: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
