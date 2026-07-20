import { prisma } from "@/lib/prisma";
import { getEligibleStudentIds } from "@/lib/notifications/eligibility";

/** Eligible students for an activity who have no attendance record at all
 * for it yet — i.e. haven't shown up, as opposed to attended-but-flagged. */
export async function getMissingStudentIds(activityId: string): Promise<string[]> {
  const eligibleIds = await getEligibleStudentIds(activityId);
  if (eligibleIds.length === 0) return [];

  const attended = await prisma.attendance.findMany({
    where: { activityId, userId: { in: eligibleIds } },
    select: { userId: true },
  });
  const attendedIds = new Set(attended.map((a) => a.userId));
  return eligibleIds.filter((id) => !attendedIds.has(id));
}
