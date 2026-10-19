// Versioned offline shell. Only same-origin static assets enter this cache.
const CACHE = "battle-angel-shell-f113e79d9c2c";
const ASSETS = ["/","/assets/app-d35e5234a5b1.js","/assets/app-f905730e9c25.css","/assets/media-dc82b5ea0a08.js","/manifest.webmanifest","/icon.svg","/apple-touch-icon.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      for (const path of ASSETS) {
        const response = await fetch(new Request(path, { cache: "reload" }));
        if (!response.ok) throw new Error("Offline install incomplete");
        await cache.put(path, response);
      }
      // Waiting workers activate only when no old client is using the previous release.
    })(),
  );
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) => key.startsWith("battle-angel-shell-") && key !== CACHE,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await Promise.race([
            fetch(request),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 4000),
            ),
          ]);
          if (response.ok) return response;
          throw new Error("Unavailable");
        } catch {
          const cached = await caches.match("/");
          return (
            cached ||
            new Response(
              "Open battle angel once while online to use it offline.",
              { status: 503, headers: { "Content-Type": "text/plain" } },
            )
          );
        }
      })(),
    );
    return;
  }
  if (ASSETS.includes(url.pathname) || url.pathname.startsWith("/assets/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE),
          cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      })(),
    );
  }
});
