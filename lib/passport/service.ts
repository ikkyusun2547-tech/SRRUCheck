import { prisma } from "@/lib/prisma";
import { computePassportSummary, type PassportSummary } from "./calculate";
import { getGraduationCriteria } from "./criteria";

/**
 * Bulk/grouped passport calculation for an arbitrary set of users — one
 * query per table (Attendance, ExternalActivityRequest,
 * CreditTransferRequest, User), never one query per user. Used for a single
 * student's own dashboard (call with a 1-element array) and, in phase 4,
 * for the "students ready to graduate" report (call with every year-4
 * student id at once) — same code path either way.
 */
export async function getPassportSummaries(
  userIds: string[]
): Promise<Map<string, PassportSummary>> {
  if (userIds.length === 0) return new Map();

  const [users, criteria, attendances, externalApproved, creditTransferApproved] =
    await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, programType: true, currentYear: true },
      }),
      getGraduationCriteria(),
      prisma.attendance.findMany({
        where: { userId: { in: userIds }, status: "auto_approved" },
        select: {
          userId: true,
          creditedHours: true,
          activity: { select: { activityType: true, activityCategory: true, creditHours: true } },
        },
      }),
      prisma.externalActivityRequest.findMany({
        where: { userId: { in: userIds }, status: "approved" },
        select: { userId: true, activityCategory: true, hoursApproved: true },
      }),
      prisma.creditTransferRequest.findMany({
        where: { userId: { in: userIds }, status: "approved" },
        select: { userId: true, hoursApproved: true },
      }),
    ]);

  const attendancesByUser = new Map<string, typeof attendances>();
  for (const a of attendances) {
    const list = attendancesByUser.get(a.userId) ?? [];
    list.push(a);
    attendancesByUser.set(a.userId, list);
  }
  const externalByUser = new Map<string, typeof externalApproved>();
  for (const e of externalApproved) {
    const list = externalByUser.get(e.userId) ?? [];
    list.push(e);
    externalByUser.set(e.userId, list);
  }
  const creditTransferByUser = new Map<string, typeof creditTransferApproved>();
  for (const c of creditTransferApproved) {
    const list = creditTransferByUser.get(c.userId) ?? [];
    list.push(c);
    creditTransferByUser.set(c.userId, list);
  }

  const result = new Map<string, PassportSummary>();
  for (const user of users) {
    const programType = user.programType ?? "normal";
    const summary = computePassportSummary(
      {
        programType,
        currentYear: user.currentYear,
        attendances: (attendancesByUser.get(user.id) ?? []).map((a) => ({
          activityType: a.activity.activityType,
          activityCategory: a.activity.activityCategory,
          creditHours: a.activity.creditHours,
          creditedHoursOverride: a.creditedHours,
        })),
        externalApproved: (externalByUser.get(user.id) ?? []).map((e) => ({
          activityCategory: e.activityCategory,
          hoursApproved: e.hoursApproved ?? 0,
        })),
        creditTransferApproved: (creditTransferByUser.get(user.id) ?? []).map((c) => ({
          hoursApproved: c.hoursApproved ?? 0,
        })),
      },
      criteria[programType]
    );
    result.set(user.id, summary);
  }

  return result;
}

export async function getPassportSummary(userId: string): Promise<PassportSummary | null> {
  const summaries = await getPassportSummaries([userId]);
  return summaries.get(userId) ?? null;
}
