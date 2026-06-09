<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import { catalogApi } from '@/services/catalog'
import { gymsApi } from '@/services/gyms'
import { useGeolocation } from '@/composables/useGeolocation'
import { useToastStore } from '@/stores/toast'
import type { ApiStop, BattleResult, CatalogVehicle, GymState, VehicleStats } from '@/types/game'
import SgBadge from '@/components/ui/SgBadge.vue'
import SgIcon from '@/components/SgIcon.vue'
import SgAvatar from '@/components/ui/SgAvatar.vue'
import SgProgressBar from '@/components/ui/SgProgressBar.vue'
import BattleOverlay from '@/components/game/BattleOverlay.vue'

const game = useGameStore()
const auth = useAuthStore()
const geo = useGeolocation()
const toast = useToastStore()

// Admin-only dev tools (location teleport). Gated on the account's isAdmin flag.
const isAdmin = computed(() => auth.user?.isAdmin === true)
const devOpen = ref(false)
const devTeleport = ref(false) // when on, clicking the map teleports the player

// The floating buttons (locate + dev tools) ride above whichever bottom sheet is
// open so the sheet never overlaps them. We measure the active sheet's live
// height (stop and gym sheets differ, and the gym sheet grows as it loads) and
// lift the buttons by it.
const sheetEl = ref<HTMLElement | null>(null)
const sheetHeight = ref(0)
let sheetRO: ResizeObserver | null = null
watch(sheetEl, (el) => {
  sheetRO?.disconnect()
  sheetRO = null
  if (el && typeof ResizeObserver !== 'undefined') {
    sheetRO = new ResizeObserver(() => (sheetHeight.value = el.offsetHeight))
    sheetRO.observe(el)
    sheetHeight.value = el.offsetHeight
  } else {
    sheetHeight.value = 0
  }
})
const SHEET_BOTTOM = 14 // the sheet's own bottom offset
const FAB_GAP = 14 // gap between the sheet top and the lowest button
// Bottom offset for the locate button, and for the dev tools stacked above it.
const locateBottom = computed(() =>
  sheetHeight.value > 0 ? `${sheetHeight.value + SHEET_BOTTOM + FAB_GAP}px` : '24px',
)
const devBottom = computed(() =>
  sheetHeight.value > 0 ? `${sheetHeight.value + SHEET_BOTTOM + FAB_GAP + 56}px` : '80px',
)

const DEFAULT_LOC = { lat: 50.0865, lng: 14.4319 } // Prague centre — fallback only
const VISIT_RADIUS_M = 75 // how close you must physically be to check in
// Metro: GPS is poor underground and stations span several entrances (the stored
// point is roughly their centre), so allow a wider check-in radius.
const METRO_VISIT_RADIUS_M = 150
const REVISIT_XP = 10 // a re-visit (after the cooldown) is worth a small flat bonus
const VISIT_COOLDOWN_MS = 30 * 60_000 // can't re-check-in at the same stop until this elapses
const RELOAD_DISTANCE_M = 1500 // refetch nearby stops after moving this far
const LOAD_KM = 3 // radius of stops loaded around the player (kept small for mobile)
const MIN_ZOOM = 13 // don't let the user zoom out past the loaded area

const LINE_HEX: Record<string, string> = { A: '#00A562', B: '#F7A600', C: '#D9282F' }
const CAT_HEX: Record<string, string> = {
  tram: '#E2231A',
  bus: '#2B6CE5',
  metro: '#8E44E8',
  trolley: '#0E9E8E',
  train: '#E8730C',
}
const CAT_ORDER = ['metro', 'tram', 'trolley', 'train', 'bus'] as const

// Track draw order + thickness so metro sits on top of buses.
const TRACK_ORDER: Record<string, number> = { bus: 0, trolley: 1, train: 2, tram: 3, metro: 4 }
function trackWeight(cat: string): number {
  return cat === 'metro' ? 5 : cat === 'tram' ? 4 : 3
}

const playerIcon = L.divIcon({
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  html: '<div class="sg-player-dot"></div>',
})

const mapEl = ref<HTMLDivElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const selected = ref<ApiStop | null>(null)
// Gym battle state for the selected gym (null while loading or for non-gyms).
const gymState = ref<GymState | null>(null)
// Which vehicle picker is open ('deploy' to defend, 'battle' to attack), if any.
const picker = ref<null | 'deploy' | 'battle'>(null)
// Active battle (drives the full-screen BattleOverlay).
const battle = ref<null | { stopId: string; vehicleId: string; attackerName: string }>(null)
const gymBusy = ref(false)
const markersById: Record<string, L.Marker> = {}
let trackLayer: L.LayerGroup | null = null
let stopLayer: L.LayerGroup | null = null
let playerMarker: L.Marker | null = null
let accuracyCircle: L.Circle | null = null
let lastLoadCenter: { lat: number; lng: number } | null = null
let following = true // keep the map centred on the player until they pan away
let initialized = false
let destroyed = false // set on unmount so async work can't touch a dead map
let mapAnimating = false // true during a zoom animation (defer marker churn until idle)
let invalidateTimer: ReturnType<typeof setTimeout> | undefined

const playerLoc = ref({ ...DEFAULT_LOC })
const usingFallback = ref(false)
// Ticks every 30s so cooldown countdowns + marker states re-evaluate over time.
const now = ref(Date.now())
let stateTimer: ReturnType<typeof setInterval> | undefined

const noStopsNearby = ref(false)
const noticeText = computed(() =>
  usingFallback.value
    ? 'Poloha nedostupná — zobrazuji Prahu'
    : noStopsNearby.value
      ? 'V okolí nejsou žádné zastávky'
      : '',
)

const lineCats = ref<Record<string, string>>({})
const query = ref('')
const results = ref<ApiStop[]>([])

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const la1 = (aLat * Math.PI) / 180
  const la2 = (bLat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`
}

/** A lat/lng box `km` in every direction around a point. */
function boundsAround(loc: { lat: number; lng: number }, km: number): L.LatLngBounds {
  const dLat = km / 111
  const dLng = km / (111 * Math.cos((loc.lat * Math.PI) / 180) || 1)
  return L.latLngBounds([loc.lat - dLat, loc.lng - dLng], [loc.lat + dLat, loc.lng + dLng])
}

function pinStyle(stop: ApiStop): { color: string; label: string } {
  const letter = stop.lines.find((l) => l in LINE_HEX)
  if (stop.categories.includes('metro') && letter) {
    return { color: LINE_HEX[letter], label: letter }
  }
  const cat = CAT_ORDER.find((c) => stop.categories.includes(c)) ?? 'bus'
  return { color: CAT_HEX[cat], label: (stop.lines[0] ?? '').slice(0, 3) }
}

function rewardFor(stop: ApiStop): number {
  if (stop.isGym) return 60
  if (stop.categories.includes('metro')) return 40
  if (stop.categories.some((c) => c === 'tram' || c === 'trolley' || c === 'train')) return 30
  return 20
}

// Per-stop check-in state: never visited, recently visited (on cooldown), or
// visited but ready to check in again.
type VisitState = 'new' | 'cooldown' | 'ready'
function visitState(stop: ApiStop): VisitState {
  const ts = game.visitedAt[stop.id]
  if (!ts) return 'new'
  return now.value - new Date(ts).getTime() < VISIT_COOLDOWN_MS ? 'cooldown' : 'ready'
}
function visitRadiusFor(stop: ApiStop): number {
  return stop.categories.includes('metro') ? METRO_VISIT_RADIUS_M : VISIT_RADIUS_M
}

function lineColor(line: string): string {
  const cat = lineCats.value[line]
  if (cat) return CAT_HEX[cat] ?? 'var(--slate-500)'
  return LINE_HEX[line] ?? 'var(--slate-500)'
}

const distanceMeters = computed(() =>
  selected.value
    ? haversine(playerLoc.value.lat, playerLoc.value.lng, selected.value.lat, selected.value.lng)
    : Infinity,
)
const distanceLabel = computed(() => (selected.value ? fmtDist(distanceMeters.value) : ''))
const selectedState = computed<VisitState>(() =>
  selected.value ? visitState(selected.value) : 'new',
)
const selectedReward = computed(() =>
  selected.value ? (selectedState.value === 'ready' ? REVISIT_XP : rewardFor(selected.value)) : 0,
)
const canVisit = computed(
  () =>
    selected.value != null &&
    selectedState.value !== 'cooldown' &&
    distanceMeters.value <= visitRadiusFor(selected.value),
)
// Minutes until the selected stop can be checked in again (only on cooldown).
const cooldownLabel = computed(() => {
  if (!selected.value || selectedState.value !== 'cooldown') return ''
  const ts = game.visitedAt[selected.value.id]
  const leftMs = Math.max(0, VISIT_COOLDOWN_MS - (now.value - new Date(ts).getTime()))
  return `${Math.max(1, Math.ceil(leftMs / 60_000))} min`
})

function stateClass(state: VisitState): string {
  return state === 'cooldown'
    ? ' sg-stop-pin--cooldown'
    : state === 'ready'
      ? ' sg-stop-pin--ready'
      : ''
}

function addMarker(stop: ApiStop): L.Marker {
  const { color, label } = pinStyle(stop)
  const gym = stop.isGym ? ' sg-stop-pin--gym' : ''
  const icon = L.divIcon({
    className: '',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    html: `<div class="sg-stop-pin${gym}${stateClass(visitState(stop))}" style="--pin:${color}">
             <div class="sg-stop-pin__head"><span>${label}</span></div>
             <div class="sg-stop-pin__badge"></div>
           </div>`,
  })
  const marker = L.marker([stop.lat, stop.lng], { icon })
  if (stopLayer) marker.addTo(stopLayer)
  marker.on('click', () => selectStop(stop))
  markersById[stop.id] = marker
  return marker
}

/** Re-apply a pin's visit-state class (after a visit, or as cooldowns elapse). */
function applyState(stop: ApiStop) {
  const el = markersById[stop.id]?.getElement()?.querySelector<HTMLElement>('.sg-stop-pin')
  if (!el) return
  el.classList.remove('sg-stop-pin--cooldown', 'sg-stop-pin--ready')
  const cls = stateClass(visitState(stop)).trim()
  if (cls) el.classList.add(cls)
}

function refreshMarkerStates() {
  for (const stop of game.stops) applyState(stop)
}

/**
 * Reconcile pins with the loaded stops: add new ones, remove gone ones, leave
 * the rest untouched. Avoids tearing out every marker (clearLayers) on each
 * reload, which could race with an in-flight map animation — Leaflet then
 * dereferences a removed icon ("Cannot read properties of null … parentNode").
 */
function syncStops() {
  const want = new Set(game.stops.map((s) => s.id))
  for (const id of Object.keys(markersById)) {
    if (!want.has(id)) {
      stopLayer?.removeLayer(markersById[id])
      delete markersById[id]
    }
  }
  for (const stop of game.stops) {
    if (!markersById[stop.id]) addMarker(stop)
  }
}

async function drawTracks(stop: ApiStop) {
  if (!map.value || !trackLayer) return
  trackLayer.clearLayers()
  let routes
  try {
    routes = await catalogApi.routes(stop.id)
  } catch {
    return
  }
  if (destroyed || !map.value || !trackLayer) return // unmounted during fetch
  const cats: Record<string, string> = {}
  for (const r of routes) cats[r.line] = r.category
  lineCats.value = cats

  routes.sort((a, b) => (TRACK_ORDER[a.category] ?? 0) - (TRACK_ORDER[b.category] ?? 0))
  // Guard the Leaflet writes: if we're torn down between here and now, adding to
  // a removed layer can throw ("parentNode of null"). Never let it reject.
  try {
    for (const r of routes) {
      if (destroyed || !trackLayer) return
      L.polyline(r.points, {
        color: CAT_HEX[r.category] ?? '#888',
        weight: trackWeight(r.category),
        opacity: 0.7,
        lineJoin: 'round',
      }).addTo(trackLayer)
    }
  } catch {
    /* map torn down mid-draw — ignore */
  }
}

function selectStop(stop: ApiStop) {
  selected.value = stop
  if (!markersById[stop.id]) addMarker(stop)
  void drawTracks(stop)
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(query, (q) => {
  clearTimeout(searchTimer)
  if (q.trim().length < 2) {
    results.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      results.value = await catalogApi.searchStops(q.trim())
    } catch {
      results.value = []
    }
  }, 250)
})

function selectResult(stop: ApiStop) {
  query.value = ''
  results.value = []
  following = false // viewing a searched stop — don't snap back to the player
  map.value?.flyTo([stop.lat, stop.lng], 16, { duration: 0.8 })
  selectStop(stop)
}

function updatePlayer(loc: { lat: number; lng: number }, accuracy: number | null) {
  if (!map.value) return
  const ll: L.LatLngExpression = [loc.lat, loc.lng]
  if (!playerMarker) playerMarker = L.marker(ll, { icon: playerIcon, zIndexOffset: 1000 }).addTo(map.value)
  else playerMarker.setLatLng(ll)
  if (accuracy != null && accuracy < 1000) {
    if (!accuracyCircle) {
      accuracyCircle = L.circle(ll, {
        radius: accuracy,
        color: '#43B02A',
        weight: 1,
        fillColor: '#43B02A',
        fillOpacity: 0.08,
      }).addTo(map.value)
    } else {
      accuracyCircle.setLatLng(ll)
      accuracyCircle.setRadius(accuracy)
    }
  }
}

async function loadAround(loc: { lat: number; lng: number }) {
  await Promise.all([
    game.loadStops({ lat: loc.lat, lng: loc.lng, km: LOAD_KM }),
    game.loadProgress(),
  ])
  if (destroyed || !map.value) return // unmounted while loading
  lastLoadCenter = { ...loc }
  noStopsNearby.value = game.stops.length === 0

  // Touching bounds/markers mid-zoom-animation can make Leaflet dereference a
  // removed icon — defer until the current zoom animation settles.
  const apply = () => {
    if (destroyed || !map.value) return
    try {
      // Lock panning to the loaded area so the user can't drift into empty space.
      map.value.setMaxBounds(boundsAround(loc, LOAD_KM))
      syncStops()
      selected.value =
        [...game.stops].sort(
          (a, b) =>
            haversine(loc.lat, loc.lng, a.lat, a.lng) - haversine(loc.lat, loc.lng, b.lat, b.lng),
        )[0] ?? null
    } catch {
      /* torn down mid-apply — ignore */
    }
  }
  if (mapAnimating) map.value.once('zoomend', apply)
  else apply()
}

// Live position → follow the player and refetch stops when they move far.
watch(
  () => geo.coords.value,
  (c) => {
    if (destroyed || !c || !map.value) return
    playerLoc.value = { lat: c.lat, lng: c.lng }
    usingFallback.value = false
    updatePlayer(c, c.accuracy)
    if (!initialized) {
      initialized = true
      map.value.setView([c.lat, c.lng], 16)
      void loadAround(c)
    } else {
      // Follow the player so the dot stays centred — unless they've panned away.
      if (following) map.value.panTo([c.lat, c.lng], { animate: true })
      if (
        lastLoadCenter &&
        haversine(c.lat, c.lng, lastLoadCenter.lat, lastLoadCenter.lng) > RELOAD_DISTANCE_M
      ) {
        void loadAround(c)
      }
    }
  },
)

// Location unavailable/denied → fall back to Prague so the map still works.
watch(
  () => geo.error.value,
  (e) => {
    if (e && !initialized && !destroyed && map.value) {
      initialized = true
      usingFallback.value = true
      playerLoc.value = { ...DEFAULT_LOC }
      map.value.setView([DEFAULT_LOC.lat, DEFAULT_LOC.lng], 14)
      updatePlayer(DEFAULT_LOC, null)
      void loadAround(DEFAULT_LOC)
    }
  },
)

onMounted(() => {
  if (!mapEl.value) return
  const m = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false,
    minZoom: MIN_ZOOM,
    maxBoundsViscosity: 1.0,
  }).setView([DEFAULT_LOC.lat, DEFAULT_LOC.lng], 13)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(m)
  trackLayer = L.layerGroup().addTo(m)
  stopLayer = L.layerGroup().addTo(m)
  map.value = m
  // A user-initiated drag stops follow mode; tapping locate turns it back on.
  m.on('dragstart', () => {
    following = false
  })
  // Dev teleport: clicking the map jumps the player there (admin tool only).
  m.on('click', (e: L.LeafletMouseEvent) => {
    if (devTeleport.value) teleport(e.latlng.lat, e.latlng.lng)
  })
  // Track zoom animations so we don't churn markers while one is running.
  m.on('zoomstart', () => {
    mapAnimating = true
  })
  m.on('zoomend', () => {
    mapAnimating = false
  })
  invalidateTimer = setTimeout(() => m.invalidateSize(), 60)
  geo.start()
  // Advance cooldown countdowns + flip pins from "cooldown" to "ready" over time.
  stateTimer = setInterval(() => {
    now.value = Date.now()
    refreshMarkerStates()
  }, 30_000)
})

onBeforeUnmount(() => {
  destroyed = true
  clearTimeout(invalidateTimer)
  clearTimeout(searchTimer)
  clearInterval(stateTimer)
  sheetRO?.disconnect()
  geo.stop()
  // Tear the map down defensively. Because there's no route transition, Vue
  // unmounts us synchronously *inside* the router navigation, so any throw here
  // rejects router.push() → "Uncaught (in promise) … parentNode of null". Null
  // the ref FIRST (so late async work bails on `!map.value`), then drop our
  // listeners and cancel animations before removing, so no stray Leaflet
  // callback fires against a detached pane. Whole thing is swallowed regardless.
  const m = map.value
  map.value = null
  trackLayer = null
  stopLayer = null
  playerMarker = null
  accuracyCircle = null
  if (m) {
    try {
      m.off()
      m.stop()
      m.remove()
    } catch {
      /* map is going away regardless — never let this block navigation */
    }
  }
})

function recenter() {
  following = true
  map.value?.setView([playerLoc.value.lat, playerLoc.value.lng], 16)
}

// ── Dev: location teleport (admin) ───────────────────────────────────────────
// Mock the player position; the geo.coords watcher repositions + reloads stops.
function teleport(lat: number, lng: number) {
  following = true
  geo.setMock({ lat, lng })
}
function teleportToSelected() {
  if (selected.value) teleport(selected.value.lat, selected.value.lng)
}
function resetGps() {
  geo.clearMock()
  following = true
  toast.push({ title: 'Zpět na reálnou GPS', icon: 'locate-fixed' })
}

async function visitSelected() {
  const stop = selected.value
  if (!stop || !canVisit.value) return
  const awarded = await game.visitStop(stop.id)
  if (awarded != null) {
    now.value = Date.now() // the stop is now on cooldown
    applyState(stop)
  }
}

// ── Gyms ─────────────────────────────────────────────────────────────────────
// You must be within the visit radius to deploy/recall/battle, same as check-ins.
const inRange = computed(
  () => selected.value != null && distanceMeters.value <= visitRadiusFor(selected.value),
)

interface IdleVehicle { v: CatalogVehicle; stats: VehicleStats }
// Collected vehicles not currently defending a gym — the deploy/attack roster.
const idleVehicles = computed<IdleVehicle[]>(() =>
  game.catalog
    .filter((v) => game.collectedSet.has(v.id))
    .map((v) => ({ v, stats: game.vehicleStats[v.id] }))
    .filter((x): x is IdleVehicle => x.stats != null && x.stats.deployedStopId == null),
)

async function loadGymState(stopId: string) {
  gymState.value = null
  try {
    gymState.value = await gymsApi.getState(stopId)
  } catch {
    gymState.value = null
  }
}

// Load (or clear) gym state whenever the selected stop changes.
watch(selected, (s) => {
  picker.value = null
  if (s?.isGym) void loadGymState(s.id)
  else gymState.value = null
})

function gymError(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
    'Akce se nezdařila.'
  )
}

async function chooseVehicle(item: IdleVehicle) {
  const stop = selected.value
  if (!stop || gymBusy.value) return
  if (picker.value === 'deploy') {
    gymBusy.value = true
    try {
      gymState.value = await game.deployToGym(stop.id, item.v.id)
      toast.push({
        title: 'Vozidlo nasazeno',
        description: `${item.v.shortName} teď brání ${stop.name}`,
        icon: 'shield',
        color: 'var(--brand)',
      })
    } catch (err) {
      toast.push({ title: 'Nasazení selhalo', description: gymError(err), icon: 'triangle-alert' })
    } finally {
      gymBusy.value = false
      picker.value = null
    }
  } else if (picker.value === 'battle') {
    battle.value = { stopId: stop.id, vehicleId: item.v.id, attackerName: item.v.shortName }
    picker.value = null
  }
}

async function recallGym() {
  const stop = selected.value
  if (!stop || gymBusy.value) return
  gymBusy.value = true
  try {
    gymState.value = await game.recallGym(stop.id)
    toast.push({ title: 'Vozidlo staženo', icon: 'rotate-ccw', color: 'var(--brand)' })
  } catch (err) {
    toast.push({ title: 'Stažení selhalo', description: gymError(err), icon: 'triangle-alert' })
  } finally {
    gymBusy.value = false
  }
}

function onBattleFinished(result: BattleResult) {
  if (result.won) {
    toast.push({
      eyebrow: 'Vítězství!',
      title: 'Gym je tvůj',
      description: `+${result.awardedXp} XP`,
      icon: 'trophy',
      color: 'var(--xp)',
    })
  }
}

function onBattleClose() {
  const stopId = battle.value?.stopId
  battle.value = null
  if (stopId) void loadGymState(stopId) // reflect the new defender/holder
}
</script>

<template>
  <div class="map">
    <div ref="mapEl" class="map__canvas" />

    <!-- Top floating HUD -->
    <div class="hud">
      <div class="hud__panel hud__level">
        <div class="hud__badge">{{ game.player.level }}</div>
        <div class="hud__levelbody">
          <div class="hud__levelmeta">
            <span>LEVEL {{ game.player.level }}</span>
            <span>{{ game.player.xp }} / {{ game.player.xpMax }} XP</span>
          </div>
          <div class="hud__track"><div class="hud__fill" :style="{ width: `${game.levelPct}%` }" /></div>
        </div>
      </div>
      <div class="hud__panel hud__search">
        <SgIcon name="search" :size="18" />
        <input
          v-model="query"
          class="hud__searchinput"
          type="search"
          placeholder="Hledat zastávku…"
          autocomplete="off"
        />
        <ul v-if="results.length" class="hud__results">
          <li v-for="r in results" :key="r.id">
            <button type="button" class="hud__result" @click="selectResult(r)">
              <SgIcon name="map-pin" :size="15" />
              <span class="hud__resultname">{{ r.name }}</span>
              <span class="hud__resultlines">{{ r.lines.slice(0, 4).join(' · ') }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Location / no-stops notice -->
    <div v-if="noticeText" class="geo-notice" role="status">
      <SgIcon name="navigation" :size="14" /> {{ noticeText }}
    </div>

    <!-- Locate FAB — sits in the bottom-right corner, lifting above the stop
         sheet when one is open so it never overlaps it. -->
    <button class="locate" :style="{ bottom: locateBottom }" aria-label="Moje poloha" @click="recenter">
      <SgIcon name="locate-fixed" :size="22" />
    </button>

    <!-- Admin dev tools: teleport the player to test gyms without walking there.
         Sits just above the locate (recenter) button, bottom-right. -->
    <div v-if="isAdmin" class="dev" :style="{ bottom: devBottom }">
      <div v-if="devOpen" class="dev__panel">
        <p class="dev__title"><SgIcon name="target" :size="13" /> DEV · poloha</p>
        <button class="dev__row" :class="{ 'is-on': devTeleport }" @click="devTeleport = !devTeleport">
          <SgIcon name="map-pin" :size="15" />{{ devTeleport ? 'Klikni do mapy…' : 'Teleport klikem' }}
        </button>
        <button class="dev__row" :disabled="!selected" @click="teleportToSelected">
          <SgIcon name="navigation" :size="15" />Na vybranou zastávku
        </button>
        <button class="dev__row" :disabled="!geo.mocked.value" @click="resetGps">
          <SgIcon name="locate-fixed" :size="15" />Zpět na GPS
        </button>
        <p v-if="geo.mocked.value" class="dev__coords">
          {{ playerLoc.lat.toFixed(5) }}, {{ playerLoc.lng.toFixed(5) }}
        </p>
      </div>
      <button
        class="dev__fab"
        :class="{ 'dev__fab--on': devTeleport || geo.mocked.value }"
        aria-label="Dev nástroje"
        @click="devOpen = !devOpen"
      >
        <SgIcon name="target" :size="20" />
      </button>
    </div>

    <!-- Bottom stop sheet (regular stops; gyms get their own sheet below) -->
    <div v-if="selected && !selected.isGym" ref="sheetEl" class="stopsheet">
      <section class="stopsheet__panel" aria-labelledby="stop-name">
        <div class="stopsheet__info">
          <h2 id="stop-name" class="stopsheet__name">
            {{ selected.name }}
            <SgIcon v-if="selected.isGym" name="award" :size="16" class="stopsheet__gym" />
          </h2>
          <div class="stopsheet__meta">
            <div class="stopsheet__lines">
              <span
                v-for="l in selected.lines.slice(0, 4)"
                :key="l"
                class="stopsheet__line"
                :style="{ background: lineColor(l) }"
              >{{ l }}</span>
            </div>
            <div class="stopsheet__dist"><SgIcon name="navigation" :size="12" />{{ distanceLabel }} odsud</div>
          </div>
        </div>
        <div class="stopsheet__action">
          <button v-if="canVisit" class="stopsheet__reward" @click="visitSelected">
            <SgIcon :name="selectedState === 'ready' ? 'rotate-ccw' : 'zap'" :size="16" />+{{ selectedReward }} XP
          </button>
          <div v-else-if="selectedState === 'cooldown'" class="stopsheet__cooldown">
            <SgBadge tone="success" variant="soft" icon="check">Navštíveno</SgBadge>
            <span class="stopsheet__cooldownleft">Znovu za {{ cooldownLabel }}</span>
          </div>
          <span v-else class="stopsheet__far"><SgIcon name="navigation" :size="13" />Přijď blíž</span>
        </div>
      </section>
    </div>

    <!-- Gym sheet -->
    <div v-if="selected && selected.isGym" ref="sheetEl" class="gymsheet">
      <section class="gymsheet__panel" aria-labelledby="gym-name">
        <div class="gymsheet__top">
          <h2 id="gym-name" class="gymsheet__name">
            <SgIcon name="award" :size="16" class="gymsheet__gymicon" />{{ selected.name }}
          </h2>
          <span class="gymsheet__dist"><SgIcon name="navigation" :size="12" />{{ distanceLabel }}</span>
        </div>

        <p v-if="!gymState" class="gymsheet__status">Načítám gym…</p>

        <template v-else>
          <!-- Held: show the defender -->
          <div v-if="gymState.defender" class="gymsheet__defender">
            <div class="gymsheet__who">
              <SgAvatar
                :src="gymState.holder?.avatarUrl ?? undefined"
                :name="gymState.holder?.username ?? ''"
                :size="34"
              />
              <div class="gymsheet__whotext">
                <span class="gymsheet__holder">{{ gymState.isMine ? 'Bráníš ty' : gymState.holder?.username }}</span>
                <span class="gymsheet__veh">{{ gymState.defender.shortName }}</span>
              </div>
              <span class="gymsheet__atk"><SgIcon name="zap" :size="12" />{{ gymState.defender.attack }}</span>
            </div>
            <SgProgressBar
              :value="gymState.defender.hp"
              :max="gymState.defender.maxHp"
              :color="`var(--rarity-${gymState.defender.rarity})`"
              :height="10"
              show-value
              :value-text="`${gymState.defender.hp} / ${gymState.defender.maxHp} HP`"
            />
          </div>
          <p v-else class="gymsheet__open"><SgIcon name="shield" :size="15" />Tento gym je volný — obsaď ho!</p>

          <!-- Action -->
          <div class="gymsheet__actions">
            <span v-if="!inRange" class="gymsheet__far"><SgIcon name="navigation" :size="13" />Přijď blíž</span>
            <button
              v-else-if="gymState.isMine"
              class="gymsheet__btn gymsheet__btn--ghost"
              :disabled="gymBusy"
              @click="recallGym"
            >
              <SgIcon name="rotate-ccw" :size="16" />Stáhnout vozidlo
            </button>
            <button
              v-else-if="gymState.defender"
              class="gymsheet__btn"
              :disabled="gymBusy || !idleVehicles.length"
              @click="picker = 'battle'"
            >
              <SgIcon name="zap" :size="16" />{{ idleVehicles.length ? 'Bojovat' : 'Nemáš volné vozidlo' }}
            </button>
            <button
              v-else
              class="gymsheet__btn"
              :disabled="gymBusy || !idleVehicles.length"
              @click="picker = 'deploy'"
            >
              <SgIcon name="shield" :size="16" />{{ idleVehicles.length ? 'Nasadit vozidlo' : 'Nemáš volné vozidlo' }}
            </button>
          </div>
        </template>
      </section>
    </div>

    <!-- Vehicle picker (deploy a defender / pick an attacker) -->
    <div v-if="picker" class="vpick" @click.self="picker = null">
      <div class="vpick__panel">
        <div class="vpick__handle" aria-hidden="true" />
        <h3 class="vpick__title">{{ picker === 'deploy' ? 'Vyber obránce' : 'Vyber útočníka' }}</h3>
        <ul class="vpick__list">
          <li v-for="item in idleVehicles" :key="item.v.id">
            <button class="vpick__item" :disabled="gymBusy" @click="chooseVehicle(item)">
              <span class="vpick__code" :style="{ color: `var(--rarity-${item.v.rarity})` }">{{ item.v.shortName }}</span>
              <span class="vpick__cat">{{ game.cats[item.v.category].label }}</span>
              <span class="vpick__stats">
                <SgIcon name="zap" :size="12" />{{ item.stats.attack }} · {{ item.stats.maxHp }} HP
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Full-screen tap battle. position:fixed (in the component) lifts it over the
         bottom nav without a Teleport — a cross-boundary teleport here broke Vue's
         unmount patch on route change ("parentNode of null"). -->
    <BattleOverlay
      v-if="battle && gymState?.defender"
      :stop-id="battle.stopId"
      :vehicle-id="battle.vehicleId"
      :gym-name="selected?.name ?? ''"
      :attacker-name="battle.attackerName"
      :defender-name="gymState.defender.shortName"
      :defender-rarity="gymState.defender.rarity"
      :holder-name="gymState.holder?.username ?? 'Obránce'"
      @finished="onBattleFinished"
      @close="onBattleClose"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

.map { position: absolute; inset: 0; }
.map__canvas { position: absolute; inset: 0; background: #e9eef2; z-index: 0; isolation: isolate; }

.hud {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  left: 12px;
  right: 12px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.hud__panel { @include glass-hud; pointer-events: auto; }
.hud__level { display: flex; align-items: center; gap: 10px; }
.hud__badge {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--xp);
  color: #4a2d00;
  @include flex-center;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 14px;
  flex: none;
}
.hud__levelbody { flex: 1; min-width: 0; }
.hud__levelmeta {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-on-night-muted);
  margin-bottom: 3px;
}
.hud__track { height: 6px; background: rgba(255, 255, 255, 0.16); border-radius: 999px; overflow: hidden; }
.hud__fill { height: 100%; background: var(--xp); border-radius: 999px; transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.hud__search { display: flex; align-items: center; gap: 9px; padding: 10px 14px; color: var(--text-on-night-muted); font-size: 14px; position: relative; }
.hud__searchinput {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  color: var(--text-on-night);
  font-family: var(--font-body);
  font-size: 14px;
  &::placeholder { color: var(--text-on-night-muted); }
  &::-webkit-search-cancel-button { filter: invert(0.6); }
}
.hud__results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-height: 280px;
  overflow-y: auto;
  z-index: 10;
}
.hud__result {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  color: var(--text-secondary);
  &:hover { background: var(--surface-sunken); }
}
.hud__resultname { flex: 1; min-width: 0; font-weight: var(--fw-medium); color: var(--text-primary); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hud__resultlines { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); flex: none; }

.geo-notice {
  position: absolute;
  top: 128px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-night);
  color: var(--text-on-night);
  font-size: 12.5px;
  padding: 7px 13px;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-md);
  white-space: nowrap;
}

.locate {
  position: absolute;
  right: 14px;
  bottom: 24px; // bottom-right corner when no stop sheet is open
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: none;
  background: var(--surface-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-lg);
  @include flex-center;
  cursor: pointer;
  z-index: 5;
  transition: bottom 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:active { transform: scale(0.94); }
}

/* Admin dev tools — stacked directly above the locate button (bottom-right) */
.dev {
  position: absolute;
  right: 14px;
  bottom: 80px; // clears the 46px locate FAB at bottom:24px + a gap
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  transition: bottom 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.dev__fab {
  width: 46px; height: 46px; border-radius: 50%;
  border: none; cursor: pointer;
  background: var(--surface-night); color: var(--text-on-night);
  box-shadow: var(--shadow-lg);
  @include flex-center;
  &:active { transform: scale(0.94); }
}
.dev__fab--on { background: var(--brand); color: var(--text-on-brand); }
.dev__panel {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: 10px;
  width: 200px;
  display: flex; flex-direction: column; gap: 6px;
}
.dev__title {
  display: flex; align-items: center; gap: 5px;
  font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 10px;
  letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-muted);
  margin: 2px 2px 4px;
}
.dev__row {
  display: flex; align-items: center; gap: 8px;
  border: none; cursor: pointer; text-align: left;
  padding: 9px 11px; border-radius: var(--radius-md);
  background: var(--surface-sunken); color: var(--text-secondary);
  font-family: var(--font-body); font-size: 13px; font-weight: var(--fw-medium);
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.45; cursor: default; }
  &.is-on { background: var(--brand); color: var(--text-on-brand); }
}
.dev__coords {
  font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);
  text-align: center; margin: 2px 0 0;
}

.stopsheet { position: absolute; left: 12px; right: 12px; bottom: 14px; z-index: 5; }
.stopsheet__panel {
  display: flex;
  align-items: stretch;
  gap: 12px;
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: 14px 16px;
}
.stopsheet__info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.stopsheet__meta { display: flex; align-items: center; gap: 9px; }
.stopsheet__lines { display: flex; gap: 4px; flex: none; }
.stopsheet__line {
  min-width: 26px;
  height: 26px;
  padding: 0 5px;
  border-radius: 7px;
  color: #fff;
  @include flex-center;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 13px;
}
.stopsheet__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 20px;
  color: var(--text-primary);
}
.stopsheet__gym { color: var(--xp); flex: none; }
.stopsheet__dist { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-muted); }
// The action column stretches to the panel's full height (a <div> obeys
// align-self: stretch where a <button> wouldn't in mobile WebKit); the reward
// button then fills it via flex-grow, which buttons honor on the main axis.
.stopsheet__action { flex: none; display: flex; flex-direction: column; justify-content: center; }
.stopsheet__reward {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: none;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 15px;
  color: var(--gold-700);
  background: var(--xp-subtle);
  padding: 0 18px;
  border-radius: var(--radius-lg);
  &:active { transform: scale(0.96); }
}
.stopsheet__far {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface-sunken);
  padding: 6px 11px;
  border-radius: 999px;
  flex: none;
}
.stopsheet__cooldown { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 4px; flex: none; }
.stopsheet__cooldownleft { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }

/* Gym sheet */
.gymsheet { position: absolute; left: 12px; right: 12px; bottom: 14px; z-index: 5; }
.gymsheet__panel {
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.gymsheet__top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.gymsheet__name {
  display: flex; align-items: center; gap: 6px;
  font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 19px;
  color: var(--text-primary);
}
.gymsheet__gymicon { color: var(--xp); flex: none; }
.gymsheet__dist { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-muted); flex: none; }
.gymsheet__status { font-size: 13px; color: var(--text-muted); padding: 4px 0; }

.gymsheet__defender { display: flex; flex-direction: column; gap: 9px; }
.gymsheet__who { display: flex; align-items: center; gap: 10px; }
.gymsheet__whotext { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.gymsheet__holder {
  font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 14px;
  color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.gymsheet__veh { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
.gymsheet__atk {
  display: inline-flex; align-items: center; gap: 4px; flex: none;
  font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 13px; color: var(--text-secondary);
}
.gymsheet__open {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; color: var(--text-secondary);
}

.gymsheet__actions { display: flex; }
.gymsheet__btn {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  border: none; cursor: pointer;
  font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 15px;
  color: var(--text-on-brand); background: var(--brand);
  padding: 12px; border-radius: var(--radius-lg);
  transition: transform 0.12s ease, opacity 0.12s ease;
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.5; cursor: default; }
}
.gymsheet__btn--ghost { color: var(--text-secondary); background: var(--surface-sunken); }
.gymsheet__far {
  flex: 1;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 13px;
  color: var(--text-muted); background: var(--surface-sunken);
  padding: 12px; border-radius: var(--radius-lg);
}

/* Vehicle picker */
.vpick {
  position: absolute; inset: 0; z-index: 20;
  display: flex; flex-direction: column; justify-content: flex-end;
  background: rgba(11, 15, 20, 0.45);
}
.vpick__panel {
  background: var(--surface-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 10px 16px max(20px, env(safe-area-inset-bottom));
  max-height: 70%;
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-xl);
}
.vpick__handle { width: 40px; height: 5px; border-radius: 999px; background: var(--border-strong); margin: 0 auto 14px; }
.vpick__title {
  font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 16px;
  color: var(--text-primary); margin: 0 0 12px;
}
.vpick__list { list-style: none; margin: 0; padding: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.vpick__item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  border: none; cursor: pointer; text-align: left;
  padding: 11px 14px; border-radius: var(--radius-md);
  background: var(--surface-sunken);
  &:active { transform: scale(0.99); }
  &:disabled { opacity: 0.5; }
}
.vpick__code { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 16px; flex: none; }
.vpick__cat { flex: 1; min-width: 0; font-size: 13px; color: var(--text-secondary); }
.vpick__stats {
  display: inline-flex; align-items: center; gap: 4px; flex: none;
  font-family: var(--font-mono); font-size: 12px; color: var(--text-muted);
}
</style>
