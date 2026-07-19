import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/lib/auth/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations();
  const navItems = [
    { href: "/dashboard", label: t("studentNav.dashboard") },
    { href: "/activities", label: t("studentNav.activities") },
    { href: "/checkin", label: t("studentNav.checkin") },
    { href: "/requests", label: t("studentNav.requests") },
    { href: "/history", label: t("studentNav.history") },
    { href: "/notifications", label: t("studentNav.notifications") },
    { href: "/profile", label: t("studentNav.profile") },
  ];

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-foreground/10 bg-brand-purple-950 px-4 py-3 text-white">
        <span className="font-semibold">{t("app.name")}</span>
        <nav className="hidden gap-4 text-sm sm:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brand-emerald-500">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="text-sm text-white/70 hover:text-white">
              {t("app.logout")}
            </button>
          </form>
        </div>
      </header>
      <nav className="flex gap-3 overflow-x-auto border-b border-foreground/10 px-4 py-2 text-sm sm:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
