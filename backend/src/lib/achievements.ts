// Achievement definitions + evaluation. Like quests, the definitions live in
// code (not a table); only the fact that a player unlocked one is persisted
// (user_achievements). Unlocks are PERMANENT — once earned they don't regress if
// the player later removes a vehicle — and each grants a one-time XP reward.
//
// Progress is computed from authoritative server data (caught vehicles, distinct
// models, visited stops, streak, catalog totals), so the unlock state and XP can
// never be fabricated by the client.

export type Tier = 'common' | 'rare' | 'epic' | 'legendary'

// What a player has done so far, in the metrics achievements care about. Built
// once per evaluation (see playerMetrics in routes/me.ts) and shared by all defs.
export interface Metrics {
  /** Total caught instances (every physical vehicle). */
  caught: number
  /** Distinct catalog models found. */
  models: number
  /** Total distinct stops visited. */
  visited: number
  /** Current daily login streak. */
  streak: number
  /** Distinct models found per category. */
  modelsByCategory: Record<string, number>
  /** Total catalog models per category (the "complete the category" target). */
  catalogByCategory: Record<string, number>
  /** Total catalog size (the "complete everything" target). */
  catalogTotal: number
}

export interface AchievementDef {
  /** Stable id — the key stored in user_achievements. */
  id: string
  title: string
  desc: string
  /** Lucide icon name for the badge. */
  icon: string
  tier: Tier
  /** Accent color (CSS value) for the badge. */
  color: string
  /** Current progress for this player. */
  value: (m: Metrics) => number
  /** Target to unlock. Dynamic for "complete a category/collection" goals; a
   *  target of 0 (e.g. a category with no seeded catalog) is treated as locked. */
  target: (m: Metrics) => number
}

/** XP granted the first time an achievement unlocks, by tier. */
export const TIER_REWARD: Record<Tier, number> = {
  common: 50,
  rare: 150,
  epic: 300,
  legendary: 600,
}

// Mirrors the badges the client previously computed locally, now authoritative.
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-catch', title: 'První úlovek', desc: 'Vyfoť 1. vozidlo', icon: 'sparkles', tier: 'common', color: 'var(--xp)',
    value: (m) => m.caught, target: () => 1 },
  { id: 'collector-10', title: 'Sběratel', desc: 'Ulov 10 vozidel', icon: 'layers', tier: 'rare', color: 'var(--rarity-rare)',
    value: (m) => m.caught, target: () => 10 },
  { id: 'master-25', title: 'Mistr sbírky', desc: 'Ulov 25 vozidel', icon: 'crown', tier: 'epic', color: 'var(--rarity-epic)',
    value: (m) => m.caught, target: () => 25 },
  { id: 'tram-complete', title: 'Lovec tramvají', desc: 'Všechny tramvaje', icon: 'tram-front', tier: 'epic', color: 'var(--cat-tram)',
    value: (m) => m.modelsByCategory.tram ?? 0, target: (m) => m.catalogByCategory.tram ?? 0 },
  { id: 'bus-complete', title: 'Pán autobusů', desc: 'Všechny autobusy', icon: 'bus', tier: 'rare', color: 'var(--cat-bus)',
    value: (m) => m.modelsByCategory.bus ?? 0, target: (m) => m.catalogByCategory.bus ?? 0 },
  { id: 'metro-complete', title: 'Metro expert', desc: 'Celé metro', icon: 'train-front-tunnel', tier: 'epic', color: 'var(--cat-metro)',
    value: (m) => m.modelsByCategory.metro ?? 0, target: (m) => m.catalogByCategory.metro ?? 0 },
  { id: 'visit-5', title: 'Cestovatel', desc: 'Navštiv 5 zastávek', icon: 'map-pin', tier: 'common', color: 'var(--brand)',
    value: (m) => m.visited, target: () => 5 },
  { id: 'visit-50', title: 'Šotouš na cestách', desc: 'Navštiv 50 zastávek', icon: 'route', tier: 'rare', color: 'var(--cat-trolley)',
    value: (m) => m.visited, target: () => 50 },
  { id: 'streak-3', title: 'Ve formě', desc: 'Hraj 3 dny v řadě', icon: 'flame', tier: 'common', color: 'var(--xp)',
    value: (m) => m.streak, target: () => 3 },
  { id: 'streak-7', title: 'Týden v kuse', desc: 'Hraj 7 dní v řadě', icon: 'flame', tier: 'rare', color: 'var(--rarity-rare)',
    value: (m) => m.streak, target: () => 7 },
  { id: 'streak-30', title: 'Neúnavný šotouš', desc: 'Hraj 30 dní v řadě', icon: 'flame', tier: 'legendary', color: 'var(--rarity-legendary)',
    value: (m) => m.streak, target: () => 30 },
  { id: 'complete-all', title: 'Kompletista', desc: 'Dokonči celou sbírku', icon: 'award', tier: 'legendary', color: 'var(--rarity-legendary)',
    value: (m) => m.models, target: (m) => m.catalogTotal },
]

/** An achievement as reported to the client, with this player's progress. */
export interface AchievementView {
  id: string
  title: string
  desc: string
  icon: string
  tier: Tier
  color: string
  value: number
  max: number
  unlocked: boolean
  reward: number
}

/** Evaluate every achievement for a player's metrics + their persisted unlocks.
 *  `unlockedIds` are achievements already latched in user_achievements (stay
 *  unlocked even if live progress dropped below target). */
export function evaluate(m: Metrics, unlockedIds: Set<string>): AchievementView[] {
  return ACHIEVEMENTS.map((a) => {
    const max = a.target(m)
    const value = a.value(m)
    const unlocked = unlockedIds.has(a.id) || (max > 0 && value >= max)
    return {
      id: a.id,
      title: a.title,
      desc: a.desc,
      icon: a.icon,
      tier: a.tier,
      color: a.color,
      // Show the capped value once unlocked so the bar reads as full.
      value: unlocked ? Math.max(value, max) : value,
      max,
      unlocked,
      reward: TIER_REWARD[a.tier],
    }
  })
}
