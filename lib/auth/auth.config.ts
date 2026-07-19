import type { NextAuthConfig } from "next-auth";
import { verifyMobileToken } from "./mobile-token";

// Edge-safe base config: no providers with DB-dependent `authorize`/`signIn`
// logic here (Prisma isn't Edge-runtime compatible). This is what
// middleware.ts uses to read/route on the session; the full config with
// providers and DB callbacks lives in auth.ts and runs in the Node runtime
// (Route Handlers, Server Components, Server Actions).
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Without this, Auth.js rejects every request in production with
  // "UntrustedHost" unless AUTH_URL matches the incoming Host header exactly
  // — breaks self-hosted/non-Vercel deployments and even local `next start`
  // testing. Safe here because our own domain-allowlist check in auth.ts
  // (ALLOWED_EMAIL_DOMAIN) is the real access control, not the host header.
  trustHost: true,
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = (token.role as "student" | "admin") ?? "student";
        session.user.profileCompleted = Boolean(token.profileCompleted);
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // CORS preflight requests never carry credentials (no cookie, no
      // Authorization header) by design — the browser sends them before the
      // real request specifically to ask permission, so gating them on auth
      // would break CORS for every cross-origin caller (e.g. the mobile
      // app's Expo web build). The actual response headers come from
      // next.config.ts's headers(); this just lets the preflight through.
      if (request.method === "OPTIONS") return true;

      const isPublic =
        pathname === "/" ||
        pathname === "/login" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/dev/login") ||
        pathname.startsWith("/api/mobile/auth") ||
        pathname.startsWith("/api/cron") ||
        // PWA assets: browsers fetch these unauthenticated (manifest/SW
        // registration happen regardless of login state; the offline page
        // must work precisely when nothing else does).
        pathname === "/manifest.json" ||
        pathname === "/sw.js" ||
        pathname === "/offline.html" ||
        pathname.startsWith("/icons/");

      if (isPublic) return true;

      if (!isLoggedIn) {
        // Mobile client: no session cookie, but may present a Bearer token
        // instead. Only signature/expiry are checked here (edge-safe, no
        // Prisma) — each API route's own getSession() re-verifies the
        // token against the DB (ban status, current role) before trusting
        // it, so this is just enough to let a legitimate mobile request
        // past the middleware gate.
        if (pathname.startsWith("/api/")) {
          const authHeader = request.headers.get("authorization");
          if (authHeader?.startsWith("Bearer ")) {
            const verified = await verifyMobileToken(authHeader.slice(7));
            if (verified) return true;
          }
        }
        return false;
      }

      if (pathname.startsWith("/admin") && auth.user.role !== "admin") {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      if (
        auth.user.role === "student" &&
        !auth.user.profileCompleted &&
        !pathname.startsWith("/setup-profile")
      ) {
        return Response.redirect(new URL("/setup-profile", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
