import Link from "next/link";
import type { ReactNode } from "react";

// Shared "icon + number" stat tile — same card chrome and purple icon-block
// treatment as the category icons in the activities list, so every summary
// card across the admin section reads as one system rather than a per-page
// invention. `note` is an optional dot+text status line (e.g. "ต้องดำเนินการ")
// for stats that need attention, following the dot+text accent convention
// instead of a loud filled badge.
export function StatCard({
  href,
  icon,
  label,
  value,
  note,
  noteTone = "amber",
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: number;
  note?: string;
  noteTone?: "amber" | "rose";
}) {
  const noteToneClass = noteTone === "rose" ? "text-rose-600 dark:text-rose-400" : "text-amber-700 dark:text-amber-400";
  const noteDotClass = noteTone === "rose" ? "bg-rose-500" : "bg-amber-500";

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm transition-all hover:border-brand-purple-600/30 hover:shadow-[0_4px_20px_-4px_rgba(124,58,237,0.15)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400">
          {icon}
        </div>
        <ChevronIcon className="text-foreground/20 transition-colors group-hover:text-brand-purple-600" />
      </div>
      <p className="mt-4 text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-sm text-foreground/55">{label}</p>
      {note && (
        <p className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${noteToneClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${noteDotClass}`} aria-hidden />
          {note}
        </p>
      )}
    </Link>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
