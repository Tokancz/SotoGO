<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import type { CatalogVehicle, CategoryKey, Rarity } from '@/types/game'
import TopBar from '@/components/layout/TopBar.vue'
import SgProgressBar from '@/components/ui/SgProgressBar.vue'
import SgTag from '@/components/ui/SgTag.vue'
import SgSegmentedControl from '@/components/ui/SgSegmentedControl.vue'
import SgBadge from '@/components/ui/SgBadge.vue'
import SgStatTile from '@/components/ui/SgStatTile.vue'
import SgVehicleCard from '@/components/game/SgVehicleCard.vue'
import SgIcon from '@/components/SgIcon.vue'
import { useDialog } from '@/composables/useDialog'

const game = useGameStore()

type Filter = 'all' | CategoryKey
const filter = ref<Filter>('all')
const view = ref<'mrizka' | 'seznam'>('mrizka')
const detail = ref<CatalogVehicle | null>(null)

const panelEl = ref<HTMLElement | null>(null)
useDialog(panelEl, { onClose: () => (detail.value = null), active: () => detail.value != null })

const counts = computed(() => game.countByCategory)

/** Catalog filtered by category, collected entries first. */
const list = computed(() => {
  const collected = game.collectedSet
  const items = (
    filter.value === 'all' ? game.catalog : game.catalog.filter((v) => v.category === filter.value)
  ).map((v) => ({ v, collected: collected.has(v.id) }))
  return items.sort((a, b) => Number(b.collected) - Number(a.collected))
})

const newestId = computed(() => game.recentVehicles[0]?.id)

const stars: Record<Rarity, string> = {
  common: '★',
  rare: '★★',
  epic: '★★★',
  legendary: '★★★★',
}

const detailCat = computed(() => (detail.value ? game.cats[detail.value.category] : null))
const detailPhoto = computed(() => (detail.value ? game.collectedPhotos[detail.value.id] : undefined))

const deleting = ref(false)
async function deleteDetail() {
  const v = detail.value
  if (!v || deleting.value) return
  if (!confirm(`Opravdu odstranit ${v.shortName} z parku?`)) return
  deleting.value = true
  try {
    await game.removeVehicle(v.id)
    detail.value = null
  } catch (err) {
    console.error('Odstranění vozidla selhalo:', err)
  } finally {
    deleting.value = false
  }
}
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
    <TopBar title="Vozový park" :subtitle="`${game.totalFound} z ${game.totalAll} modelů`" />

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
        <h2 class="eyebrow">{{ filter === 'all' ? 'Všechny modely' : game.cats[filter].plural }}</h2>
        <SgSegmentedControl
          v-model="view"
          :options="[
            { value: 'mrizka', icon: 'layout-grid' },
            { value: 'seznam', icon: 'list' },
          ]"
        />
      </div>

      <p v-if="!game.catalogLoaded" class="hint">Načítám katalog…</p>
      <div v-else class="grid" :class="{ 'grid--list': view === 'seznam' }">
        <SgVehicleCard
          v-for="item in list"
          :key="item.v.id"
          :locked="!item.collected"
          :type="item.v.shortName"
          :operator="item.v.manufacturer"
          :category="game.cats[item.v.category].label"
          :category-color="game.cats[item.v.category].color"
          :category-icon="game.cats[item.v.category].icon"
          :rarity="item.collected ? item.v.rarity : undefined"
          :is-new="item.collected && item.v.id === newestId"
          :image="item.collected ? game.collectedPhotos[item.v.id] : undefined"
          :compact="view === 'seznam'"
          @click="item.collected && (detail = item.v)"
        />
      </div>
    </div>

    <Teleport to=".app-shell">
      <div v-if="detail && detailCat" class="sheet" @click.self="detail = null">
        <div ref="panelEl" class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="vehicle-detail-title">
          <div class="sheet__handle" aria-hidden="true" />
          <div class="sheet__preview" :class="{ 'sheet__preview--photo': detailPhoto }" :style="detailPhoto ? undefined : previewStyle">
            <img v-if="detailPhoto" :src="detailPhoto" :alt="detail.shortName" />
            <SgIcon v-else :name="detailCat.icon" :size="84" />
          </div>
          <div class="sheet__head">
            <div>
              <h2 id="vehicle-detail-title" class="sheet__code">{{ detail.shortName }}</h2>
              <p class="sheet__sub">{{ detail.model }}</p>
            </div>
            <SgBadge :color="detailCat.color" variant="solid" :icon="detailCat.icon">{{ detailCat.label }}</SgBadge>
          </div>
          <div class="sheet__stats">
            <SgStatTile :value="stars[detail.rarity]" label="Vzácnost" :color="`var(--rarity-${detail.rarity})`" icon="star" />
            <SgStatTile :value="detail.operator" label="Dopravce" color="var(--brand)" icon="award" />
          </div>
          <div class="sheet__maker"><SgIcon name="layers" :size="15" />{{ detail.manufacturer }}</div>
          <button class="sheet__delete" :disabled="deleting" @click="deleteDetail">
            <SgIcon name="trash-2" :size="16" />{{ deleting ? 'Odstraňuji…' : 'Odstranit z parku' }}
          </button>
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

.hint { padding: 28px 0; text-align: center; color: var(--text-muted); font-size: 14px; }

.sheet { position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; background: rgba(11, 15, 20, 0.45); }
.sheet__panel {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  background: var(--surface-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 10px 18px 24px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  box-shadow: var(--shadow-xl);
}
.sheet__handle { width: 40px; height: 5px; border-radius: 999px; background: var(--border-strong); margin: 0 auto 16px; }
.sheet__preview {
  aspect-ratio: 16 / 10;
  max-height: 220px;
  width: 100%;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  overflow: hidden;
}
.sheet__preview--photo { background: var(--surface-sunken); }
.sheet__preview img { width: 100%; height: 100%; object-fit: cover; }
.sheet__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.sheet__code { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 24px; letter-spacing: -0.01em; }
.sheet__sub { color: var(--text-muted); margin-top: 2px; }
.sheet__stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
.sheet__maker {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  svg { color: var(--text-muted); }
}
.sheet__delete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  margin-top: 20px;
  padding: 13px;
  border: 1px solid color-mix(in srgb, var(--danger-500) 30%, transparent);
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  color: var(--danger-500);
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.6; cursor: default; }
}
</style>
