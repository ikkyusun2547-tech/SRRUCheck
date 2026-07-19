import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { apiFetch, ApiError } from "@/lib/api";
import { storeSession, type AuthUser } from "@/lib/auth";

type DevUser = {
  id: string;
  email: string;
  role: "student" | "admin";
  firstName: string | null;
  lastName: string | null;
};

export default function Login() {
  const [devUsers, setDevUsers] = useState<DevUser[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loggingInId, setLoggingInId] = useState<string | null>(null);

  useEffect(() => {
    // Same dev-only shortcut as the web login page — the server 404s this
    // route outside of NODE_ENV=development, so this list is simply absent
    // in a production build talking to a production API.
    if (!__DEV__) return;
    apiFetch<{ users: DevUser[] }>("/api/mobile/auth/dev-login")
      .then((res) => setDevUsers(res.users))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "โหลดรายชื่อไม่สำเร็จ"));
  }, []);

  async function loginAs(user: DevUser) {
    setLoggingInId(user.id);
    try {
      const res = await apiFetch<{ token: string; user: AuthUser }>(
        "/api/mobile/auth/dev-login",
        { method: "POST", body: { userId: user.id } }
      );
      await storeSession(res.token, res.user);
      router.replace("/dashboard");
    } catch (err) {
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoggingInId(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SRRU Check</Text>
      <Text style={styles.subtitle}>ระบบเช็คชื่อกิจกรรมนักศึกษา</Text>

      <Pressable
        style={styles.googleButton}
        onPress={() =>
          Alert.alert(
            "ยังไม่พร้อมใช้งาน",
            "ต้องตั้งค่า Google OAuth client สำหรับมือถือก่อน (ดู mobile/README.md)"
          )
        }
      >
        <Text style={styles.googleButtonText}>เข้าสู่ระบบด้วย Google</Text>
      </Pressable>

      {__DEV__ && (
        <View style={styles.devBox}>
          <Text style={styles.devBoxTitle}>Dev-only shortcut (ไม่แสดงใน production)</Text>
          {loadError && <Text style={styles.errorText}>{loadError}</Text>}
          {!devUsers && !loadError && <ActivityIndicator style={{ marginTop: 8 }} />}
          {devUsers && devUsers.length === 0 && (
            <Text style={styles.errorText}>ยังไม่มี user ในฐานข้อมูล</Text>
          )}
          {devUsers && (
            <FlatList
              data={devUsers}
              keyExtractor={(u) => u.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.devUserRow}
                  disabled={loggingInId !== null}
                  onPress={() => loginAs(item)}
                >
                  <Text style={styles.devUserName}>
                    {[item.firstName, item.lastName].filter(Boolean).join(" ") || item.email}
                  </Text>
                  <Text style={styles.devUserMeta}>
                    {item.role} · {item.email}
                  </Text>
                  {loggingInId === item.id && <ActivityIndicator style={{ marginTop: 4 }} />}
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 8 },
  googleButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  googleButtonText: { color: "#fff", fontWeight: "600" },
  devBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#d97706",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fffbeb",
  },
  devBoxTitle: { fontSize: 12, fontWeight: "600", color: "#b45309", marginBottom: 8 },
  errorText: { fontSize: 13, color: "#b91c1c" },
  devUserRow: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  devUserName: { fontWeight: "600" },
  devUserMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
});
