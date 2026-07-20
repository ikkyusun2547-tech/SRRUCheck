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
      className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm transition-colors hover:bg-white/10"
    >
      <GlobeIcon />
      {locale === "th" ? "EN" : "ไทย"}
    </button>
  );
}

function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 8H14" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 2c1.8 1.6 2.8 3.7 2.8 6s-1 4.4-2.8 6c-1.8-1.6-2.8-3.7-2.8-6s1-4.4 2.8-6Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
