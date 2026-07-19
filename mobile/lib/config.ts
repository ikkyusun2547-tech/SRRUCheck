// EXPO_PUBLIC_* env vars are inlined at build time by Expo — see
// https://docs.expo.dev/guides/environment-variables/. Falls back to the
// Android emulator's host-loopback alias so `npm run android` works out of
// the box against a `next dev` server on the same machine; override via
// .env for a physical device (use your machine's LAN IP) or iOS simulator
// (localhost works there directly).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://10.0.2.2:3000";
