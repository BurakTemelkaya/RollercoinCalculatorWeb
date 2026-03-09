// Update this version whenever CURRENT_CACHE_VERSION changes in App.tsx
const CACHE_VERSION = '1.0.3';
const CACHE_NAME = `rollercoin-${CACHE_VERSION}`;

self.addEventListener('install', () => {
  // Take control immediately without waiting for old SW to finish
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
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match('/index.html'))
    );
  }
  // All other requests (JS, CSS, assets): use browser default behavior
});
