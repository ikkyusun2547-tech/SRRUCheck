import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { id } = await params;
  const notification = await prisma.notification.findUnique({ where: { id } });
  // Ownership check — never let a user mark someone else's notification read.
  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ error: "ไม่พบการแจ้งเตือนนี้" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: notification.readAt ?? new Date() },
  });

  return NextResponse.json({ notification: updated });
}
