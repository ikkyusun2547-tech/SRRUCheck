import type { ActivityCategory, ActivityLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CATEGORY_CODE: Record<ActivityCategory, string> = {
  culture: "C",
  academic: "A",
  sports: "S",
  volunteer: "V",
  ethics: "E",
};

const LEVEL_DIGIT: Record<ActivityLevel, string> = {
  university: "0",
  faculty: "1",
};

/** Builds a self-describing activity code like `SRRU-A6900001`: category
 * letter, last 2 digits of the (Buddhist) academic year, level digit, and a
 * 4-digit sequence. The sequence counts every activity ever created in the
 * system — it never resets per year or category. */
export function buildActivityCode(
  category: ActivityCategory,
  academicYear: number,
  level: ActivityLevel,
  sequence: number
): string {
  const yearYY = String(academicYear).slice(-2).padStart(2, "0");
  const seq = String(sequence).padStart(4, "0");
  return `SRRU-${CATEGORY_CODE[category]}${yearYY}${LEVEL_DIGIT[level]}${seq}`;
}

/** The next candidate sequence number — callers should pass increasing
 * `attempt` values (1, 2, 3, ...) to retry past a rare race where two
 * activities are created concurrently and both read the same base count. */
export async function nextActivityCodeCandidate(
  category: ActivityCategory,
  academicYear: number,
  level: ActivityLevel,
  attempt: number
): Promise<string> {
  const existingCount = await prisma.activity.count();
  return buildActivityCode(category, academicYear, level, existingCount + attempt);
}
