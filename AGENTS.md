# SRRU Check — agent notes

- Web app: Next.js **15** (App Router) + React 18, pinned deliberately (not 16) for ecosystem
  compatibility with NextAuth v5 / next-intl / react-pdf / leaflet. Don't bump to Next 16 without
  checking those libraries first.
- Prisma is pinned to v6 (classic `prisma-client-js` generator, `@prisma/client` import path) —
  not v7 (new ESM-only client generator). Don't upgrade without deliberately migrating.
- Auth: NextAuth v5, JWT session strategy, **no Prisma adapter** — `User` table is our own custom
  schema, find-or-create happens in `lib/auth/auth.ts`'s `signIn` callback.
  - `lib/auth/auth.config.ts` must stay Edge-safe (no Prisma) — it's reused by `middleware.ts`.
  - `lib/auth/auth.ts` holds providers + DB-dependent callbacks (Node runtime only).
- Dev-login shortcut (`/api/dev/login/[userId]`) must 404 whenever `NODE_ENV !== "development"` —
  this is a security-relevant invariant, not just a convenience; don't relax it.
- File uploads (selfies, evidence) go to Supabase Storage only, private buckets, signed URLs on
  read. Never write uploads to local disk — the app targets serverless deployment.
- Follow the phased build order in README.md; each phase should build + run cleanly, with tests
  landing alongside phase 2's business logic (not bolted on at the end).
- `mobile/` is a separate Expo app sharing the same backend API — don't duplicate business logic
  there; it calls the same Next.js API routes as the web client.
