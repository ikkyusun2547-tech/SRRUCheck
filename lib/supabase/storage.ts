import { createSupabaseServiceClient } from "./server";

export async function uploadToBucket(
  bucket: string,
  path: string,
  data: Buffer,
  contentType: string
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.storage.from(bucket).upload(path, data, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw new Error(`Upload failed (${bucket}/${path}): ${error.message}`);
  }
}

/** Best-effort cleanup — used when an upload succeeded but the following DB
 * write failed (e.g. duplicate check-in race), so we don't leak the file. */
export async function removeFromBucket(bucket: string, path: string): Promise<void> {
  const supabase = createSupabaseServiceClient();
  await supabase.storage.from(bucket).remove([path]);
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 60 * 10
): Promise<string> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) {
    throw new Error(`Failed to create signed URL (${bucket}/${path}): ${error?.message}`);
  }
  return data.signedUrl;
}
