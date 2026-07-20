import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch, ApiError } from "@/lib/api";
import { pickEvidence } from "@/lib/evidence";
import { CATEGORY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/labels";

type ClosedActivity = { id: string; title: string; activityCode: string };

type Tab = "external" | "credit-transfer" | "late-checkin" | "mine";
const TAB_LABELS: Record<Tab, string> = {
  external: "กิจกรรมภายนอก",
  "credit-transfer": "เทียบชั่วโมงผู้นำ",
  "late-checkin": "เช็คชื่อย้อนหลัง",
  mine: "คำร้องของฉัน",
};
const TABS: Tab[] = ["external", "credit-transfer", "late-checkin", "mine"];

export default function Requests() {
  const [tab, setTab] = useState<Tab>("external");
  const [refreshKey, setRefreshKey] = useState(0);
  const [closedActivities, setClosedActivities] = useState<ClosedActivity[] | null>(null);

  useEffect(() => {
    apiFetch<{ activities: ClosedActivity[] }>("/api/activities/closed")
      .then((res) => setClosedActivities(res.activities))
      .catch(() => setClosedActivities([]));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABELS[t]}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "external" && <ExternalActivityForm onSubmitted={() => setRefreshKey((k) => k + 1)} />}
      {tab === "credit-transfer" && (
        <CreditTransferForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
      )}
      {tab === "late-checkin" && (
        <LateCheckInForm
          closedActivities={closedActivities}
          onSubmitted={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {tab === "mine" && <MyRequestsList refreshKey={refreshKey} />}
    </View>
  );
}

function FormShell({
  children,
  error,
  success,
}: {
  children: React.ReactNode;
  error: string | null;
  success: string | null;
}) {
  return (
    <View style={{ gap: 10 }}>
      {error && <Text style={styles.errorBox}>{error}</Text>}
      {success && <Text style={styles.successBox}>{success}</Text>}
      {children}
    </View>
  );
}

function EvidencePicker({
  fileName,
  onPick,
}: {
  fileName: string | null;
  onPick: (dataUrl: string, name: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function pick() {
    setBusy(true);
    try {
      const picked = await pickEvidence();
      if (picked) onPick(picked.dataUrl, picked.name);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <Text style={styles.label}>หลักฐาน (รูปภาพหรือ PDF)</Text>
      <Pressable style={styles.secondaryButton} onPress={pick} disabled={busy}>
        <Text style={styles.secondaryButtonText}>
          {busy ? "กำลังเลือกไฟล์..." : fileName ? fileName : "เลือกไฟล์"}
        </Text>
      </Pressable>
    </View>
  );
}

function ExternalActivityForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [hours, setHours] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [evidenceDataUrl, setEvidenceDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!evidenceDataUrl) {
      setError("กรุณาแนบหลักฐาน");
      return;
    }
    setPending(true);
    try {
      await apiFetch("/api/requests/external", {
        method: "POST",
        body: {
          title,
          activityCategory: category,
          hoursRequested: Number(hours),
          evidenceDataUrl,
        },
      });
      setSuccess("ยื่นคำร้องสำเร็จ รอแอดมินตรวจสอบ");
      setTitle("");
      setCategory("");
      setHours("");
      setFileName(null);
      setEvidenceDataUrl(null);
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  return (
    <FormShell error={error} success={success}>
      <View>
        <Text style={styles.label}>ชื่อกิจกรรม</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          accessibilityLabel="ชื่อกิจกรรม"
        />
      </View>
      <View>
        <Text style={styles.label}>หมวดหมู่</Text>
        <View style={styles.chipRow}>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <Pressable
              key={value}
              style={[styles.chip, category === value && styles.chipActive]}
              onPress={() => setCategory(value)}
            >
              <Text style={[styles.chipText, category === value && styles.chipTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Text style={styles.label}>จำนวนชั่วโมงที่ขอเทียบ</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={hours}
          onChangeText={setHours}
          accessibilityLabel="จำนวนชั่วโมงที่ขอเทียบ (กิจกรรมภายนอก)"
        />
      </View>
      <EvidencePicker
        fileName={fileName}
        onPick={(dataUrl, name) => {
          setEvidenceDataUrl(dataUrl);
          setFileName(name);
        }}
      />
      <Pressable
        style={[styles.primaryButton, pending && styles.disabled]}
        disabled={pending}
        onPress={submit}
      >
        <Text style={styles.primaryButtonText}>{pending ? "กำลังส่ง..." : "ยื่นคำร้อง"}</Text>
      </Pressable>
    </FormShell>
  );
}

function CreditTransferForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [evidenceDataUrl, setEvidenceDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!evidenceDataUrl) {
      setError("กรุณาแนบหลักฐาน");
      return;
    }
    setPending(true);
    try {
      await apiFetch("/api/requests/credit-transfer", {
        method: "POST",
        body: { title, hoursRequested: Number(hours), evidenceDataUrl },
      });
      setSuccess("ยื่นคำร้องสำเร็จ รอแอดมินตรวจสอบ");
      setTitle("");
      setHours("");
      setFileName(null);
      setEvidenceDataUrl(null);
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  return (
    <FormShell error={error} success={success}>
      <View>
        <Text style={styles.label}>ตำแหน่ง/เหตุผลที่ขอเทียบชั่วโมง</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          accessibilityLabel="ตำแหน่ง/เหตุผลที่ขอเทียบชั่วโมง"
        />
      </View>
      <View>
        <Text style={styles.label}>จำนวนชั่วโมงที่ขอเทียบ</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={hours}
          onChangeText={setHours}
          accessibilityLabel="จำนวนชั่วโมงที่ขอเทียบ (เทียบชั่วโมงผู้นำ)"
        />
      </View>
      <EvidencePicker
        fileName={fileName}
        onPick={(dataUrl, name) => {
          setEvidenceDataUrl(dataUrl);
          setFileName(name);
        }}
      />
      <Pressable
        style={[styles.primaryButton, pending && styles.disabled]}
        disabled={pending}
        onPress={submit}
      >
        <Text style={styles.primaryButtonText}>{pending ? "กำลังส่ง..." : "ยื่นคำร้อง"}</Text>
      </Pressable>
    </FormShell>
  );
}

function LateCheckInForm({
  closedActivities,
  onSubmitted,
}: {
  closedActivities: ClosedActivity[] | null;
  onSubmitted: () => void;
}) {
  const [activityId, setActivityId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      await apiFetch("/api/requests/late-checkin", {
        method: "POST",
        body: { activityId, reason },
      });
      setSuccess("ยื่นคำร้องสำเร็จ รอแอดมินตรวจสอบ");
      setActivityId("");
      setReason("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  if (closedActivities === null) return <ActivityIndicator style={{ marginTop: 16 }} />;

  if (closedActivities.length === 0) {
    return <Text style={styles.empty}>ยังไม่มีกิจกรรมที่ปิดรับเช็คชื่อแล้วให้ยื่นคำร้อง</Text>;
  }

  return (
    <FormShell error={error} success={success}>
      <View>
        <Text style={styles.label}>กิจกรรม</Text>
        {closedActivities.map((a) => (
          <Pressable
            key={a.id}
            style={[styles.activityOption, activityId === a.id && styles.activityOptionActive]}
            onPress={() => setActivityId(a.id)}
          >
            <Text style={activityId === a.id ? styles.activityOptionTextActive : styles.activityOptionText}>
              {a.title}
            </Text>
          </Pressable>
        ))}
      </View>
      <View>
        <Text style={styles.label}>เหตุผลที่เช็คชื่อไม่ทัน</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
          accessibilityLabel="เหตุผลที่เช็คชื่อไม่ทัน"
        />
      </View>
      <Pressable
        style={[styles.primaryButton, (pending || !activityId) && styles.disabled]}
        disabled={pending || !activityId}
        onPress={submit}
      >
        <Text style={styles.primaryButtonText}>{pending ? "กำลังส่ง..." : "ยื่นคำร้อง"}</Text>
      </Pressable>
    </FormShell>
  );
}

type MyRequestType = "external" | "credit-transfer" | "late-checkin";
type RequestItem = {
  id: string;
  title?: string;
  reason?: string;
  activityCategory?: string;
  hoursRequested?: number;
  hoursApproved?: number | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  adminComment?: string | null;
  createdAt: string;
  activity?: { title: string; activityCode: string };
};

function MyRequestsList({ refreshKey }: { refreshKey: number }) {
  const [type, setType] = useState<MyRequestType>("external");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: RequestItem[]; totalPages: number } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [type]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    apiFetch<{ items: RequestItem[]; totalPages: number }>(`/api/requests/mine?type=${type}&page=${page}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData({ items: [], totalPages: 1 });
      });
    return () => {
      cancelled = true;
    };
  }, [type, page, refreshKey]);

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      const endpoint = type === "external" ? "external" : "credit-transfer";
      await apiFetch(`/api/requests/${endpoint}/${id}/cancel`, { method: "POST" });
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.map((it) => (it.id === id ? { ...it, status: "cancelled" } : it)) }
          : prev
      );
    } catch {
      // leave item as-is; a real error would surface via the button staying enabled again
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.chipRow}>
        {(["external", "credit-transfer", "late-checkin"] as MyRequestType[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.chip, type === t && styles.chipActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{TAB_LABELS[t]}</Text>
          </Pressable>
        ))}
      </View>

      {!data && <ActivityIndicator style={{ marginTop: 12 }} />}
      {data?.items.length === 0 && <Text style={styles.empty}>ยังไม่มีคำร้อง</Text>}

      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{item.title ?? item.activity?.title ?? item.reason}</Text>
              <Text style={styles.rowMeta}>
                {item.hoursRequested != null ? `ขอ ${item.hoursRequested} ชม.` : ""}
                {item.hoursApproved != null ? ` · อนุมัติ ${item.hoursApproved} ชม.` : ""}
                {item.activityCategory ? ` · ${CATEGORY_LABELS[item.activityCategory]}` : ""}
              </Text>
              {item.adminComment && <Text style={styles.rowComment}>หมายเหตุ: {item.adminComment}</Text>}
              {item.status === "pending" && type !== "late-checkin" && (
                <Pressable
                  style={styles.cancelButton}
                  disabled={cancellingId === item.id}
                  onPress={() => handleCancel(item.id)}
                >
                  <Text style={styles.cancelButtonText}>
                    {cancellingId === item.id ? "กำลังยกเลิก..." : "ยกเลิกคำร้อง"}
                  </Text>
                </Pressable>
              )}
            </View>
            <View style={[styles.badge, badgeStyle(item.status)]}>
              <Text style={styles.badgeText}>{REQUEST_STATUS_LABELS[item.status]}</Text>
            </View>
          </View>
        )}
      />

      {data && data.totalPages > 1 && (
        <View style={styles.pager}>
          <Pressable
            style={[styles.pagerButton, page <= 1 && styles.pagerButtonDisabled]}
            disabled={page <= 1}
            onPress={() => setPage((p) => p - 1)}
          >
            <Text>ก่อนหน้า</Text>
          </Pressable>
          <Text style={styles.pagerLabel}>
            หน้า {page} / {data.totalPages}
          </Text>
          <Pressable
            style={[styles.pagerButton, page >= data.totalPages && styles.pagerButtonDisabled]}
            disabled={page >= data.totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            <Text>ถัดไป</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function badgeStyle(status: string) {
  if (status === "approved") return styles.badgeApproved;
  if (status === "rejected") return styles.badgeRejected;
  if (status === "cancelled") return styles.badgeCancelled;
  return styles.badgePending;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 14 },
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tab: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#d1d5db" },
  tabActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  tabText: { fontSize: 12, color: "#111827" },
  tabTextActive: { color: "#fff" },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 4, color: "#374151" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, fontSize: 14 },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  chipText: { fontSize: 12, color: "#111827" },
  chipTextActive: { color: "#fff" },
  activityOption: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  activityOptionActive: { backgroundColor: "#ede9fe", borderColor: "#7c3aed" },
  activityOptionText: { fontSize: 13, color: "#111827" },
  activityOptionTextActive: { fontSize: 13, color: "#5b21b6", fontWeight: "600" },
  primaryButton: { backgroundColor: "#10b981", borderRadius: 999, paddingVertical: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  secondaryButton: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, alignItems: "center" },
  secondaryButtonText: { fontSize: 13, color: "#111827" },
  disabled: { opacity: 0.6 },
  errorBox: {
    color: "#b91c1c",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
  },
  successBox: {
    color: "#047857",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
  },
  empty: { fontSize: 13, color: "#6b7280", marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, marginBottom: 8 },
  rowMain: { flex: 1 },
  rowTitle: { fontWeight: "600", fontSize: 14 },
  rowMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  rowComment: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  cancelButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8 },
  cancelButtonText: { fontSize: 11 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, height: 22 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  badgeApproved: { backgroundColor: "#d1fae5" },
  badgeRejected: { backgroundColor: "#fee2e2" },
  badgeCancelled: { backgroundColor: "#e5e7eb" },
  badgePending: { backgroundColor: "#fef3c7" },
  pager: { flexDirection: "row", alignItems: "center", gap: 12 },
  pagerButton: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  pagerButtonDisabled: { opacity: 0.4 },
  pagerLabel: { fontSize: 13 },
});
