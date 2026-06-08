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
    api
      .get<{ collectedIds: string[]; visitedIds: string[]; photos: Record<string, string> }>(
        '/me/progress',
      )
      .then((r) => r.data),

  collectVehicle: (vehicleId: string, photo?: Blob | null) => {
    // Send multipart when there's a photo so the catch + image land together.
    let body: FormData | { vehicleId: string }
    if (photo) {
      const form = new FormData()
      form.append('vehicleId', vehicleId)
      form.append('photo', photo, 'catch.jpg')
      body = form
    } else {
      body = { vehicleId }
    }
    return api
      .post<MutationResult & { collectedIds: string[]; imageUrl: string | null }>(
        '/me/vehicles',
        body,
      )
      .then((r) => r.data)
  },

  visitStop: (stopId: string) =>
    api
      .post<MutationResult & { visitedIds: string[] }>(`/me/stops/${stopId}/visit`)
      .then((r) => r.data),
}
