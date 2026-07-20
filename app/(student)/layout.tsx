import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/lib/auth/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { StudentNav } from "@/components/student/student-nav";
import { LogoutIcon } from "@/components/student/nav-icons";

export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations();
  const navItems = [
    { href: "/dashboard", label: t("studentNav.dashboard"), key: "dashboard" as const },
    { href: "/activities", label: t("studentNav.activities"), key: "activities" as const },
    { href: "/checkin", label: t("studentNav.checkin"), key: "checkin" as const },
    { href: "/requests", label: t("studentNav.requests"), key: "requests" as const },
    { href: "/history", label: t("studentNav.history"), key: "history" as const },
    { href: "/notifications", label: t("studentNav.notifications"), key: "notifications" as const },
    { href: "/profile", label: t("studentNav.profile"), key: "profile" as const },
  ];

  const displayName = session.user.name ?? session.user.email ?? "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-purple-950 via-brand-purple-900 to-[#1a0940] text-white shadow-lg">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-purple-600/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-brand-emerald-500/15 blur-3xl"
        />

        <div className="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon.svg" alt="" className="h-8 w-8 shrink-0 rounded-lg shadow-md" />
            <span className="truncate text-sm font-bold leading-tight sm:text-base">{t("app.name")}</span>
          </Link>

          <div className="flex shrink-0 items-center gap-0.5">
            <LanguageToggle />
            <ThemeToggle />
            <div className="mx-1 hidden h-6 w-px bg-white/15 sm:block" aria-hidden />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple-400 to-brand-emerald-400 text-xs font-bold text-brand-purple-950">
                {initial}
              </span>
              <span className="max-w-[120px] truncate text-sm font-medium text-white/85">{displayName}</span>
            </div>
            <form action={handleSignOut}>
              <button
                type="submit"
                aria-label={t("app.logout")}
                title={t("app.logout")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogoutIcon />
              </button>
            </form>
          </div>
        </div>

        <StudentNav items={navItems} />
      </header>

      <main className="min-w-0 flex-1 bg-surface-raised p-4 sm:p-6">{children}</main>
    </div>
  );
}
