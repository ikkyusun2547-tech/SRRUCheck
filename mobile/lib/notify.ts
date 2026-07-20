import { Alert, Platform } from "react-native";

// react-native-web's entire Alert implementation is `static alert() {}` — a
// silent no-op, so every Alert.alert() call in this app was invisible on
// web (no dialog, and any onPress callback attached to it never fires).
// window.alert() is the reliable cross-platform fallback for the simple
// title+message case every call site here actually needs.
export function notify(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
