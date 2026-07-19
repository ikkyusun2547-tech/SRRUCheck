import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

// Public (any authenticated user) read of just enough activity info for
// the check-in client to know which steps to show after a QR scan. All
// security-relevant checks are re-done server-side in /api/checkin — this
// endpoint is purely informational.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { activityId } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      title: true,
      checkinMethod: true,
      requiresGps: true,
      status: true,
      locationName: true,
      startTime: true,
      endTime: true,
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  }

  return NextResponse.json({ activity });
}
