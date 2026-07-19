const CACHE_NAME = "srru-check-shell-v1";
const SHELL_ASSETS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// This app is auth-heavy and real-time-sensitive (GPS check-in, a QR that
// rotates every 15s) — deliberately never cache API responses or page HTML,
// only the static app-shell assets above. Navigations always go to the
// network; the only offline behavior is a static fallback page instead of
// the browser's own error screen.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html").then((res) => res || Response.error()))
    );
    return;
  }

  if (SHELL_ASSETS.some((asset) => request.url.endsWith(asset))) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
