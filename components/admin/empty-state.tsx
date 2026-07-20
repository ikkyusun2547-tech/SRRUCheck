import type { ReactNode } from "react";

// Shared dashed-card empty state — used whenever a list has nothing to show,
// whether that's "no data at all" or "no results for the current filters".
export function EmptyState({ icon, message, hint }: { icon: ReactNode; message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-foreground/15 bg-surface py-16 text-center">
      <div className="rounded-full bg-brand-purple-50 p-3 text-brand-purple-600 dark:bg-brand-purple-400/10">{icon}</div>
      <p className="font-medium text-foreground/80">{message}</p>
      {hint && <p className="text-sm text-foreground/50">{hint}</p>}
    </div>
  );
}
