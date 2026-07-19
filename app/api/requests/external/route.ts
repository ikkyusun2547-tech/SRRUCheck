import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { externalActivityRequestSchema } from "@/lib/requests/validation";
import { createExternalActivityRequest, RequestError } from "@/lib/requests/service";

const ERROR_STATUS: Record<string, number> = {
  INVALID_EVIDENCE: 400,
  HOUR_CAP_EXCEEDED: 400,
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = externalActivityRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  try {
    const created = await createExternalActivityRequest(session.user.id, parsed.data);
    return NextResponse.json({ request: created }, { status: 201 });
  } catch (err) {
    if (err instanceof RequestError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: ERROR_STATUS[err.code] ?? 400 }
      );
    }
    console.error("create external activity request failed", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
