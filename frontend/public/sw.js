const CACHE_NAME = "bhartx-cache-v1";
const OFFLINE_URL = "/offline.html";

// Core static assets to cache on install
const ASSETS_TO_CACHE = [
  "/",
  "/dashboard",
  "/login",
  "/icon.svg",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Warm up cache with core assets
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("PWA: Pre-caching some assets failed, will cache on-demand", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
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

// Network first, fallback to cache for api and pages
self.addEventListener("fetch", (event) => {
  const { request } = event;
  
  // Skip cross-origin and POST requests
  if (!request.url.startsWith(self.location.origin) || request.method !== "GET") {
    return;
  }

  // Next.js hot reloading assets (development only)
  if (request.url.includes("_next/webpack-hmr")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response and cache it if it's a valid GET request
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Return offline fallback if hitting a page route
          const acceptHeader = request.headers.get("accept");
          if (acceptHeader && acceptHeader.includes("text/html")) {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});
