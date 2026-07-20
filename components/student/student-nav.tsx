"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { HomeIcon, CalendarIcon, QrIcon, DocumentIcon, HistoryIcon, BellIcon, UserIcon } from "./nav-icons";

type NavKey = "dashboard" | "activities" | "checkin" | "requests" | "history" | "notifications" | "profile";
type NavItem = { href: string; label: string; key: NavKey };

const ICONS: Record<NavKey, ComponentType<{ className?: string }>> = {
  dashboard: HomeIcon,
  activities: CalendarIcon,
  checkin: QrIcon,
  requests: DocumentIcon,
  history: HistoryIcon,
  notifications: BellIcon,
  profile: UserIcon,
};

// A flat, single-row pill nav — the student app only has 7 destinations
// (vs. the admin sidebar's 11 grouped ones), so one scrollable row works at
// every breakpoint instead of needing a separate mobile drawer.
export function StudentNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="relative flex gap-1 overflow-x-auto px-3 pb-3 sm:px-5">
      {items.map((item) => {
        const Icon = ICONS[item.key];
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              active ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:bg-white/8 hover:text-white/90"
            }`}
          >
            <Icon className={active ? "text-brand-emerald-400" : "text-white/45"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
