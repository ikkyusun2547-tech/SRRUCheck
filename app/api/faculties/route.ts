import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// Non-admin read of the faculty/major list, for the cascading dropdown in
// profile setup/edit. app/api/admin/faculties is gated to admins only and
// can't be reused here — this is the same query, minus the role check,
// since faculty/major names aren't sensitive data.
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session?.user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const faculties = await prisma.faculty.findMany({
    orderBy: { nameTh: "asc" },
    include: { majors: { orderBy: { nameTh: "asc" } } },
  });
  return NextResponse.json({ faculties });
}
