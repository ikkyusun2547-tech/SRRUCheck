import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getAuditLogPage } from "@/lib/audit/log";
import { actionTone } from "@/lib/audit/action-tone";
import { PageHero } from "@/components/admin/page-hero";
import { EmptyState } from "@/components/admin/empty-state";
import { AuditLogFilters } from "./audit-log-filters";

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; actor?: string }>;
}) {
  const { page: pageParam, action, actor } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const [{ items, total, totalPages }, t, tCommon, locale] = await Promise.all([
    getAuditLogPage(page, 30, { action, actorSearch: actor }),
    getTranslations("adminAuditLog"),
    getTranslations("common"),
    getLocale(),
  ]);
  const dateLocale = locale === "en" ? "en-US" : "th-TH";

  const filterQs = new URLSearchParams();
  if (action) filterQs.set("action", action);
  if (actor) filterQs.set("actor", actor);
  const pageHref = (p: number) => {
    const qs = new URLSearchParams(filterQs);
    qs.set("page", String(p));
    return `/admin/audit-log?${qs}`;
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        stats={[{ label: t("totalLabel"), value: total }]}
      />

      <AuditLogFilters initialAction={action ?? ""} initialActor={actor ?? ""} />

      {items.length === 0 ? (
        <EmptyState icon={<LogIcon />} message={t("emptyMessage")} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-foreground/10 bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-foreground/10 text-xs uppercase tracking-wide text-foreground/45">
                <tr>
                  <th className="py-3 pl-4 pr-4 font-medium">{t("tableTime")}</th>
                  <th className="py-3 pr-4 font-medium">{t("tableActor")}</th>
                  <th className="py-3 pr-4 font-medium">{t("tableAction")}</th>
                  <th className="py-3 pr-4 font-medium">{t("tableTarget")}</th>
                  <th className="py-3 pr-4 font-medium">{t("tableDetails")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr key={log.id} className="border-b border-foreground/5 align-top transition-colors last:border-0 hover:bg-foreground/[0.02]">
                    <td className="whitespace-nowrap py-2.5 pl-4 pr-4 text-foreground/60">
                      {log.createdAt.toLocaleString(dateLocale)}
                    </td>
                    <td className="py-2.5 pr-4 text-foreground/80">
                      {log.actor
                        ? [log.actor.firstName, log.actor.lastName].filter(Boolean).join(" ") || log.actor.email
                        : t("systemActor")}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs ${actionTone(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-foreground/60">
                      {log.targetType}
                      {log.targetId ? ` #${log.targetId.slice(-6)}` : ""}
                    </td>
                    <td className="max-w-xs truncate py-2.5 pr-4 text-xs text-foreground/45">
                      {log.changes ? JSON.stringify(log.changes) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-surface px-4 py-2.5 text-sm">
          <span className="text-foreground/50">{tCommon("pageOf", { page, totalPages })}</span>
          <div className="flex items-center gap-1.5">
            <Link
              href={pageHref(Math.max(1, page - 1))}
              className={`inline-flex items-center gap-1 rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/65 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600 ${
                page <= 1 ? "pointer-events-none opacity-35" : ""
              }`}
            >
              <ChevronLeftIcon />
              {tCommon("previous")}
            </Link>
            <Link
              href={pageHref(Math.min(totalPages, page + 1))}
              className={`inline-flex items-center gap-1 rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/65 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600 ${
                page >= totalPages ? "pointer-events-none opacity-35" : ""
              }`}
            >
              {tCommon("next")}
              <ChevronRightIcon />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function LogIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 6.5V11L14 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M10 3.5L5 8L10 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 3.5L11 8L6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
