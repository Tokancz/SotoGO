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
import type {
  Achievement,
  ApiStop,
  BattleResult,
  BattleStart,
  CatalogVehicle,
  CategoryKey,
  CaughtReveal,
  GymState,
  Player,
  Quest,
  VehicleStats,
} from '@/types/game'
import { useAuthStore } from '@/stores/auth'
import { levelFromTotalXp } from '@/lib/leveling'
import { catalogApi } from '@/services/catalog'
import { progressApi } from '@/services/progress'
import { gymsApi } from '@/services/gyms'
import { mediaUrl } from '@/services/api'
import { CATS } from '@/data/seed'

interface State {
  cats: typeof CATS
  catalog: CatalogVehicle[]
  /** Catalog ids the player has collected, newest first. */
  collectedIds: string[]
  /** The player's catch photo per collected vehicle id (absolute URL). */
  collectedPhotos: Record<string, string>
  /** Combat stats per collected vehicle id (HP/Attack, gym deployment). */
  vehicleStats: Record<string, VehicleStats>
  stops: ApiStop[]
  /** Stop ids the player has visited (unique). */
  visitedIds: string[]
  /** stopId → ISO timestamp of the most recent visit (drives the re-visit cooldown). */
  visitedAt: Record<string, string>
  /** This period's daily quests (from the server). */
  quests: Quest[]
  /** When the current quest period ends (ISO), for the countdown. */
  questsEndsAt: string | null
  catalogLoaded: boolean
}

export const useGameStore = defineStore('game', {
  state: (): State => ({
    cats: CATS,
    catalog: [],
    collectedIds: [],
    collectedPhotos: {},
    vehicleStats: {},
    stops: [],
    visitedIds: [],
    visitedAt: {},
    quests: [],
    questsEndsAt: null,
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
        streak: auth.user?.streak ?? 0,
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

    dailyDoneCount: (s) => s.quests.filter((q) => q.done).length,
    /** Quests finished but whose reward hasn't been collected yet. */
    dailyClaimable: (s) => s.quests.filter((q) => q.done && !q.claimed).length,
    /** XP still collectable this period (rewards of quests not yet claimed). */
    dailyXpAvailable: (s) =>
      s.quests.filter((q) => !q.claimed).reduce((sum, q) => sum + q.reward, 0),

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
        color: string,
        value: number,
        max: number,
      ): Achievement => ({
        title,
        desc,
        icon,
        tier,
        color,
        value,
        max,
        unlocked: max > 0 && value >= max,
      })

      const C = this.cats
      return [
        mk('První úlovek', 'Vyfoť 1. vozidlo', 'sparkles', 'common', 'var(--xp)', found, 1),
        mk('Sběratel', 'Ulov 10 modelů', 'layers', 'rare', 'var(--rarity-rare)', found, 10),
        mk('Mistr sbírky', 'Ulov 25 modelů', 'crown', 'epic', 'var(--rarity-epic)', found, 25),
        mk('Lovec tramvají', 'Všechny tramvaje', 'tram-front', 'epic', C.tram.color, byCat.tram, catTotal.tram),
        mk('Pán autobusů', 'Všechny autobusy', 'bus', 'rare', C.bus.color, byCat.bus, catTotal.bus),
        mk('Metro expert', 'Celé metro', 'train-front-tunnel', 'epic', C.metro.color, byCat.metro, catTotal.metro),
        mk('Cestovatel', 'Navštiv 5 zastávek', 'map-pin', 'common', 'var(--brand)', visited, 5),
        mk('Šotouš na cestách', 'Navštiv 50 zastávek', 'route', 'rare', C.trolley.color, visited, 50),
        mk('Kompletista', 'Dokonči celou sbírku', 'award', 'legendary', 'var(--rarity-legendary)', found, this.totalAll),
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
        const { collectedIds, visitedIds, visitedAt, photos, stats } = await progressApi.get()
        this.collectedIds = collectedIds
        this.visitedIds = visitedIds
        this.visitedAt = visitedAt
        this.vehicleStats = stats
        this.collectedPhotos = Object.fromEntries(
          Object.entries(photos).map(([id, path]) => [id, mediaUrl(path)!]),
        )
      } catch (err) {
        console.error('Načtení postupu selhalo:', err)
      }
    },

    /**
     * Persist a catch, optionally with the player's photo. XP is awarded
     * server-side; the user (and the catch photo) are updated from the response.
     */
    async collectVehicle(id: string, photo?: Blob | null): Promise<CaughtReveal | null> {
      if (this.collectedIds.includes(id)) return null
      // Note: errors propagate so the capture flow can surface them — a swallowed
      // failure here means the catch is silently lost and never reaches the park.
      const res = await progressApi.collectVehicle(id, photo)
      this.collectedIds = res.collectedIds
      const url = mediaUrl(res.imageUrl)
      if (url) this.collectedPhotos = { ...this.collectedPhotos, [id]: url }
      useAuthStore().setUser(res.user)
      void this.loadProgress() // pull in the new vehicle's rolled combat stats
      void this.loadQuests() // a catch may have advanced a quest — refresh progress
      // Surface the rolled rarity + stats so the capture screen can reveal them.
      return { rarity: res.rarity, hp: res.stats.hp, maxHp: res.stats.maxHp, attack: res.stats.attack }
    },

    /** Remove a collected vehicle from the park. Reclaims XP server-side. */
    async removeVehicle(id: string) {
      if (!this.collectedIds.includes(id)) return
      const res = await progressApi.removeVehicle(id)
      this.collectedIds = res.collectedIds
      const photos = { ...this.collectedPhotos }
      delete photos[id]
      this.collectedPhotos = photos
      useAuthStore().setUser(res.user)
      void this.loadQuests() // catch count dropped — refresh quest progress
    },

    /** Wipe all progress (vehicles, stops, quests, XP). Irreversible. */
    async resetProgress() {
      const res = await progressApi.resetProgress()
      this.collectedIds = res.collectedIds
      this.visitedIds = res.visitedIds
      this.visitedAt = {}
      this.collectedPhotos = {}
      useAuthStore().setUser(res.user)
      void this.loadQuests()
    },

    /** Collect by category + short name (what the OCR/capture flow knows). */
    async collectByModel(category: CategoryKey, shortName: string, photo?: Blob | null) {
      const v = this.catalog.find((x) => x.category === category && x.shortName === shortName)
      if (v) await this.collectVehicle(v.id, photo)
    },

    /**
     * Check in at a stop. First visit awards the full reward, a re-visit a small
     * bonus; the server rejects re-visits during the cooldown. Returns the XP
     * awarded, or null if the visit didn't go through (offline, on cooldown, …).
     */
    async visitStop(id: string): Promise<number | null> {
      try {
        const res = await progressApi.visitStop(id)
        this.visitedIds = res.visitedIds
        this.visitedAt = res.visitedAt
        useAuthStore().setUser(res.user)
        void this.loadQuests() // a visit may have advanced a quest — refresh progress
        return res.awardedXp
      } catch (err) {
        console.error('Uložení návštěvy selhalo:', err)
        return null
      }
    },

    /** Record today's check-in and advance the daily login streak. */
    async checkIn() {
      const auth = useAuthStore()
      if (!auth.isAuthenticated) return
      // Local calendar date (YYYY-MM-DD), not UTC, so the streak day matches
      // what the player sees on their own clock.
      const d = new Date()
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      try {
        const { user } = await progressApi.checkin(date)
        auth.setUser(user)
      } catch (err) {
        console.error('Záznam denní série selhal:', err)
      }
    },

    /** Load this period's daily quests with live progress. */
    async loadQuests() {
      const auth = useAuthStore()
      if (!auth.isAuthenticated) return
      try {
        const { periodEndsAt, quests } = await progressApi.quests()
        this.questsEndsAt = periodEndsAt
        this.quests = quests.map((q) => ({
          id: q.id,
          title: q.title,
          cat: q.category,
          icon: q.icon,
          value: q.value,
          max: q.max,
          reward: q.reward,
          done: q.done,
          claimed: q.claimed,
        }))
      } catch (err) {
        console.error('Načtení výzev selhalo:', err)
      }
    },

    /** Collect a completed quest's XP reward (once per period). */
    async claimQuest(id: string) {
      const quest = this.quests.find((q) => q.id === id)
      if (!quest || !quest.done || quest.claimed) return
      // Errors propagate so the view can surface them instead of losing the claim.
      const res = await progressApi.claimQuest(id)
      quest.claimed = true
      useAuthStore().setUser(res.user)
    },

    /** Deploy a vehicle to defend an open gym. Errors propagate to the view. */
    async deployToGym(stopId: string, vehicleId: string): Promise<GymState> {
      const state = await gymsApi.deploy(stopId, vehicleId)
      await this.loadProgress() // the vehicle is now locked + at full HP
      return state
    },

    /** Recall your defender from a gym you hold. */
    async recallGym(stopId: string): Promise<GymState> {
      const state = await gymsApi.recall(stopId)
      await this.loadProgress() // the vehicle is freed + healed
      return state
    },

    /** Begin a timed attack on a gym's defender. */
    startBattle(stopId: string, vehicleId: string): Promise<BattleStart> {
      return gymsApi.battleStart(stopId, vehicleId)
    },

    /** Resolve a battle (report taps landed). Refreshes user + stats on win. */
    async resolveBattle(battleId: string, hits: number): Promise<BattleResult> {
      const res = await gymsApi.battleResolve(battleId, hits)
      useAuthStore().setUser(res.user)
      await this.loadProgress() // gym takeover changes deployment + HP
      return res
    },
  },
})
