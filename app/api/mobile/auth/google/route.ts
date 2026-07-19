import { NextResponse } from "next/server";
import { z } from "zod";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { signMobileToken } from "@/lib/auth/mobile-token";
import { emailMatchesAllowedDomain, findOrCreateUserByEmail } from "@/lib/auth/user-upsert";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ idToken: z.string().min(1) });

// Verified against Google's published JWKS rather than pulling in
// google-auth-library — jose already covers RS256 verification and is a
// dependency of next-auth already, so this avoids a second copy of the
// same capability.
const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

// CORS preflight — see next.config.ts's headers() for the actual
// Access-Control-* response headers applied to every /api/* response.
export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  const clientId = process.env.AUTH_GOOGLE_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ต้องระบุ idToken" }, { status: 400 });
  }

  let email: string | undefined;
  try {
    const { payload } = await jwtVerify(parsed.data.idToken, googleJwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });
    if (payload.email_verified !== true || typeof payload.email !== "string") {
      return NextResponse.json({ error: "ยืนยันอีเมลไม่สำเร็จ" }, { status: 401 });
    }
    email = payload.email;
  } catch {
    return NextResponse.json({ error: "idToken ไม่ถูกต้องหรือหมดอายุ" }, { status: 401 });
  }

  if (!emailMatchesAllowedDomain(email)) {
    return NextResponse.json({ error: "อีเมลต้องอยู่ในโดเมนที่กำหนด" }, { status: 403 });
  }

  const user = await findOrCreateUserByEmail(email);
  if (user.bannedAt) {
    return NextResponse.json({ error: "บัญชีนี้ถูกระงับการใช้งาน" }, { status: 403 });
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
