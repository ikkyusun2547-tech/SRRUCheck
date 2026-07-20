import Link from "next/link";
import { actionTone } from "@/lib/audit/action-tone";
import { SectionHeading } from "./section-heading";

type Row = { id: string; action: string; actorName: string; createdAt: Date };

export function RecentActivityFeed({
  title,
  icon,
  items,
  emptyLabel,
  viewAllHref,
  viewAllLabel,
  dateLocale,
}: {
  title: string;
  icon: React.ReactNode;
  items: Row[];
  emptyLabel: string;
  viewAllHref: string;
  viewAllLabel: string;
  dateLocale: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <SectionHeading icon={icon}>{title}</SectionHeading>
        <Link href={viewAllHref} className="shrink-0 text-xs font-medium text-brand-purple-600 hover:underline">
          {viewAllLabel}
        </Link>
      </div>
      <div className="mt-3 flex-1 space-y-3">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/40">{emptyLabel}</p>
        ) : (
          items.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-[10px] ${actionTone(log.action)}`}
              >
                {log.action}
              </span>
              <div className="min-w-0 flex-1">
                <p className="min-w-0 truncate text-sm text-foreground/80">{log.actorName}</p>
                <p className="text-xs text-foreground/40">{log.createdAt.toLocaleString(dateLocale)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
