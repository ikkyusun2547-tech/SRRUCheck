import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="checkin" options={{ headerShown: true, title: "เช็คชื่อ" }} />
      <Stack.Screen name="requests" options={{ headerShown: true, title: "คำร้อง" }} />
      <Stack.Screen name="history" options={{ headerShown: true, title: "ประวัติกิจกรรม" }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: "การแจ้งเตือน" }} />
      <Stack.Screen name="profile" options={{ headerShown: true, title: "โปรไฟล์" }} />
    </Stack>
  );
}
