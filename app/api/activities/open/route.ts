import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

// Minimal open-activities listing to drive the check-in flow. The full
// browsable activities page (filters, restrictions, pagination) is a
// phase 3 concern — this just needs to exist enough to test check-in.
// GET routes with no dynamic path segment default toward static
// optimization in Next.js — force dynamic so session/auth-scoped data is
// never cached or served stale across users.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const activities = await prisma.activity.findMany({
    where: { status: "open" },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      title: true,
      checkinMethod: true,
      requiresGps: true,
      activityCode: true,
      locationName: true,
      startTime: true,
      endTime: true,
    },
  });

  return NextResponse.json({ activities });
}
