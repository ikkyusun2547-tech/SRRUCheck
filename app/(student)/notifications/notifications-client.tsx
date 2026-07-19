"use client";

import { useEffect, useState } from "react";

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

  if (!items) return <p className="text-sm text-foreground/50">กำลังโหลด...</p>;
  if (items.length === 0) return <p className="text-sm text-foreground/50">ยังไม่มีการแจ้งเตือน</p>;

  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li
          key={n.id}
          onClick={() => !n.readAt && markRead(n.id)}
          className={`cursor-pointer rounded-md border p-3 text-sm ${
            n.readAt ? "border-foreground/10" : "border-brand-purple-600/40 bg-brand-purple-600/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="font-medium">{n.title}</p>
            {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-purple-600" />}
          </div>
          {n.body && <p className="mt-1 text-foreground/70">{n.body}</p>}
          <p className="mt-1 text-xs text-foreground/50">
            {new Date(n.createdAt).toLocaleString("th-TH")}
          </p>
        </li>
      ))}
    </ul>
  );
}
