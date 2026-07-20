import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";

export type PickedEvidence = { dataUrl: string; name: string };

// Mirrors lib/file-to-data-url.ts's browser FileReader approach on the web
// (same data: URL format, same server-side parser in
// lib/requests/evidence.ts). On web, expo-document-picker's `base64: true`
// option already reads the file via FileReader.readAsDataURL under the
// hood, so `asset.base64` is already a complete data: URL. Native has no
// such shortcut — it hands back a file:// uri that has to be read and
// base64-encoded separately via expo-file-system.
export async function pickEvidence(): Promise<PickedEvidence | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];

  if (Platform.OS === "web" && asset.base64) {
    return { dataUrl: asset.base64, name: asset.name };
  }

  const base64 = await new File(asset.uri).base64();
  const mimeType = asset.mimeType ?? "application/octet-stream";
  return { dataUrl: `data:${mimeType};base64,${base64}`, name: asset.name };
}
