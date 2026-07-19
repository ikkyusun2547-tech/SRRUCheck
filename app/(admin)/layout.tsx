import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/lib/auth/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

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

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-foreground/10 bg-brand-purple-950 p-4 text-white sm:flex">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-semibold">{t("app.name")} · Admin</span>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded px-2 py-1 hover:bg-white/10">
              {item.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-auto"
        >
          <button type="submit" className="text-sm text-white/70 hover:text-white">
            {t("app.logout")}
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
