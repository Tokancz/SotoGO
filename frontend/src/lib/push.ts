// Web Push client: register the service worker, subscribe via the browser's
// PushManager using the backend's VAPID public key, and sync the subscription
// with the backend. Everything degrades gracefully when push is unsupported or
// unconfigured, so callers can just reflect the returned state in the UI.
import { pushApi } from '@/services/push'

export type PushState = 'unsupported' | 'unconfigured' | 'denied' | 'subscribed' | 'off'

/** Whether the browser has the APIs we need (PWA on iOS also requires installed). */
export function pushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** VAPID key → Uint8Array (ArrayBuffer-backed) for PushManager.applicationServerKey. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/** Register (or reuse) the service worker, scoped to the app's base path. */
async function registration(): Promise<ServiceWorkerRegistration> {
  const base = import.meta.env.BASE_URL || '/'
  const existing = await navigator.serviceWorker.getRegistration(base)
  return existing ?? navigator.serviceWorker.register(`${base}sw.js`, { scope: base })
}

/** Current push state without prompting the user. */
export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL || '/')
  const sub = await reg?.pushManager.getSubscription()
  return sub ? 'subscribed' : 'off'
}

/**
 * Turn notifications on: prompt for permission, subscribe, register the endpoint
 * with the backend. Returns the resulting state ('subscribed' on success,
 * 'denied' if the user blocked it, 'unconfigured' if the server has no VAPID key).
 */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'

  const { key } = await pushApi.key()
  if (!key) return 'unconfigured'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'

  const reg = await registration()
  await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    }))

  await pushApi.subscribe(sub.toJSON())
  return 'subscribed'
}

/** Turn notifications off: unsubscribe locally and drop the endpoint server-side. */
export async function disablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'
  const reg = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL || '/')
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await pushApi.unsubscribe(sub.endpoint).catch(() => {})
    await sub.unsubscribe().catch(() => {})
  }
  return 'off'
}
