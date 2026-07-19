import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { LanguageToggle } from "@/components/language-toggle";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    if (!session.user.profileCompleted) redirect("/setup-profile");
    redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
  }

  const t = await getTranslations();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand-purple-950 to-brand-purple-800 px-6 py-24 text-center text-white">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <h1 className="text-3xl font-bold sm:text-4xl">{t("app.name")}</h1>
      <p className="max-w-md text-white/80">{t("app.tagline")}</p>
      <Link
        href="/login"
        className="rounded-full bg-brand-emerald-500 px-8 py-3 font-medium text-white transition-colors hover:bg-brand-emerald-600"
      >
        {t("app.login")}
      </Link>
    </div>
  );
}
