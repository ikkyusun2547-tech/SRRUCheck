import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit/log";
import { getGraduationCriteria } from "@/lib/passport/criteria";
import { getExternalActivityHourCap, getCreditTransferHourCap } from "@/lib/requests/caps";
import { settingsUpdateSchema } from "@/lib/admin/settings-validation";

// GET routes with no dynamic path segment default toward static
// optimization in Next.js — force dynamic so session/auth-scoped data is
// never cached or served stale across users.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [criteria, externalActivityHourCap, creditTransferHourCap] = await Promise.all([
    getGraduationCriteria(),
    getExternalActivityHourCap(),
    getCreditTransferHourCap(),
  ]);

  return NextResponse.json({ criteria, externalActivityHourCap, creditTransferHourCap });
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = settingsUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }
  const { criteria, externalActivityHourCap, creditTransferHourCap } = parsed.data;

  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: "graduation_criteria" },
      create: { key: "graduation_criteria", value: criteria },
      update: { value: criteria },
    }),
    prisma.setting.upsert({
      where: { key: "external_activity_hour_cap_per_year" },
      create: { key: "external_activity_hour_cap_per_year", value: externalActivityHourCap },
      update: { value: externalActivityHourCap },
    }),
    prisma.setting.upsert({
      where: { key: "credit_transfer_hour_cap_per_year" },
      create: { key: "credit_transfer_hour_cap_per_year", value: creditTransferHourCap },
      update: { value: creditTransferHourCap },
    }),
  ]);

  await logAudit({
    actorId: session.user.id,
    action: "settings.update",
    targetType: "Setting",
    changes: { criteria, externalActivityHourCap, creditTransferHourCap },
  });

  return NextResponse.json({ ok: true });
}
