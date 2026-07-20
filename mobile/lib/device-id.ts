import * as Crypto from "expo-crypto";
import { getItem, setItem } from "./storage";

const STORAGE_KEY = "srru-device-id";

// Stable per-device identifier used for device-sharing detection — mirrors
// lib/checkin/device-id.ts's web version (localStorage there, this app's
// cross-platform storage layer here). Not a hardware fingerprint, just a
// random id persisted so the same phone reuses the same value across
// check-ins.
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = Crypto.randomUUID();
  await setItem(STORAGE_KEY, id);
  return id;
}
