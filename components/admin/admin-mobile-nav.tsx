"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { AdminSidebarNav } from "./admin-sidebar-nav";
import { LogoutIcon, MenuIcon, CloseIcon } from "./nav-icons";

type NavItem = { href: string; label: string };

// The desktop <aside> sidebar is hidden entirely below `sm:` (no room for a
// 288px rail on a phone) — this is its mobile replacement: a slim top bar
// plus a slide-in drawer that reuses the same AdminSidebarNav content.
export function AdminMobileNav({
  navItems,
  appName,
  displayName,
  initial,
  adminRoleLabel,
  logoutLabel,
  onSignOut,
}: {
  navItems: NavItem[];
  appName: string;
  displayName: string;
  initial: string;
  adminRoleLabel: string;
  logoutLabel: string;
  onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-black/20 bg-brand-purple-950 px-4 py-3 text-white shadow-sm sm:hidden">
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon.svg" alt="" className="h-7 w-7 shrink-0 rounded-md" />
        <span className="text-sm font-bold">{appName}</span>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10"
      >
        <MenuIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-gradient-to-b from-brand-purple-950 to-[#1a0940] p-4 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-between px-1">
              <div className="flex min-w-0 items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon.svg" alt="" className="h-9 w-9 shrink-0 rounded-lg shadow-md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-tight">{appName}</p>
                  <p className="text-[11px] font-medium tracking-wide text-brand-emerald-400">ADMIN CONSOLE</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-0.5 text-white/70">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            <div className="flex-1">
              <AdminSidebarNav items={navItems} />
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple-400 to-brand-emerald-400 text-sm font-bold text-brand-purple-950">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{displayName}</p>
                  <p className="text-[11px] text-white/50">{adminRoleLabel}</p>
                </div>
              </div>
              <form action={onSignOut} className="mt-2">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogoutIcon />
                  {logoutLabel}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
