import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPassportSummary } from "@/lib/passport/service";

// Same data the web dashboard (app/(student)/dashboard/page.tsx) reads via
// a direct server-side call to getPassportSummary() inside a Server
// Component — the mobile client has no equivalent, so this exposes the
// same service function over JSON. No business logic is duplicated here.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const summary = await getPassportSummary(session.user.id);
  if (!summary) {
    return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
  }

  return NextResponse.json({ summary });
}
