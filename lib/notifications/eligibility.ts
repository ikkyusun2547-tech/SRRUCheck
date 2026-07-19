import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Students eligible for an activity: everyone, if it has no restrictions,
 * otherwise anyone matching at least one restriction row (each row's own
 * faculty/major/year fields are AND'd together; rows themselves are OR'd). */
export async function getEligibleStudentIds(activityId: string): Promise<string[]> {
  const restrictions = await prisma.activityRestriction.findMany({ where: { activityId } });

  if (restrictions.length === 0) {
    const all = await prisma.user.findMany({ where: { role: "student" }, select: { id: true } });
    return all.map((u) => u.id);
  }

  const orConditions: Prisma.UserWhereInput[] = restrictions.map((r) => ({
    ...(r.facultyId ? { facultyId: r.facultyId } : {}),
    ...(r.majorId ? { majorId: r.majorId } : {}),
    ...(r.yearLevel ? { currentYear: r.yearLevel } : {}),
  }));

  const eligible = await prisma.user.findMany({
    where: { role: "student", OR: orConditions },
    select: { id: true },
  });
  return eligible.map((u) => u.id);
}
