import { prisma } from "@/lib/prisma";
import { STORAGE_BUCKETS } from "@/lib/supabase/server";
import { removeFromBucket, uploadToBucket } from "@/lib/supabase/storage";
import { parseEvidenceDataUrl } from "./evidence";
import { currentBuddhistYear, getCreditTransferHourCap, getExternalActivityHourCap } from "./caps";
import type {
  CreditTransferRequestInput,
  ExternalActivityRequestInput,
  LateCheckInRequestInput,
} from "./validation";

export class RequestError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function createExternalActivityRequest(
  userId: string,
  input: ExternalActivityRequestInput
) {
  const evidence = parseEvidenceDataUrl(input.evidenceDataUrl);
  if (!evidence) {
    throw new RequestError("INVALID_EVIDENCE", "ไฟล์หลักฐานไม่ถูกต้อง กรุณาแนบรูปภาพหรือ PDF ใหม่");
  }

  const academicYear = currentBuddhistYear();
  const cap = await getExternalActivityHourCap();

  // Soft cap: a narrow TOCTOU race is possible between two concurrent
  // submissions from the same user (no DB-level running-total constraint
  // backs this), which is an acceptable tradeoff for a business limit that
  // isn't a security/identity guarantee like check-in idempotency.
  const usedAgg = await prisma.externalActivityRequest.aggregate({
    where: { userId, academicYear, status: { in: ["pending", "approved"] } },
    _sum: { hoursRequested: true },
  });
  const usedHours = usedAgg._sum.hoursRequested ?? 0;
  if (usedHours + input.hoursRequested > cap) {
    throw new RequestError(
      "HOUR_CAP_EXCEEDED",
      `เกินเพดานชั่วโมงที่ขอเทียบได้ต่อปี (${cap} ชม.) — ใช้ไปแล้ว ${usedHours} ชม.`
    );
  }

  const evidencePath = `${userId}/external-${Date.now()}.${evidence.extension}`;
  await uploadToBucket(STORAGE_BUCKETS.evidence, evidencePath, evidence.buffer, evidence.contentType);

  try {
    return await prisma.externalActivityRequest.create({
      data: {
        userId,
        title: input.title,
        activityCategory: input.activityCategory,
        hoursRequested: input.hoursRequested,
        evidenceFile: evidencePath,
        academicYear,
        status: "pending",
      },
    });
  } catch (err) {
    await removeFromBucket(STORAGE_BUCKETS.evidence, evidencePath).catch(() => {});
    throw err;
  }
}

export async function createCreditTransferRequest(
  userId: string,
  input: CreditTransferRequestInput
) {
  const evidence = parseEvidenceDataUrl(input.evidenceDataUrl);
  if (!evidence) {
    throw new RequestError("INVALID_EVIDENCE", "ไฟล์หลักฐานไม่ถูกต้อง กรุณาแนบรูปภาพหรือ PDF ใหม่");
  }

  const academicYear = currentBuddhistYear();
  const cap = await getCreditTransferHourCap();

  const usedAgg = await prisma.creditTransferRequest.aggregate({
    where: { userId, academicYear, status: { in: ["pending", "approved"] } },
    _sum: { hoursRequested: true },
  });
  const usedHours = usedAgg._sum.hoursRequested ?? 0;
  if (usedHours + input.hoursRequested > cap) {
    throw new RequestError(
      "HOUR_CAP_EXCEEDED",
      `เกินเพดานชั่วโมงที่ขอเทียบได้ต่อปี (${cap} ชม.) — ใช้ไปแล้ว ${usedHours} ชม.`
    );
  }

  const evidencePath = `${userId}/credit-transfer-${Date.now()}.${evidence.extension}`;
  await uploadToBucket(STORAGE_BUCKETS.evidence, evidencePath, evidence.buffer, evidence.contentType);

  try {
    return await prisma.creditTransferRequest.create({
      data: {
        userId,
        title: input.title,
        hoursRequested: input.hoursRequested,
        evidenceFile: evidencePath,
        academicYear,
        status: "pending",
      },
    });
  } catch (err) {
    await removeFromBucket(STORAGE_BUCKETS.evidence, evidencePath).catch(() => {});
    throw err;
  }
}

export async function createLateCheckInRequest(userId: string, input: LateCheckInRequestInput) {
  const activity = await prisma.activity.findUnique({ where: { id: input.activityId } });
  if (!activity) {
    throw new RequestError("ACTIVITY_NOT_FOUND", "ไม่พบกิจกรรม");
  }
  if (activity.status !== "closed") {
    throw new RequestError(
      "ACTIVITY_NOT_CLOSED",
      "ยื่นเช็คชื่อย้อนหลังได้เฉพาะกิจกรรมที่ปิดรับเช็คชื่อแล้วเท่านั้น"
    );
  }

  const existingAttendance = await prisma.attendance.findUnique({
    where: { userId_activityId: { userId, activityId: input.activityId } },
  });
  if (existingAttendance) {
    throw new RequestError("ALREADY_CHECKED_IN", "คุณมีการเช็คชื่อกิจกรรมนี้อยู่แล้ว");
  }

  const existingPending = await prisma.lateCheckInRequest.findFirst({
    where: { userId, activityId: input.activityId, status: "pending" },
  });
  if (existingPending) {
    throw new RequestError(
      "PENDING_REQUEST_EXISTS",
      "คุณมีคำร้องเช็คชื่อย้อนหลังกิจกรรมนี้ค้างอยู่แล้ว"
    );
  }

  return prisma.lateCheckInRequest.create({
    data: { userId, activityId: input.activityId, reason: input.reason, status: "pending" },
  });
}

export async function cancelExternalActivityRequest(userId: string, requestId: string) {
  const existing = await prisma.externalActivityRequest.findUnique({ where: { id: requestId } });
  if (!existing || existing.userId !== userId) {
    throw new RequestError("NOT_FOUND", "ไม่พบคำร้องนี้");
  }
  if (existing.status !== "pending") {
    throw new RequestError("NOT_CANCELLABLE", "ยกเลิกได้เฉพาะคำร้องที่ยังรอตรวจสอบเท่านั้น");
  }
  await prisma.externalActivityRequest.update({
    where: { id: requestId },
    data: { status: "cancelled" },
  });
}

export async function cancelCreditTransferRequest(userId: string, requestId: string) {
  const existing = await prisma.creditTransferRequest.findUnique({ where: { id: requestId } });
  if (!existing || existing.userId !== userId) {
    throw new RequestError("NOT_FOUND", "ไม่พบคำร้องนี้");
  }
  if (existing.status !== "pending") {
    throw new RequestError("NOT_CANCELLABLE", "ยกเลิกได้เฉพาะคำร้องที่ยังรอตรวจสอบเท่านั้น");
  }
  await prisma.creditTransferRequest.update({
    where: { id: requestId },
    data: { status: "cancelled" },
  });
}
