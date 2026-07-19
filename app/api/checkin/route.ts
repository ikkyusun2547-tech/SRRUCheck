import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { performCheckin, CheckinError } from "@/lib/checkin/service";

const bodySchema = z
  .object({
    token: z.string().optional(),
    activityId: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    deviceUuid: z.string().min(1).max(200),
    selfieDataUrl: z.string().min(1),
  })
  .refine((d) => Boolean(d.token || d.activityId), {
    message: "ต้องระบุ QR token หรือรหัสกิจกรรม",
    path: ["token"],
  });

const ERROR_STATUS: Record<string, number> = {
  INVALID_TOKEN: 400,
  TOKEN_EXPIRED: 400,
  MISSING_TARGET: 400,
  ACTIVITY_NOT_FOUND: 404,
  ACTIVITY_CLOSED: 409,
  METHOD_MISMATCH: 400,
  OUTSIDE_TIME_WINDOW: 400,
  GPS_REQUIRED: 400,
  INVALID_SELFIE: 400,
  DUPLICATE_CHECKIN: 409,
  SERVER_MISCONFIGURED: 500,
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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  try {
    const result = await performCheckin({ userId: session.user.id, ...parsed.data });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof CheckinError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: ERROR_STATUS[err.code] ?? 400 }
      );
    }
    console.error("checkin failed", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
