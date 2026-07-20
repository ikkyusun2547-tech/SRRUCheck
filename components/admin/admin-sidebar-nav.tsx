"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import {
  OverviewIcon,
  ActivitiesIcon,
  LiveIcon,
  RequestsIcon,
  StudentsIcon,
  UsersShieldIcon,
  FacultiesIcon,
  SettingsIcon,
  AuditIcon,
  AnnouncementsIcon,
  ReportsIcon,
} from "./nav-icons";

type NavItem = { href: string; label: string };

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "/admin": OverviewIcon,
  "/admin/activities": ActivitiesIcon,
  "/admin/live": LiveIcon,
  "/admin/requests": RequestsIcon,
  "/admin/students": StudentsIcon,
  "/admin/users": UsersShieldIcon,
  "/admin/faculties": FacultiesIcon,
  "/admin/settings": SettingsIcon,
  "/admin/audit-log": AuditIcon,
  "/admin/announcements": AnnouncementsIcon,
  "/admin/reports": ReportsIcon,
};

// Purely visual grouping — same flat list of routes, just clustered with
// section labels so an 11-item menu reads as organized instead of a wall
// of links.
const GROUPS: { labelKey: "groupUsers" | "groupSystem" | null; hrefs: string[] }[] = [
  { labelKey: null, hrefs: ["/admin", "/admin/activities", "/admin/live", "/admin/requests"] },
  { labelKey: "groupUsers", hrefs: ["/admin/students", "/admin/users", "/admin/faculties"] },
  { labelKey: "groupSystem", hrefs: ["/admin/settings", "/admin/audit-log", "/admin/announcements", "/admin/reports"] },
];

export function AdminSidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const t = useTranslations("adminShell");
  const byHref = new Map(items.map((item) => [item.href, item]));

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-5">
      {GROUPS.map((group, i) => (
        <div key={i} className="flex flex-col gap-1">
          {group.labelKey && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">
              {t(group.labelKey)}
            </p>
          )}
          {group.hrefs.map((href) => {
            const item = byHref.get(href);
            if (!item) return null;
            const Icon = ICONS[href];
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-white/12 text-white shadow-sm"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-brand-emerald-400" />
                )}
                {Icon && (
                  <Icon
                    className={`shrink-0 transition-colors ${active ? "text-brand-emerald-400" : "text-white/45 group-hover:text-white/80"}`}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
