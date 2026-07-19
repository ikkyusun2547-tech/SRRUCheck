import { createHmac, timingSafeEqual } from "crypto";

// Live QR on the projector rotates every 15s. We accept the current window
// plus one window of drift each side (~15-30s total tolerance) to absorb
// client/server clock skew and the brief moment right at rotation.
export const QR_ROTATE_INTERVAL_MS = 15_000;
const WINDOW_DRIFT = 1;

export type QrTokenType = "live" | "printed";

export type QrVerifyResult =
  | { valid: true; type: QrTokenType; activityId: string }
  | { valid: false; reason: "MALFORMED" | "BAD_SIGNATURE" | "EXPIRED" };

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function currentWindow(now: number): number {
  return Math.floor(now / QR_ROTATE_INTERVAL_MS);
}

/**
 * type=live tokens are bound to the current 15s rotation window.
 * type=printed tokens (the downloadable backup QR) never expire by time —
 * the window field is just the issue time for bookkeeping — but always
 * flag PRINTED_QR_USED on the check-in side, enforced by the caller.
 */
export function generateQrToken(
  activityId: string,
  type: QrTokenType,
  secret: string,
  now: number = Date.now()
): string {
  const window = type === "live" ? currentWindow(now) : 0;
  const payload = `${type}.${activityId}.${window}`;
  const signature = sign(secret, payload);
  return `${payload}.${signature}`;
}

export function verifyQrToken(
  token: string,
  secret: string,
  now: number = Date.now()
): QrVerifyResult {
  if (typeof token !== "string" || !token) {
    return { valid: false, reason: "MALFORMED" };
  }

  const parts = token.split(".");
  if (parts.length !== 4) {
    return { valid: false, reason: "MALFORMED" };
  }
  const [type, activityId, windowStr, signature] = parts;

  if (type !== "live" && type !== "printed") {
    return { valid: false, reason: "MALFORMED" };
  }
  if (!activityId || !/^-?\d+$/.test(windowStr)) {
    return { valid: false, reason: "MALFORMED" };
  }

  const payload = `${type}.${activityId}.${windowStr}`;
  const expected = sign(secret, payload);

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    return { valid: false, reason: "BAD_SIGNATURE" };
  }

  if (type === "live") {
    const tokenWindow = Number(windowStr);
    const nowWindow = currentWindow(now);
    if (Math.abs(nowWindow - tokenWindow) > WINDOW_DRIFT) {
      return { valid: false, reason: "EXPIRED" };
    }
  }

  return { valid: true, type, activityId };
}

export function buildCheckinUrl(appBaseUrl: string, token: string): string {
  return `${appBaseUrl.replace(/\/$/, "")}/checkin?token=${encodeURIComponent(token)}`;
}

/**
 * Reads the activityId out of a token's plaintext structure without
 * verifying its signature. Safe to call client-side — it's only used to
 * know which activity's info to fetch for UI purposes; the token is always
 * re-verified server-side before anything security-relevant happens.
 */
export function extractActivityIdFromToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [type, activityId] = parts;
  if (type !== "live" && type !== "printed") return null;
  return activityId || null;
}
