import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken, storeSession, type AuthUser } from "@/lib/auth";

const TITLE_OPTIONS = ["นาย", "นาง", "นางสาว"];
const CURRENT_YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const currentBuddhistYear = new Date().getFullYear() + 543;
const ENROLLMENT_YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => currentBuddhistYear - i);

type Major = { id: string; facultyId: string; nameTh: string };
type Faculty = { id: string; nameTh: string; majors: Major[] };

type ProfileUser = {
  id: string;
  email: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  studentId: string | null;
  enrollmentYear: number | null;
  currentYear: number | null;
  programType: "normal" | "special" | null;
  facultyId: string | null;
  majorId: string | null;
  profileCompleted: boolean;
  role: "student" | "admin";
};

export default function Profile() {
  const [faculties, setFaculties] = useState<Faculty[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [enrollmentYear, setEnrollmentYear] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [programType, setProgramType] = useState<"normal" | "special">("normal");
  const [facultyId, setFacultyId] = useState("");
  const [majorId, setMajorId] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<{ user: ProfileUser }>("/api/profile"),
      apiFetch<{ faculties: Faculty[] }>("/api/faculties"),
    ])
      .then(([profileRes, facultiesRes]) => {
        const u = profileRes.user;
        setEmail(u.email);
        setTitle(u.title ?? "");
        setFirstName(u.firstName ?? "");
        setLastName(u.lastName ?? "");
        setStudentId(u.studentId ?? "");
        setEnrollmentYear(u.enrollmentYear);
        setCurrentYear(u.currentYear);
        setProgramType(u.programType ?? "normal");
        setFacultyId(u.facultyId ?? "");
        setMajorId(u.majorId ?? "");
        setFaculties(facultiesRes.faculties);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const filteredMajors = useMemo(
    () => faculties?.find((f) => f.id === facultyId)?.majors ?? [],
    [faculties, facultyId]
  );

  function selectFaculty(id: string) {
    setFacultyId(id);
    setMajorId("");
  }

  async function submit() {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await apiFetch<{ user: ProfileUser }>("/api/profile", {
        method: "POST",
        body: {
          title,
          firstName,
          lastName,
          studentId,
          enrollmentYear,
          currentYear,
          programType,
          facultyId,
          majorId,
        },
      });
      setSuccess("บันทึกโปรไฟล์สำเร็จ");
      // Keep the locally-stored session in sync so dashboard/nav logic
      // that reads profileCompleted doesn't stay stale after a first-time
      // setup.
      const stored: AuthUser = {
        id: res.user.id,
        email: res.user.email,
        role: res.user.role,
        profileCompleted: res.user.profileCompleted,
        firstName: res.user.firstName,
        lastName: res.user.lastName,
      };
      const token = await getToken();
      if (token) await storeSession(token, stored);
      // Alert.alert is a silent no-op on React Native Web (its whole
      // implementation there is an empty function) — a confirm-dialog
      // pattern would leave web users stuck on this screen after a
      // successful save with no redirect and no feedback. Showing the
      // inline success banner and navigating after a beat works
      // identically on every platform instead.
      setTimeout(() => router.replace("/dashboard"), 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (loadError || !faculties) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorBox}>{loadError ?? "โหลดข้อมูลไม่สำเร็จ"}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.email}>{email}</Text>

      {error && <Text style={styles.errorBox}>{error}</Text>}
      {success && <Text style={styles.successBox}>{success}</Text>}

      <View>
        <Text style={styles.label}>คำนำหน้า</Text>
        <View style={styles.chipRow}>
          {TITLE_OPTIONS.map((t) => (
            <Pressable
              key={t}
              style={[styles.chip, title === t && styles.chipActive]}
              onPress={() => setTitle(t)}
            >
              <Text style={[styles.chipText, title === t && styles.chipTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text style={styles.label}>ชื่อ</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          accessibilityLabel="ชื่อ"
        />
      </View>
      <View>
        <Text style={styles.label}>นามสกุล</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          accessibilityLabel="นามสกุล"
        />
      </View>

      <View>
        <Text style={styles.label}>รหัสนักศึกษา (11 หลัก)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          maxLength={11}
          value={studentId}
          onChangeText={(v) => setStudentId(v.replace(/\D/g, "").slice(0, 11))}
          accessibilityLabel="รหัสนักศึกษา"
        />
      </View>

      <View>
        <Text style={styles.label}>ปีที่เข้าศึกษา (พ.ศ.)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {ENROLLMENT_YEAR_OPTIONS.map((y) => (
              <Pressable
                key={y}
                style={[styles.chip, enrollmentYear === y && styles.chipActive]}
                onPress={() => setEnrollmentYear(y)}
              >
                <Text style={[styles.chipText, enrollmentYear === y && styles.chipTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View>
        <Text style={styles.label}>ชั้นปีปัจจุบัน</Text>
        <View style={styles.chipRow}>
          {CURRENT_YEAR_OPTIONS.map((y) => (
            <Pressable
              key={y}
              style={[styles.chip, currentYear === y && styles.chipActive]}
              onPress={() => setCurrentYear(y)}
            >
              <Text style={[styles.chipText, currentYear === y && styles.chipTextActive]}>ปี {y}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>เลือกเองตามจริง (รองรับกรณีซ้ำชั้น/ลาพัก)</Text>
      </View>

      <View>
        <Text style={styles.label}>ประเภทหลักสูตร</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, programType === "normal" && styles.chipActive]}
            onPress={() => setProgramType("normal")}
          >
            <Text style={[styles.chipText, programType === "normal" && styles.chipTextActive]}>
              ภาคปกติ
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, programType === "special" && styles.chipActive]}
            onPress={() => setProgramType("special")}
          >
            <Text style={[styles.chipText, programType === "special" && styles.chipTextActive]}>
              กศ.บป.
            </Text>
          </Pressable>
        </View>
      </View>

      <View>
        <Text style={styles.label}>คณะ</Text>
        {faculties.map((f) => (
          <Pressable
            key={f.id}
            style={[styles.optionRow, facultyId === f.id && styles.optionRowActive]}
            onPress={() => selectFaculty(f.id)}
          >
            <Text style={facultyId === f.id ? styles.optionTextActive : styles.optionText}>{f.nameTh}</Text>
          </Pressable>
        ))}
      </View>

      <View>
        <Text style={styles.label}>สาขา</Text>
        {!facultyId && <Text style={styles.hint}>เลือกคณะก่อน</Text>}
        {filteredMajors.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.optionRow, majorId === m.id && styles.optionRowActive]}
            onPress={() => setMajorId(m.id)}
          >
            <Text style={majorId === m.id ? styles.optionTextActive : styles.optionText}>{m.nameTh}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.primaryButton, saving && styles.disabled]} disabled={saving} onPress={submit}>
        <Text style={styles.primaryButtonText}>{saving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  email: { fontSize: 13, color: "#6b7280" },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, color: "#374151" },
  hint: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, fontSize: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  chipText: { fontSize: 13, color: "#111827" },
  chipTextActive: { color: "#fff" },
  optionRow: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, marginBottom: 6 },
  optionRowActive: { backgroundColor: "#ede9fe", borderColor: "#7c3aed" },
  optionText: { fontSize: 13, color: "#111827" },
  optionTextActive: { fontSize: 13, color: "#5b21b6", fontWeight: "600" },
  primaryButton: { backgroundColor: "#10b981", borderRadius: 999, paddingVertical: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
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
});
