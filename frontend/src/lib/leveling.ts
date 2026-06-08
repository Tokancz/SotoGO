// Client-side leveling curve. The backend stores cumulative XP as the source of
// truth; level and within-level progress are DERIVED from it here so the whole
// UI stays consistent. When the backend computes XP authoritatively (see
// docs/ARCHITECTURE.md "Autoritativní skórování"), this stays the display math.

/** XP required to advance FROM `level` to `level + 1`. Gentle linear ramp. */
export function xpToNext(level: number): number {
  return 300 + (level - 1) * 150
}

export interface LevelProgress {
  /** Current level (starts at 1). */
  level: number
  /** XP earned within the current level. */
  xpIntoLevel: number
  /** XP needed to clear the current level. */
  xpForNext: number
}

/** Convert cumulative lifetime XP into a level + progress within that level. */
export function levelFromTotalXp(totalXp: number): LevelProgress {
  let level = 1
  let remaining = Math.max(0, Math.floor(totalXp))
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level)
    level += 1
  }
  return { level, xpIntoLevel: remaining, xpForNext: xpToNext(level) }
}
