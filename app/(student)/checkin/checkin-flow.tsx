"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QrScanner } from "@/components/checkin/qr-scanner";
import { CameraCapture } from "@/components/checkin/camera-capture";
import { getOrCreateDeviceId } from "@/lib/checkin/device-id";
import { extractActivityIdFromToken } from "@/lib/checkin/qr-token";
import { FLAG_REASON_LABELS } from "@/lib/labels";

type OpenActivity = {
  id: string;
  title: string;
  checkinMethod: "realtime" | "self_report";
  requiresGps: boolean;
  activityCode: string;
  locationName: string | null;
};

type ActivityInfo = {
  id: string;
  title: string;
  checkinMethod: "realtime" | "self_report";
  requiresGps: boolean;
  status: string;
  locationName: string | null;
};

type CheckinResult = { status: "auto_approved" | "flagged"; flagReasons: string[] };

export function CheckinFlow() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token");
  const initialActivityId = searchParams.get("activityId");

  const [token, setToken] = useState<string | null>(initialToken);
  const [activityId, setActivityId] = useState<string | null>(
    initialToken ? extractActivityIdFromToken(initialToken) : initialActivityId
  );
  const [scanning, setScanning] = useState(false);
  const [activity, setActivity] = useState<ActivityInfo | null>(null);
  const [openActivities, setOpenActivities] = useState<OpenActivity[] | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);

  useEffect(() => {
    if (activityId || result) return;
    fetch("/api/activities/open")
      .then((r) => r.json())
      .then((d) => setOpenActivities(d.activities ?? []))
      .catch(() => setOpenActivities([]));
  }, [activityId, result]);

  useEffect(() => {
    if (!activityId || activity) return;
    let cancelled = false;
    fetch(`/api/activities/${activityId}/info`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.activity) setActivity(d.activity);
        else setError(d.error ?? "ไม่พบกิจกรรม");
      })
      .catch(() => {
        if (!cancelled) setError("โหลดข้อมูลกิจกรรมไม่สำเร็จ");
      });
    return () => {
      cancelled = true;
    };
  }, [activityId, activity]);

  function reset() {
    setToken(null);
    setActivityId(null);
    setScanning(false);
    setActivity(null);
    setCoords(null);
    setGeoError(null);
    setSelfie(null);
    setSubmitting(false);
    setError(null);
    setResult(null);
  }

  function requestLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้งแล้วลองใหม่"
            : "ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่"
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function submit(selfieDataUrl: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token ?? undefined,
          activityId: token ? undefined : (activityId ?? undefined),
          lat: coords?.lat,
          lng: coords?.lng,
          deviceUuid: getOrCreateDeviceId(),
          selfieDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เช็คชื่อไม่สำเร็จ");
        setSubmitting(false);
        return;
      }
      setResult(data);
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
      setSubmitting(false);
    }
  }

  // --- Result ---
  if (result) {
    const isApproved = result.status === "auto_approved";
    return (
      <FlowCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isApproved
                ? "bg-brand-emerald-50 text-brand-emerald-600 dark:bg-brand-emerald-500/10 dark:text-brand-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            {isApproved ? <CheckIcon /> : <WarningIcon />}
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            {isApproved ? "เช็คชื่อสำเร็จ" : "บันทึกแล้ว รอตรวจสอบ"}
          </h2>
          {!isApproved && (
            <ul className="w-full space-y-1 rounded-lg bg-amber-50 p-3 text-left text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              {result.flagReasons.map((r) => (
                <li key={r} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                  {FLAG_REASON_LABELS[r] ?? r}
                </li>
              ))}
            </ul>
          )}
          {!isApproved && (
            <p className="text-xs text-foreground/45">
              หากมีข้อสงสัยติดต่อกองพัฒนานักศึกษา (ข้อมูลติดต่อจะเพิ่มเข้ามาเร็วๆ นี้)
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-2 w-full rounded-full bg-brand-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-purple-800"
          >
            เช็คชื่อกิจกรรมอื่น
          </button>
        </div>
      </FlowCard>
    );
  }

  // --- Hard error (duplicate check-in, closed activity, invalid QR, etc.) ---
  if (error) {
    return (
      <FlowCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <WarningIcon />
          </span>
          <p className="rounded-lg border border-red-500/30 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-full border border-foreground/15 px-6 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600"
          >
            กลับไปเลือกกิจกรรม
          </button>
        </div>
      </FlowCard>
    );
  }

  // --- Step: scanning a live QR ---
  if (scanning) {
    return (
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-foreground/10 shadow-sm">
        <QrScanner
          onScan={(data) => {
            setScanning(false);
            setToken(data);
            const id = extractActivityIdFromToken(data);
            if (!id) {
              setError("QR นี้ไม่ใช่ QR ของระบบ SRRU Check");
              return;
            }
            setActivityId(id);
          }}
        />
      </div>
    );
  }

  // --- Step: pick an activity (scan QR or self-report) ---
  if (!activityId) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <button
          type="button"
          onClick={() => setScanning(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-purple-600 px-6 py-3.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-purple-800"
        >
          <QrIcon />
          สแกน QR เช็คชื่อ
        </button>

        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground/70">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald-500" />
            กิจกรรมที่เปิดอยู่
          </p>
          {openActivities === null && <p className="text-sm text-foreground/50">กำลังโหลด...</p>}
          {openActivities?.length === 0 && (
            <p className="rounded-xl border border-dashed border-foreground/15 px-3 py-6 text-center text-sm text-foreground/45">
              ไม่มีกิจกรรมที่เปิดรับเช็คชื่ออยู่ตอนนี้
            </p>
          )}
          {openActivities?.map((a) => (
            <div key={a.id} className="rounded-xl border border-foreground/10 bg-surface p-3.5 shadow-sm">
              <p className="font-medium text-foreground">{a.title}</p>
              <p className="mt-0.5 text-xs text-foreground/50">
                {a.checkinMethod === "self_report" ? "แนบหลักฐานด้วยตนเอง" : "เช็คชื่อสดหน้างาน"}
                {a.locationName ? ` · ${a.locationName}` : ""}
              </p>
              <div className="mt-2.5 flex gap-2">
                {a.checkinMethod === "self_report" ? (
                  <button
                    type="button"
                    onClick={() => setActivityId(a.id)}
                    className="rounded-full bg-brand-emerald-500 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600"
                  >
                    แนบหลักฐาน
                  </button>
                ) : (
                  <a
                    href={`/api/qr-token/printed/${a.id}?download=1`}
                    className="rounded-full border border-foreground/15 px-3.5 py-1.5 text-xs font-medium text-foreground/65 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600"
                  >
                    ดาวน์โหลด QR สำรอง
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Loading activity info ---
  if (!activity) {
    return <p className="text-sm text-foreground/50">กำลังโหลดข้อมูลกิจกรรม...</p>;
  }

  // --- Step: GPS (only for realtime + requiresGps) ---
  const needsGps = activity.checkinMethod === "realtime" && activity.requiresGps;
  if (needsGps && !coords) {
    return (
      <FlowCard>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400">
            <PinIcon />
          </span>
          <h2 className="text-lg font-semibold text-foreground">{activity.title}</h2>
          <p className="text-sm text-foreground/60">กิจกรรมนี้ต้องยืนยันตำแหน่งที่ตั้ง</p>
          {geoError && (
            <p className="w-full rounded-lg border border-red-500/30 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {geoError}
            </p>
          )}
          <button
            type="button"
            onClick={requestLocation}
            className="mt-1 w-full rounded-full bg-brand-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-purple-800"
          >
            แชร์ตำแหน่งที่ตั้ง
          </button>
        </div>
      </FlowCard>
    );
  }

  // --- Step: selfie + submit ---
  if (submitting) {
    return <p className="text-sm text-foreground/50">กำลังส่งข้อมูล...</p>;
  }

  return (
    <FlowCard>
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-lg font-semibold text-foreground">{activity.title}</h2>
        <p className="text-sm text-foreground/60">ถ่ายเซลฟียืนยันตัวตนเพื่อเช็คชื่อ</p>
        <CameraCapture capturedDataUrl={selfie} onCapture={setSelfie} onRetake={() => setSelfie(null)} />
        {selfie && (
          <button
            type="button"
            onClick={() => submit(selfie)}
            className="w-full rounded-full bg-brand-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600"
          >
            ยืนยันและส่ง
          </button>
        )}
      </div>
    </FlowCard>
  );
}

function FlowCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-surface p-6 shadow-sm">{children}</div>
  );
}

function QrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2.2" y="2.2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10.8" y="2.2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.2" y="10.8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.8 10.8H13M14.6 10.8H15.8M10.8 13.4H12M13.4 13.4H15.8M10.8 15.8H15.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 14.5 12.3 17.8 19 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M14 4 25 23H3L14 4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 12v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="14" cy="20" r="1.1" fill="currentColor" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 16s5.5-4.7 5.5-9.2A5.5 5.5 0 0 0 9 1.3a5.5 5.5 0 0 0-5.5 5.5C3.5 11.3 9 16 9 16Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="6.8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
