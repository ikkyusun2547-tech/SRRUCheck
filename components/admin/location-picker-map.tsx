"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at module load time — must never render on the server.
const LocationPickerMapInner = dynamic(() => import("./location-picker-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 w-full items-center justify-center rounded-lg border border-foreground/10 text-sm text-foreground/50">
      กำลังโหลดแผนที่...
    </div>
  ),
});

export { LocationPickerMapInner as LocationPickerMap };
