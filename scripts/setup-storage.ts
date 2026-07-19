// One-time setup: create the private Supabase Storage buckets this app
// needs. Run with `npm run storage:setup` after DATABASE_URL / Supabase
// keys in .env point at a real project.
//
// Buckets are private — the app always serves files through signed URLs
// generated server-side, since selfies/evidence are personal data.

import { createSupabaseServiceClient, STORAGE_BUCKETS } from "../lib/supabase/server";

async function ensureBucket(name: string) {
  const supabase = createSupabaseServiceClient();
  const { data: existing } = await supabase.storage.getBucket(name);

  if (existing) {
    console.log(`- bucket "${name}" already exists, skipping`);
    return;
  }

  const { error } = await supabase.storage.createBucket(name, {
    public: false,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  });

  if (error) {
    throw new Error(`Failed to create bucket "${name}": ${error.message}`);
  }

  console.log(`- created private bucket "${name}"`);
}

async function main() {
  console.log("Setting up Supabase Storage buckets...");
  await ensureBucket(STORAGE_BUCKETS.selfies);
  await ensureBucket(STORAGE_BUCKETS.evidence);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
