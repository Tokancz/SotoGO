<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import L from 'leaflet'
import { useGameStore } from '@/stores/game'
import type { MetroLine, Stop } from '@/types/game'
import SgBadge from '@/components/ui/SgBadge.vue'
import SgIcon from '@/components/SgIcon.vue'

const game = useGameStore()

const LINE_COLOR: Record<MetroLine, string> = {
  A: 'var(--line-a)',
  B: 'var(--line-b)',
  C: 'var(--line-c)',
}
const LINE_HEX: Record<MetroLine, string> = { A: '#00A562', B: '#F7A600', C: '#D9282F' }

const mapEl = ref<HTMLDivElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const selected = ref<Stop>(game.stops[0])

const player = computed(() => game.player)

onMounted(() => {
  if (!mapEl.value) return

  const m = L.map(mapEl.value, { zoomControl: false, attributionControl: false }).setView(
    [50.0865, 14.433],
    15,
  )
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(m)

  // Player location — pulsing green dot.
  const playerIcon = L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: '<div class="sg-player-dot"></div>',
  })
  L.marker([50.089, 14.4395], { icon: playerIcon, zIndexOffset: 1000 }).addTo(m)

  // Stop pins — colored by primary metro line.
  game.stops.forEach((s) => {
    const hex = LINE_HEX[s.lines[0]] ?? '#43B02A'
    const icon = L.divIcon({
      className: '',
      iconSize: [34, 42],
      iconAnchor: [17, 42],
      html: `<div class="sg-stop-pin" style="--pin:${hex}">
               <div class="sg-stop-pin__head"><span>${s.lines[0]}</span></div>
             </div>`,
    })
    L.marker([s.lat, s.lng], { icon }).addTo(m).on('click', () => (selected.value = s))
  })

  setTimeout(() => m.invalidateSize(), 60)
  map.value = m
})

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
})

function visitSelected() {
  if (selected.value.visited) return
  game.visitStop(selected.value.name)
}
</script>

<template>
  <div class="map">
    <div ref="mapEl" class="map__canvas" />

    <!-- Top floating HUD -->
    <div class="hud">
      <div class="hud__panel hud__level">
        <div class="hud__badge">{{ player.level }}</div>
        <div class="hud__levelbody">
          <div class="hud__levelmeta">
            <span>LEVEL {{ player.level }}</span>
            <span>{{ player.xp }} / {{ player.xpMax }} XP</span>
          </div>
          <div class="hud__track"><div class="hud__fill" :style="{ width: `${game.levelPct}%` }" /></div>
        </div>
      </div>
      <div class="hud__panel hud__search">
        <SgIcon name="search" :size="18" />
        <span>Hledat zastávku nebo linku…</span>
      </div>
    </div>

    <!-- Locate FAB -->
    <button class="locate" aria-label="Moje poloha" @click="map?.setView([50.089, 14.4395], 16)">
      <SgIcon name="locate-fixed" :size="22" />
    </button>

    <!-- Bottom stop sheet -->
    <div class="stopsheet">
      <div class="stopsheet__panel">
        <div class="stopsheet__lines">
          <span v-for="l in selected.lines" :key="l" class="stopsheet__line" :style="{ background: LINE_COLOR[l] }">{{ l }}</span>
        </div>
        <div class="stopsheet__body">
          <div class="stopsheet__name">{{ selected.name }}</div>
          <div class="stopsheet__dist"><SgIcon name="navigation" :size="12" />{{ selected.dist }} odsud</div>
        </div>
        <SgBadge v-if="selected.visited" tone="success" variant="soft" icon="check">Navštíveno</SgBadge>
        <button v-else class="stopsheet__reward" @click="visitSelected">
          <SgIcon name="zap" :size="14" />+{{ selected.xp }} XP
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
.hud__search { display: flex; align-items: center; gap: 9px; padding: 10px 14px; color: var(--text-on-night-muted); font-size: 14px; }

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
.stopsheet__lines { display: flex; gap: 4px; }
.stopsheet__line {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  color: #fff;
  @include flex-center;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 14px;
}
.stopsheet__body { flex: 1; min-width: 0; }
.stopsheet__name { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 16px; color: var(--text-primary); }
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
  &:active { transform: scale(0.96); }
}
</style>
