import { prisma } from "@/lib/prisma";

const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN ?? "srru.ac.th").toLowerCase();

export function emailMatchesAllowedDomain(email: string | null | undefined) {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${allowedDomain}`);
}

// Find-or-create our own User row for a Google-verified email. Shared by the
// web signIn callback (auth.ts) and the mobile Google auth bridge
// (app/api/mobile/auth/google) so the two clients can't drift.
export async function findOrCreateUserByEmail(email: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });
}
