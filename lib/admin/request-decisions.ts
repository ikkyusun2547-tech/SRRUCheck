import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";

export class RequestDecisionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type Decision = "approved" | "rejected";

export async function decideExternalActivityRequest(
  adminId: string,
  requestId: string,
  decision: Decision,
  hoursApproved: number | undefined,
  adminComment: string | undefined
) {
  const existing = await prisma.externalActivityRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new RequestDecisionError("NOT_FOUND", "ไม่พบคำร้อง");
  if (existing.status !== "pending") {
    throw new RequestDecisionError("ALREADY_DECIDED", "คำร้องนี้ถูกตัดสินใจไปแล้ว");
  }

  const updated = await prisma.externalActivityRequest.update({
    where: { id: requestId },
    data: {
      status: decision,
      hoursApproved: decision === "approved" ? (hoursApproved ?? existing.hoursRequested) : null,
      adminComment: adminComment || null,
    },
  });

  await logAudit({
    actorId: adminId,
    action: `externalActivityRequest.${decision}`,
    targetType: "ExternalActivityRequest",
    targetId: requestId,
    changes: { hoursApproved: updated.hoursApproved, adminComment: updated.adminComment },
  });

  return updated;
}

export async function decideCreditTransferRequest(
  adminId: string,
  requestId: string,
  decision: Decision,
  hoursApproved: number | undefined,
  adminComment: string | undefined
) {
  const existing = await prisma.creditTransferRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new RequestDecisionError("NOT_FOUND", "ไม่พบคำร้อง");
  if (existing.status !== "pending") {
    throw new RequestDecisionError("ALREADY_DECIDED", "คำร้องนี้ถูกตัดสินใจไปแล้ว");
  }

  const updated = await prisma.creditTransferRequest.update({
    where: { id: requestId },
    data: {
      status: decision,
      hoursApproved: decision === "approved" ? (hoursApproved ?? existing.hoursRequested) : null,
      adminComment: adminComment || null,
    },
  });

  await logAudit({
    actorId: adminId,
    action: `creditTransferRequest.${decision}`,
    targetType: "CreditTransferRequest",
    targetId: requestId,
    changes: { hoursApproved: updated.hoursApproved, adminComment: updated.adminComment },
  });

  return updated;
}

/** Approving a late check-in request must also create the Attendance row it
 * stands in for — done inside one transaction so a lost race against the
 * unique (userId, activityId) constraint rolls the whole decision back
 * instead of leaving the request "approved" with no attendance to show for it. */
export async function decideLateCheckInRequest(
  adminId: string,
  requestId: string,
  decision: Decision,
  hoursApproved: number | undefined,
  adminComment: string | undefined
) {
  const existing = await prisma.lateCheckInRequest.findUnique({
    where: { id: requestId },
    include: { activity: true },
  });
  if (!existing) throw new RequestDecisionError("NOT_FOUND", "ไม่พบคำร้อง");
  if (existing.status !== "pending") {
    throw new RequestDecisionError("ALREADY_DECIDED", "คำร้องนี้ถูกตัดสินใจไปแล้ว");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.lateCheckInRequest.update({
        where: { id: requestId },
        data: {
          status: decision,
          hoursApproved: decision === "approved" ? (hoursApproved ?? existing.activity.creditHours) : null,
          adminComment: adminComment || null,
        },
      });

      if (decision === "approved") {
        await tx.attendance.create({
          data: {
            userId: existing.userId,
            activityId: existing.activityId,
            checkinMethod: "late_request",
            status: "auto_approved",
            creditedHours: hoursApproved ?? existing.activity.creditHours,
          },
        });
      }

      return req;
    });

    await logAudit({
      actorId: adminId,
      action: `lateCheckInRequest.${decision}`,
      targetType: "LateCheckInRequest",
      targetId: requestId,
      changes: { hoursApproved: updated.hoursApproved, adminComment: updated.adminComment },
    });

    return updated;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new RequestDecisionError(
        "ALREADY_CHECKED_IN",
        "นักศึกษามีการเช็คชื่อกิจกรรมนี้อยู่แล้ว ไม่สามารถอนุมัติซ้ำได้"
      );
    }
    throw err;
  }
}
