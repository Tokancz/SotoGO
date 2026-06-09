// Leaderboard API — top players by XP plus the caller's own rank (so it can be
// pinned when they're outside the returned slice).
import api, { mediaUrl } from './api'

/** Which stat the leaderboard is ranked by. */
export type LeaderboardMetric = 'xp' | 'battles' | 'time'

export interface LeaderboardEntry {
  rank: number
  id: string
  username: string
  avatarUrl: string | null
  level: number
  xp: number
  /** Gyms taken from another player. */
  battlesWon: number
  /** Total seconds spent defending gyms (banked + currently held). */
  gymSeconds: number
}

export interface LeaderboardData {
  /** Total number of players (the leaderboard returns at most the top 100). */
  total: number
  /** The metric the entries are ranked by. */
  metric: LeaderboardMetric
  /** The current player's own entry, with their global rank. */
  me: LeaderboardEntry
  /** Top players, already ranked by the requested metric. */
  entries: LeaderboardEntry[]
}

const withAbsoluteAvatar = (e: LeaderboardEntry): LeaderboardEntry => ({
  ...e,
  avatarUrl: mediaUrl(e.avatarUrl) ?? null,
})

export const leaderboardApi = {
  get: (metric: LeaderboardMetric = 'xp') =>
    api.get<LeaderboardData>('/me/leaderboard', { params: { metric } }).then((r) => ({
      ...r.data,
      me: withAbsoluteAvatar(r.data.me),
      entries: r.data.entries.map(withAbsoluteAvatar),
    })),
}
