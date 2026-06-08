// Player-progress routes (all require auth). XP is awarded SERVER-SIDE here so
// the client can't fabricate it (docs/ARCHITECTURE.md "Autoritativní skórování").
import { Router } from 'express'
import multer from 'multer'
import { pool } from '../db/pool.js'
import { config } from '../config.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { asyncHandler } from '../util/asyncHandler.js'
import { publicUser, type UserRow } from '../lib/user.js'
import { isAllowedImage, saveImage } from '../lib/uploads.js'
import { levelFromTotalXp } from '../lib/leveling.js'

export const meRouter = Router()
meRouter.use(requireAuth)

const CATCH_XP = 100

// Catch photos arrive as multipart/form-data ("photo" field). Held in memory so
// we only persist the file once we know it's a genuinely new catch.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (_req, file, cb) => cb(null, isAllowedImage(file.mimetype)),
})

/** Stop XP — must match the frontend's preview (MapView rewardFor). */
function stopReward(isGym: boolean, categories: string[]): number {
  if (isGym) return 60
  if (categories.includes('metro')) return 40
  if (categories.some((c) => c === 'tram' || c === 'trolley' || c === 'train')) return 30
  return 20
}

/** Add XP to a user, keep level in sync, and return the client-safe user. */
async function awardXp(userId: string, amount: number) {
  const { rows } = await pool.query<UserRow>(
    'update users set xp = xp + $1 where id = $2 returning *',
    [amount, userId],
  )
  const user = rows[0]
  const level = levelFromTotalXp(user.xp)
  if (level !== user.level) {
    await pool.query('update users set level = $1 where id = $2', [level, userId])
    user.level = level
  }
  return user
}

async function collectedIds(userId: string): Promise<string[]> {
  const { rows } = await pool.query(
    'select vehicle_type_id from user_vehicles where user_id = $1 order by found_at desc',
    [userId],
  )
  return rows.map((r) => String(r.vehicle_type_id))
}

async function visitedIds(userId: string): Promise<string[]> {
  const { rows } = await pool.query(
    'select stop_id from user_stops where user_id = $1 order by visited_at desc',
    [userId],
  )
  return rows.map((r) => String(r.stop_id))
}

/** Map of collected vehicle id → the player's catch photo (only those with one). */
async function collectedPhotos(userId: string): Promise<Record<string, string>> {
  const { rows } = await pool.query<{ vehicle_type_id: string; image_url: string }>(
    'select vehicle_type_id, image_url from user_vehicles where user_id = $1 and image_url is not null',
    [userId],
  )
  const out: Record<string, string> = {}
  for (const r of rows) out[String(r.vehicle_type_id)] = r.image_url
  return out
}

// GET /api/me/progress — everything needed to rehydrate the collection on load.
meRouter.get(
  '/progress',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const [collected, visited, photos] = await Promise.all([
      collectedIds(userId),
      visitedIds(userId),
      collectedPhotos(userId),
    ])
    res.json({ collectedIds: collected, visitedIds: visited, photos })
  }),
)

// POST /api/me/vehicles — record a catch; award XP if it's new. Accepts
// multipart/form-data: a `vehicleId` field and an optional `photo` image.
meRouter.post(
  '/vehicles',
  upload.single('photo'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const vehicleId = String(req.body?.vehicleId ?? '')
    if (!vehicleId) return res.status(400).json({ error: 'Chybí vehicleId.' })

    const exists = await pool.query('select 1 from vehicle_types where id = $1', [vehicleId])
    if (!exists.rowCount) return res.status(404).json({ error: 'Vozidlo nenalezeno.' })

    // Keep the FIRST catch and its photo — a re-scan just reports current state.
    const prior = await pool.query<{ image_url: string | null }>(
      'select image_url from user_vehicles where user_id = $1 and vehicle_type_id = $2',
      [userId, vehicleId],
    )

    if (prior.rowCount) {
      const user = (await pool.query<UserRow>('select * from users where id = $1', [userId])).rows[0]
      const ids = await collectedIds(userId)
      return res.json({
        user: publicUser(user),
        collectedIds: ids,
        awardedXp: 0,
        imageUrl: prior.rows[0].image_url,
      })
    }

    const imageUrl = req.file ? await saveImage(req.file.buffer, req.file.mimetype) : null
    await pool.query(
      'insert into user_vehicles (user_id, vehicle_type_id, image_url) values ($1, $2, $3)',
      [userId, vehicleId, imageUrl],
    )
    const user = await awardXp(userId, CATCH_XP)
    const ids = await collectedIds(userId)

    res.json({ user: publicUser(user), collectedIds: ids, awardedXp: CATCH_XP, imageUrl })
  }),
)

// POST /api/me/stops/:id/visit — record a visit; award XP if it's new.
meRouter.post(
  '/stops/:id/visit',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const stopId = req.params.id

    const stop = await pool.query<{ is_gym: boolean; categories: string[] }>(
      'select is_gym, categories from stops where id = $1',
      [stopId],
    )
    if (!stop.rowCount) return res.status(404).json({ error: 'Zastávka nenalezena.' })

    const ins = await pool.query(
      `insert into user_stops (user_id, stop_id) values ($1, $2)
       on conflict do nothing returning stop_id`,
      [userId, stopId],
    )
    const awarded = ins.rowCount
      ? stopReward(stop.rows[0].is_gym, stop.rows[0].categories)
      : 0

    const user = awarded
      ? await awardXp(userId, awarded)
      : (await pool.query<UserRow>('select * from users where id = $1', [userId])).rows[0]
    const ids = await visitedIds(userId)

    res.json({ user: publicUser(user), visitedIds: ids, awardedXp: awarded })
  }),
)
