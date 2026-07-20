// Mirrors lib/checkin/qr-token.ts's extractActivityIdFromToken on the web —
// pure string parsing, no crypto, safe to duplicate here since the actual
// HMAC signing/verification (which needs Node's crypto, unavailable in
// React Native) only ever happens server-side in /api/checkin. This is
// UI-only: it decides which activity's info to fetch next, nothing more.
//
// Accepts either a bare token or a full checkin URL (buildCheckinUrl) —
// that's what the projector's live QR image actually encodes, so scanning
// it with the camera returns the whole URL, not just the token.
export function extractActivityIdFromToken(scanned: string): string | null {
  let token = scanned;
  try {
    const fromQuery = new URL(scanned).searchParams.get("token");
    if (fromQuery) token = fromQuery;
  } catch {
    // Not a URL — already a bare token.
  }

  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [type, activityId] = parts;
  if (type !== "live" && type !== "printed") return null;
  return activityId || null;
}
