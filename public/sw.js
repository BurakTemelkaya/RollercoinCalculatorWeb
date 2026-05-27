// Update this version whenever CURRENT_CACHE_VERSION changes in App.tsx
const CACHE_VERSION = '20260527.041833';
const CACHE_NAME = `rollercoin-${CACHE_VERSION}`;

self.addEventListener('install', () => {
  // Activate immediately so new assets are served without waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete all old caches from previous versions
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first for HTML navigation: always fetch fresh index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          // Cache index.html on success so offline fallback works
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then((cached) => {
            // Safari requires respondWith to receive a non-null Response
            return cached || new Response(
              '<!DOCTYPE html><html><body><p>Offline – please check your connection.</p></body></html>',
              { status: 503, headers: { 'Content-Type': 'text/html' } }
            );
          })
        )
    );
  }
  // All other requests (JS, CSS, assets): use browser default behavior
});
