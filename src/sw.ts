/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

// Yeni SW hemen aktifleşsin (autoUpdate stratejisi)
self.skipWaiting()
clientsClaim()

// Eski cache'leri temizle
cleanupOutdatedCaches()

// Vite-plugin-pwa tarafından inject edilen precache manifest
// Build sırasında tüm JS, CSS, HTML, asset dosyaları otomatik eklenir
precacheAndRoute(self.__WB_MANIFEST)

// --- Push Notification Logic ---
self.addEventListener('push', (event) => {
  let title = 'Rollercoin Calculator'
  let options: NotificationOptions & { data?: { url: string } } = {
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
