import { prisma } from "@/lib/prisma";
import { auth } from "./auth";
import { verifyMobileToken } from "./mobile-token";

export type SessionUser = {
  id: string;
  role: "student" | "admin";
  profileCompleted: boolean;
};

// Drop-in replacement for `await auth()` in API route handlers that also
// accepts the mobile app's Bearer token. Web keeps using the NextAuth
// session cookie (auth() reads it from the request context); mobile has no
// cookie jar, so it sends `Authorization: Bearer <mobile token>` instead.
//
// Unlike the NextAuth JWT (refreshed only via unstable_update()), the mobile
// token is long-lived (30d) and carries only a userId, so role/ban state is
// re-read from the DB on every request rather than trusted from the token —
// the same reasoning as the `trigger === "update"` branch in auth.ts's jwt
// callback: don't let a stale claim outlive a real DB change.
export async function getSession(request: Request): Promise<{ user: SessionUser } | null> {
  const webSession = await auth();
  if (webSession?.user?.id) {
    return {
      user: {
        id: webSession.user.id,
        role: webSession.user.role,
        profileCompleted: webSession.user.profileCompleted,
      },
    };
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const verified = await verifyMobileToken(authHeader.slice(7));
  if (!verified) return null;

  const dbUser = await prisma.user.findUnique({ where: { id: verified.userId } });
  if (!dbUser || dbUser.bannedAt) return null;

  return {
    user: { id: dbUser.id, role: dbUser.role, profileCompleted: dbUser.profileCompleted },
  };
}
