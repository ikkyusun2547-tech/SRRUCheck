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

  const [token, setToken] = useState<string | null>(initialToken);
  const [activityId, setActivityId] = useState<string | null>(
    initialToken ? extractActivityIdFromToken(initialToken) : null
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
      <div className="w-full max-w-sm space-y-3 text-center">
        <p className="text-4xl">{isApproved ? "✅" : "⚠️"}</p>
        <h2 className="text-lg font-semibold">
          {isApproved ? "เช็คชื่อสำเร็จ" : "บันทึกแล้ว รอตรวจสอบ"}
        </h2>
        {!isApproved && (
          <ul className="space-y-1 text-left text-sm text-foreground/70">
            {result.flagReasons.map((r) => (
              <li key={r}>• {FLAG_REASON_LABELS[r] ?? r}</li>
            ))}
          </ul>
        )}
        {!isApproved && (
          <p className="text-xs text-foreground/50">
            หากมีข้อสงสัยติดต่อกองพัฒนานักศึกษา (ข้อมูลติดต่อจะเพิ่มเข้ามาเร็วๆ นี้)
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand-purple-600 px-6 py-2 text-sm font-medium text-white"
        >
          เช็คชื่อกิจกรรมอื่น
        </button>
      </div>
    );
  }

  // --- Hard error (duplicate check-in, closed activity, invalid QR, etc.) ---
  if (error) {
    return (
      <div className="w-full max-w-sm space-y-3 text-center">
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-foreground/20 px-6 py-2 text-sm"
        >
          กลับไปเลือกกิจกรรม
        </button>
      </div>
    );
  }

  // --- Step: scanning a live QR ---
  if (scanning) {
    return (
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
    );
  }

  // --- Step: pick an activity (scan QR or self-report) ---
  if (!activityId) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <button
          type="button"
          onClick={() => setScanning(true)}
          className="w-full rounded-full bg-brand-purple-600 px-6 py-3 font-medium text-white"
        >
          สแกน QR เช็คชื่อ
        </button>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground/70">กิจกรรมที่เปิดอยู่</p>
          {openActivities === null && <p className="text-sm text-foreground/50">กำลังโหลด...</p>}
          {openActivities?.length === 0 && (
            <p className="text-sm text-foreground/50">ไม่มีกิจกรรมที่เปิดรับเช็คชื่ออยู่ตอนนี้</p>
          )}
          {openActivities?.map((a) => (
            <div key={a.id} className="rounded-md border border-foreground/10 p-3 text-sm">
              <p className="font-medium">{a.title}</p>
              <p className="text-xs text-foreground/50">
                {a.checkinMethod === "self_report" ? "แนบหลักฐานด้วยตนเอง" : "เช็คชื่อสดหน้างาน"}
                {a.locationName ? ` · ${a.locationName}` : ""}
              </p>
              <div className="mt-2 flex gap-2">
                {a.checkinMethod === "self_report" ? (
                  <button
                    type="button"
                    onClick={() => setActivityId(a.id)}
                    className="rounded-md bg-brand-emerald-500 px-3 py-1 text-xs font-medium text-white"
                  >
                    แนบหลักฐาน
                  </button>
                ) : (
                  <a
                    href={`/api/qr-token/printed/${a.id}?download=1`}
                    className="rounded-md border border-foreground/20 px-3 py-1 text-xs"
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
      <div className="w-full max-w-sm space-y-3 text-center">
        <h2 className="text-lg font-semibold">{activity.title}</h2>
        <p className="text-sm text-foreground/70">กิจกรรมนี้ต้องยืนยันตำแหน่งที่ตั้ง</p>
        {geoError && (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {geoError}
          </p>
        )}
        <button
          type="button"
          onClick={requestLocation}
          className="rounded-full bg-brand-purple-600 px-6 py-2 text-sm font-medium text-white"
        >
          แชร์ตำแหน่งที่ตั้ง
        </button>
      </div>
    );
  }

  // --- Step: selfie + submit ---
  if (submitting) {
    return <p className="text-sm text-foreground/50">กำลังส่งข้อมูล...</p>;
  }

  return (
    <div className="w-full max-w-sm space-y-3 text-center">
      <h2 className="text-lg font-semibold">{activity.title}</h2>
      <p className="text-sm text-foreground/70">ถ่ายเซลฟียืนยันตัวตนเพื่อเช็คชื่อ</p>
      <CameraCapture capturedDataUrl={selfie} onCapture={setSelfie} onRetake={() => setSelfie(null)} />
      {selfie && (
        <button
          type="button"
          onClick={() => submit(selfie)}
          className="w-full rounded-full bg-brand-emerald-500 px-6 py-2 text-sm font-medium text-white"
        >
          ยืนยันและส่ง
        </button>
      )}
    </div>
  );
}
