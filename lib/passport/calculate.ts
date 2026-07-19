import type { ActivityCategory, ActivityType, ProgramType } from "@prisma/client";
import { cumulativeYearTarget, type ProgramCriteria } from "./criteria";

const ALL_CATEGORIES: ActivityCategory[] = ["culture", "academic", "sports", "volunteer", "ethics"];

export type AttendanceForPassport = {
  activityType: ActivityType;
  activityCategory: ActivityCategory;
  creditHours: number;
  creditedHoursOverride: number | null;
};

export type ApprovedExternalRequest = {
  activityCategory: ActivityCategory;
  hoursApproved: number;
};

export type ApprovedCreditTransfer = {
  hoursApproved: number;
};

export type PassportInput = {
  programType: ProgramType;
  currentYear: number | null;
  /** Already filtered to Attendance.status === 'auto_approved'. */
  attendances: AttendanceForPassport[];
  /** Already filtered to ExternalActivityRequest.status === 'approved'. */
  externalApproved: ApprovedExternalRequest[];
  /** Already filtered to CreditTransferRequest.status === 'approved'. */
  creditTransferApproved: ApprovedCreditTransfer[];
};

export type PassportSummary = {
  totalHours: number;
  totalActivitiesCount: number;
  categoryHours: Record<ActivityCategory, number>;
  requiredActivities: number;
  requiredHours: number;
  yearlyCumulativeTarget: number;
  passed: boolean;
};

export function computePassportSummary(
  input: PassportInput,
  criteria: ProgramCriteria
): PassportSummary {
  const categoryHours = Object.fromEntries(ALL_CATEGORIES.map((c) => [c, 0])) as Record<
    ActivityCategory,
    number
  >;
  let totalHours = 0;
  let totalActivitiesCount = 0;

  for (const a of input.attendances) {
    const hours = a.creditedHoursOverride ?? a.creditHours;
    totalHours += hours;
    categoryHours[a.activityCategory] += hours;
    // Practice sessions (ซ้อม) count toward hours but not the activity count.
    if (a.activityType !== "practice") totalActivitiesCount += 1;
  }

  // External activities count only toward hours + their own category — the
  // spec's activity-count rule is scoped to internal Attendance rows only.
  for (const e of input.externalApproved) {
    totalHours += e.hoursApproved;
    categoryHours[e.activityCategory] += e.hoursApproved;
  }

  // Credit-transfer hours count toward the total only — it isn't one of the
  // 5 tracked categories (it's a leadership-position credit, not an activity).
  for (const c of input.creditTransferApproved) {
    totalHours += c.hoursApproved;
  }

  return {
    totalHours,
    totalActivitiesCount,
    categoryHours,
    requiredActivities: criteria.requiredActivities,
    requiredHours: criteria.requiredHours,
    yearlyCumulativeTarget: cumulativeYearTarget(criteria, input.currentYear ?? 1),
    passed: totalActivitiesCount >= criteria.requiredActivities && totalHours >= criteria.requiredHours,
  };
}
