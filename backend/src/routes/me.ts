// Player-progress routes (all require auth). XP is awarded SERVER-SIDE here so
// the client can't fabricate it (docs/ARCHITECTURE.md "Autoritativní skórování").
import { Router } from 'express'
import { pool } from '../db/pool.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { asyncHandler } from '../util/asyncHandler.js'
import { publicUser, type UserRow } from '../lib/user.js'
import { levelFromTotalXp } from '../lib/leveling.js'

export const meRouter = Router()
meRouter.use(requireAuth)

const CATCH_XP = 100

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

// GET /api/me/progress — everything needed to rehydrate the collection on load.
meRouter.get(
  '/progress',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const [collected, visited] = await Promise.all([collectedIds(userId), visitedIds(userId)])
    res.json({ collectedIds: collected, visitedIds: visited })
  }),
)

// POST /api/me/vehicles { vehicleId } — record a catch; award XP if it's new.
meRouter.post(
  '/vehicles',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const vehicleId = String(req.body?.vehicleId ?? '')
    if (!vehicleId) return res.status(400).json({ error: 'Chybí vehicleId.' })

    const exists = await pool.query('select 1 from vehicle_types where id = $1', [vehicleId])
    if (!exists.rowCount) return res.status(404).json({ error: 'Vozidlo nenalezeno.' })

    const ins = await pool.query(
      `insert into user_vehicles (user_id, vehicle_type_id) values ($1, $2)
       on conflict do nothing returning vehicle_type_id`,
      [userId, vehicleId],
    )
    const awarded = ins.rowCount ? CATCH_XP : 0

    const user = awarded
      ? await awardXp(userId, awarded)
      : (await pool.query<UserRow>('select * from users where id = $1', [userId])).rows[0]
    const ids = await collectedIds(userId)

    res.json({ user: publicUser(user), collectedIds: ids, awardedXp: awarded })
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
