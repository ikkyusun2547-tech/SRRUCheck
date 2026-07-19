import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "./email";

export type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
};

/**
 * Fire-and-isolate: each recipient's in-app write (the source of truth for
 * `sent`/`failed`) is wrapped independently so one failure never blocks or
 * drops the rest — email is sent alongside as a best-effort secondary
 * channel and never affects that count or another recipient's delivery.
 */
export async function notifyMany(
  notifications: NotificationInput[]
): Promise<{ sent: number; failed: number }> {
  if (notifications.length === 0) return { sent: 0, failed: 0 };

  const userIds = [...new Set(notifications.map((n) => n.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  const outcomes = await Promise.allSettled(
    notifications.map(async (n) => {
      await prisma.notification.create({
        data: { userId: n.userId, type: n.type, title: n.title, body: n.body, data: n.data },
      });

      const email = emailByUserId.get(n.userId);
      if (email) {
        // Awaited (not fire-and-forget): a serverless function can freeze
        // execution right after the response is sent, silently dropping
        // any unawaited work still in flight. Still fully isolated —
        // this is one recipient's own branch of the allSettled array, and
        // sendEmail() never throws (it catches its own errors), so a slow
        // or failing send here can't affect this recipient's in-app
        // notification (already created above) or any other recipient.
        await sendEmail(email, n.title, n.body ?? n.title).catch(() => {});
      }
    })
  );
  const failed = outcomes.filter((o) => o.status === "rejected").length;
  return { sent: outcomes.length - failed, failed };
}
