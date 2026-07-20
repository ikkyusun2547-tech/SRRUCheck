import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// Drives the late-check-in request form's activity picker — mirrors the
// direct Prisma query app/(student)/requests/page.tsx (server component)
// already does for the web client; mobile has no equivalent, hence this
// route. Same take(50)/fields as that query.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session?.user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const activities = await prisma.activity.findMany({
    where: { status: "closed" },
    orderBy: { endTime: "desc" },
    take: 50,
    select: { id: true, title: true, activityCode: true },
  });

  return NextResponse.json({ activities });
}
