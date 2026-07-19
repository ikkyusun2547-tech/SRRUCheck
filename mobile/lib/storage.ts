import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// expo-secure-store has no web implementation (its ExpoSecureStore.web.js
// is an empty stub — calling it throws at runtime), even though this app
// declares web support in app.json. Native platforms keep the OS
// keychain/keystore; web falls back to localStorage, which is the standard
// (if less secure — no encryption at rest, vulnerable to XSS) choice for
// browser-based Expo apps with no server-side session to lean on instead.
const isWeb = Platform.OS === "web";

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
