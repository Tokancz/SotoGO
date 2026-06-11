/* ŠotoGO service worker — Web Push only (no offline caching yet).
 * Served from the app's base path (e.g. /SotoGO/), so relative URLs below resolve
 * against that scope. Receives push payloads sent by the backend (lib/push.ts). */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'ŠotoGO', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'ŠotoGO'
  const options = {
    body: data.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: data.tag || undefined,
    // Re-alert when an updated notification reuses a tag (e.g. same gym attacked).
    renotify: Boolean(data.tag),
    data: { url: data.url || '' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Resolve the (possibly leading-slash) path against the SW scope, so /mapa
  // becomes <base>/mapa rather than the domain root.
  const path = String(event.notification.data?.url || '').replace(/^\/+/, '')
  const target = new URL(path, self.registration.scope).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        // Focus an existing app tab and route it to the target if we can.
        if (w.url.startsWith(self.registration.scope) && 'focus' in w) {
          if ('navigate' in w) w.navigate(target).catch(() => {})
          return w.focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
