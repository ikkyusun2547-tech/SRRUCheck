const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SELFIE_BYTES = 8 * 1024 * 1024; // 8MB

export type ParsedSelfie = { buffer: Buffer; contentType: string; extension: string };

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Parses a `data:image/...;base64,...` URL from the client-side camera capture. */
export function parseSelfieDataUrl(dataUrl: string): ParsedSelfie | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl.trim());
  if (!match) return null;

  const [, contentType, base64] = match;
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    return null;
  }

  if (buffer.length === 0 || buffer.length > MAX_SELFIE_BYTES) return null;
  if (!ALLOWED_MIME_TYPES.has(contentType)) return null;

  return { buffer, contentType, extension: EXTENSION_BY_MIME[contentType] };
}
