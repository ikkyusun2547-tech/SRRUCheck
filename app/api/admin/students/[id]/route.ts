import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { getPassportSummary } from "@/lib/passport/service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { faculty: true, major: true },
  });
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  const [passport, attendances, externalRequests, creditTransferRequests, lateCheckInRequests] =
    await Promise.all([
      getPassportSummary(id),
      prisma.attendance.findMany({
        where: { userId: id },
        orderBy: { checkinTime: "desc" },
        take: 20,
        include: { activity: { select: { title: true, activityCode: true, creditHours: true } } },
      }),
      prisma.externalActivityRequest.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.creditTransferRequest.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.lateCheckInRequest.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { activity: { select: { title: true, activityCode: true } } },
      }),
    ]);

  return NextResponse.json({
    user,
    passport,
    attendances,
    externalRequests,
    creditTransferRequests,
    lateCheckInRequests,
  });
}
