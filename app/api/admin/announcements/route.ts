import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { notifyMany } from "@/lib/notifications/dispatch";
import { announcementSchema } from "@/lib/admin/announcements";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = announcementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
  const { title, body, facultyId, majorId, currentYear } = parsed.data;

  const recipients = await prisma.user.findMany({
    where: {
      role: "student",
      ...(facultyId ? { facultyId } : {}),
      ...(majorId ? { majorId } : {}),
      ...(currentYear ? { currentYear } : {}),
    },
    select: { id: true },
  });

  const { sent, failed } = await notifyMany(
    recipients.map((r) => ({
      userId: r.id,
      type: "announcement",
      title,
      body,
    }))
  );

  await logAudit({
    actorId: session.user.id,
    action: "announcement.send",
    targetType: "Announcement",
    changes: { title, recipients: recipients.length, sent, failed, facultyId, majorId, currentYear },
  });

  return NextResponse.json({ recipients: recipients.length, sent, failed });
}
