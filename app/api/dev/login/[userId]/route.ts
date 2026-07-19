import { signIn } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

// Dev-only shortcut: sign in as an existing DB user without going through
// real Google OAuth. Requires no OAuth credentials to be configured, which
// matters early in development. This route does not exist at all in
// production — it 404s before touching auth or the database.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }

  const { userId } = await params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return new Response(`No user with id "${userId}" in the database.`, {
      status: 404,
    });
  }

  return signIn("dev-login", { userId, redirectTo: "/" });
}
