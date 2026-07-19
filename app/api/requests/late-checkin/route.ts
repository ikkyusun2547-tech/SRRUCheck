import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { lateCheckInRequestSchema } from "@/lib/requests/validation";
import { createLateCheckInRequest, RequestError } from "@/lib/requests/service";

const ERROR_STATUS: Record<string, number> = {
  ACTIVITY_NOT_FOUND: 404,
  ACTIVITY_NOT_CLOSED: 400,
  ALREADY_CHECKED_IN: 409,
  PENDING_REQUEST_EXISTS: 409,
};

export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = lateCheckInRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  try {
    const created = await createLateCheckInRequest(session.user.id, parsed.data);
    return NextResponse.json({ request: created }, { status: 201 });
  } catch (err) {
    if (err instanceof RequestError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: ERROR_STATUS[err.code] ?? 400 }
      );
    }
    console.error("create late check-in request failed", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
