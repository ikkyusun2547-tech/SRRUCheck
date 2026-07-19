import { haversineDistanceMeters } from "./geo";

export type FlagReason =
  | "GPS_OUT_OF_BOUNDS"
  | "DEVICE_SHARING_SUSPECTED"
  | "PRINTED_QR_USED"
  | "SELF_REPORTED";

export type EvaluateCheckinInput =
  | {
      method: "realtime";
      requiresGps: boolean;
      allowedRadius: number | null;
      activityLat: number | null;
      activityLng: number | null;
      studentLat: number | null;
      studentLng: number | null;
      qrTokenType: "live" | "printed";
      deviceAlreadyUsedByOtherUser: boolean;
    }
  | {
      method: "self_report";
      deviceAlreadyUsedByOtherUser: boolean;
    };

export type EvaluateCheckinResult = {
  status: "auto_approved" | "flagged";
  flagReasons: FlagReason[];
  distanceMeters: number | null;
};

export function evaluateCheckin(input: EvaluateCheckinInput): EvaluateCheckinResult {
  if (input.method === "self_report") {
    const flagReasons: FlagReason[] = ["SELF_REPORTED"];
    if (input.deviceAlreadyUsedByOtherUser) flagReasons.push("DEVICE_SHARING_SUSPECTED");
    // self_report always lands in review, regardless of any other signal.
    return { status: "flagged", flagReasons, distanceMeters: null };
  }

  const flagReasons: FlagReason[] = [];
  let distanceMeters: number | null = null;

  if (input.requiresGps) {
    const hasAllCoords =
      input.activityLat != null &&
      input.activityLng != null &&
      input.studentLat != null &&
      input.studentLng != null;

    if (!hasAllCoords) {
      // Can't verify location — never silently auto-approve in this case.
      flagReasons.push("GPS_OUT_OF_BOUNDS");
    } else {
      distanceMeters = haversineDistanceMeters(
        input.activityLat!,
        input.activityLng!,
        input.studentLat!,
        input.studentLng!
      );
      const radius = input.allowedRadius ?? 0;
      if (distanceMeters > radius) {
        flagReasons.push("GPS_OUT_OF_BOUNDS");
      }
    }
  }

  if (input.qrTokenType === "printed") {
    flagReasons.push("PRINTED_QR_USED");
  }

  if (input.deviceAlreadyUsedByOtherUser) {
    flagReasons.push("DEVICE_SHARING_SUSPECTED");
  }

  return {
    status: flagReasons.length === 0 ? "auto_approved" : "flagged",
    flagReasons,
    distanceMeters,
  };
}
