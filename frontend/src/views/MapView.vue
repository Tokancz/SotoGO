<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import L from 'leaflet'
import { useGameStore } from '@/stores/game'
import { catalogApi } from '@/services/catalog'
import type { ApiStop } from '@/types/game'
import SgBadge from '@/components/ui/SgBadge.vue'
import SgIcon from '@/components/SgIcon.vue'

const game = useGameStore()

// Demo player location (real geolocation is a later feature).
const PLAYER_LOC = { lat: 50.089, lng: 14.4395 }

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

const mapEl = ref<HTMLDivElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const selected = ref<ApiStop | null>(null)
const markersById: Record<string, L.Marker> = {}
let trackLayer: L.LayerGroup | null = null

// line short name → category, learned from the selected stop's routes (so the
// sheet's line chips can be colored by category, matching the drawn tracks).
const lineCats = ref<Record<string, string>>({})

// Stop search
const query = ref('')
const results = ref<ApiStop[]>([])

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const la1 = (aLat * Math.PI) / 180
  const la2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`
}

/** Pin color + short label for a stop, prioritising metro line colors. */
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

const distanceLabel = computed(() =>
  selected.value
    ? fmtDist(haversine(PLAYER_LOC.lat, PLAYER_LOC.lng, selected.value.lat, selected.value.lng))
    : '',
)
const selectedVisited = computed(() =>
  selected.value ? game.visitedSet.has(selected.value.id) : false,
)

function lineColor(line: string): string {
  const cat = lineCats.value[line]
  if (cat) return CAT_HEX[cat] ?? 'var(--slate-500)'
  return LINE_HEX[line] ?? 'var(--slate-500)' // fallback before routes load
}

function addMarker(m: L.Map, stop: ApiStop): L.Marker {
  const { color, label } = pinStyle(stop)
  const visited = game.visitedSet.has(stop.id) ? ' sg-stop-pin--visited' : ''
  const gym = stop.isGym ? ' sg-stop-pin--gym' : ''
  const icon = L.divIcon({
    className: '',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    html: `<div class="sg-stop-pin${gym}${visited}" style="--pin:${color}">
             <div class="sg-stop-pin__head"><span>${label}</span></div>
           </div>`,
  })
  const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(m)
  marker.on('click', () => selectStop(stop))
  markersById[stop.id] = marker
  return marker
}

function renderStops(m: L.Map) {
  for (const stop of game.stops) addMarker(m, stop)
}

/** Draw the category-colored tracks for every route serving a stop. */
async function drawTracks(stop: ApiStop) {
  if (!map.value || !trackLayer) return
  trackLayer.clearLayers()
  let routes
  try {
    routes = await catalogApi.routes(stop.id)
  } catch {
    return
  }
  // Remember each line's category so the sheet chips match the track colors.
  const cats: Record<string, string> = {}
  for (const r of routes) cats[r.line] = r.category
  lineCats.value = cats

  routes.sort((a, b) => (TRACK_ORDER[a.category] ?? 0) - (TRACK_ORDER[b.category] ?? 0))
  for (const r of routes) {
    L.polyline(r.points, {
      color: CAT_HEX[r.category] ?? '#888',
      weight: trackWeight(r.category),
      opacity: 0.7,
      lineJoin: 'round',
    }).addTo(trackLayer)
  }
}

/** Select a stop: show its sheet, ensure it has a marker, and draw its tracks. */
function selectStop(stop: ApiStop) {
  selected.value = stop
  if (map.value && !markersById[stop.id]) addMarker(map.value, stop)
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
  map.value?.flyTo([stop.lat, stop.lng], 16, { duration: 0.8 })
  selectStop(stop)
}

onMounted(async () => {
  if (!mapEl.value) return

  const m = L.map(mapEl.value, { zoomControl: false, attributionControl: false }).setView(
    [PLAYER_LOC.lat, PLAYER_LOC.lng],
    15,
  )
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(m)

  const playerIcon = L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: '<div class="sg-player-dot"></div>',
  })
  L.marker([PLAYER_LOC.lat, PLAYER_LOC.lng], { icon: playerIcon, zIndexOffset: 1000 }).addTo(m)

  trackLayer = L.layerGroup().addTo(m)
  map.value = m
  setTimeout(() => m.invalidateSize(), 60)

  // Load stops + the player's visits together so visited pins render dimmed.
  await Promise.all([
    game.loadStops({ lat: PLAYER_LOC.lat, lng: PLAYER_LOC.lng, km: 2.5 }),
    game.loadProgress(),
  ])
  renderStops(m)

  // Preselect the nearest stop for the bottom sheet.
  selected.value =
    [...game.stops].sort(
      (a, b) =>
        haversine(PLAYER_LOC.lat, PLAYER_LOC.lng, a.lat, a.lng) -
        haversine(PLAYER_LOC.lat, PLAYER_LOC.lng, b.lat, b.lng),
    )[0] ?? null
})

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
})

async function visitSelected() {
  const stop = selected.value
  if (!stop || game.visitedSet.has(stop.id)) return
  await game.visitStop(stop.id)
  markersById[stop.id]?.getElement()?.firstElementChild?.classList.add('sg-stop-pin--visited')
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
          <li v-for="r in results" :key="r.id" class="hud__result" @click="selectResult(r)">
            <SgIcon name="map-pin" :size="15" />
            <span class="hud__resultname">{{ r.name }}</span>
            <span class="hud__resultlines">{{ r.lines.slice(0, 4).join(' · ') }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Locate FAB -->
    <button class="locate" aria-label="Moje poloha" @click="map?.setView([PLAYER_LOC.lat, PLAYER_LOC.lng], 16)">
      <SgIcon name="locate-fixed" :size="22" />
    </button>

    <!-- Bottom stop sheet -->
    <div v-if="selected" class="stopsheet">
      <div class="stopsheet__panel">
        <div class="stopsheet__lines">
          <span
            v-for="l in selected.lines.slice(0, 4)"
            :key="l"
            class="stopsheet__line"
            :style="{ background: lineColor(l) }"
          >{{ l }}</span>
        </div>
        <div class="stopsheet__body">
          <div class="stopsheet__name">
            {{ selected.name }}
            <SgIcon v-if="selected.isGym" name="award" :size="14" class="stopsheet__gym" />
          </div>
          <div class="stopsheet__dist"><SgIcon name="navigation" :size="12" />{{ distanceLabel }} odsud</div>
        </div>
        <SgBadge v-if="selectedVisited" tone="success" variant="soft" icon="check">Navštíveno</SgBadge>
        <button v-else class="stopsheet__reward" @click="visitSelected">
          <SgIcon name="zap" :size="14" />+{{ rewardFor(selected) }} XP
        </button>
      </div>
    </div>
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
  padding: 9px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  &:hover { background: var(--surface-sunken); }
}
.hud__resultname { flex: 1; min-width: 0; font-weight: var(--fw-medium); color: var(--text-primary); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hud__resultlines { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); flex: none; }

.locate {
  position: absolute;
  right: 14px;
  bottom: 118px;
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

  &:active { transform: scale(0.94); }
}

.stopsheet { position: absolute; left: 12px; right: 12px; bottom: 14px; z-index: 5; }
.stopsheet__panel {
  display: flex;
  align-items: center;
  gap: 11px;
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: 14px 16px;
}
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
.stopsheet__body { flex: 1; min-width: 0; }
.stopsheet__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 16px;
  color: var(--text-primary);
}
.stopsheet__gym { color: var(--xp); }
.stopsheet__dist { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-muted); }
.stopsheet__reward {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 13px;
  color: var(--gold-700);
  background: var(--xp-subtle);
  padding: 6px 11px;
  border-radius: 999px;
  flex: none;
  &:active { transform: scale(0.96); }
}
</style>
