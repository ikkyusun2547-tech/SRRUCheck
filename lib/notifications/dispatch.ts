import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
};

/**
 * Fire-and-isolate: each recipient's write is wrapped independently so one
 * failure (bad data, transient DB error) never blocks or drops the rest.
 * This is in-app notification only for now — email/push dispatch is phase 5,
 * but callers (e.g. bulk-approve) can already rely on this never blocking
 * the request that triggered it.
 */
export async function notifyMany(
  notifications: NotificationInput[]
): Promise<{ sent: number; failed: number }> {
  const outcomes = await Promise.allSettled(
    notifications.map((n) =>
      prisma.notification.create({
        data: { userId: n.userId, type: n.type, title: n.title, body: n.body, data: n.data },
      })
    )
  );
  const failed = outcomes.filter((o) => o.status === "rejected").length;
  return { sent: outcomes.length - failed, failed };
}
