// Shared color coding for audit log action badges — used on the full audit
// log page and the dashboard's recent-activity feed so the same action
// always reads the same color everywhere.
export function actionTone(action: string): string {
  if (action.includes("delete")) {
    return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  }
  if (action.includes("create")) {
    return "bg-brand-emerald-50 text-brand-emerald-700 dark:bg-brand-emerald-500/10 dark:text-brand-emerald-400";
  }
  if (action.includes("update") || action.includes("settings")) {
    return "bg-brand-purple-50 text-brand-purple-700 dark:bg-brand-purple-400/10 dark:text-brand-purple-400";
  }
  return "bg-foreground/8 text-foreground/65";
}
