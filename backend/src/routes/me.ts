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
import {
  BATTLE_DURATION_MS,
  BATTLE_GRACE_MS,
  BATTLE_WIN_XP,
  MAX_TAPS_PER_SEC,
  regenHp,
  rollRarity,
  rollStats,
} from '../lib/combat.js'

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

/** Combat stats per collected vehicle id (HP regen applied for any deployed ones). */
async function collectedStats(userId: string) {
  const { rows } = await pool.query<{
    vehicle_type_id: string
    rarity: string
    hp: number
    max_hp: number
    attack: number
    deployed_stop_id: string | null
    defender_hp: number | null
    last_regen_at: string | null
  }>(
    `select uv.vehicle_type_id, uv.rarity, uv.hp, uv.max_hp, uv.attack, uv.deployed_stop_id,
            g.defender_hp, g.last_regen_at
       from user_vehicles uv
       left join gym_state g on g.stop_id = uv.deployed_stop_id and g.holder_user_id = uv.user_id
      where uv.user_id = $1`,
    [userId],
  )
  const now = Date.now()
  const out: Record<
    string,
    { rarity: string; hp: number; maxHp: number; attack: number; deployedStopId: string | null }
  > = {}
  for (const r of rows) {
    // A deployed vehicle's live HP lives on gym_state (with regen); an idle one is full.
    const hp =
      r.defender_hp != null && r.last_regen_at
        ? regenHp(r.defender_hp, r.max_hp, new Date(r.last_regen_at).getTime(), now)
        : r.hp
    out[String(r.vehicle_type_id)] = {
      rarity: r.rarity,
      hp,
      maxHp: r.max_hp,
      attack: r.attack,
      deployedStopId: r.deployed_stop_id ? String(r.deployed_stop_id) : null,
    }
  }
  return out
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
    const [collected, visited, photos, stats] = await Promise.all([
      collectedIds(userId),
      visitedStops(userId),
      collectedPhotos(userId),
      collectedStats(userId),
    ])
    res.json({
      collectedIds: collected,
      visitedIds: visited.ids,
      visitedAt: visited.visitedAt,
      photos,
      stats,
    })
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
      // Abandon any gyms this player holds and drop their battle history.
      pool.query('delete from gym_state where holder_user_id = $1', [userId]),
      pool.query('delete from gym_battles where attacker_user_id = $1', [userId]),
    ])

    const { rows } = await pool.query<UserRow>(
      `update users set xp = 0, level = 1, streak_count = 0, last_active_date = null,
              battles_won = 0, gym_seconds = 0
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

    const vt = await pool.query<{ rarity: string }>(
      'select rarity from vehicle_types where id = $1',
      [vehicleId],
    )
    if (!vt.rowCount) return res.status(404).json({ error: 'Vozidlo nenalezeno.' })

    // Keep the FIRST catch and its photo — a re-scan just reports current state.
    const prior = await pool.query<{
      image_url: string | null
      rarity: string
      hp: number
      max_hp: number
      attack: number
    }>(
      'select image_url, rarity, hp, max_hp, attack from user_vehicles where user_id = $1 and vehicle_type_id = $2',
      [userId, vehicleId],
    )

    if (prior.rowCount) {
      const user = (await pool.query<UserRow>('select * from users where id = $1', [userId])).rows[0]
      const ids = await collectedIds(userId)
      const p = prior.rows[0]
      return res.json({
        user: publicUser(user),
        collectedIds: ids,
        awardedXp: 0,
        imageUrl: p.image_url,
        rarity: p.rarity,
        stats: { hp: p.hp, maxHp: p.max_hp, attack: p.attack },
      })
    }

    const imageUrl = req.file ? await saveImage(req.file.buffer, req.file.mimetype) : null
    // Roll this catch's rarity (biased by the model's base rarity), then its
    // combat stats from that rolled rarity (see lib/combat.ts).
    const rarity = rollRarity(vt.rows[0].rarity)
    const { maxHp, attack } = rollStats(rarity)
    await pool.query(
      `insert into user_vehicles (user_id, vehicle_type_id, image_url, rarity, max_hp, hp, attack)
       values ($1, $2, $3, $4, $5, $5, $6)`,
      [userId, vehicleId, imageUrl, rarity, maxHp, attack],
    )
    const user = await awardXp(userId, CATCH_XP)
    const ids = await collectedIds(userId)

    res.json({
      user: publicUser(user),
      collectedIds: ids,
      awardedXp: CATCH_XP,
      imageUrl,
      rarity,
      stats: { hp: maxHp, maxHp, attack },
    })
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

    // A vehicle defending a gym is locked — recall it first.
    const deployed = await pool.query(
      'select 1 from user_vehicles where user_id = $1 and vehicle_type_id = $2 and deployed_stop_id is not null',
      [userId, vehicleId],
    )
    if (deployed.rowCount) {
      return res.status(409).json({ error: 'Vozidlo brání gym. Nejdřív ho stáhni.' })
    }

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

// GET /api/me/leaderboard?metric=xp|battles|time — top players by the chosen
// metric, plus the caller's own rank so it can be pinned when they're outside the
// top slice. Every entry carries all three values; the client shows the relevant
// one. Ranking is metric desc, then id asc as a stable tiebreak.
const LEADERBOARD_LIMIT = 100

// Map each metric to its ranking column in the `ranked` CTE below (whitelisted —
// never interpolate raw query input into SQL).
const METRIC_COL: Record<string, string> = {
  xp: 'xp',
  battles: 'battles_won',
  time: 'gym_time',
}

interface LeaderRow {
  id: string
  username: string
  avatar_url: string | null
  level: number
  xp: number
  battles_won: number
  gym_time: number
}

function leaderEntry(u: LeaderRow, rank: number) {
  return {
    rank,
    id: String(u.id),
    username: u.username,
    avatarUrl: u.avatar_url,
    level: u.level,
    xp: u.xp,
    battlesWon: u.battles_won,
    // Finalized holding seconds plus any time currently being defended.
    gymSeconds: Math.round(Number(u.gym_time)),
  }
}

// Per-user metrics, including live gym-holding seconds (banked + currently held).
const RANKED_CTE = `
  with held as (
    select holder_user_id, sum(extract(epoch from now() - held_since)) as live
    from gym_state group by holder_user_id
  ),
  ranked as (
    select u.id, u.username, u.avatar_url, u.level, u.xp, u.battles_won,
           (u.gym_seconds + coalesce(h.live, 0)) as gym_time
    from users u left join held h on h.holder_user_id = u.id
  )`

meRouter.get(
  '/leaderboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const metric = typeof req.query.metric === 'string' && req.query.metric in METRIC_COL
      ? req.query.metric
      : 'xp'
    const col = METRIC_COL[metric]

    const me = (
      await pool.query<LeaderRow>(`${RANKED_CTE} select * from ranked where id = $1`, [userId])
    ).rows[0]

    const [top, totalRes, rankRes] = await Promise.all([
      pool.query<LeaderRow>(
        `${RANKED_CTE} select * from ranked order by ${col} desc, id asc limit $1`,
        [LEADERBOARD_LIMIT],
      ),
      pool.query<{ n: number }>('select count(*)::int n from users'),
      pool.query<{ r: number }>(
        `${RANKED_CTE}
         select count(*)::int + 1 r from ranked
         where ${col} > $1 or (${col} = $1 and id < $2)`,
        [me[col as keyof LeaderRow], me.id],
      ),
    ])

    res.json({
      total: totalRes.rows[0].n,
      metric,
      me: leaderEntry(me, rankRes.rows[0].r),
      entries: top.rows.map((u, i) => leaderEntry(u, i + 1)),
    })
  }),
)

// ── Gyms ───────────────────────────────────────────────────────────────────
// King-of-the-hill battles. One defending vehicle holds a gym until recalled or
// beaten. Presence (being at the gym) is gated client-side, like stop visits.

interface GymRow {
  stop_id: string
  holder_user_id: string
  vehicle_type_id: string
  defender_hp: number
  defender_max_hp: number
  defender_attack: number
  held_since: string
  last_regen_at: string
}

/** The gym's current defender, or null if open. */
async function gymRow(stopId: string): Promise<GymRow | null> {
  const { rows } = await pool.query<GymRow>('select * from gym_state where stop_id = $1', [stopId])
  return rows[0] ?? null
}

/** Defender HP after regen, persisting the healed value so it can't be re-healed twice. */
async function applyRegen(g: GymRow): Promise<number> {
  const hp = regenHp(g.defender_hp, g.defender_max_hp, new Date(g.last_regen_at).getTime(), Date.now())
  if (hp !== g.defender_hp) {
    await pool.query('update gym_state set defender_hp = $1, last_regen_at = now() where stop_id = $2', [
      hp,
      g.stop_id,
    ])
  }
  return hp
}

/** Add a finished holding stint's seconds to the holder's lifetime total. */
async function finalizeHolding(holderId: string, heldSinceIso: string): Promise<void> {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(heldSinceIso).getTime()) / 1000))
  if (seconds > 0) {
    await pool.query('update users set gym_seconds = gym_seconds + $1 where id = $2', [seconds, holderId])
  }
}

async function defenderPayload(g: GymRow, hp: number) {
  const { rows } = await pool.query<{
    model: string
    short_name: string
    rarity: string
    username: string
    avatar_url: string | null
    holder_id: string
  }>(
    // Prefer the deployed instance's rolled rarity; fall back to the model's base.
    `select vt.model, vt.short_name, coalesce(uv.rarity, vt.rarity) as rarity,
            u.username, u.avatar_url, u.id as holder_id
       from vehicle_types vt
       join users u on u.id = $2
       left join user_vehicles uv on uv.user_id = $2 and uv.vehicle_type_id = $1
      where vt.id = $1`,
    [g.vehicle_type_id, g.holder_user_id],
  )
  const r = rows[0]
  return {
    holder: r ? { id: String(r.holder_id), username: r.username, avatarUrl: r.avatar_url } : null,
    defender: r
      ? { model: r.model, shortName: r.short_name, rarity: r.rarity, hp, maxHp: g.defender_max_hp, attack: g.defender_attack }
      : null,
    heldSince: g.held_since,
  }
}

// GET /api/me/gyms/:stopId — who holds the gym and the defender's current state.
meRouter.get(
  '/gyms/:stopId',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const g = await gymRow(req.params.stopId)
    if (!g) return res.json({ holder: null, defender: null, heldSince: null, isMine: false })
    const hp = await applyRegen(g)
    res.json({ ...(await defenderPayload(g, hp)), isMine: g.holder_user_id === userId })
  }),
)

/** Look up an idle (not-deployed) vehicle the player owns; null if missing/deployed. */
async function idleVehicle(userId: string, vehicleId: string) {
  const { rows } = await pool.query<{ max_hp: number; attack: number; deployed_stop_id: string | null }>(
    'select max_hp, attack, deployed_stop_id from user_vehicles where user_id = $1 and vehicle_type_id = $2',
    [userId, vehicleId],
  )
  return rows[0] ?? null
}

// POST /api/me/gyms/:stopId/deploy — place one of your vehicles to defend an open gym.
meRouter.post(
  '/gyms/:stopId/deploy',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const stopId = req.params.stopId
    const vehicleId = String(req.body?.vehicleId ?? '')

    const stop = await pool.query<{ is_gym: boolean }>('select is_gym from stops where id = $1', [stopId])
    if (!stop.rowCount) return res.status(404).json({ error: 'Zastávka nenalezena.' })
    if (!stop.rows[0].is_gym) return res.status(400).json({ error: 'Tato zastávka není gym.' })

    const v = await idleVehicle(userId, vehicleId)
    if (!v) return res.status(404).json({ error: 'Vozidlo nenalezeno.' })
    if (v.deployed_stop_id) return res.status(409).json({ error: 'Vozidlo už brání jiný gym.' })

    // Claim the vehicle first (guards against deploying it to two gyms at once)…
    const claim = await pool.query(
      'update user_vehicles set deployed_stop_id = $1, hp = max_hp where user_id = $2 and vehicle_type_id = $3 and deployed_stop_id is null',
      [stopId, userId, vehicleId],
    )
    if (!claim.rowCount) return res.status(409).json({ error: 'Vozidlo už brání jiný gym.' })

    // …then claim the gym slot. On conflict the gym is taken — release the vehicle.
    const ins = await pool.query(
      `insert into gym_state (stop_id, holder_user_id, vehicle_type_id, defender_hp, defender_max_hp, defender_attack)
       values ($1, $2, $3, $4, $4, $5) on conflict (stop_id) do nothing returning stop_id`,
      [stopId, userId, vehicleId, v.max_hp, v.attack],
    )
    if (!ins.rowCount) {
      await pool.query(
        'update user_vehicles set deployed_stop_id = null where user_id = $1 and vehicle_type_id = $2',
        [userId, vehicleId],
      )
      return res.status(409).json({ error: 'Tento gym už někdo obsadil.' })
    }

    const g = await gymRow(stopId)
    res.json({ ...(g ? await defenderPayload(g, g.defender_hp) : {}), isMine: true })
  }),
)

// POST /api/me/gyms/:stopId/recall — pull your defender out (frees the gym, banks
// the holding time, heals the vehicle).
meRouter.post(
  '/gyms/:stopId/recall',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const stopId = req.params.stopId
    const g = await gymRow(stopId)
    if (!g || g.holder_user_id !== userId) {
      return res.status(409).json({ error: 'Tento gym nebráníš.' })
    }
    await finalizeHolding(userId, g.held_since)
    await pool.query(
      'update user_vehicles set deployed_stop_id = null, hp = max_hp where user_id = $1 and vehicle_type_id = $2',
      [userId, g.vehicle_type_id],
    )
    await pool.query('delete from gym_state where stop_id = $1', [stopId])
    res.json({ holder: null, defender: null, heldSince: null, isMine: false })
  }),
)

// POST /api/me/gyms/:stopId/battle/start — begin a timed attack on the gym's
// defender. The server stamps the start time; resolve derives elapsed from it.
meRouter.post(
  '/gyms/:stopId/battle/start',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const stopId = req.params.stopId
    const vehicleId = String(req.body?.vehicleId ?? '')

    const g = await gymRow(stopId)
    if (!g) return res.status(409).json({ error: 'Tento gym nikdo nebrání — můžeš ho obsadit.' })
    if (g.holder_user_id === userId) return res.status(409).json({ error: 'Tento gym už bráníš ty.' })

    const v = await idleVehicle(userId, vehicleId)
    if (!v) return res.status(404).json({ error: 'Vozidlo nenalezeno.' })
    if (v.deployed_stop_id) return res.status(409).json({ error: 'Vozidlo brání jiný gym.' })

    const hp = await applyRegen(g)
    const { rows } = await pool.query<{ id: string }>(
      `insert into gym_battles (stop_id, attacker_user_id, vehicle_type_id, attacker_attack, defender_hp_at_start)
       values ($1, $2, $3, $4, $5) returning id`,
      [stopId, userId, vehicleId, v.attack, hp],
    )
    res.json({
      battleId: String(rows[0].id),
      defenderHp: hp,
      attackerAttack: v.attack,
      durationMs: BATTLE_DURATION_MS,
      maxTapsPerSec: MAX_TAPS_PER_SEC,
    })
  }),
)

// POST /api/me/gyms/battle/:battleId/resolve — finish a battle. Damage is
// recomputed authoritatively: hits are capped to what's physically possible in
// the server-measured elapsed time, so the client can't claim a bogus win.
meRouter.post(
  '/gyms/battle/:battleId/resolve',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    const battleId = req.params.battleId
    const hits = Math.max(0, Math.floor(Number(req.body?.hits ?? 0)))

    const battleRes = await pool.query<{
      stop_id: string
      vehicle_type_id: string
      attacker_attack: number
      started_at: string
      resolved_at: string | null
    }>(
      'select stop_id, vehicle_type_id, attacker_attack, started_at, resolved_at from gym_battles where id = $1 and attacker_user_id = $2',
      [battleId, userId],
    )
    if (!battleRes.rowCount) return res.status(404).json({ error: 'Bitva nenalezena.' })
    const b = battleRes.rows[0]
    if (b.resolved_at) return res.status(409).json({ error: 'Bitva už byla vyhodnocena.' })

    // Cap credited taps to what fits in the elapsed window (clamped to the round
    // length, so a late submit can't inflate the cap).
    const elapsedSec = Math.min(
      BATTLE_DURATION_MS + BATTLE_GRACE_MS,
      Date.now() - new Date(b.started_at).getTime(),
    ) / 1000
    const maxHits = Math.ceil(MAX_TAPS_PER_SEC * Math.min(elapsedSec, BATTLE_DURATION_MS / 1000))
    const damage = Math.min(hits, maxHits) * b.attacker_attack

    const markResolved = (won: boolean) =>
      pool.query('update gym_battles set resolved_at = now(), won = $1 where id = $2', [won, battleId])

    const g = await gymRow(b.stop_id)
    // Defender vanished mid-battle (recalled, or already taken over) — void result.
    if (!g || g.holder_user_id === userId) {
      await markResolved(false)
      const user = (await pool.query<UserRow>('select * from users where id = $1', [userId])).rows[0]
      return res.json({ won: false, awardedXp: 0, defenderHp: g ? g.defender_hp : null, user: publicUser(user), voided: true })
    }

    const currentHp = await applyRegen(g)

    if (damage < currentHp) {
      // Defender survives — drain its motivation (HP), persist.
      const left = Math.max(1, currentHp - damage)
      await pool.query('update gym_state set defender_hp = $1, last_regen_at = now() where stop_id = $2', [
        left,
        b.stop_id,
      ])
      await markResolved(false)
      const user = (await pool.query<UserRow>('select * from users where id = $1', [userId])).rows[0]
      return res.json({ won: false, awardedXp: 0, defenderHp: left, user: publicUser(user) })
    }

    // Win: bank the old holder's time, return their (healed) vehicle, and take the
    // gym with the attacking vehicle at full HP.
    await finalizeHolding(g.holder_user_id, g.held_since)
    await pool.query(
      'update user_vehicles set deployed_stop_id = null, hp = max_hp where user_id = $1 and vehicle_type_id = $2',
      [g.holder_user_id, g.vehicle_type_id],
    )
    await pool.query('delete from gym_state where stop_id = $1', [b.stop_id])

    // Deploy the attacker's vehicle (claim it; if it's busy, the gym just stays open).
    const claim = await pool.query<{ max_hp: number; attack: number }>(
      'update user_vehicles set deployed_stop_id = $1, hp = max_hp where user_id = $2 and vehicle_type_id = $3 and deployed_stop_id is null returning max_hp, attack',
      [b.stop_id, userId, b.vehicle_type_id],
    )
    let newDefenderHp: number | null = null
    if (claim.rowCount) {
      const nv = claim.rows[0]
      await pool.query(
        `insert into gym_state (stop_id, holder_user_id, vehicle_type_id, defender_hp, defender_max_hp, defender_attack)
         values ($1, $2, $3, $4, $4, $5) on conflict (stop_id) do nothing`,
        [b.stop_id, userId, b.vehicle_type_id, nv.max_hp, nv.attack],
      )
      newDefenderHp = nv.max_hp
    }

    await markResolved(true)
    await pool.query('update users set battles_won = battles_won + 1 where id = $1', [userId])
    const user = await awardXp(userId, BATTLE_WIN_XP)
    res.json({ won: true, awardedXp: BATTLE_WIN_XP, defenderHp: newDefenderHp, user: publicUser(user) })
  }),
)

// XP for re-visiting a stop you've already collected (much less than the first
// visit), and how long before a visited stop can be checked in again.
const REVISIT_XP = 10
const VISIT_COOLDOWN_MS = 30 * 60_000

// POST /api/me/avatar — upload/replace the player's profile picture (multipart
// "photo"). Stored like catch photos; the previous uploaded avatar is cleaned up
// (deleteImage ignores external URLs such as the Google profile picture).
meRouter.post(
  '/avatar',
  upload.single('photo'),
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.userId!
    if (!req.file) return res.status(400).json({ error: 'Chybí obrázek.' })

    const prior = await pool.query<{ avatar_url: string | null }>(
      'select avatar_url from users where id = $1',
      [userId],
    )
    const url = await saveImage(req.file.buffer, req.file.mimetype, 'avatars')
    const { rows } = await pool.query<UserRow>(
      'update users set avatar_url = $1 where id = $2 returning *',
      [url, userId],
    )
    await deleteImage(prior.rows[0]?.avatar_url ?? null)

    res.json({ user: publicUser(rows[0]) })
  }),
)

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
