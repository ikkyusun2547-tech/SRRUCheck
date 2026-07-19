import { getTranslations } from "next-intl/server";
import { signIn } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { LanguageToggle } from "@/components/language-toggle";

async function getDevUsers() {
  if (process.env.NODE_ENV !== "development") return [];
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      take: 20,
    });
  } catch {
    // Placeholder Supabase credentials, or DB not migrated yet — the dev
    // login list just won't have anything to show.
    return null;
  }
}

export default async function LoginPage() {
  const devUsers = await getDevUsers();
  const t = await getTranslations();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("app.login")}</h1>
        <p className="text-sm text-foreground/70">
          จำกัดเฉพาะอีเมล @{process.env.ALLOWED_EMAIL_DOMAIN ?? "srru.ac.th"} เท่านั้น
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-full bg-brand-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-purple-800"
          >
            เข้าสู่ระบบด้วย Google
          </button>
        </form>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="w-full max-w-sm space-y-3 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Dev-only shortcut (ไม่แสดงใน production)
          </p>
          {devUsers === null && (
            <p className="text-sm text-foreground/70">
              เชื่อมต่อฐานข้อมูลไม่ได้ — ตรวจสอบ DATABASE_URL ใน .env
            </p>
          )}
          {devUsers?.length === 0 && (
            <p className="text-sm text-foreground/70">
              ยังไม่มี user ในฐานข้อมูล รัน <code>npm run prisma:seed</code> ก่อน
            </p>
          )}
          {devUsers && devUsers.length > 0 && (
            <ul className="space-y-2">
              {devUsers.map((u) => (
                <li key={u.id}>
                  <a
                    href={`/api/dev/login/${u.id}`}
                    className="block rounded-md border border-foreground/10 px-3 py-2 text-sm hover:bg-foreground/5"
                  >
                    <span className="font-medium">
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                    </span>
                    <span className="ml-2 text-foreground/50">
                      {u.role} · {u.email}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
