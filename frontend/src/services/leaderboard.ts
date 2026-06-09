// Leaderboard API — top players by XP plus the caller's own rank (so it can be
// pinned when they're outside the returned slice).
import api from './api'

export interface LeaderboardEntry {
  rank: number
  id: string
  username: string
  avatarUrl: string | null
  level: number
  xp: number
}

export interface LeaderboardData {
  /** Total number of players (the leaderboard returns at most the top 100). */
  total: number
  /** The current player's own entry, with their global rank. */
  me: LeaderboardEntry
  /** Top players, already ranked, most XP first. */
  entries: LeaderboardEntry[]
}

export const leaderboardApi = {
  get: () => api.get<LeaderboardData>('/me/leaderboard').then((r) => r.data),
}
