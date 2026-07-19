import { prisma } from "@/lib/prisma";

export type ProgramCriteria = {
  requiredActivities: number;
  requiredHours: number;
  /** Cumulative hour target by the end of each year of study, index 0 = year 1. */
  yearlyHourTargets: [number, number, number, number];
};

export type GraduationCriteria = {
  normal: ProgramCriteria;
  special: ProgramCriteria;
};

// Per the graduation-criteria table: ภาคปกติ 25 activities / 100 hours,
// กศ.บป. 4 activities / 50 hours. Yearly targets sum to the 4-year total
// (40+30+20+10=100, 20+15+10+5=50) — they're a pacing guide, not a
// separate per-year requirement.
export const DEFAULT_CRITERIA: GraduationCriteria = {
  normal: { requiredActivities: 25, requiredHours: 100, yearlyHourTargets: [40, 30, 20, 10] },
  special: { requiredActivities: 4, requiredHours: 50, yearlyHourTargets: [20, 15, 10, 5] },
};

const SETTING_KEY = "graduation_criteria";

/** Admin-overridable via the Setting table (key: graduation_criteria), falling
 * back to DEFAULT_CRITERIA — and falling back per-field if the stored value
 * is partial, so a malformed override never produces NaN targets. */
export async function getGraduationCriteria(): Promise<GraduationCriteria> {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting || typeof setting.value !== "object" || setting.value === null) {
    return DEFAULT_CRITERIA;
  }

  const override = setting.value as Partial<
    Record<"normal" | "special", Partial<ProgramCriteria>>
  >;

  return {
    normal: { ...DEFAULT_CRITERIA.normal, ...override.normal },
    special: { ...DEFAULT_CRITERIA.special, ...override.special },
  };
}

/** Cumulative target hours by the end of `currentYear` (clamped to 1..4 —
 * students beyond year 4, e.g. ซ้ำชั้น, are held to the full 4-year target). */
export function cumulativeYearTarget(criteria: ProgramCriteria, currentYear: number): number {
  const clamped = Math.min(Math.max(Math.trunc(currentYear) || 1, 1), 4);
  let sum = 0;
  for (let i = 0; i < clamped; i++) sum += criteria.yearlyHourTargets[i];
  return sum;
}
