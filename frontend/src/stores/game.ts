// ŠotoGO — Game store
// Single source of truth for player progress, collection, stops, challenges and
// achievements. Seeded from src/data/seed.ts; replace the seed reads with API
// calls when the backend lands (see docs/BACKEND.md). XP/leveling here is a
// client-side stand-in — production must compute it server-side.

import { defineStore } from 'pinia'
import type { CategoryKey, Stop, Vehicle } from '@/types/game'
import {
  ACHIEVEMENTS,
  CATS,
  CHALLENGES,
  LOCKED_COUNT,
  PLAYER,
  STOPS,
  VEHICLES,
} from '@/data/seed'

interface State {
  player: typeof PLAYER
  cats: typeof CATS
  vehicles: Vehicle[]
  lockedCount: Record<CategoryKey, number>
  stops: Stop[]
  challenges: typeof CHALLENGES
  achievements: typeof ACHIEVEMENTS
}

export const useGameStore = defineStore('game', {
  state: (): State => ({
    player: { ...PLAYER },
    cats: CATS,
    vehicles: VEHICLES.map((v) => ({ ...v })),
    lockedCount: { ...LOCKED_COUNT },
    stops: STOPS.map((s) => ({ ...s })),
    challenges: CHALLENGES.map((c) => ({ ...c })),
    achievements: ACHIEVEMENTS.map((a) => ({ ...a })),
  }),

  getters: {
    categoryList: (s) => Object.values(s.cats),

    /** Number of caught vehicles per category. */
    countByCategory: (s) => {
      const out = {} as Record<CategoryKey, number>
      for (const key of Object.keys(s.cats) as CategoryKey[]) {
        out[key] = s.vehicles.filter((v) => v.cat === key).length
      }
      return out
    },

    totalFound: (s) => s.vehicles.length,

    totalLocked: (s) =>
      Object.values(s.lockedCount).reduce((a, b) => a + b, 0),

    totalAll(): number {
      return this.totalFound + this.totalLocked
    },

    completionPct(): number {
      return Math.round((this.totalFound / this.totalAll) * 100)
    },

    /** XP progress through the current level, 0–100. */
    levelPct: (s) =>
      Math.max(0, Math.min(100, (s.player.xp / s.player.xpMax) * 100)),

    dailyDoneCount: (s) => s.challenges.filter((c) => c.done).length,

    /** Total XP still available from unfinished daily challenges. */
    dailyXpAvailable: (s) =>
      s.challenges.filter((c) => !c.done).reduce((sum, c) => sum + c.reward, 0),

    unlockedAchievements: (s) =>
      s.achievements.filter((a) => a.unlocked).length,

    recentVehicles: (s) => s.vehicles.slice(0, 4),
  },

  actions: {
    /** Award XP and roll the level over when the bar fills. */
    awardXp(amount: number) {
      this.player.xpTotal += amount
      this.player.xp += amount
      while (this.player.xp >= this.player.xpMax) {
        this.player.xp -= this.player.xpMax
        this.player.level += 1
      }
    },

    /** Record a freshly caught vehicle (from the camera capture flow). */
    catchVehicle(vehicle: Vehicle, xp = 100) {
      const exists = this.vehicles.some(
        (v) => v.type === vehicle.type && v.number === vehicle.number,
      )
      if (exists) return
      this.vehicles.unshift({ ...vehicle, isNew: true })
      this.player.vehicles += 1
      if (this.lockedCount[vehicle.cat] > 0) this.lockedCount[vehicle.cat] -= 1
      this.awardXp(xp)
    },

    /** Register a stop visit, awarding its XP the first time. */
    visitStop(name: string) {
      const stop = this.stops.find((s) => s.name === name)
      if (!stop || stop.visited) return
      stop.visited = true
      this.player.stops += 1
      this.awardXp(stop.xp)
    },
  },
})
