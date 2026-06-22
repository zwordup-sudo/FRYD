const CACHE_NAME = "fryd-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/manifest.json"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (e) => {
  // Only handle HTTP/HTTPS, skip extension schemas
  if (!e.request.url.startsWith("http")) {
    return;
  }

  // Skip API requests - handled separately by offline sync interceptors
  const isApiRequest = e.request.url.includes("/api/") || e.request.url.includes("/users/") || e.request.url.includes("/tasks/") || e.request.url.includes("/habits/") || e.request.url.includes("/diary/");
  if (isApiRequest) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale while revalidate: fetch fresh copy in background
        fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(e.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          // Cache successful GET responses for assets
          if (e.request.method === "GET") {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is for page navigation, fallback to app shell
          if (e.request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});
