// Daily quests. A player's set is NOT stored — it's derived deterministically
// from (userId, period) so it's random per person, identical every time it's
// recomputed within a period, and rolls over to a fresh set each period. Only
// the fact that a completed quest's reward was claimed is persisted
// (user_quest_claims), so XP can't be collected twice. Progress is counted live
// from user_vehicles / user_stops — see routes/me.ts.

export type QuestCategory = 'tram' | 'bus' | 'metro' | 'trolley' | 'train'

export interface QuestTemplate {
  /** Stable id — referenced by the claim endpoint and the claims table. */
  id: string
  /** What action advances it. */
  kind: 'visit' | 'catch'
  /** Restrict to one category, or null for "any". */
  category: QuestCategory | null
  /** How many to reach completion. */
  target: number
  /** XP awarded on claim. */
  reward: number
  /** Lucide icon name for the card. */
  icon: string
  /** Czech card title. */
  title: string
}

/** How many quests each player gets per period. */
export const QUEST_COUNT = 5

// Pool restricted to categories Prague's seeded data actually has plenty of
// (tram, bus, metro) plus category-agnostic goals, so no quest is unwinnable.
const QUEST_TEMPLATES: QuestTemplate[] = [
  { id: 'visit-any-3', kind: 'visit', category: null, target: 3, reward: 80, icon: 'route', title: 'Navštiv 3 zastávky' },
  { id: 'visit-any-5', kind: 'visit', category: null, target: 5, reward: 130, icon: 'route', title: 'Navštiv 5 zastávek' },
  { id: 'visit-metro-2', kind: 'visit', category: 'metro', target: 2, reward: 110, icon: 'train-front-tunnel', title: 'Navštiv 2 stanice metra' },
  { id: 'visit-tram-3', kind: 'visit', category: 'tram', target: 3, reward: 100, icon: 'map-pin', title: 'Navštiv 3 tramvajové zastávky' },
  { id: 'visit-bus-3', kind: 'visit', category: 'bus', target: 3, reward: 90, icon: 'map-pin', title: 'Navštiv 3 autobusové zastávky' },
  { id: 'catch-any-1', kind: 'catch', category: null, target: 1, reward: 70, icon: 'camera', title: 'Vyfoť libovolné vozidlo' },
  { id: 'catch-any-3', kind: 'catch', category: null, target: 3, reward: 150, icon: 'camera', title: 'Vyfoť 3 vozidla' },
  { id: 'catch-tram-1', kind: 'catch', category: 'tram', target: 1, reward: 90, icon: 'tram-front', title: 'Vyfoť tramvaj' },
  { id: 'catch-bus-1', kind: 'catch', category: 'bus', target: 1, reward: 90, icon: 'bus', title: 'Vyfoť autobus' },
  { id: 'catch-metro-1', kind: 'catch', category: 'metro', target: 1, reward: 110, icon: 'train-front-tunnel', title: 'Vyfoť soupravu metra' },
]

const TEMPLATES_BY_ID = new Map(QUEST_TEMPLATES.map((t) => [t.id, t]))

export interface Period {
  /** Integer period index: floor(epoch_ms / period_ms). */
  index: number
  /** Period start, ms since epoch. */
  startMs: number
  /** Period end (= next period's start), ms since epoch. */
  endMs: number
}

/** The quest period containing `now`, aligned to the Unix epoch (UTC). */
export function currentPeriod(periodHours: number, now: number = Date.now()): Period {
  const periodMs = periodHours * 3600_000
  const index = Math.floor(now / periodMs)
  return { index, startMs: index * periodMs, endMs: (index + 1) * periodMs }
}

// FNV-1a hash → 32-bit seed for the PRNG, from a stable per-user-per-period key.
function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// mulberry32 — tiny deterministic PRNG. Same seed ⇒ same sequence everywhere.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The quests a given player has for a given period. Deterministic: a seeded
 * Fisher–Yates shuffle of the pool, take the first QUEST_COUNT.
 */
export function questsFor(userId: string, period: number): QuestTemplate[] {
  const rng = mulberry32(hashSeed(`${userId}:${period}`))
  const pool = [...QUEST_TEMPLATES]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, QUEST_COUNT)
}

/** Look up a template by id (to validate a claim request). */
export function questById(id: string): QuestTemplate | undefined {
  return TEMPLATES_BY_ID.get(id)
}
