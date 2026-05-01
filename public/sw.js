const CACHE_NAME = 'car safety-v3';

// Minimal Service Worker to trigger PWA install banner while allowing Auth to work
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map(k => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. CRITICAL: Never intercept Supabase, OpenAI, or API requests
  // Returning without calling event.respondWith() allows the browser to handle the request normally.
  if (
    url.hostname.includes('supabase.co') || 
    url.hostname.includes('openai.com') ||
    url.pathname.startsWith('/api')
  ) {
    return;
  }

  // 2. Only intercept GET requests for static assets
  if (event.request.method !== 'GET') {
    return;
  }

  // 3. Simple pass-through for everything else with a safety catch
  event.respondWith(
    fetch(event.request).catch(err => {
      console.warn('[SW] Fetch failed:', event.request.url);
      // Return a basic error response or offline fallback if needed
    })
  );
});
