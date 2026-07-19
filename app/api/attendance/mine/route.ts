import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// GET routes with no dynamic path segment default toward static
// optimization in Next.js — force dynamic so session/auth-scoped data is
// never cached or served stale across users.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE)
  );
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { userId: session.user.id },
      orderBy: { checkinTime: "desc" },
      skip,
      take: pageSize,
      include: { activity: { select: { title: true, activityCode: true, creditHours: true } } },
    }),
    prisma.attendance.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
}
