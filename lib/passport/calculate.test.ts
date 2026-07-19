import { describe, expect, it } from "vitest";
import { computePassportSummary, type PassportInput } from "./calculate";
import { DEFAULT_CRITERIA } from "./criteria";

const normalCriteria = DEFAULT_CRITERIA.normal; // 25 activities / 100 hours / [40,30,20,10]

function baseInput(overrides: Partial<PassportInput> = {}): PassportInput {
  return {
    programType: "normal",
    currentYear: 2,
    attendances: [],
    externalApproved: [],
    creditTransferApproved: [],
    ...overrides,
  };
}

describe("computePassportSummary", () => {
  it("returns all zeros and not passed for a student with nothing yet", () => {
    const result = computePassportSummary(baseInput(), normalCriteria);
    expect(result.totalHours).toBe(0);
    expect(result.totalActivitiesCount).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.categoryHours).toEqual({
      culture: 0,
      academic: 0,
      sports: 0,
      volunteer: 0,
      ethics: 0,
    });
  });

  it("sums hours per category and counts non-practice attendances", () => {
    const result = computePassportSummary(
      baseInput({
        attendances: [
          { activityType: "mandatory_core", activityCategory: "academic", creditHours: 3, creditedHoursOverride: null },
          { activityType: "mandatory_elective", activityCategory: "volunteer", creditHours: 2, creditedHoursOverride: null },
        ],
      }),
      normalCriteria
    );
    expect(result.totalHours).toBe(5);
    expect(result.totalActivitiesCount).toBe(2);
    expect(result.categoryHours.academic).toBe(3);
    expect(result.categoryHours.volunteer).toBe(2);
  });

  it("counts practice sessions toward hours but not the activity count", () => {
    const result = computePassportSummary(
      baseInput({
        attendances: [
          { activityType: "practice", activityCategory: "sports", creditHours: 1.5, creditedHoursOverride: null },
        ],
      }),
      normalCriteria
    );
    expect(result.totalHours).toBe(1.5);
    expect(result.totalActivitiesCount).toBe(0);
  });

  it("prefers the per-attendance creditedHours override over the activity default", () => {
    const result = computePassportSummary(
      baseInput({
        attendances: [
          { activityType: "mandatory_core", activityCategory: "ethics", creditHours: 3, creditedHoursOverride: 1 },
        ],
      }),
      normalCriteria
    );
    expect(result.totalHours).toBe(1);
    expect(result.categoryHours.ethics).toBe(1);
  });

  it("adds approved external-activity hours to both total and its category, not the activity count", () => {
    const result = computePassportSummary(
      baseInput({ externalApproved: [{ activityCategory: "culture", hoursApproved: 10 }] }),
      normalCriteria
    );
    expect(result.totalHours).toBe(10);
    expect(result.categoryHours.culture).toBe(10);
    expect(result.totalActivitiesCount).toBe(0);
  });

  it("adds approved credit-transfer hours to the total only, no category bucket", () => {
    const result = computePassportSummary(
      baseInput({ creditTransferApproved: [{ hoursApproved: 8 }] }),
      normalCriteria
    );
    expect(result.totalHours).toBe(8);
    expect(Object.values(result.categoryHours).every((v) => v === 0)).toBe(true);
  });

  it("is not passed when hours are met but activity count is short", () => {
    const attendances = Array.from({ length: 5 }, () => ({
      activityType: "mandatory_core" as const,
      activityCategory: "academic" as const,
      creditHours: 25,
      creditedHoursOverride: null,
    }));
    const result = computePassportSummary(baseInput({ attendances }), normalCriteria);
    expect(result.totalHours).toBe(125); // hours requirement met (>=100)
    expect(result.totalActivitiesCount).toBe(5); // but activity count requirement (25) is not
    expect(result.passed).toBe(false);
  });

  it("is not passed when activity count is met but hours are short", () => {
    const attendances = Array.from({ length: 25 }, () => ({
      activityType: "mandatory_core" as const,
      activityCategory: "academic" as const,
      creditHours: 1,
      creditedHoursOverride: null,
    }));
    const result = computePassportSummary(baseInput({ attendances }), normalCriteria);
    expect(result.totalActivitiesCount).toBe(25);
    expect(result.totalHours).toBe(25); // short of 100
    expect(result.passed).toBe(false);
  });

  it("passes exactly at the threshold (inclusive) for both count and hours", () => {
    const attendances = Array.from({ length: 25 }, () => ({
      activityType: "mandatory_core" as const,
      activityCategory: "academic" as const,
      creditHours: 4,
      creditedHoursOverride: null,
    }));
    const result = computePassportSummary(baseInput({ attendances }), normalCriteria);
    expect(result.totalActivitiesCount).toBe(25);
    expect(result.totalHours).toBe(100);
    expect(result.passed).toBe(true);
  });

  it.each([
    [1, 40],
    [2, 70],
    [3, 90],
    [4, 100],
  ])("cumulative target for year %i is %i", (year, expected) => {
    const result = computePassportSummary(baseInput({ currentYear: year }), normalCriteria);
    expect(result.yearlyCumulativeTarget).toBe(expected);
  });

  it("clamps year 5+ (ซ้ำชั้น) to the full 4-year cumulative target", () => {
    const result = computePassportSummary(baseInput({ currentYear: 6 }), normalCriteria);
    expect(result.yearlyCumulativeTarget).toBe(100);
  });

  it("falls back to year 1's target when currentYear is null", () => {
    const result = computePassportSummary(baseInput({ currentYear: null }), normalCriteria);
    expect(result.yearlyCumulativeTarget).toBe(40);
  });

  it("uses the special-program criteria when given (4 activities / 50 hours)", () => {
    const specialCriteria = DEFAULT_CRITERIA.special;
    const attendances = Array.from({ length: 4 }, () => ({
      activityType: "mandatory_core" as const,
      activityCategory: "academic" as const,
      creditHours: 12.5,
      creditedHoursOverride: null,
    }));
    const result = computePassportSummary(
      baseInput({ programType: "special", attendances }),
      specialCriteria
    );
    expect(result.requiredActivities).toBe(4);
    expect(result.requiredHours).toBe(50);
    expect(result.totalHours).toBe(50);
    expect(result.passed).toBe(true);
  });
});
