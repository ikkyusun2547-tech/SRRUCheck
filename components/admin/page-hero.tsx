import Link from "next/link";

// The shared header pattern for every admin page — deep purple gradient
// (matching the sidebar), glass sheen + soft glow accents, an eyebrow /
// title / subtitle block, an optional primary action, and an optional row
// of stat chips. Established on app/(admin)/admin/activities/page.tsx and
// meant to be reused as-is everywhere else in the admin section rather
// than re-implemented per page.
export function PageHero({
  eyebrow,
  title,
  subtitle,
  cta,
  stats,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  cta?: { href: string; label: string };
  stats?: { label: string; value: number; tone?: "default" | "emerald" | "amber" }[];
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e0b47] via-brand-purple-800 to-brand-purple-600 px-7 py-9 text-white shadow-xl shadow-brand-purple-950/30 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-brand-emerald-400/25 blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 right-1/4 h-48 w-48 rounded-full bg-fuchsia-400/10 blur-[80px]"
      />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-white/70">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
          </div>
          {cta && (
            <Link
              href={cta.href}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-purple-800 shadow-sm transition-transform hover:scale-[1.03] hover:shadow-md active:scale-[0.98]"
            >
              <PlusIcon />
              {cta.label}
            </Link>
          )}
        </div>

        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {stats.map((s) => (
              <StatChip key={s.label} {...s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "emerald" | "amber";
}) {
  const toneStyles =
    tone === "emerald"
      ? "border-brand-emerald-400/40 bg-brand-emerald-400/15"
      : tone === "amber"
        ? "border-amber-300/40 bg-amber-400/15"
        : "border-white/20 bg-white/10";
  return (
    <div className={`flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm ${toneStyles}`}>
      <span className="text-base font-bold tabular-nums">{value}</span>
      <span className="text-xs text-white/80">{label}</span>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
