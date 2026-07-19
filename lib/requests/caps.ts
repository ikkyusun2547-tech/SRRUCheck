import { prisma } from "@/lib/prisma";

const EXTERNAL_CAP_KEY = "external_activity_hour_cap_per_year";
const CREDIT_TRANSFER_CAP_KEY = "credit_transfer_hour_cap_per_year";

// Placeholder defaults — the spec requires *a* server-enforced per-year cap
// but doesn't specify the number. Admin can override via the Setting table
// once the settings UI exists (phase 4); until then these apply.
export const DEFAULT_EXTERNAL_ACTIVITY_HOUR_CAP = 20;
export const DEFAULT_CREDIT_TRANSFER_HOUR_CAP = 20;

async function getNumericSetting(key: string, fallback: number): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  const value = setting?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getExternalActivityHourCap(): Promise<number> {
  return getNumericSetting(EXTERNAL_CAP_KEY, DEFAULT_EXTERNAL_ACTIVITY_HOUR_CAP);
}

export function getCreditTransferHourCap(): Promise<number> {
  return getNumericSetting(CREDIT_TRANSFER_CAP_KEY, DEFAULT_CREDIT_TRANSFER_HOUR_CAP);
}

export function currentBuddhistYear(): number {
  return new Date().getFullYear() + 543;
}
