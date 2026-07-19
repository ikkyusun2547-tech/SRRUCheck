import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signMobileToken } from "@/lib/auth/mobile-token";

// Mobile equivalent of /api/dev/login/[userId]: same security-relevant
// invariant applies — this must 404 whenever NODE_ENV !== "development",
// not just skip auth, since it's the mechanism that bypasses real Google
// sign-in entirely.
export const dynamic = "force-dynamic";

const bodySchema = z.object({ userId: z.string().min(1) });

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ต้องระบุ userId" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user || user.bannedAt) {
    return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
  }

  const token = await signMobileToken(user.id);
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
}

// CORS preflight — see next.config.ts's headers() for the actual
// Access-Control-* response headers applied to every /api/* response.
export function OPTIONS() {
  return new Response(null, { status: 204 });
}

// Dev-only convenience list, mirroring the web login page's dev shortcut —
// lets the mobile app show a picker without a second round-trip.
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { id: true, email: true, role: true, firstName: true, lastName: true },
  });
  return NextResponse.json({ users });
}
