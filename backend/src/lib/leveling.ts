// Server-side leveling curve. MUST match frontend/src/lib/leveling.ts so the
// level derived for display equals the level persisted here.

/** XP required to advance FROM `level` to `level + 1`. */
export function xpToNext(level: number): number {
  return 300 + (level - 1) * 150
}

/** Level reached at a given cumulative XP total. */
export function levelFromTotalXp(totalXp: number): number {
  let level = 1
  let remaining = Math.max(0, Math.floor(totalXp))
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level)
    level += 1
  }
  return level
}
