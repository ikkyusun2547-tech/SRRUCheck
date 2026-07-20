import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { apiFetch, ApiError } from "@/lib/api";
import { clearSession, getStoredUser, type AuthUser } from "@/lib/auth";

// Mirrors the shape of lib/passport/calculate.ts's PassportSummary (web) —
// a type-only duplication, not business logic; the computation itself
// still happens once, server-side, in app/api/passport/mine.
type PassportSummary = {
  totalHours: number;
  totalActivitiesCount: number;
  categoryHours: Record<string, number>;
  requiredActivities: number;
  requiredHours: number;
  yearlyCumulativeTarget: number;
  passed: boolean;
};

const CATEGORY_LABEL_TH: Record<string, string> = {
  culture: "ทำนุบำรุงศิลปวัฒนธรรม",
  academic: "วิชาการ",
  sports: "กีฬาและส่งเสริมสุขภาพ",
  volunteer: "จิตอาสา",
  ethics: "คุณธรรมจริยธรรม",
};

export default function Dashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<PassportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedUser = await getStoredUser();
      setUser(storedUser);
      const res = await apiFetch<{ summary: PassportSummary }>("/api/passport/mine");
      setSummary(res.summary);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearSession();
        router.replace("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Re-check on every screen focus so a check-in done elsewhere (or a
  // future screen in this app) is reflected without a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function logout() {
    await clearSession();
    router.replace("/login");
  }

  if (loading && !summary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>ลองใหม่</Text>
        </Pressable>
      </View>
    );
  }

  if (!summary) return null;

  const hoursPct = Math.min(100, Math.round((summary.totalHours / summary.requiredHours) * 100));
  const activitiesPct = Math.min(
    100,
    Math.round((summary.totalActivitiesCount / summary.requiredActivities) * 100)
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>แดชบอร์ด</Text>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>ออกจากระบบ</Text>
        </Pressable>
      </View>

      <Pressable style={styles.checkinButton} onPress={() => router.push("/checkin")}>
        <Text style={styles.checkinButtonText}>เช็คชื่อกิจกรรม</Text>
      </Pressable>

      {user && (
        <Text style={styles.welcome}>
          {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
        </Text>
      )}

      <View style={[styles.badge, summary.passed ? styles.badgePass : styles.badgePending]}>
        <Text style={styles.badgeText}>{summary.passed ? "ผ่านเกณฑ์" : "ยังไม่ผ่านเกณฑ์"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>ชั่วโมงสะสม</Text>
        <Text style={styles.cardValue}>
          {summary.totalHours} <Text style={styles.cardUnit}>/ {summary.requiredHours} ชม.</Text>
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${hoursPct}%` }]} />
        </View>
        <Text style={styles.cardHint}>เป้าหมายสะสมภายในปี: {summary.yearlyCumulativeTarget} ชม.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>กิจกรรมที่เข้าร่วม</Text>
        <Text style={styles.cardValue}>
          {summary.totalActivitiesCount}{" "}
          <Text style={styles.cardUnit}>/ {summary.requiredActivities} กิจกรรม</Text>
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, styles.progressFillPurple, { width: `${activitiesPct}%` }]} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>แยกตามหมวด</Text>
      <View style={styles.categoryGrid}>
        {Object.entries(summary.categoryHours).map(([category, hours]) => (
          <View key={category} style={styles.categoryCard}>
            <Text style={styles.categoryLabel}>{CATEGORY_LABEL_TH[category] ?? category}</Text>
            <Text style={styles.categoryValue}>{hours} ชม.</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  logout: { color: "#b91c1c", fontSize: 13 },
  welcome: { fontSize: 14, color: "#374151" },
  checkinButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkinButtonText: { color: "#fff", fontWeight: "600" },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  badgePass: { backgroundColor: "#d1fae5" },
  badgePending: { backgroundColor: "#fef3c7" },
  badgeText: { fontSize: 13, fontWeight: "600" },
  card: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16, gap: 6 },
  cardLabel: { fontSize: 13, color: "#6b7280" },
  cardValue: { fontSize: 24, fontWeight: "700" },
  cardUnit: { fontSize: 14, fontWeight: "400" },
  cardHint: { fontSize: 12, color: "#9ca3af" },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "#f3f4f6", overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#10b981" },
  progressFillPurple: { backgroundColor: "#7c3aed" },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 8 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: {
    flexGrow: 1,
    minWidth: "45%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  categoryLabel: { fontSize: 12, color: "#6b7280", textAlign: "center" },
  categoryValue: { fontSize: 16, fontWeight: "600", marginTop: 4 },
  errorText: { color: "#b91c1c", textAlign: "center" },
  retryButton: { backgroundColor: "#111827", borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  retryButtonText: { color: "#fff", fontWeight: "600" },
});
