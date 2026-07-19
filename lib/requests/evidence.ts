const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024; // 15MB — PDFs run larger than a selfie JPEG

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export type ParsedEvidence = { buffer: Buffer; contentType: string; extension: string };

/** Parses a `data:<mime>;base64,...` URL for external-activity / credit-transfer
 * evidence uploads — image or PDF, unlike the selfie capture which is JPEG-only. */
export function parseEvidenceDataUrl(dataUrl: string): ParsedEvidence | null {
  const match = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,(.+)$/.exec(
    dataUrl.trim()
  );
  if (!match) return null;

  const [, contentType, base64] = match;
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    return null;
  }

  if (buffer.length === 0 || buffer.length > MAX_EVIDENCE_BYTES) return null;
  if (!ALLOWED_MIME_TYPES.has(contentType)) return null;

  return { buffer, contentType, extension: EXTENSION_BY_MIME[contentType] };
}
