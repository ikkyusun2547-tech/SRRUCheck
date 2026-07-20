import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { getStoredUser, getToken } from "@/lib/auth";

export default function Index() {
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      const user = await getStoredUser();
      // Mirrors the web middleware's gate: a student whose profile isn't
      // complete yet gets sent to fill it in before anything else.
      router.replace(user?.role === "student" && !user.profileCompleted ? "/profile" : "/dashboard");
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}
