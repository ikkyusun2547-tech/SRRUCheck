import type { ActivityCategory } from "@prisma/client";

// Shared category color mapping — dot/bar fill and dot+text accents stay in
// sync everywhere a category is shown (activities list, dashboard charts)
// since they all read from this one source instead of re-picking hues.
export const CATEGORY_DOT: Record<ActivityCategory, string> = {
  culture: "bg-amber-500",
  academic: "bg-blue-500",
  sports: "bg-cyan-500",
  volunteer: "bg-rose-500",
  ethics: "bg-violet-500",
};

export const CATEGORY_TEXT: Record<ActivityCategory, string> = {
  culture: "text-amber-700 dark:text-amber-400",
  academic: "text-blue-700 dark:text-blue-400",
  sports: "text-cyan-700 dark:text-cyan-400",
  volunteer: "text-rose-700 dark:text-rose-400",
  ethics: "text-violet-700 dark:text-violet-400",
};

export const CATEGORY_ORDER: ActivityCategory[] = ["academic", "culture", "sports", "volunteer", "ethics"];
