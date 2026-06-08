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
import type { Achievement, ApiStop, CatalogVehicle, CategoryKey, Player } from '@/types/game'
import { useAuthStore } from '@/stores/auth'
import { levelFromTotalXp } from '@/lib/leveling'
import { catalogApi } from '@/services/catalog'
import { progressApi } from '@/services/progress'
import { mediaUrl } from '@/services/api'
import { CATS, CHALLENGES } from '@/data/seed'

interface State {
  cats: typeof CATS
  catalog: CatalogVehicle[]
  /** Catalog ids the player has collected, newest first. */
  collectedIds: string[]
  /** The player's catch photo per collected vehicle id (absolute URL). */
  collectedPhotos: Record<string, string>
  stops: ApiStop[]
  /** Stop ids the player has visited. */
  visitedIds: string[]
  challenges: typeof CHALLENGES
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

    /** Achievements computed live from real progress (collection + visits). */
    achievements(): Achievement[] {
      const found = this.totalFound
      const visited = this.visitedIds.length
      const byCat = this.countByCategory
      const catTotal = this.catalogCountByCategory
      const mk = (
        title: string,
        desc: string,
        icon: string,
        tier: Achievement['tier'],
        value: number,
        max: number,
      ): Achievement => ({ title, desc, icon, tier, value, max, unlocked: max > 0 && value >= max })

      return [
        mk('První úlovek', 'Vyfoť 1. vozidlo', 'sparkles', 'common', found, 1),
        mk('Sběratel', 'Ulov 10 modelů', 'layers', 'rare', found, 10),
        mk('Mistr sbírky', 'Ulov 25 modelů', 'crown', 'epic', found, 25),
        mk('Lovec tramvají', 'Všechny tramvaje', 'tram-front', 'epic', byCat.tram, catTotal.tram),
        mk('Pán autobusů', 'Všechny autobusy', 'bus', 'rare', byCat.bus, catTotal.bus),
        mk('Metro expert', 'Celé metro', 'train-front-tunnel', 'epic', byCat.metro, catTotal.metro),
        mk('Cestovatel', 'Navštiv 5 zastávek', 'map-pin', 'common', visited, 5),
        mk('Šotouš na cestách', 'Navštiv 50 zastávek', 'route', 'rare', visited, 50),
        mk('Kompletista', 'Dokonči celou sbírku', 'award', 'legendary', found, this.totalAll),
      ]
    },

    unlockedAchievements(): number {
      return this.achievements.filter((a) => a.unlocked).length
    },

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

    /** Hydrate the player's saved collection + visits from the server. */
    async loadProgress() {
      const auth = useAuthStore()
      if (!auth.isAuthenticated) return
      try {
        const { collectedIds, visitedIds } = await progressApi.get()
        this.collectedIds = collectedIds
        this.visitedIds = visitedIds
      } catch (err) {
        console.error('Načtení postupu selhalo:', err)
      }
    },

    /** Persist a catch. XP is awarded server-side; the user is updated from it. */
    async collectVehicle(id: string) {
      if (this.collectedIds.includes(id)) return
      try {
        const res = await progressApi.collectVehicle(id)
        this.collectedIds = res.collectedIds
        useAuthStore().setUser(res.user)
      } catch (err) {
        console.error('Uložení úlovku selhalo:', err)
      }
    },

    /** Collect by category + short name (what the OCR/capture flow knows). */
    async collectByModel(category: CategoryKey, shortName: string) {
      const v = this.catalog.find((x) => x.category === category && x.shortName === shortName)
      if (v) await this.collectVehicle(v.id)
    },

    /** Persist a stop visit. XP is awarded server-side. */
    async visitStop(id: string) {
      if (this.visitedIds.includes(id)) return
      try {
        const res = await progressApi.visitStop(id)
        this.visitedIds = res.visitedIds
        useAuthStore().setUser(res.user)
      } catch (err) {
        console.error('Uložení návštěvy selhalo:', err)
      }
    },
  },
})
