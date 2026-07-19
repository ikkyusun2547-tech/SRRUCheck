"use client";

import { useEffect, useRef, useState } from "react";

type CameraCaptureProps = {
  onCapture: (dataUrl: string) => void;
  capturedDataUrl: string | null;
  onRetake: () => void;
};

// Opens the front camera directly via getUserMedia and grabs a canvas
// snapshot — deliberately not a plain <input type="file" capture="user">,
// which on some browsers still lets the user fall back to the gallery.
// This component never presents a file picker at all.
export function CameraCapture({ onCapture, capturedDataUrl, onRetake }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (capturedDataUrl) return; // already have a photo, no need for the stream

    let cancelled = false;
    setError(null);
    setReady(false);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        // Wait for real frame dimensions before allowing capture — right
        // after getUserMedia resolves, videoWidth/videoHeight can still be
        // 0 for a moment, which would silently produce an empty image.
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (!cancelled) setReady(true);
          };
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("เปิดกล้องหน้าไม่ได้ กรุณาอนุญาตการใช้กล้องแล้วลองใหม่");
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [capturedDataUrl]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("กล้องยังไม่พร้อม กรุณาลองใหม่อีกครั้ง");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    onCapture(canvas.toDataURL("image/jpeg", 0.85));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  if (capturedDataUrl) {
    return (
      <div className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capturedDataUrl}
          alt="เซลฟียืนยันตัวตน"
          className="aspect-square w-full max-w-xs rounded-lg object-cover"
        />
        <button
          type="button"
          onClick={onRetake}
          className="rounded-md border border-foreground/20 px-4 py-2 text-sm"
        >
          ถ่ายใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-square w-full max-w-xs rounded-lg bg-black object-cover"
        />
      )}
      <button
        type="button"
        onClick={handleCapture}
        disabled={!ready}
        className="rounded-full bg-brand-purple-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        ถ่ายรูป
      </button>
    </div>
  );
}
