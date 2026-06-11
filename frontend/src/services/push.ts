// Web Push subscription endpoints. The key is public; subscribe/unsubscribe carry
// the auth token like the rest of /me.
import api from './api'

export const pushApi = {
  /** The server's VAPID public key, or null when push isn't configured. */
  key: () => api.get<{ key: string | null }>('/push/key').then((r) => r.data),

  /** Register a PushSubscription (its JSON form) for the current user. */
  subscribe: (subscription: PushSubscriptionJSON) =>
    api.post<{ ok: true }>('/push/subscribe', subscription).then((r) => r.data),

  /** Drop a subscription by endpoint. */
  unsubscribe: (endpoint: string) =>
    api.post<{ ok: true }>('/push/unsubscribe', { endpoint }).then((r) => r.data),
}
