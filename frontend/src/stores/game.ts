// ŠotoGO — Game store
// The PLAYER is derived from the signed-in account (name/avatar/level/XP).
// The vehicle CATALOG ("Pokédex") and STOPS are loaded from the backend
// (GET /api/vehicles, GET /api/stops). Progress — which catalog models the
// player has collected and which stops they've visited — starts empty and is
// tracked in memory for now (no collection backend yet); when that lands,
// hydrate collectedIds / visitedIds from the server.
//
// Challenge / achievement DEFINITIONS are still seed reference (progress zeroed)
// until their backend exists. Category UI metadata (CATS) is design data.

import { defineStore } from 'pinia'
import type { ApiStop, CatalogVehicle, CategoryKey, Player } from '@/types/game'
import { useAuthStore } from '@/stores/auth'
import { levelFromTotalXp } from '@/lib/leveling'
import { catalogApi } from '@/services/catalog'
import { ACHIEVEMENTS, CATS, CHALLENGES } from '@/data/seed'

interface State {
  cats: typeof CATS
  catalog: CatalogVehicle[]
  /** Catalog ids the player has collected, newest first. */
  collectedIds: string[]
  stops: ApiStop[]
  /** Stop ids the player has visited. */
  visitedIds: string[]
  challenges: typeof CHALLENGES
  achievements: typeof ACHIEVEMENTS
  catalogLoaded: boolean
}

export const useGameStore = defineStore('game', {
  state: (): State => ({
    cats: CATS,
    catalog: [],
    collectedIds: [],
    stops: [],
    visitedIds: [],
    challenges: CHALLENGES.map((c) => ({ ...c, value: 0, done: false })),
    achievements: ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: false,
      value: a.value != null ? 0 : undefined,
    })),
    catalogLoaded: false,
  }),

  getters: {
    /** Player card derived from the signed-in account + live progress. */
    player(state): Player {
      const auth = useAuthStore()
      const xpTotal = auth.user?.xp ?? 0
      const { level, xpIntoLevel, xpForNext } = levelFromTotalXp(xpTotal)
      return {
        name: auth.user?.username ?? 'Hráč',
        handle: auth.user?.email ?? '',
        avatarUrl: auth.user?.avatarUrl ?? null,
        level,
        xp: xpIntoLevel,
        xpMax: xpForNext,
        xpTotal,
        vehicles: state.collectedIds.length,
        stops: state.visitedIds.length,
        streak: 0, // no streak source yet — comes with the game backend
      }
    },

    categoryList: (s) => Object.values(s.cats),

    collectedSet: (s) => new Set(s.collectedIds),
    visitedSet: (s) => new Set(s.visitedIds),

    /** Collected catalog count per category. */
    countByCategory(state): Record<CategoryKey, number> {
      const set = new Set(state.collectedIds)
      const out = {} as Record<CategoryKey, number>
      for (const k of Object.keys(state.cats) as CategoryKey[]) out[k] = 0
      for (const v of state.catalog) if (set.has(v.id)) out[v.category] += 1
      return out
    },

    /** Total catalog size per category. */
    catalogCountByCategory(state): Record<CategoryKey, number> {
      const out = {} as Record<CategoryKey, number>
      for (const k of Object.keys(state.cats) as CategoryKey[]) out[k] = 0
      for (const v of state.catalog) out[v.category] += 1
      return out
    },

    totalFound: (s) => s.collectedIds.length,
    totalAll: (s) => s.catalog.length,

    completionPct(): number {
      return this.totalAll === 0 ? 0 : Math.round((this.totalFound / this.totalAll) * 100)
    },

    /** XP progress through the current level, 0–100. */
    levelPct(): number {
      const p = this.player
      return p.xpMax === 0 ? 0 : Math.max(0, Math.min(100, (p.xp / p.xpMax) * 100))
    },

    dailyDoneCount: (s) => s.challenges.filter((c) => c.done).length,
    dailyXpAvailable: (s) =>
      s.challenges.filter((c) => !c.done).reduce((sum, c) => sum + c.reward, 0),
    unlockedAchievements: (s) => s.achievements.filter((a) => a.unlocked).length,

    /** Collected catalog entries, newest first (for the Profile feed). */
    recentVehicles(state): CatalogVehicle[] {
      const byId = new Map(state.catalog.map((v) => [v.id, v]))
      return state.collectedIds
        .map((id) => byId.get(id))
        .filter((v): v is CatalogVehicle => v != null)
        .slice(0, 4)
    },
  },

  actions: {
    /** Load the vehicle catalog once. Safe to call from multiple screens. */
    async ensureCatalog() {
      if (this.catalogLoaded) return
      try {
        this.catalog = await catalogApi.vehicles()
        this.catalogLoaded = true
      } catch (err) {
        console.error('Načtení katalogu vozidel selhalo:', err)
      }
    },

    /** Load stops near a coordinate (the map fetches around the player). */
    async loadStops(near: { lat: number; lng: number; km?: number }) {
      try {
        this.stops = await catalogApi.stops(near)
      } catch (err) {
        console.error('Načtení zastávek selhalo:', err)
      }
    },

    /**
     * Award XP to the signed-in account. Client-side only for now (not persisted)
     * — the server must own XP/leveling in production (docs/ARCHITECTURE.md).
     */
    awardXp(amount: number) {
      const auth = useAuthStore()
      if (auth.user) auth.user.xp += amount
    },

    /** Mark a catalog model as collected (from the camera capture flow). */
    collectVehicle(id: string, xp = 100) {
      if (this.collectedIds.includes(id)) return
      this.collectedIds.unshift(id)
      this.awardXp(xp)
    },

    /** Collect by category + short name (what the OCR/capture flow knows). */
    collectByModel(category: CategoryKey, shortName: string, xp = 100) {
      const v = this.catalog.find((x) => x.category === category && x.shortName === shortName)
      if (v) this.collectVehicle(v.id, xp)
    },

    /** Register a stop visit, awarding XP the first time. */
    visitStop(id: string, xp = 30) {
      if (this.visitedIds.includes(id)) return
      this.visitedIds.push(id)
      this.awardXp(xp)
    },
  },
})
