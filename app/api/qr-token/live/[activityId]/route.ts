import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { generateQrToken, buildCheckinUrl } from "@/lib/checkin/qr-token";
import { generateQrPng } from "@/lib/checkin/qr-image";

// Admin-only: the live, rotating QR shown on the projector. Re-fetched by
// the admin UI every 15s so the embedded token always matches the current
// window — the token itself is verified server-side on scan, not trusted
// from the client that requested this image.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const session = await getSession(request);
  if (!session?.user || session.user.role !== "admin") {
    return new Response(null, { status: 404 });
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

  const token = generateQrToken(activity.id, "live", secret);
  const url = buildCheckinUrl(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", token);
  const png = await generateQrPng(url);

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
