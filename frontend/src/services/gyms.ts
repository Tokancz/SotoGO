// Gym battle API (all require auth). King-of-the-hill: one vehicle defends a gym
// until recalled or beaten. XP/counters are awarded server-side, so the deploy/
// resolve responses carry the updated user where relevant.
import api, { mediaUrl } from './api'
import type { User } from '@/types/auth'
import type { BattleResult, BattleStart, GymState } from '@/types/game'

/** Resolve the defender's catch-photo path to an absolute media URL. */
function withDefenderPhoto(s: GymState): GymState {
  if (s.defender?.imageUrl) s.defender.imageUrl = mediaUrl(s.defender.imageUrl) ?? null
  return s
}

export const gymsApi = {
  /** Current defender + holder of a gym (HP regen applied server-side). */
  getState: (stopId: string) =>
    api.get<GymState>(`/me/gyms/${stopId}`).then((r) => withDefenderPhoto(r.data)),

  /** Place one of your vehicles (by caught-instance id) to defend an open gym. */
  deploy: (stopId: string, vehicleId: string) =>
    api.post<GymState>(`/me/gyms/${stopId}/deploy`, { vehicleId }).then((r) => withDefenderPhoto(r.data)),

  /** Pull your defender out of a gym you hold. */
  recall: (stopId: string) =>
    api.post<GymState>(`/me/gyms/${stopId}/recall`).then((r) => withDefenderPhoto(r.data)),

  /** Begin a timed attack; returns the defender HP + the round's limits. */
  battleStart: (stopId: string, vehicleId: string) =>
    api.post<BattleStart>(`/me/gyms/${stopId}/battle/start`, { vehicleId }).then((r) => r.data),

  /** Resolve a battle by reporting the number of taps landed. */
  battleResolve: (battleId: string, hits: number) =>
    api
      .post<BattleResult & { user: User }>(`/me/gyms/battle/${battleId}/resolve`, { hits })
      .then((r) => r.data),
}
