"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function LanguageToggle() {
  const router = useRouter();
  const locale = useLocale();

  function toggle() {
    const next = locale === "th" ? "en" : "th";
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch language"
      className="rounded-full px-2 py-1 text-sm hover:bg-white/10"
    >
      {locale === "th" ? "EN" : "ไทย"}
    </button>
  );
}
