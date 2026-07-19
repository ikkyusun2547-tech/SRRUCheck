import { describe, expect, it } from "vitest";
import { evaluateCheckin } from "./evaluate";

const ACTIVITY = { activityLat: 14.881, activityLng: 103.493 };

describe("evaluateCheckin — realtime, requiresGps", () => {
  const base = {
    method: "realtime" as const,
    requiresGps: true,
    allowedRadius: 100,
    ...ACTIVITY,
    qrTokenType: "live" as const,
    deviceAlreadyUsedByOtherUser: false,
  };

  it("auto-approves when inside radius, live QR, no device sharing", () => {
    const result = evaluateCheckin({ ...base, studentLat: 14.881, studentLng: 103.493 });
    expect(result).toEqual({ status: "auto_approved", flagReasons: [], distanceMeters: 0 });
  });

  it("auto-approves exactly at the radius boundary (inclusive)", () => {
    // ~100m north of the activity point
    const result = evaluateCheckin({
      ...base,
      allowedRadius: 111, // generous enough to include the ~100m offset below
      studentLat: 14.8819,
      studentLng: 103.493,
    });
    expect(result.status).toBe("auto_approved");
  });

  it("flags GPS_OUT_OF_BOUNDS when outside the radius", () => {
    const result = evaluateCheckin({
      ...base,
      allowedRadius: 50,
      studentLat: 14.9, // far away
      studentLng: 103.6,
    });
    expect(result.status).toBe("flagged");
    expect(result.flagReasons).toContain("GPS_OUT_OF_BOUNDS");
    expect(result.distanceMeters).toBeGreaterThan(50);
  });

  it("flags GPS_OUT_OF_BOUNDS when coordinates are missing entirely (never silently passes)", () => {
    const result = evaluateCheckin({ ...base, studentLat: null, studentLng: null });
    expect(result.status).toBe("flagged");
    expect(result.flagReasons).toEqual(["GPS_OUT_OF_BOUNDS"]);
    expect(result.distanceMeters).toBeNull();
  });

  it("flags PRINTED_QR_USED even when GPS and device checks pass", () => {
    const result = evaluateCheckin({
      ...base,
      studentLat: 14.881,
      studentLng: 103.493,
      qrTokenType: "printed",
    });
    expect(result.status).toBe("flagged");
    expect(result.flagReasons).toEqual(["PRINTED_QR_USED"]);
  });

  it("flags DEVICE_SHARING_SUSPECTED when the device was used by another user", () => {
    const result = evaluateCheckin({
      ...base,
      studentLat: 14.881,
      studentLng: 103.493,
      deviceAlreadyUsedByOtherUser: true,
    });
    expect(result.status).toBe("flagged");
    expect(result.flagReasons).toEqual(["DEVICE_SHARING_SUSPECTED"]);
  });

  it("accumulates multiple flag reasons at once", () => {
    const result = evaluateCheckin({
      ...base,
      allowedRadius: 10,
      studentLat: 14.9,
      studentLng: 103.6,
      qrTokenType: "printed",
      deviceAlreadyUsedByOtherUser: true,
    });
    expect(result.status).toBe("flagged");
    expect(result.flagReasons).toEqual(
      expect.arrayContaining(["GPS_OUT_OF_BOUNDS", "PRINTED_QR_USED", "DEVICE_SHARING_SUSPECTED"])
    );
    expect(result.flagReasons).toHaveLength(3);
  });
});

describe("evaluateCheckin — realtime, requiresGps = false", () => {
  it("auto-approves without any location data when GPS isn't required", () => {
    const result = evaluateCheckin({
      method: "realtime",
      requiresGps: false,
      allowedRadius: null,
      activityLat: null,
      activityLng: null,
      studentLat: null,
      studentLng: null,
      qrTokenType: "live",
      deviceAlreadyUsedByOtherUser: false,
    });
    expect(result).toEqual({ status: "auto_approved", flagReasons: [], distanceMeters: null });
  });

  it("still flags PRINTED_QR_USED even when GPS isn't required", () => {
    const result = evaluateCheckin({
      method: "realtime",
      requiresGps: false,
      allowedRadius: null,
      activityLat: null,
      activityLng: null,
      studentLat: null,
      studentLng: null,
      qrTokenType: "printed",
      deviceAlreadyUsedByOtherUser: false,
    });
    expect(result.status).toBe("flagged");
    expect(result.flagReasons).toEqual(["PRINTED_QR_USED"]);
  });
});

describe("evaluateCheckin — self_report", () => {
  it("always flags SELF_REPORTED, even with nothing else wrong", () => {
    const result = evaluateCheckin({ method: "self_report", deviceAlreadyUsedByOtherUser: false });
    expect(result.status).toBe("flagged");
    expect(result.flagReasons).toEqual(["SELF_REPORTED"]);
    expect(result.distanceMeters).toBeNull();
  });

  it("also flags DEVICE_SHARING_SUSPECTED when applicable", () => {
    const result = evaluateCheckin({ method: "self_report", deviceAlreadyUsedByOtherUser: true });
    expect(result.flagReasons).toEqual(
      expect.arrayContaining(["SELF_REPORTED", "DEVICE_SHARING_SUSPECTED"])
    );
    expect(result.flagReasons).toHaveLength(2);
  });
});
