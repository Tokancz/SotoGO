// Web Push fan-out. Loads a user's subscriptions and pushes an encrypted payload
// to each via VAPID; subscriptions a push service reports as gone (404/410) are
// pruned so dead endpoints don't pile up. No-ops cleanly when VAPID isn't
// configured, so the rest of the app runs without push set up.
import webpush from 'web-push'
import { pool } from '../db/pool.js'
import { config } from '../config.js'

let configured = false
export function pushEnabled(): boolean {
  if (!config.vapid.publicKey || !config.vapid.privateKey) return false
  if (!configured) {
    webpush.setVapidDetails(config.vapid.subject, config.vapid.publicKey, config.vapid.privateKey)
    configured = true
  }
  return true
}

export interface PushPayload {
  title: string
  body: string
  /** Path the notification opens (e.g. "/mapa"). */
  url?: string
  /** Collapses notifications sharing a tag (e.g. one per gym). */
  tag?: string
}

interface SubRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Send a notification to every device a user has subscribed. Best-effort and
 * non-blocking by design: failures are swallowed per-endpoint (the caller is a
 * game action, not a notification service) and gone endpoints are deleted.
 */
export async function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!pushEnabled()) return
  const { rows } = await pool.query<SubRow>(
    'select id, endpoint, p256dh, auth from push_subscriptions where user_id = $1',
    [userId],
  )
  if (!rows.length) return

  const body = JSON.stringify(payload)
  await Promise.all(
    rows.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        )
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // 404/410 mean the subscription is gone for good — drop it. Other errors
        // (network, 5xx) are transient; leave the row and just log.
        if (status === 404 || status === 410) {
          await pool.query('delete from push_subscriptions where id = $1', [s.id])
        } else {
          console.error('Push send failed:', status ?? err)
        }
      }
    }),
  )
}
