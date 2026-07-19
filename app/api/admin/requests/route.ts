import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { STORAGE_BUCKETS } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/supabase/storage";

async function withEvidenceUrl<T extends { evidenceFile: string | null }>(items: T[]) {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      evidenceUrl: item.evidenceFile
        ? await getSignedUrl(STORAGE_BUCKETS.evidence, item.evidenceFile).catch(() => null)
        : null,
    }))
  );
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// GET routes with no dynamic path segment default toward static
// optimization in Next.js — force dynamic so session/auth-scoped data is
// never cached or served stale across users.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const status = (url.searchParams.get("status") as "pending" | "approved" | "rejected" | "cancelled" | null) ?? "pending";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE)
  );
  const skip = (page - 1) * pageSize;

  const userSelect = {
    select: { id: true, firstName: true, lastName: true, email: true, studentId: true },
  } as const;

  if (type === "external") {
    const [items, total] = await Promise.all([
      prisma.externalActivityRequest.findMany({
        where: { status },
        orderBy: { createdAt: "asc" },
        skip,
        take: pageSize,
        include: { user: userSelect },
      }),
      prisma.externalActivityRequest.count({ where: { status } }),
    ]);
    return NextResponse.json({
      items: await withEvidenceUrl(items),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  }

  if (type === "credit-transfer") {
    const [items, total] = await Promise.all([
      prisma.creditTransferRequest.findMany({
        where: { status },
        orderBy: { createdAt: "asc" },
        skip,
        take: pageSize,
        include: { user: userSelect },
      }),
      prisma.creditTransferRequest.count({ where: { status } }),
    ]);
    return NextResponse.json({
      items: await withEvidenceUrl(items),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  }

  if (type === "late-checkin") {
    const [items, total] = await Promise.all([
      prisma.lateCheckInRequest.findMany({
        where: { status },
        orderBy: { createdAt: "asc" },
        skip,
        take: pageSize,
        include: { user: userSelect, activity: { select: { title: true, activityCode: true } } },
      }),
      prisma.lateCheckInRequest.count({ where: { status } }),
    ]);
    return NextResponse.json({ items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  }

  return NextResponse.json(
    { error: "type ต้องเป็น external, credit-transfer หรือ late-checkin" },
    { status: 400 }
  );
}
