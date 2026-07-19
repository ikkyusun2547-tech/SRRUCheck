import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { generateQrToken, buildCheckinUrl } from "@/lib/checkin/qr-token";
import { generateQrPng } from "@/lib/checkin/qr-image";

// Student-facing: the downloadable backup QR for when there's no live
// screen at the venue. Never rotates, and checking in with it always gets
// flagged PRINTED_QR_USED server-side — enforced in lib/checkin/service.ts,
// not here.
export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(null, { status: 401 });
  }

  const { activityId } = await params;
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) {
    return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
  }

  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const token = generateQrToken(activity.id, "printed", secret);
  const url = buildCheckinUrl(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", token);
  const png = await generateQrPng(url);

  const download = new URL(request.url).searchParams.get("download") === "1";

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=60",
      ...(download
        ? { "Content-Disposition": `attachment; filename="qr-backup-${activity.activityCode}.png"` }
        : {}),
    },
  });
}
