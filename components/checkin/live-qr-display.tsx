"use client";

import { useEffect, useState } from "react";
import { QR_ROTATE_INTERVAL_MS } from "@/lib/checkin/qr-token";

export function LiveQrDisplay({ activityId }: { activityId: string }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), QR_ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={tick}
        src={`/api/qr-token/live/${activityId}?t=${tick}`}
        alt="Live check-in QR"
        className="h-80 w-80 rounded-lg border border-foreground/10 bg-white p-4"
      />
      <p className="text-sm text-foreground/60">รหัสหมุนใหม่ทุก 15 วินาที</p>
    </div>
  );
}
