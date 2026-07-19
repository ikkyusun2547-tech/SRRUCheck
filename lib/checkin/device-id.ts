const STORAGE_KEY = "srru-device-id";

/** Stable per-browser identifier used for device-sharing detection. Not a
 * hardware fingerprint — just a random id persisted in localStorage so the
 * same phone/browser reuses the same value across check-ins. */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
