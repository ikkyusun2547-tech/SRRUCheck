import type { ActivityCategory } from "@prisma/client";
import { CATEGORY_DOT } from "@/lib/admin/category-colors";
import { SectionHeading } from "./section-heading";

type Row = { category: ActivityCategory; label: string; count: number };

// Horizontal dot+bar breakdown — same category colors as the activities
// list, just aggregated instead of per-row, so the dashboard's "shape" of
// the system reads at a glance without a charting library.
export function CategoryBreakdown({
  title,
  icon,
  data,
}: {
  title: string;
  icon: React.ReactNode;
  data: Row[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex flex-col rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
      <SectionHeading icon={icon}>{title}</SectionHeading>
      <div className="mt-4 space-y-3.5">
        {data.map((d) => (
          <div key={d.category}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground/70">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${CATEGORY_DOT[d.category]}`} aria-hidden />
                <span className="truncate">{d.label}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-foreground/80">{d.count}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/8">
              <div
                className={`h-full rounded-full ${CATEGORY_DOT[d.category]}`}
                style={{ width: `${Math.max(3, (d.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
