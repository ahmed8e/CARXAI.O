// Minimal Service Worker to trigger PWA install banner
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests - caching can be added later
  event.respondWith(fetch(event.request));
});
