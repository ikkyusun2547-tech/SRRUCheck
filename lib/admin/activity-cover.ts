const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5MB — a display image, not a security photo

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ParsedCoverImage = { buffer: Buffer; contentType: string; extension: string };

/** Parses a `data:<mime>;base64,...` URL for an activity cover image upload. */
export function parseCoverImageDataUrl(dataUrl: string): ParsedCoverImage | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl.trim());
  if (!match) return null;

  const [, contentType, base64] = match;
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    return null;
  }

  if (buffer.length === 0 || buffer.length > MAX_COVER_BYTES) return null;
  if (!ALLOWED_MIME_TYPES.has(contentType)) return null;

  return { buffer, contentType, extension: EXTENSION_BY_MIME[contentType] };
}
