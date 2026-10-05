/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

// SW, React'tan 'SKIP_WAITING' mesajı alana kadar bekleyecek
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

clientsClaim()

// Eski cache'leri temizle
cleanupOutdatedCaches()

// Vite-plugin-pwa tarafından inject edilen precache manifest
// Only the app shell and its static imports are included at build time.
precacheAndRoute(self.__WB_MANIFEST)

// Vite gives JS/CSS content hashes, so a cached URL never needs revalidation.
// Lazy pages enter this cache only when requested, not during SW installation.
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && /^\/assets\/.+-[\w-]{8,}\.(js|css)$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'rollercoin-lazy-assets-v1',
    plugins: [
      {
        // Never persist an HTML SPA fallback returned for a missing chunk.
        cacheWillUpdate: async ({ response }) => {
          const contentType = response.headers.get('content-type') ?? ''
          return response.status === 200 && /(?:javascript|text\/css)/i.test(contentType)
            ? response
            : null
        },
      },
      new ExpirationPlugin({
        maxEntries: 256,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
)

// --- Push Notification Logic ---
self.addEventListener('push', (event) => {
  let title = 'Rollercoin Calculator'
  const options: NotificationOptions & { data?: { url: string } } = {
    body: 'You have a new notification.',
    icon: '/icon.png',
    badge: '/icon.png',
  }

  if (event.data) {
    try {
      const data = event.data.json()
      title = data.title || title
      if (data.body) options.body = data.body
      if (data.icon) options.icon = data.icon
      if (data.url) options.data = { url: data.url }
    } catch {
      options.body = event.data.text()
    }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(self.clients.openWindow(event.notification.data.url))
  } else {
    event.waitUntil(self.clients.openWindow('/'))
  }
})
