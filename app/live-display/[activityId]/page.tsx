import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { LiveQrDisplay } from "@/components/checkin/live-qr-display";

// Deliberately outside the (admin) route group — no sidebar, no admin
// chrome, just the QR at presentation scale for projecting on a screen at
// the event. Still gated behind the same admin session check as the rest
// of /admin since it exposes a live rotating check-in code.
export default async function LiveDisplayPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const { activityId } = await params;
  const t = await getTranslations("adminLive");

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, title: true, activityCode: true, checkinMethod: true },
  });

  if (!activity || activity.checkinMethod !== "realtime") notFound();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#1e0b47] via-brand-purple-800 to-brand-purple-600 px-6 py-12 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-brand-emerald-400/25 blur-[90px]"
      />

      <Link
        href={`/admin/live?activityId=${activity.id}`}
        className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <BackGlyph />
        {t("backToControl")}
      </Link>

      <div className="relative flex flex-col items-center gap-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-emerald-400/15 px-4 py-1.5 text-sm font-bold tracking-wide text-brand-emerald-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-emerald-400" />
          </span>
          {t("liveBadge")}
        </span>

        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{activity.title}</h1>
          <p className="mt-1 font-mono text-sm text-white/50">{activity.activityCode}</p>
        </div>

        <LiveQrDisplay
          activityId={activity.id}
          className="h-[min(70vw,26rem)] w-[min(70vw,26rem)] rounded-2xl border border-white/10 bg-white p-5 shadow-2xl shadow-black/30"
        />

        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
          <ClockGlyph />
          {t("qrRotateNote")}
        </span>
      </div>
    </div>
  );
}

function BackGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M10 3.5L5 8L10 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.8V8L10.2 9.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
