import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Edge-safe: only decodes/route-guards on the JWT, no Prisma access here.
export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
