import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// GET routes with no dynamic path segment default toward static
// optimization in Next.js — force dynamic so session/auth-scoped data is
// never cached or served stale across users.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();
  const facultyId = url.searchParams.get("facultyId") || undefined;
  const majorId = url.searchParams.get("majorId") || undefined;
  const currentYear = url.searchParams.get("currentYear");
  const role = url.searchParams.get("role") || undefined;
  const banned = url.searchParams.get("banned");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(url.searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE)
  );

  const where: Prisma.UserWhereInput = {
    ...(facultyId ? { facultyId } : {}),
    ...(majorId ? { majorId } : {}),
    ...(currentYear ? { currentYear: Number(currentYear) } : {}),
    ...(role ? { role: role as "student" | "admin" } : {}),
    ...(banned === "true" ? { bannedAt: { not: null } } : {}),
    ...(banned === "false" ? { bannedAt: null } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { studentId: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { faculty: true, major: true },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
