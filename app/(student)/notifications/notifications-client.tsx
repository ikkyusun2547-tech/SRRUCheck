"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { BellIcon } from "@/components/student/nav-icons";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsClient() {
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications/mine")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setItems(d.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function markRead(id: string) {
    setItems((prev) =>
      prev ? prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)) : prev
    );
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
  }

  if (!items) return <p className="py-8 text-center text-sm text-foreground/50">กำลังโหลด...</p>;
  if (items.length === 0) {
    return <EmptyState icon={<BellIcon className="h-[22px] w-[22px]" />} message="ยังไม่มีการแจ้งเตือน" />;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((n) => (
        <li
          key={n.id}
          onClick={() => !n.readAt && markRead(n.id)}
          className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm transition-colors ${
            n.readAt
              ? "cursor-default border-foreground/10 bg-surface"
              : "cursor-pointer border-brand-purple-600/25 bg-brand-purple-50/50 hover:border-brand-purple-600/40 dark:bg-brand-purple-400/5"
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              n.readAt
                ? "bg-foreground/8 text-foreground/40"
                : "bg-brand-purple-100 text-brand-purple-600 dark:bg-brand-purple-400/15 dark:text-brand-purple-400"
            }`}
          >
            <BellIcon />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate font-medium text-foreground">{n.title}</p>
              {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-purple-600" aria-hidden />}
            </div>
            {n.body && <p className="mt-1 text-sm text-foreground/70">{n.body}</p>}
            <p className="mt-1.5 text-xs text-foreground/45">{new Date(n.createdAt).toLocaleString("th-TH")}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
