import { SignJWT, jwtVerify } from "jose";

// Bearer tokens for the mobile (Expo) client, which has no browser cookie
// jar to hold a NextAuth session. Signed with the same AUTH_SECRET NextAuth
// already requires — a dedicated secret would be one more env var to keep in
// sync for no real isolation benefit, since both ultimately gate access to
// the same API. issuer/audience pin the token to this specific use so a
// mobile token can't be replayed anywhere a NextAuth JWT is expected, or
// vice versa.
const ISSUER = "srru-check-mobile";
const AUDIENCE = "srru-check-mobile-api";
const EXPIRY = "30d";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signMobileToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secretKey());
}

export async function verifyMobileToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
