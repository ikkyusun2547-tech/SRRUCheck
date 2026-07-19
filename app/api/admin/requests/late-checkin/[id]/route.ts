import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { decisionSchema } from "@/lib/admin/request-decision-validation";
import { decideLateCheckInRequest, RequestDecisionError } from "@/lib/admin/request-decisions";

const ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  ALREADY_DECIDED: 409,
  ALREADY_CHECKED_IN: 409,
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  try {
    const updated = await decideLateCheckInRequest(
      session.user.id,
      id,
      parsed.data.decision,
      parsed.data.hoursApproved,
      parsed.data.adminComment
    );
    return NextResponse.json({ request: updated });
  } catch (err) {
    if (err instanceof RequestDecisionError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: ERROR_STATUS[err.code] ?? 400 }
      );
    }
    throw err;
  }
}
