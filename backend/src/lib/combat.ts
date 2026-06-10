// Gym-battle combat model. Vehicle HP/Attack are rolled once on first catch from
// the model's rarity; gyms are king-of-the-hill, fought via a timed tap loop.
//
// IMPORTANT: the rarity bands here MUST stay in sync with the backfill UPDATE in
// db/schema.sql, and the tap/duration constants with the client battle overlay.

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

interface Band {
  hp: [number, number]
  attack: [number, number]
}

/** HP + Attack ranges per rarity (inclusive). Rarer ⇒ tankier and harder-hitting.
 *  Tuned so a defender takes several tap-rounds to drain (HP ≫ attacker damage in
 *  one round). MUST stay in sync with the backfill bands in db/schema.sql. */
export const RARITY_BANDS: Record<Rarity, Band> = {
  common: { hp: [120, 180], attack: [9, 13] },
  rare: { hp: [180, 260], attack: [13, 19] },
  epic: { hp: [240, 340], attack: [18, 26] },
  legendary: { hp: [320, 440], attack: [24, 34] },
}

const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))

/** Roll combat stats for a freshly caught vehicle of the given rarity. */
export function rollStats(rarity: string): { maxHp: number; attack: number } {
  const band = RARITY_BANDS[(rarity as Rarity)] ?? RARITY_BANDS.common
  return { maxHp: randInt(...band.hp), attack: randInt(...band.attack) }
}

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary']

// How a catch's rarity is rolled, biased by the model's *base* rarity (its
// catalog tier). Each row is the outcome weights over [common, rare, epic,
// legendary]: a model usually rolls near its base, but there's always a chance to
// roll up (a lucky catch) or down. Tweak here to make jackpots rarer/commoner.
const RARITY_WEIGHTS: Record<Rarity, number[]> = {
  common: [80, 16, 3.5, 0.5],
  rare: [25, 55, 17, 3],
  epic: [5, 25, 55, 15],
  legendary: [1, 9, 35, 55],
}

/** Roll a caught vehicle's rarity, weighted toward the model's base rarity. */
export function rollRarity(base: string): Rarity {
  const weights = RARITY_WEIGHTS[(base as Rarity)] ?? RARITY_WEIGHTS.common
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < RARITY_ORDER.length; i++) {
    if ((r -= weights[i]) < 0) return RARITY_ORDER[i]
  }
  return RARITY_ORDER[RARITY_ORDER.length - 1]
}

// ── Battle tuning ────────────────────────────────────────────────────────────
/** How long the attacker has to drain the defender's HP. */
export const BATTLE_DURATION_MS = 25_000
/** Grace added to the duration when validating elapsed time server-side. */
export const BATTLE_GRACE_MS = 3_000
/** Max taps/sec we'll credit — caps how much damage an attacker can claim, and
 *  (with the tankier HP bands) makes draining a strong defender take real effort. */
export const MAX_TAPS_PER_SEC = 6
/** XP for taking over a gym. */
export const BATTLE_WIN_XP = 80
/** Defender HP healed per hour while defending (regenerates after being attacked). */
export const HP_REGEN_PER_HOUR = 40

/** Defender HP after regen, given the stored hp and when it was last updated. */
export function regenHp(hp: number, maxHp: number, lastRegenAtMs: number, nowMs: number): number {
  const healed = ((nowMs - lastRegenAtMs) / 3_600_000) * HP_REGEN_PER_HOUR
  return Math.min(maxHp, Math.floor(hp + Math.max(0, healed)))
}
