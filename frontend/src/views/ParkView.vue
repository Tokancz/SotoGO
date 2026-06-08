<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import type { CategoryKey, Rarity, Vehicle } from '@/types/game'
import TopBar from '@/components/layout/TopBar.vue'
import SgProgressBar from '@/components/ui/SgProgressBar.vue'
import SgTag from '@/components/ui/SgTag.vue'
import SgSegmentedControl from '@/components/ui/SgSegmentedControl.vue'
import SgBadge from '@/components/ui/SgBadge.vue'
import SgStatTile from '@/components/ui/SgStatTile.vue'
import SgVehicleCard from '@/components/game/SgVehicleCard.vue'
import SgIcon from '@/components/SgIcon.vue'

const game = useGameStore()

type Filter = 'all' | CategoryKey
const filter = ref<Filter>('all')
const view = ref<'mrizka' | 'seznam'>('mrizka')
const detail = ref<Vehicle | null>(null)

const counts = computed(() => game.countByCategory)
const list = computed(() =>
  filter.value === 'all' ? game.vehicles : game.vehicles.filter((v) => v.cat === filter.value),
)
const lockedSlots = computed(() =>
  filter.value === 'all' ? 4 : game.lockedCount[filter.value],
)

const stars: Record<Rarity, string> = {
  common: '★',
  rare: '★★',
  epic: '★★★',
  legendary: '★★★★',
}

const detailCat = computed(() => (detail.value ? game.cats[detail.value.cat] : null))
const previewStyle = computed(() =>
  detailCat.value
    ? {
        background: `color-mix(in srgb, ${detailCat.value.color} 10%, white)`,
        boxShadow: `inset 0 0 0 2px ${detailCat.value.color}`,
        color: detailCat.value.color,
      }
    : undefined,
)
</script>

<template>
  <div class="screen">
    <TopBar title="Vozový park" :subtitle="`${game.totalFound} z ${game.totalAll} vozidel`" />

    <div class="screen__scroll">
      <div class="completion">
        <SgProgressBar
          :value="game.totalFound"
          :max="game.totalAll"
          label="Dokončení sbírky"
          show-value
          :value-text="`${game.completionPct} %`"
        />
      </div>

      <div class="filters">
        <SgTag :selected="filter === 'all'" color="var(--brand)" icon="layout-grid" :count="game.totalFound" @click="filter = 'all'">
          Vše
        </SgTag>
        <SgTag
          v-for="c in game.categoryList"
          :key="c.key"
          :selected="filter === c.key"
          :color="c.color"
          :icon="c.icon"
          :count="counts[c.key]"
          @click="filter = c.key"
        >
          {{ c.plural }}
        </SgTag>
      </div>

      <div class="screen__sectionhead">
        <span class="eyebrow">{{ filter === 'all' ? 'Všechna vozidla' : game.cats[filter].plural }}</span>
        <SgSegmentedControl
          v-model="view"
          :options="[
            { value: 'mrizka', icon: 'layout-grid' },
            { value: 'seznam', icon: 'list' },
          ]"
        />
      </div>

      <div class="grid" :class="{ 'grid--list': view === 'seznam' }">
        <SgVehicleCard
          v-for="v in list"
          :key="v.type + v.number"
          :type="v.type"
          :number="v.number"
          :operator="v.operator"
          :category="game.cats[v.cat].label"
          :category-color="game.cats[v.cat].color"
          :category-icon="game.cats[v.cat].icon"
          :rarity="v.rarity"
          :found="v.found"
          :is-new="v.isNew"
          @click="detail = v"
        />
        <SgVehicleCard
          v-for="i in lockedSlots"
          :key="'lock' + i"
          locked
          :category-color="filter === 'all' ? 'var(--cat-train)' : game.cats[filter].color"
        />
      </div>
    </div>

    <Teleport to=".app-shell">
      <div v-if="detail && detailCat" class="sheet" @click.self="detail = null">
        <div class="sheet__panel">
          <div class="sheet__handle" />
          <div class="sheet__preview" :style="previewStyle"><SgIcon :name="detailCat.icon" :size="84" /></div>
          <div class="sheet__head">
            <div>
              <div class="sheet__code">{{ detail.type }} #{{ detail.number }}</div>
              <div class="sheet__sub">{{ detailCat.label }} · {{ detail.operator }}</div>
            </div>
            <SgBadge :color="detailCat.color" variant="solid" :icon="detailCat.icon">{{ detailCat.label }}</SgBadge>
          </div>
          <div class="sheet__stats">
            <SgStatTile :value="stars[detail.rarity]" label="Vzácnost" :color="`var(--rarity-${detail.rarity})`" icon="star" />
            <SgStatTile :value="detail.found" label="Nalezeno" color="var(--brand)" icon="calendar-check" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

.screen { position: absolute; inset: 0; display: flex; flex-direction: column; }
.screen__scroll { flex: 1; overflow-y: auto; padding: 14px 16px 90px; }
.screen__sectionhead { display: flex; justify-content: space-between; align-items: center; margin: 4px 0 12px; }

.completion {
  @include soft-card;
  padding: 14px;
  margin-bottom: 14px;
}

.filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 16px 10px;
  margin: 0 -16px;
  @include hide-scrollbar;
}

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid--list { grid-template-columns: 1fr; }

.sheet { position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column; justify-content: flex-end; background: rgba(11, 15, 20, 0.45); }
.sheet__panel {
  position: relative;
  background: var(--surface-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 10px 18px 24px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  box-shadow: var(--shadow-xl);
}
.sheet__handle { width: 40px; height: 5px; border-radius: 999px; background: var(--border-strong); margin: 0 auto 16px; }
.sheet__preview {
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.sheet__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.sheet__code { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 24px; letter-spacing: -0.01em; }
.sheet__sub { color: var(--text-muted); margin-top: 2px; }
.sheet__stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
</style>
