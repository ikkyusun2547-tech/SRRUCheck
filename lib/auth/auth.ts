import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN ?? "srru.ac.th").toLowerCase();

function emailMatchesAllowedDomain(email: string | null | undefined) {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${allowedDomain}`);
}

const providers: NextAuthConfig["providers"] = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }),
];

// Dev-only shortcut: sign in as an existing DB user without real Google
// OAuth. Only ever registered when NODE_ENV === "development" — in
// production this provider does not exist, so it cannot be invoked at all.
if (process.env.NODE_ENV === "development") {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev login",
      credentials: {
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        if (process.env.NODE_ENV !== "development") return null;

        const userId = credentials?.userId;
        if (typeof userId !== "string" || !userId) return null;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
        };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        // dev-login: authorize() above already resolved a real, non-banned
        // check is still worth doing since the row could've been banned
        // after the dev picked it from the list.
        const dbUser = await prisma.user.findUnique({ where: { id: user.id! } });
        return !dbUser?.bannedAt;
      }

      if (!emailMatchesAllowedDomain(user.email)) {
        return false;
      }

      // Find-or-create our own User row. We intentionally do not use the
      // Prisma adapter — this app's User model has custom student fields
      // the adapter's shape doesn't need to know about.
      const dbUser = await prisma.user.upsert({
        where: { email: user.email! },
        update: {},
        create: { email: user.email! },
      });

      if (dbUser.bannedAt) return false;

      // Mutating `user` here carries the resolved DB id forward into the
      // jwt callback's `user` argument on this same sign-in.
      user.id = dbUser.id;
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.profileCompleted = dbUser.profileCompleted;
        }
      } else if (trigger === "update" && token.userId) {
        // Triggered by unstable_update() — re-read from the DB rather than
        // trusting whatever the caller passed in, so this can't be spoofed.
        const dbUser = await prisma.user.findUnique({ where: { id: token.userId as string } });
        if (dbUser) {
          token.role = dbUser.role;
          token.profileCompleted = dbUser.profileCompleted;
        }
      }
      return token;
    },
  },
});
