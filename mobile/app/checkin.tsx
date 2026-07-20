import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { router } from "expo-router";
import { apiFetch, ApiError } from "@/lib/api";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { extractActivityIdFromToken } from "@/lib/qr-token";
import { notify } from "@/lib/notify";

const FLAG_REASON_LABEL_TH: Record<string, string> = {
  GPS_OUT_OF_BOUNDS: "อยู่นอกระยะที่กำหนดของกิจกรรม",
  DEVICE_SHARING_SUSPECTED: "อุปกรณ์นี้เคยถูกใช้เช็คชื่อกิจกรรมนี้จากบัญชีอื่นมาก่อน",
  PRINTED_QR_USED: "ใช้ QR สำรอง ไม่ใช่ QR สดหน้างาน",
  SELF_REPORTED: "รอเจ้าหน้าที่ตรวจสอบหลักฐาน",
};

type OpenActivity = {
  id: string;
  title: string;
  checkinMethod: "realtime" | "self_report";
  requiresGps: boolean;
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

type Step = "pick" | "scanning" | "loadingActivity" | "gps" | "selfie" | "submitting" | "result" | "error";

export default function Checkin() {
  const [step, setStep] = useState<Step>("pick");
  const [openActivities, setOpenActivities] = useState<OpenActivity[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activityId, setActivityId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityInfo | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (step !== "pick") return;
    apiFetch<{ activities: OpenActivity[] }>("/api/activities/open")
      .then((res) => setOpenActivities(res.activities))
      .catch(() => setOpenActivities([]));
  }, [step]);

  const loadActivity = useCallback(async (id: string) => {
    setStep("loadingActivity");
    try {
      const res = await apiFetch<{ activity: ActivityInfo }>(`/api/activities/${id}/info`);
      setActivity(res.activity);
      const needsGps = res.activity.checkinMethod === "realtime" && res.activity.requiresGps;
      setStep(needsGps ? "gps" : "selfie");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดข้อมูลกิจกรรมไม่สำเร็จ");
      setStep("error");
    }
  }, []);

  function reset() {
    setStep("pick");
    setToken(null);
    setActivityId(null);
    setActivity(null);
    setCoords(null);
    setSelfieUri(null);
    setSelfieBase64(null);
    setError(null);
    setResult(null);
    scannedRef.current = false;
  }

  async function startScanning() {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        notify("ต้องอนุญาตใช้กล้อง", "กรุณาอนุญาตการใช้กล้องเพื่อสแกน QR เช็คชื่อ");
        return;
      }
    }
    scannedRef.current = false;
    setStep("scanning");
  }

  function handleBarcodeScanned(result: { data: string }) {
    if (scannedRef.current) return;
    const id = extractActivityIdFromToken(result.data);
    if (!id) {
      setError("QR นี้ไม่ใช่ QR ของระบบ SRRU Check");
      setStep("error");
      return;
    }
    scannedRef.current = true;
    setToken(result.data);
    setActivityId(id);
    loadActivity(id);
  }

  function pickSelfReport(a: OpenActivity) {
    setActivityId(a.id);
    loadActivity(a.id);
  }

  async function requestLocation() {
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้งแล้วลองใหม่");
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStep("selfie");
    } catch {
      setError("ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่");
    }
  }

  async function captureSelfie() {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        notify("ต้องอนุญาตใช้กล้อง", "กรุณาอนุญาตการใช้กล้องเพื่อถ่ายเซลฟียืนยันตัวตน");
        return;
      }
    }
    const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.5 });
    if (!photo?.base64) {
      notify("ถ่ายรูปไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง");
      return;
    }
    setSelfieUri(photo.uri);
    setSelfieBase64(`data:image/jpeg;base64,${photo.base64}`);
  }

  async function submit() {
    if (!selfieBase64) return;
    setStep("submitting");
    setError(null);
    try {
      const deviceUuid = await getOrCreateDeviceId();
      const res = await apiFetch<CheckinResult>("/api/checkin", {
        method: "POST",
        body: {
          token: token ?? undefined,
          activityId: token ? undefined : (activityId ?? undefined),
          lat: coords?.lat,
          lng: coords?.lng,
          deviceUuid,
          selfieDataUrl: selfieBase64,
        },
      });
      setResult(res);
      setStep("result");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เช็คชื่อไม่สำเร็จ");
      setStep("error");
    }
  }

  // --- Result ---
  if (step === "result" && result) {
    const isApproved = result.status === "auto_approved";
    return (
      <View style={styles.center}>
        <Text style={styles.resultEmoji}>{isApproved ? "✅" : "⚠️"}</Text>
        <Text style={styles.resultTitle}>{isApproved ? "เช็คชื่อสำเร็จ" : "บันทึกแล้ว รอตรวจสอบ"}</Text>
        {!isApproved && (
          <View style={{ alignSelf: "stretch" }}>
            {result.flagReasons.map((r) => (
              <Text key={r} style={styles.reasonText}>
                • {FLAG_REASON_LABEL_TH[r] ?? r}
              </Text>
            ))}
          </View>
        )}
        <Pressable style={styles.primaryButton} onPress={reset}>
          <Text style={styles.primaryButtonText}>เช็คชื่อกิจกรรมอื่น</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/dashboard")}>
          <Text style={styles.linkText}>กลับแดชบอร์ด</Text>
        </Pressable>
      </View>
    );
  }

  // --- Hard error ---
  if (step === "error") {
    return (
      <View style={styles.center}>
        <Text style={styles.errorBox}>{error}</Text>
        <Pressable style={styles.secondaryButton} onPress={reset}>
          <Text style={styles.secondaryButtonText}>กลับไปเลือกกิจกรรม</Text>
        </Pressable>
      </View>
    );
  }

  // --- Scanning ---
  if (step === "scanning") {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <Text style={styles.hint}>เล็งกล้องไปที่ QR Code หน้างาน</Text>
        <Pressable style={styles.secondaryButton} onPress={reset}>
          <Text style={styles.secondaryButtonText}>ยกเลิก</Text>
        </Pressable>
      </View>
    );
  }

  // --- Pick activity ---
  if (step === "pick") {
    return (
      <View style={styles.container}>
        <Pressable style={styles.primaryButton} onPress={startScanning}>
          <Text style={styles.primaryButtonText}>สแกน QR เช็คชื่อ</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>กิจกรรมที่เปิดอยู่</Text>
        {openActivities === null && <ActivityIndicator />}
        {openActivities?.length === 0 && <Text style={styles.hint}>ไม่มีกิจกรรมที่เปิดรับเช็คชื่ออยู่ตอนนี้</Text>}
        <FlatList
          data={openActivities ?? []}
          keyExtractor={(a) => a.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.activityRow}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityMeta}>
                {item.checkinMethod === "self_report" ? "แนบหลักฐานด้วยตนเอง" : "เช็คชื่อสดหน้างาน (สแกน QR)"}
                {item.locationName ? ` · ${item.locationName}` : ""}
              </Text>
              {item.checkinMethod === "self_report" && (
                <Pressable style={styles.smallButton} onPress={() => pickSelfReport(item)}>
                  <Text style={styles.smallButtonText}>แนบหลักฐาน</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      </View>
    );
  }

  // --- Loading activity info ---
  if (step === "loadingActivity" || !activity) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.hint}>กำลังโหลดข้อมูลกิจกรรม...</Text>
      </View>
    );
  }

  // --- GPS ---
  if (step === "gps") {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.subtitle}>กิจกรรมนี้ต้องยืนยันตำแหน่งที่ตั้ง</Text>
        {error && <Text style={styles.errorBox}>{error}</Text>}
        <Pressable style={styles.primaryButton} onPress={requestLocation}>
          <Text style={styles.primaryButtonText}>แชร์ตำแหน่งที่ตั้ง</Text>
        </Pressable>
      </View>
    );
  }

  // --- Submitting ---
  if (step === "submitting") {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.hint}>กำลังส่งข้อมูล...</Text>
      </View>
    );
  }

  // --- Selfie ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.subtitle}>ถ่ายเซลฟียืนยันตัวตนเพื่อเช็คชื่อ</Text>

      {selfieUri ? (
        <View style={styles.cameraContainer}>
          <View style={styles.selfiePreview}>
            <Image source={{ uri: selfieUri }} style={styles.selfieImage} />
          </View>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              setSelfieUri(null);
              setSelfieBase64(null);
            }}
          >
            <Text style={styles.secondaryButtonText}>ถ่ายใหม่</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={submit}>
            <Text style={styles.primaryButtonText}>ยืนยันและส่ง</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing="front" />
          <Pressable style={styles.primaryButton} onPress={captureSelfie}>
            <Text style={styles.primaryButtonText}>ถ่ายรูป</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  hint: { fontSize: 12, color: "#6b7280", textAlign: "center" },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginTop: 8 },
  primaryButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#111827", fontWeight: "600" },
  smallButton: {
    alignSelf: "flex-start",
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  smallButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  activityRow: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  activityTitle: { fontWeight: "600" },
  activityMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  cameraContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20 },
  camera: { width: 280, height: 280, borderRadius: 12, overflow: "hidden" },
  selfiePreview: { width: 280, height: 280, borderRadius: 12, overflow: "hidden", backgroundColor: "#000" },
  selfieImage: { width: 280, height: 280 },
  errorBox: {
    color: "#b91c1c",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    textAlign: "center",
  },
  resultEmoji: { fontSize: 48 },
  resultTitle: { fontSize: 18, fontWeight: "700" },
  reasonText: { fontSize: 13, color: "#6b7280" },
  linkText: { color: "#7c3aed", fontSize: 13, marginTop: 4 },
});
