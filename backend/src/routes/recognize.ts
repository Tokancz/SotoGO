// Photo-based vehicle recognition (capture flow). Auth-required — it spends a
// vision API call per request, so it shouldn't be open. Accepts the catch photo
// as multipart/form-data ("photo") and returns { fleetNumber, category, candidates }.
import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { asyncHandler } from '../util/asyncHandler.js'
import { isAllowedImage } from '../lib/uploads.js'
import { recognitionEnabled, recognizeVehicle } from '../lib/recognize.js'

export const recognizeRouter = Router()
recognizeRouter.use(requireAuth)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (_req, file, cb) => cb(null, isAllowedImage(file.mimetype)),
})

// Per-user sliding-window rate limit. Each recognize call spends a paid vision
// request, so we cap how fast one account can fire them — protects cost and
// blunts scripted abuse. In-memory is enough: the API runs as a single machine,
// and the limit is a courtesy ceiling, not a security boundary. The map is
// pruned lazily as users hit the endpoint, so it can't grow unbounded.
const RATE_WINDOW_MS = 60_000
const hits = new Map<string, number[]>()

/** Record a call for `userId` and report whether it's within the per-minute cap.
 *  Returns the seconds to wait when over the limit (for Retry-After). */
function withinRateLimit(userId: string): { ok: boolean; retryAfter: number } {
  const limit = config.recognizeRatePerMin
  const now = Date.now()
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  if (recent.length >= limit) {
    const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - recent[0])) / 1000)
    hits.set(userId, recent)
    return { ok: false, retryAfter: Math.max(1, retryAfter) }
  }
  recent.push(now)
  hits.set(userId, recent)
  return { ok: true, retryAfter: 0 }
}

recognizeRouter.post(
  '/',
  upload.single('photo'),
  asyncHandler(async (req: AuthedRequest, res) => {
    if (!recognitionEnabled()) {
      res.status(503).json({ error: 'Rozpoznávání není nastavené.' })
      return
    }
    if (!req.file) {
      res.status(400).json({ error: 'Chybí fotka.' })
      return
    }
    const gate = withinRateLimit(req.userId!)
    if (!gate.ok) {
      res
        .status(429)
        .set('Retry-After', String(gate.retryAfter))
        .json({ error: 'Příliš mnoho pokusů o rozpoznání. Zkus to za chvíli.' })
      return
    }
    const result = await recognizeVehicle(req.file.buffer, req.file.mimetype)
    res.json(result)
  }),
)
