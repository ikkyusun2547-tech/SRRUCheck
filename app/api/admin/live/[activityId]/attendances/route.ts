import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { activityId } = await params;
  const attendances = await prisma.attendance.findMany({
    where: { activityId },
    orderBy: { checkinTime: "desc" },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, studentId: true } },
    },
  });

  return NextResponse.json({ attendances });
}
