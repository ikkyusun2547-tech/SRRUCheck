import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { STORAGE_BUCKETS } from "@/lib/supabase/server";
import { removeFromBucket, uploadToBucket } from "@/lib/supabase/storage";
import { verifyQrToken } from "./qr-token";
import { evaluateCheckin, type FlagReason } from "./evaluate";
import { parseSelfieDataUrl } from "./selfie";

export class CheckinError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type CheckinRequest = {
  userId: string;
  token?: string;
  activityId?: string;
  lat?: number;
  lng?: number;
  deviceUuid: string;
  selfieDataUrl: string;
};

export type CheckinOutcome = {
  status: "auto_approved" | "flagged";
  flagReasons: FlagReason[];
};

const QR_TOKEN_SECRET = process.env.QR_TOKEN_SECRET ?? "";

export async function performCheckin(req: CheckinRequest): Promise<CheckinOutcome> {
  if (!QR_TOKEN_SECRET) {
    throw new CheckinError("SERVER_MISCONFIGURED", "QR_TOKEN_SECRET is not set");
  }

  // Resolve which activity this is for. A token's activityId is the only
  // trustworthy source when present — never trust a client-supplied
  // activityId for the QR path, only for the tokenless self-report path.
  let activityId: string;
  let tokenType: "live" | "printed" | null = null;

  if (req.token) {
    const verified = verifyQrToken(req.token, QR_TOKEN_SECRET);
    if (!verified.valid) {
      if (verified.reason === "EXPIRED") {
        throw new CheckinError("TOKEN_EXPIRED", "QR หมดอายุ กรุณาสแกนใหม่อีกครั้ง");
      }
      throw new CheckinError("INVALID_TOKEN", "QR ไม่ถูกต้อง กรุณาลองใหม่");
    }
    activityId = verified.activityId;
    tokenType = verified.type;
  } else if (req.activityId) {
    activityId = req.activityId;
  } else {
    throw new CheckinError("MISSING_TARGET", "ไม่พบข้อมูลกิจกรรมที่จะเช็คชื่อ");
  }

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) {
    throw new CheckinError("ACTIVITY_NOT_FOUND", "ไม่พบกิจกรรมนี้");
  }
  if (activity.status !== "open") {
    throw new CheckinError("ACTIVITY_CLOSED", "กิจกรรมนี้ปิดรับเช็คชื่อแล้ว");
  }

  const now = new Date();

  if (activity.checkinMethod === "realtime") {
    if (!tokenType) {
      throw new CheckinError("METHOD_MISMATCH", "กิจกรรมนี้ต้องเช็คชื่อด้วยการสแกน QR เท่านั้น");
    }
  } else {
    // self_report: only valid within the activity's scheduled window.
    if (now < activity.startTime || now > activity.endTime) {
      throw new CheckinError(
        "OUTSIDE_TIME_WINDOW",
        "อยู่นอกช่วงเวลาที่กำหนดให้แนบหลักฐานสำหรับกิจกรรมนี้"
      );
    }
  }

  if (activity.checkinMethod === "realtime" && activity.requiresGps) {
    if (req.lat == null || req.lng == null) {
      throw new CheckinError("GPS_REQUIRED", "กรุณาเปิดสิทธิ์การเข้าถึงตำแหน่งที่ตั้ง");
    }
  }

  const selfie = parseSelfieDataUrl(req.selfieDataUrl);
  if (!selfie) {
    throw new CheckinError("INVALID_SELFIE", "รูปเซลฟีไม่ถูกต้อง กรุณาถ่ายใหม่");
  }

  // Fast pre-check — not race-safe on its own, the DB unique constraint
  // below is the real guarantee, but this avoids an unnecessary upload for
  // the common "already checked in" case.
  const existing = await prisma.attendance.findUnique({
    where: { userId_activityId: { userId: req.userId, activityId } },
    select: { id: true },
  });
  if (existing) {
    throw new CheckinError("DUPLICATE_CHECKIN", "คุณเช็คชื่อกิจกรรมนี้ไปแล้ว");
  }

  const deviceAlreadyUsedByOtherUser =
    (await prisma.attendance.findFirst({
      where: {
        activityId,
        deviceUuid: req.deviceUuid,
        userId: { not: req.userId },
      },
      select: { id: true },
    })) !== null;

  const evaluation =
    activity.checkinMethod === "realtime"
      ? evaluateCheckin({
          method: "realtime",
          requiresGps: activity.requiresGps,
          allowedRadius: activity.allowedRadius,
          activityLat: activity.locationLat,
          activityLng: activity.locationLng,
          studentLat: req.lat ?? null,
          studentLng: req.lng ?? null,
          qrTokenType: tokenType!,
          deviceAlreadyUsedByOtherUser,
        })
      : evaluateCheckin({ method: "self_report", deviceAlreadyUsedByOtherUser });

  const photoPath = `${activityId}/${req.userId}-${Date.now()}.${selfie.extension}`;
  await uploadToBucket(STORAGE_BUCKETS.selfies, photoPath, selfie.buffer, selfie.contentType);

  try {
    await prisma.attendance.create({
      data: {
        userId: req.userId,
        activityId,
        checkinMethod: activity.checkinMethod === "realtime" ? "realtime" : "self_report",
        studentLat: req.lat ?? null,
        studentLng: req.lng ?? null,
        distanceMeters: evaluation.distanceMeters,
        deviceUuid: req.deviceUuid,
        photoPath,
        status: evaluation.status,
        flagReason: evaluation.flagReasons.length ? evaluation.flagReasons.join(",") : null,
      },
    });
  } catch (err) {
    // Duplicate check-in raced past the pre-check above — the unique
    // constraint is what actually guarantees idempotency. Clean up the
    // selfie we just uploaded so it doesn't leak.
    await removeFromBucket(STORAGE_BUCKETS.selfies, photoPath).catch(() => {});
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new CheckinError("DUPLICATE_CHECKIN", "คุณเช็คชื่อกิจกรรมนี้ไปแล้ว");
    }
    throw err;
  }

  return { status: evaluation.status, flagReasons: evaluation.flagReasons };
}
