// Player progress API (collection + visits). All endpoints require auth; XP is
// awarded server-side, so responses carry the updated user.
import api from './api'
import type { User } from '@/types/auth'

interface MutationResult {
  user: User
  awardedXp: number
}

export const progressApi = {
  get: () =>
    api.get<{ collectedIds: string[]; visitedIds: string[] }>('/me/progress').then((r) => r.data),

  collectVehicle: (vehicleId: string) =>
    api
      .post<MutationResult & { collectedIds: string[] }>('/me/vehicles', { vehicleId })
      .then((r) => r.data),

  visitStop: (stopId: string) =>
    api
      .post<MutationResult & { visitedIds: string[] }>(`/me/stops/${stopId}/visit`)
      .then((r) => r.data),
}
