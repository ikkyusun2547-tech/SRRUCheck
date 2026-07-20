"use client";

import { useEffect, useState } from "react";
import { QR_ROTATE_INTERVAL_MS } from "@/lib/checkin/qr-token";

export function LiveQrDisplay({
  activityId,
  className = "h-64 w-64 rounded-xl border border-foreground/10 bg-white p-3 shadow-sm",
}: {
  activityId: string;
  className?: string;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), QR_ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={tick} src={`/api/qr-token/live/${activityId}?t=${tick}`} alt="Live check-in QR" className={className} />
  );
}
