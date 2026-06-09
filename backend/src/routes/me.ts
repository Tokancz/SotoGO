// Player-progress routes (all require auth). XP is awarded SERVER-SIDE here so
// the client can't fabricate it (docs/ARCHITECTURE.md "Autoritativní skórování").
import { Router } from 'express'
import multer from 'multer'
import { pool } from '../db/pool.js'
import { config } from '../config.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { asyncHandler } from '../util/asyncHandler.js'
import { publicUser, type UserRow } from '../lib/user.js'
import { deleteImage, isAllowedImage, saveImage } from '../lib/uploads.js'
import { levelFromTotalXp } from '../lib/leveling.js'
import { currentPeriod, questById, questsFor, type QuestTemplate } from '../lib/quests.js'

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

/** Adjust a user's XP (amount may be negative), keep level in sync, return the
 *  client-safe user. XP floors at 0. */
async function awardXp(userId: string, amount: number) {
  const { rows } = await pool.query<UserRow>(
    'update users set xp = greatest(0, xp + $1) where id = $2 returning *',
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

interface VisitedStops {
  /** Unique visited stop ids, most recent first. */
  ids: string[]
  /** stopId → ISO timestamp of the player's most recent visit (drives the re-visit cooldown). */
  visitedAt: Record<string, string>
}

async function visitedStops(userId: string): Promise<VisitedStops> {
  const { rows } = await pool.query<{ stop_id: string; visited_at: string }>(
    'select stop_id, visited_at from user_stops where user_id = $1 order by visited_at desc',
    [userId],
  )
  const ids: string[] = []
  const visitedAt: Record<string, string> = {}
  for (const r of rows) {
    const id = String(r.stop_id)
    ids.push(id)
    visitedAt[id] = new Date(r.visited_at).toISOString()
  }
  return { ids, visitedAt }
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
      visitedStops(userId),
      collectedPhotos(userId),
    ])
    res.json({ collectedIds: collected, visitedIds: visited.ids, visitedAt: visited.visitedAt, photos })
  }),
)

// DELETE /api/me/progress — wipe the player's progress: collected vehicles (and
// their photos), visited stops, quest claims/completions, and reset XP/level/
// streak to zero. The account itself stays. For testing and a "start over"
// option; irreversible, so the client gates it behind a confirmation.
meRouter.delete(
  '/progress',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!

    const del = await pool.query<{ image_url: string | null }>(
      'delete from user_vehicles where user_id = $1 returning image_url',
      [userId],
    )
    await Promise.all([
      pool.query('delete from user_stops where user_id = $1', [userId]),
      pool.query('delete from user_quest_claims where user_id = $1', [userId]),
      pool.query('delete from user_quest_completions where user_id = $1', [userId]),
    ])

    const { rows } = await pool.query<UserRow>(
      `update users set xp = 0, level = 1, streak_count = 0, last_active_date = null
       where id = $1 returning *`,
      [userId],
    )

    // Best-effort cleanup of the stored catch photos (the rows are already gone).
    await Promise.all(del.rows.map((r) => deleteImage(r.image_url)))

    res.json({ user: publicUser(rows[0]), collectedIds: [], visitedIds: [] })
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

// DELETE /api/me/vehicles/:id — remove a catch from the collection. Reclaims the
// catch XP (floored at 0) so deleting + re-catching can't farm XP, and cleans up
// the stored photo.
meRouter.delete(
  '/vehicles/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const vehicleId = req.params.id

    const del = await pool.query<{ image_url: string | null }>(
      'delete from user_vehicles where user_id = $1 and vehicle_type_id = $2 returning image_url',
      [userId, vehicleId],
    )

    const user = del.rowCount
      ? await awardXp(userId, -CATCH_XP)
      : (await pool.query<UserRow>('select * from users where id = $1', [userId])).rows[0]
    if (del.rowCount) await deleteImage(del.rows[0].image_url)

    const ids = await collectedIds(userId)
    res.json({ user: publicUser(user), collectedIds: ids })
  }),
)

// GET /api/me/leaderboard — top players by XP, plus the caller's own rank so it
// can be pinned when they're outside the top slice. Ranking is xp desc, then id
// asc as a stable tiebreak (matches the rank-count query below).
const LEADERBOARD_LIMIT = 100

interface LeaderRow {
  id: string
  username: string
  avatar_url: string | null
  level: number
  xp: number
}

function leaderEntry(u: LeaderRow, rank: number) {
  return {
    rank,
    id: String(u.id),
    username: u.username,
    avatarUrl: u.avatar_url,
    level: u.level,
    xp: u.xp,
  }
}

meRouter.get(
  '/leaderboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const me = (
      await pool.query<LeaderRow>(
        'select id, username, avatar_url, level, xp from users where id = $1',
        [userId],
      )
    ).rows[0]

    const [top, totalRes, rankRes] = await Promise.all([
      pool.query<LeaderRow>(
        `select id, username, avatar_url, level, xp from users
         order by xp desc, id asc limit $1`,
        [LEADERBOARD_LIMIT],
      ),
      pool.query<{ n: number }>('select count(*)::int n from users'),
      pool.query<{ r: number }>(
        'select count(*)::int + 1 r from users where xp > $1 or (xp = $1 and id < $2)',
        [me.xp, me.id],
      ),
    ])

    res.json({
      total: totalRes.rows[0].n,
      me: leaderEntry(me, rankRes.rows[0].r),
      entries: top.rows.map((u, i) => leaderEntry(u, i + 1)),
    })
  }),
)

// XP for re-visiting a stop you've already collected (much less than the first
// visit), and how long before a visited stop can be checked in again.
const REVISIT_XP = 10
const VISIT_COOLDOWN_MS = 30 * 60_000

// POST /api/me/stops/:id/visit — check in at a stop. First visit awards the full
// stop reward; a re-visit awards a small flat bonus, but only once the cooldown
// has elapsed (otherwise 409 with when it'll be available again). The visit time
// is stored so the client can show the cooldown state per stop.
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

    const prior = await pool.query<{ visited_at: string }>(
      'select visited_at from user_stops where user_id = $1 and stop_id = $2',
      [userId, stopId],
    )

    let awarded: number
    if (prior.rowCount) {
      const lastMs = new Date(prior.rows[0].visited_at).getTime()
      const elapsed = Date.now() - lastMs
      if (elapsed < VISIT_COOLDOWN_MS) {
        return res.status(409).json({
          error: 'Tuto zastávku můžeš navštívit znovu až za chvíli.',
          nextVisitAt: new Date(lastMs + VISIT_COOLDOWN_MS).toISOString(),
        })
      }
      await pool.query(
        'update user_stops set visited_at = now() where user_id = $1 and stop_id = $2',
        [userId, stopId],
      )
      awarded = REVISIT_XP
    } else {
      await pool.query('insert into user_stops (user_id, stop_id) values ($1, $2)', [userId, stopId])
      awarded = stopReward(stop.rows[0].is_gym, stop.rows[0].categories)
    }

    const user = await awardXp(userId, awarded)
    const visited = await visitedStops(userId)

    res.json({
      user: publicUser(user),
      visitedIds: visited.ids,
      visitedAt: visited.visitedAt,
      awardedXp: awarded,
    })
  }),
)

/** Count progress toward one quest since the period start (a JS Date). */
async function questProgress(userId: string, since: Date, q: QuestTemplate): Promise<number> {
  let sql: string
  const params: unknown[] = [userId, since]
  if (q.kind === 'visit') {
    sql = 'select count(*)::int n from user_stops where user_id = $1 and visited_at >= $2'
    if (q.category) {
      sql =
        `select count(*)::int n from user_stops us join stops s on s.id = us.stop_id
         where us.user_id = $1 and us.visited_at >= $2 and $3 = any(s.categories)`
      params.push(q.category)
    }
  } else {
    sql = 'select count(*)::int n from user_vehicles where user_id = $1 and found_at >= $2'
    if (q.category) {
      sql =
        `select count(*)::int n from user_vehicles uv join vehicle_types vt on vt.id = uv.vehicle_type_id
         where uv.user_id = $1 and uv.found_at >= $2 and vt.category = $3`
      params.push(q.category)
    }
  }
  const { rows } = await pool.query<{ n: number }>(sql, params)
  return rows[0]?.n ?? 0
}

/** Quest ids the player has already completed this period (latched — can't regress). */
async function questCompletions(userId: string, period: number): Promise<Set<string>> {
  const { rows } = await pool.query<{ quest_id: string }>(
    'select quest_id from user_quest_completions where user_id = $1 and period = $2',
    [userId, period],
  )
  return new Set(rows.map((r) => r.quest_id))
}

/** Record that a quest hit its target this period. Idempotent. */
async function latchCompletion(userId: string, period: number, questId: string): Promise<void> {
  await pool.query(
    `insert into user_quest_completions (user_id, period, quest_id) values ($1, $2, $3)
     on conflict do nothing`,
    [userId, period, questId],
  )
}

// GET /api/me/quests — this period's per-player quest set, with live progress.
meRouter.get(
  '/quests',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const period = currentPeriod(config.questPeriodHours)
    const templates = questsFor(userId, period.index)

    const claims = await pool.query<{ quest_id: string }>(
      'select quest_id from user_quest_claims where user_id = $1 and period = $2',
      [userId, period.index],
    )
    const claimed = new Set(claims.rows.map((r) => r.quest_id))
    const completed = await questCompletions(userId, period.index)

    const since = new Date(period.startMs)
    const quests = await Promise.all(
      templates.map(async (t) => {
        const value = await questProgress(userId, since, t)
        // Latch completion the first time progress reaches target, so it stays
        // done even if the player later removes a vehicle (decrementing `value`).
        if (value >= t.target && !completed.has(t.id)) {
          await latchCompletion(userId, period.index, t.id)
          completed.add(t.id)
        }
        const done = completed.has(t.id)
        return {
          id: t.id,
          title: t.title,
          category: t.category,
          icon: t.icon,
          value: done ? t.target : Math.min(value, t.target),
          max: t.target,
          reward: t.reward,
          done,
          claimed: claimed.has(t.id),
        }
      }),
    )
    res.json({ periodEndsAt: new Date(period.endMs).toISOString(), quests })
  }),
)

// POST /api/me/quests/:id/claim — collect a completed quest's XP, once per period.
meRouter.post(
  '/quests/:id/claim',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const period = currentPeriod(config.questPeriodHours)

    // Validate the quest actually belongs to THIS player's set this period.
    const template = questById(req.params.id)
    const inSet = template && questsFor(userId, period.index).some((t) => t.id === template.id)
    if (!template || !inSet) return res.status(404).json({ error: 'Výzva nenalezena.' })

    // Completed if live progress is at target, or it was latched earlier this
    // period (so removing a vehicle afterward doesn't block an earned claim).
    const value = await questProgress(userId, new Date(period.startMs), template)
    const done = value >= template.target || (await questCompletions(userId, period.index)).has(template.id)
    if (!done) {
      return res.status(400).json({ error: 'Výzva ještě není splněná.' })
    }
    if (value >= template.target) await latchCompletion(userId, period.index, template.id)

    // The claims row is the source of truth — inserting it is what prevents a
    // second payout (no row inserted ⇒ already claimed ⇒ award nothing).
    const ins = await pool.query(
      `insert into user_quest_claims (user_id, period, quest_id) values ($1, $2, $3)
       on conflict do nothing returning quest_id`,
      [userId, period.index, template.id],
    )
    if (!ins.rowCount) {
      const user = (await pool.query<UserRow>('select * from users where id = $1', [userId])).rows[0]
      return res.json({ user: publicUser(user), awardedXp: 0 })
    }

    const user = await awardXp(userId, template.reward)
    res.json({ user: publicUser(user), awardedXp: template.reward })
  }),
)

/** The calendar date one day before `date` (a YYYY-MM-DD string), UTC-safe. */
function previousDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

// POST /api/me/checkin — record today's activity and advance the daily streak.
// The client sends its LOCAL date (YYYY-MM-DD) so day boundaries match the user.
meRouter.post(
  '/checkin',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const today = String(req.body?.date ?? '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
      return res.status(400).json({ error: 'Neplatné datum.' })
    }

    const { rows } = await pool.query<UserRow>(
      `select id, username, email, avatar_url, level, xp, streak_count,
              to_char(last_active_date, 'YYYY-MM-DD') as last_active_date
       from users where id = $1`,
      [userId],
    )
    const user = rows[0]
    const last = user.last_active_date

    // Same day → already counted. Yesterday → extend. Otherwise → start over.
    if (last !== today) {
      const streak = last && last === previousDay(today) ? user.streak_count + 1 : 1
      const upd = await pool.query<UserRow>(
        `update users set streak_count = $1, last_active_date = $2 where id = $3 returning *`,
        [streak, today, userId],
      )
      return res.json({ user: publicUser(upd.rows[0]) })
    }

    res.json({ user: publicUser(user) })
  }),
)
