import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { cancelCreditTransferRequest, RequestError } from "@/lib/requests/service";

const ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  NOT_CANCELLABLE: 409,
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await cancelCreditTransferRequest(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RequestError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: ERROR_STATUS[err.code] ?? 400 }
      );
    }
    console.error("cancel credit transfer request failed", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
