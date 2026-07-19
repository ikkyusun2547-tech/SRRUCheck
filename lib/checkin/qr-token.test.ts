import { describe, expect, it } from "vitest";
import {
  generateQrToken,
  verifyQrToken,
  extractActivityIdFromToken,
  QR_ROTATE_INTERVAL_MS,
} from "./qr-token";

const SECRET = "test-secret";
const ACTIVITY_ID = "act_123";

describe("live QR token", () => {
  it("verifies a freshly generated token", () => {
    const now = Date.now();
    const token = generateQrToken(ACTIVITY_ID, "live", SECRET, now);
    const result = verifyQrToken(token, SECRET, now);
    expect(result).toEqual({ valid: true, type: "live", activityId: ACTIVITY_ID });
  });

  it("still verifies within one rotation window of drift", () => {
    const now = Date.now();
    const token = generateQrToken(ACTIVITY_ID, "live", SECRET, now);
    const result = verifyQrToken(token, SECRET, now + QR_ROTATE_INTERVAL_MS);
    expect(result.valid).toBe(true);
  });

  it("rejects a token older than the drift window (stale capture/screenshot)", () => {
    const now = Date.now();
    const token = generateQrToken(ACTIVITY_ID, "live", SECRET, now);
    const result = verifyQrToken(token, SECRET, now + QR_ROTATE_INTERVAL_MS * 3);
    expect(result).toEqual({ valid: false, reason: "EXPIRED" });
  });

  it("rejects a token from the future beyond drift (clock manipulation)", () => {
    const now = Date.now();
    const token = generateQrToken(ACTIVITY_ID, "live", SECRET, now + QR_ROTATE_INTERVAL_MS * 5);
    const result = verifyQrToken(token, SECRET, now);
    expect(result).toEqual({ valid: false, reason: "EXPIRED" });
  });

  it("rejects a tampered activityId (signature no longer matches)", () => {
    const now = Date.now();
    const token = generateQrToken(ACTIVITY_ID, "live", SECRET, now);
    const tampered = token.replace(ACTIVITY_ID, "act_999");
    const result = verifyQrToken(tampered, SECRET, now);
    expect(result).toEqual({ valid: false, reason: "BAD_SIGNATURE" });
  });

  it("rejects a token signed with a different secret", () => {
    const now = Date.now();
    const token = generateQrToken(ACTIVITY_ID, "live", SECRET, now);
    const result = verifyQrToken(token, "wrong-secret", now);
    expect(result).toEqual({ valid: false, reason: "BAD_SIGNATURE" });
  });

  it.each([
    ["empty string", ""],
    ["random garbage", "not-a-real-token"],
    ["too few segments", "live.act_123"],
    ["non-numeric window", "live.act_123.abc.deadbeef"],
    ["unknown type", "printedish.act_123.0.deadbeef"],
  ])("returns MALFORMED without throwing for %s", (_label, input) => {
    expect(() => verifyQrToken(input, SECRET)).not.toThrow();
    const result = verifyQrToken(input, SECRET);
    expect(result.valid).toBe(false);
  });
});

describe("printed (backup) QR token", () => {
  it("verifies regardless of how much time has passed", () => {
    const now = Date.now();
    const token = generateQrToken(ACTIVITY_ID, "printed", SECRET, now);
    const farFuture = now + 1000 * 60 * 60 * 24 * 30; // 30 days later
    const result = verifyQrToken(token, SECRET, farFuture);
    expect(result).toEqual({ valid: true, type: "printed", activityId: ACTIVITY_ID });
  });

  it("is distinguishable from a live token for the same activity/window", () => {
    const now = 0;
    const liveToken = generateQrToken(ACTIVITY_ID, "live", SECRET, now);
    const printedToken = generateQrToken(ACTIVITY_ID, "printed", SECRET, now);
    expect(liveToken).not.toBe(printedToken);

    const liveResult = verifyQrToken(liveToken, SECRET, now);
    const printedResult = verifyQrToken(printedToken, SECRET, now);
    expect(liveResult.valid && liveResult.type).toBe("live");
    expect(printedResult.valid && printedResult.type).toBe("printed");
  });

  it("rejects a tampered printed token", () => {
    const token = generateQrToken(ACTIVITY_ID, "printed", SECRET);
    const tampered = token.slice(0, -1) + (token.at(-1) === "0" ? "1" : "0");
    const result = verifyQrToken(tampered, SECRET);
    expect(result.valid).toBe(false);
  });
});

describe("extractActivityIdFromToken (client-side, unverified)", () => {
  it("reads the activityId out of a well-formed live token", () => {
    const token = generateQrToken(ACTIVITY_ID, "live", SECRET);
    expect(extractActivityIdFromToken(token)).toBe(ACTIVITY_ID);
  });

  it("reads the activityId out of a well-formed printed token", () => {
    const token = generateQrToken(ACTIVITY_ID, "printed", SECRET);
    expect(extractActivityIdFromToken(token)).toBe(ACTIVITY_ID);
  });

  it("still reads the id even with a bad signature — this helper is UI-only, not a trust boundary", () => {
    const token = generateQrToken(ACTIVITY_ID, "live", SECRET);
    const tampered = token.slice(0, -2) + "00";
    expect(extractActivityIdFromToken(tampered)).toBe(ACTIVITY_ID);
  });

  it("returns null for malformed input", () => {
    expect(extractActivityIdFromToken("garbage")).toBeNull();
    expect(extractActivityIdFromToken("")).toBeNull();
    expect(extractActivityIdFromToken("unknown.act_1.0.sig")).toBeNull();
  });
});
