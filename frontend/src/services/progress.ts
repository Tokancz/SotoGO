// Player progress API (collection + visits). All endpoints require auth; XP is
// awarded server-side, so responses carry the updated user.
import api from './api'
import type { User } from '@/types/auth'
import type { CategoryKey, Rarity, VehicleStats } from '@/types/game'

interface MutationResult {
  user: User
  awardedXp: number
}

/** A quest as the server reports it (note: `category`, mapped to `cat` in the store). */
export interface ApiQuest {
  id: string
  title: string
  category: CategoryKey | null
  icon: string
  value: number
  max: number
  reward: number
  done: boolean
  claimed: boolean
}

export const progressApi = {
  get: () =>
    api
      .get<{
        collectedIds: string[]
        visitedIds: string[]
        /** stopId → ISO timestamp of the most recent visit (for the re-visit cooldown). */
        visitedAt: Record<string, string>
        photos: Record<string, string>
        /** Combat stats per collected vehicle id. */
        stats: Record<string, VehicleStats>
      }>('/me/progress')
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
      .post<
        MutationResult & {
          collectedIds: string[]
          imageUrl: string | null
          /** The catch's rolled rarity + combat stats (also returned on a re-scan). */
          rarity: Rarity
          stats: { hp: number; maxHp: number; attack: number }
        }
      >('/me/vehicles', body)
      .then((r) => r.data)
  },

  removeVehicle: (vehicleId: string) =>
    api
      .delete<{ user: User; collectedIds: string[] }>(`/me/vehicles/${vehicleId}`)
      .then((r) => r.data),

  /** Wipe all progress (vehicles, stops, quests, XP). Irreversible. */
  resetProgress: () =>
    api
      .delete<{ user: User; collectedIds: string[]; visitedIds: string[] }>('/me/progress')
      .then((r) => r.data),

  visitStop: (stopId: string) =>
    api
      .post<MutationResult & { visitedIds: string[]; visitedAt: Record<string, string> }>(
        `/me/stops/${stopId}/visit`,
      )
      .then((r) => r.data),

  // `date` is the client's LOCAL date (YYYY-MM-DD) so the streak's day
  // boundaries match the user's calendar, not the server's timezone.
  checkin: (date: string) =>
    api.post<{ user: User }>('/me/checkin', { date }).then((r) => r.data),

  quests: () =>
    api
      .get<{ periodEndsAt: string; quests: ApiQuest[] }>('/me/quests')
      .then((r) => r.data),

  claimQuest: (questId: string) =>
    api.post<MutationResult>(`/me/quests/${questId}/claim`).then((r) => r.data),
}
