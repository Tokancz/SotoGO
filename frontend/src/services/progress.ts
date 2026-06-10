// Player progress API (collection + visits). All endpoints require auth; XP is
// awarded server-side, so responses carry the updated user.
import api, { mediaUrl } from './api'
import type { User } from '@/types/auth'
import type { CatchOutcome, CategoryKey, CollectedVehicle } from '@/types/game'

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
        /** Every caught instance (a physical vehicle), newest first. */
        instances: CollectedVehicle[]
        visitedIds: string[]
        /** stopId → ISO timestamp of the most recent visit (for the re-visit cooldown). */
        visitedAt: Record<string, string>
      }>('/me/progress')
      .then((r) => r.data),

  /** Catch a vehicle by model + serial. Returns a 'new' catch or a 'duplicate'
   *  re-roll to choose between (same serial caught again). */
  collectVehicle: (vehicleId: string, fleetNumber: string | null, photo?: Blob | null) => {
    const form = new FormData()
    form.append('vehicleId', vehicleId)
    if (fleetNumber) form.append('fleetNumber', fleetNumber)
    if (photo) form.append('photo', photo, 'catch.jpg')
    return api.post<CatchOutcome & { user: User }>('/me/vehicles', form).then((r) => {
      // Resolve catch-photo paths to absolute URLs (the duplicate screen shows them).
      const d = r.data
      if (d.status === 'duplicate') {
        d.existing.imageUrl = mediaUrl(d.existing.imageUrl) ?? null
        d.candidate.imageUrl = mediaUrl(d.candidate.imageUrl) ?? null
      }
      return d
    })
  },

  /** Resolve a duplicate-serial catch: keep the new roll or the existing one. */
  keepCatch: (vehicleId: string, fleetNumber: string, choice: 'new' | 'old') =>
    api.post<{ ok: true }>('/me/vehicles/keep', { vehicleId, fleetNumber, choice }).then((r) => r.data),

  /** Remove one caught instance by its id. */
  removeVehicle: (instanceId: string) =>
    api.delete<{ user: User }>(`/me/vehicles/${instanceId}`).then((r) => r.data),

  /** Wipe all progress (vehicles, stops, quests, XP). Irreversible. */
  resetProgress: () =>
    api
      .delete<{ user: User; instances: CollectedVehicle[]; visitedIds: string[] }>('/me/progress')
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
