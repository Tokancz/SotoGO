// Web Push subscription management. The client fetches the VAPID public key,
// subscribes via the browser's PushManager, and registers the resulting endpoint
// here. All but the public key require auth (a subscription belongs to a user).
import { Router } from 'express'
import { pool } from '../db/pool.js'
import { config } from '../config.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { asyncHandler } from '../util/asyncHandler.js'
import { pushEnabled } from '../lib/push.js'

export const pushRouter = Router()

// GET /api/push/key — the VAPID public key the client subscribes with (or null
// when push isn't configured, so the client can hide the toggle). Public.
pushRouter.get('/key', (_req, res) => {
  res.json({ key: pushEnabled() ? config.vapid.publicKey : null })
})

pushRouter.use(requireAuth)

// POST /api/push/subscribe — store (or refresh) a PushSubscription for this user.
// Body: { endpoint, keys: { p256dh, auth } }. Re-subscribing the same endpoint
// just re-points it at the current user (endpoint is globally unique).
pushRouter.post(
  '/subscribe',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const sub = req.body ?? {}
    const endpoint = typeof sub.endpoint === 'string' ? sub.endpoint : ''
    const p256dh = sub.keys?.p256dh
    const auth = sub.keys?.auth
    if (!endpoint || typeof p256dh !== 'string' || typeof auth !== 'string') {
      return res.status(400).json({ error: 'Neplatná subscription.' })
    }
    await pool.query(
      `insert into push_subscriptions (user_id, endpoint, p256dh, auth)
       values ($1, $2, $3, $4)
       on conflict (endpoint)
       do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
      [userId, endpoint, p256dh, auth],
    )
    res.json({ ok: true })
  }),
)

// POST /api/push/unsubscribe — drop a subscription by endpoint. Body: { endpoint }.
pushRouter.post(
  '/unsubscribe',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : ''
    if (endpoint) {
      await pool.query('delete from push_subscriptions where user_id = $1 and endpoint = $2', [
        userId,
        endpoint,
      ])
    }
    res.json({ ok: true })
  }),
)
