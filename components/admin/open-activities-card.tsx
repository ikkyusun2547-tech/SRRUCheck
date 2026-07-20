import Link from "next/link";
import type { ActivityCategory } from "@prisma/client";
import { CATEGORY_DOT } from "@/lib/admin/category-colors";
import { SectionHeading } from "./section-heading";

type Row = { id: string; title: string; category: ActivityCategory; attendeeCount: number };

export function OpenActivitiesCard({
  title,
  icon,
  items,
  emptyLabel,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  icon: React.ReactNode;
  items: Row[];
  emptyLabel: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <SectionHeading icon={icon}>{title}</SectionHeading>
        <Link href={viewAllHref} className="shrink-0 text-xs font-medium text-brand-purple-600 hover:underline">
          {viewAllLabel}
        </Link>
      </div>
      <div className="mt-3 flex-1 space-y-0.5">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/40">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/activities/${item.id}/attendees`}
              className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-foreground/5"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT[item.category]}`} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-foreground/85">{item.title}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-foreground/45">
                <UsersIcon />
                {item.attendeeCount}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.8 13.5c0-2.3 1.9-4 4.2-4s4.2 1.7 4.2 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.8 4.2a2.2 2.2 0 0 1 0 4.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 9.6c1.9.3 3.3 1.8 3.3 3.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
