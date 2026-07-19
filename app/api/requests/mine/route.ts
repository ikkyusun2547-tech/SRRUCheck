import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function parsePagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE)
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

// Every branch here does its own LIMIT/OFFSET query at the database — never
// fetches everything and slices in application code.
// GET routes with no dynamic path segment default toward static
// optimization in Next.js — force dynamic so session/auth-scoped data is
// never cached or served stale across users.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const userId = session.user.id;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const { page, pageSize, skip } = parsePagination(url);

  if (type === "external") {
    const [items, total] = await Promise.all([
      prisma.externalActivityRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.externalActivityRequest.count({ where: { userId } }),
    ]);
    return NextResponse.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  }

  if (type === "credit-transfer") {
    const [items, total] = await Promise.all([
      prisma.creditTransferRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.creditTransferRequest.count({ where: { userId } }),
    ]);
    return NextResponse.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  }

  if (type === "late-checkin") {
    const [items, total] = await Promise.all([
      prisma.lateCheckInRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { activity: { select: { title: true, activityCode: true } } },
      }),
      prisma.lateCheckInRequest.count({ where: { userId } }),
    ]);
    return NextResponse.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  }

  return NextResponse.json(
    { error: "type ต้องเป็น external, credit-transfer หรือ late-checkin" },
    { status: 400 }
  );
}
