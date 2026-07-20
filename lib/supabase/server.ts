import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Buckets are private, so
// every upload/signed-url operation must go through server code — never
// ship the service role key to the browser.
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const STORAGE_BUCKETS = {
  selfies: process.env.SUPABASE_STORAGE_BUCKET_SELFIES ?? "attendance-selfies",
  evidence: process.env.SUPABASE_STORAGE_BUCKET_EVIDENCE ?? "evidence-files",
  activityCovers: process.env.SUPABASE_STORAGE_BUCKET_ACTIVITY_COVERS ?? "activity-covers",
} as const;
