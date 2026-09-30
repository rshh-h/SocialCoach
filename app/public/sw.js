/* Minimal offline shell: cache successful, content-hashed static assets only. */
const CACHE_PREFIX = "socialcoach-";
const CACHE = `${CACHE_PREFIX}static-v2`;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    // Cache storage can be unavailable in private browsing. That must not stop
    // the worker from installing or the network-only app from working.
    try {
      const cache = await caches.open(CACHE);
      await cache.addAll(["/manifest.webmanifest", "/icon.svg"]);
    } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith((async () => {
      let cache;
      try {
        cache = await caches.open(CACHE);
        const cached = await cache.match(e.request);
        if (cached?.ok) return cached;
        // Defensive cleanup for entries written by an interrupted/older worker.
        if (cached) await cache.delete(e.request);
      } catch {}

      const response = await fetch(e.request);
      // Never make a transient deploy-time 404/500 persistent on the device.
      if (response.ok) {
        try {
          cache ??= await caches.open(CACHE);
          await cache.put(e.request, response.clone());
        } catch {}
      }
      return response;
    })());
  }
});
