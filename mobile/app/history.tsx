import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";
import {
  ATTENDANCE_STATUS_LABELS,
  FLAG_REASON_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/labels";

type Tab = "attendance" | "external" | "credit-transfer" | "late-checkin";

const TAB_LABELS: Record<Tab, string> = {
  attendance: "การเช็คชื่อ",
  external: "กิจกรรมภายนอก",
  "credit-transfer": "เทียบชั่วโมงผู้นำ",
  "late-checkin": "เช็คชื่อย้อนหลัง",
};
const TABS: Tab[] = ["attendance", "external", "credit-transfer", "late-checkin"];

type AttendanceItem = {
  id: string;
  checkinTime: string;
  status: "auto_approved" | "flagged" | "rejected";
  flagReason: string | null;
  distanceMeters: number | null;
  activity: { title: string; activityCode: string; creditHours: number };
};

type RequestItem = {
  id: string;
  title?: string;
  reason?: string;
  hoursRequested?: number;
  hoursApproved?: number | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  activity?: { title: string; activityCode: string };
};

export default function History() {
  const [tab, setTab] = useState<Tab>("attendance");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    items: (AttendanceItem | RequestItem)[];
    totalPages: number;
  } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    const url =
      tab === "attendance"
        ? `/api/attendance/mine?page=${page}`
        : `/api/requests/mine?type=${tab}&page=${page}`;
    apiFetch<{ items: (AttendanceItem | RequestItem)[]; totalPages: number }>(url)
      .then((d) => {
        if (!cancelled) setData({ items: d.items, totalPages: d.totalPages });
      })
      .catch(() => {
        if (!cancelled) setData({ items: [], totalPages: 1 });
      });
    return () => {
      cancelled = true;
    };
  }, [tab, page]);

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

      {!data && <ActivityIndicator style={{ marginTop: 16 }} />}
      {data?.items.length === 0 && <Text style={styles.empty}>ยังไม่มีข้อมูล</Text>}

      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          tab === "attendance" ? (
            <AttendanceRow item={item as AttendanceItem} />
          ) : (
            <RequestRow item={item as RequestItem} />
          )
        }
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

function StatusBadge({ status, labels }: { status: string; labels: Record<string, string> }) {
  const tone =
    status === "auto_approved" || status === "approved"
      ? styles.badgeApproved
      : status === "rejected"
        ? styles.badgeRejected
        : status === "cancelled"
          ? styles.badgeCancelled
          : styles.badgePending;
  return (
    <View style={[styles.badge, tone]}>
      <Text style={styles.badgeText}>{labels[status] ?? status}</Text>
    </View>
  );
}

function AttendanceRow({ item }: { item: AttendanceItem }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{item.activity.title}</Text>
        <Text style={styles.rowMeta}>
          {new Date(item.checkinTime).toLocaleString("th-TH")} · {item.activity.creditHours} ชม.
          {item.distanceMeters != null ? ` · ระยะ ${Math.round(item.distanceMeters)} ม.` : ""}
        </Text>
        {item.flagReason && (
          <Text style={styles.rowFlag}>
            {item.flagReason
              .split(",")
              .map((r) => FLAG_REASON_LABELS[r] ?? r)
              .join(", ")}
          </Text>
        )}
      </View>
      <StatusBadge status={item.status} labels={ATTENDANCE_STATUS_LABELS} />
    </View>
  );
}

function RequestRow({ item }: { item: RequestItem }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{item.title ?? item.activity?.title ?? item.reason}</Text>
        <Text style={styles.rowMeta}>
          {new Date(item.createdAt).toLocaleString("th-TH")}
          {item.hoursRequested != null ? ` · ขอ ${item.hoursRequested} ชม.` : ""}
          {item.hoursApproved != null ? ` · อนุมัติ ${item.hoursApproved} ชม.` : ""}
        </Text>
      </View>
      <StatusBadge status={item.status} labels={REQUEST_STATUS_LABELS} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  tabActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  tabText: { fontSize: 13, color: "#111827" },
  tabTextActive: { color: "#fff" },
  empty: { fontSize: 13, color: "#6b7280", marginTop: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  rowMain: { flex: 1 },
  rowTitle: { fontWeight: "600", fontSize: 14 },
  rowMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  rowFlag: { fontSize: 12, color: "#b45309", marginTop: 4 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  badgeApproved: { backgroundColor: "#d1fae5" },
  badgeRejected: { backgroundColor: "#fee2e2" },
  badgeCancelled: { backgroundColor: "#e5e7eb" },
  badgePending: { backgroundColor: "#fef3c7" },
  pager: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  pagerButton: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  pagerButtonDisabled: { opacity: 0.4 },
  pagerLabel: { fontSize: 13 },
});
