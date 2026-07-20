import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/lib/auth/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { LogoutIcon } from "@/components/admin/nav-icons";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const t = await getTranslations();
  const navItems = [
    { href: "/admin", label: t("adminNav.overview") },
    { href: "/admin/activities", label: t("adminNav.activities") },
    { href: "/admin/live", label: t("adminNav.live") },
    { href: "/admin/requests", label: t("adminNav.requests") },
    { href: "/admin/students", label: t("adminNav.students") },
    { href: "/admin/users", label: t("adminNav.users") },
    { href: "/admin/faculties", label: t("adminNav.faculties") },
    { href: "/admin/settings", label: t("adminNav.settings") },
    { href: "/admin/audit-log", label: t("adminNav.auditLog") },
    { href: "/admin/announcements", label: t("adminNav.announcements") },
    { href: "/admin/reports", label: t("adminNav.reports") },
  ];

  const displayName = session.user.name ?? session.user.email ?? "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col sm:flex-row">
      <AdminMobileNav
        navItems={navItems}
        appName={t("app.name")}
        displayName={displayName}
        initial={initial}
        adminRoleLabel={t("adminShell.adminRole")}
        logoutLabel={t("app.logout")}
        onSignOut={handleSignOut}
      />
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col self-start overflow-hidden border-r border-black/20 bg-gradient-to-b from-brand-purple-950 to-[#1a0940] text-white shadow-xl sm:flex">
        {/* Decorative glow — mirrors the activities page hero so the shell
            and content read as one cohesive design language. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-brand-purple-600/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 -right-16 h-56 w-56 rounded-full bg-brand-emerald-500/15 blur-3xl"
        />

        <div className="relative flex h-full flex-col p-4">
          <div className="mb-6 flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon.svg" alt="" className="h-9 w-9 shrink-0 rounded-lg shadow-md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight">{t("app.name")}</p>
                <p className="text-[11px] font-medium tracking-wide text-brand-emerald-400">ADMIN CONSOLE</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 text-white/70">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <AdminSidebarNav items={navItems} />
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple-400 to-brand-emerald-400 text-sm font-bold text-brand-purple-950">
                {initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{displayName}</p>
                <p className="text-[11px] text-white/50">{t("adminShell.adminRole")}</p>
              </div>
            </div>
            <form action={handleSignOut} className="mt-2">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <LogoutIcon />
                {t("app.logout")}
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-surface-raised p-4 sm:p-6">{children}</main>
    </div>
  );
}
