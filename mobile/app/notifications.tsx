import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch } from "@/lib/api";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function Notifications() {
  const [items, setItems] = useState<Notification[] | null>(null);

  const load = useCallback(() => {
    apiFetch<{ items: Notification[] }>("/api/notifications/mine")
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useFocusEffect(load);

  function markRead(n: Notification) {
    if (n.readAt) return;
    setItems((prev) =>
      prev ? prev.map((it) => (it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it)) : prev
    );
    apiFetch(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
  }

  return (
    <View style={styles.container}>
      {!items && <ActivityIndicator style={{ marginTop: 16 }} />}
      {items?.length === 0 && <Text style={styles.empty}>ยังไม่มีการแจ้งเตือน</Text>}
      <FlatList
        data={items ?? []}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, !item.readAt && styles.rowUnread]}
            onPress={() => markRead(item)}
          >
            {!item.readAt && <View style={styles.dot} />}
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              {item.body && <Text style={styles.rowBody}>{item.body}</Text>}
              <Text style={styles.rowMeta}>{new Date(item.createdAt).toLocaleString("th-TH")}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { fontSize: 13, color: "#6b7280", marginTop: 12 },
  row: {
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  rowUnread: { borderColor: "#c4b5fd", backgroundColor: "#f5f3ff" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7c3aed", marginTop: 5 },
  rowMain: { flex: 1 },
  rowTitle: { fontWeight: "600", fontSize: 14 },
  rowBody: { fontSize: 13, color: "#374151", marginTop: 2 },
  rowMeta: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
});
