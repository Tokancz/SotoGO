<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import type { CatalogVehicle, CategoryKey, Rarity } from '@/types/game'
import TopBar from '@/components/layout/TopBar.vue'
import SgProgressBar from '@/components/ui/SgProgressBar.vue'
import SgTag from '@/components/ui/SgTag.vue'
import SgSegmentedControl from '@/components/ui/SgSegmentedControl.vue'
import SgBadge from '@/components/ui/SgBadge.vue'
import SgVehicleCard from '@/components/game/SgVehicleCard.vue'
import SgIcon from '@/components/SgIcon.vue'
import SgConfirmDialog from '@/components/ui/SgConfirmDialog.vue'
import { useDialog } from '@/composables/useDialog'

const game = useGameStore()

type Filter = 'all' | CategoryKey
const filter = ref<Filter>('all')
const view = ref<'mrizka' | 'seznam'>('mrizka')
const detail = ref<CatalogVehicle | null>(null)

// Gym deployment filter: show everything, only models defending a gym, or only
// models with a free (non-deployed) instance. Hidden until the player has at
// least one vehicle in a gym, since otherwise it'd do nothing.
type GymFilter = 'all' | 'deployed' | 'idle'
const gymFilter = ref<GymFilter>('all')
const hasDeployed = computed(() => game.collected.some((c) => c.deployedStopId != null))

const panelEl = ref<HTMLElement | null>(null)
useDialog(panelEl, { onClose: () => (detail.value = null), active: () => detail.value != null })

const counts = computed(() => game.countByCategory)

const RARITY_ORDER: Record<Rarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 }

// Don't paper the grid with every undiscovered model — show all you own, then a
// few locked "teasers" as a nudge, with the rest summarised below the grid.
const MAX_LOCKED = 2

/** Catalog filtered by category + gym status, with owned-instance info, collected first. */
const list = computed(() => {
  const byModel = game.instancesByModel
  const items = (
    filter.value === 'all' ? game.catalog : game.catalog.filter((v) => v.category === filter.value)
  ).map((v) => {
    const instances = byModel.get(v.id) ?? []
    // Card preview uses the rarest owned instance (its rarity + photo).
    const best = instances.reduce<(typeof instances)[number] | null>(
      (acc, c) => (acc && RARITY_ORDER[acc.rarity] >= RARITY_ORDER[c.rarity] ? acc : c),
      null,
    )
    const deployed = instances.filter((c) => c.deployedStopId != null).length
    return { v, collected: instances.length > 0, count: instances.length, deployed, best }
  })
  // Gym filter: 'deployed' keeps models with a vehicle in a gym; 'idle' keeps
  // models with at least one free instance. Both imply collected, so locked
  // teasers drop out automatically.
  const byGym =
    gymFilter.value === 'deployed'
      ? items.filter((i) => i.deployed > 0)
      : gymFilter.value === 'idle'
        ? items.filter((i) => i.count - i.deployed > 0)
        : items
  return byGym.sort((a, b) => Number(b.collected) - Number(a.collected))
})

/** Collected cards + at most MAX_LOCKED locked teasers (suppressed while a gym
 *  filter is active, since those are collected-only views). */
const visibleList = computed(() => {
  const collected = list.value.filter((i) => i.collected)
  const locked = gymFilter.value === 'all' ? list.value.filter((i) => !i.collected) : []
  return [...collected, ...locked.slice(0, MAX_LOCKED)]
})

const hiddenLockedCount = computed(
  () => list.value.filter((i) => !i.collected).length - MAX_LOCKED,
)

/** Czech plural for "model": 1 → model, 2–4 → modely, 5+ → modelů. */
function modelsWord(n: number): string {
  if (n === 1) return 'model'
  if (n >= 2 && n <= 4) return 'modely'
  return 'modelů'
}

const newestId = computed(() => game.recentVehicles[0]?.instance.vehicleTypeId)

const stars: Record<Rarity, string> = {
  common: '★',
  rare: '★★',
  epic: '★★★',
  legendary: '★★★★',
}

const detailCat = computed(() => (detail.value ? game.cats[detail.value.category] : null))
/** All instances the player owns of the open model, rarest first. */
const detailInstances = computed(() => {
  if (!detail.value) return []
  const arr = [...(game.instancesByModel.get(detail.value.id) ?? [])]
  return arr.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])
})

const confirmDelete = ref<string | null>(null) // instance id pending deletion
const deleting = ref(false)
async function performDelete() {
  const id = confirmDelete.value
  if (!id || deleting.value) return
  deleting.value = true
  try {
    await game.removeVehicle(id)
    confirmDelete.value = null
    // Close the sheet if that was the model's last instance.
    if (detail.value && (game.instancesByModel.get(detail.value.id)?.length ?? 0) === 0) {
      detail.value = null
    }
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

      <div v-if="hasDeployed" class="gymfilter">
        <SgSegmentedControl
          v-model="gymFilter"
          full-width
          :options="[
            { value: 'all', label: 'Vše' },
            { value: 'deployed', label: 'V gymu', icon: 'award' },
            { value: 'idle', label: 'Volná', icon: 'shield' },
          ]"
        />
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
      <p v-else-if="visibleList.length === 0" class="hint">
        {{ gymFilter === 'deployed' ? 'Žádné vozidlo zrovna nebrání gym.' : gymFilter === 'idle' ? 'Všechna vozidla brání gymy.' : 'Tady zatím nic není.' }}
      </p>
      <div v-else class="grid" :class="{ 'grid--list': view === 'seznam' }">
        <SgVehicleCard
          v-for="(item, i) in visibleList"
          :key="item.v.id"
          class="sg-rise"
          :style="{ '--sg-rise-delay': `${Math.min(i, 14) * 32}ms` }"
          :locked="!item.collected"
          :type="item.v.shortName"
          :operator="item.v.manufacturer"
          :category="game.cats[item.v.category].label"
          :category-color="game.cats[item.v.category].color"
          :category-icon="game.cats[item.v.category].icon"
          :rarity="item.collected ? (item.best?.rarity ?? item.v.rarity) : undefined"
          :is-new="item.collected && item.v.id === newestId"
          :image="item.collected ? (item.best?.imageUrl ?? undefined) : undefined"
          :count="item.count"
          :compact="view === 'seznam'"
          @click="item.collected && (detail = item.v)"
        />
      </div>

      <p v-if="game.catalogLoaded && hiddenLockedCount > 0" class="discover">
        <SgIcon name="search" :size="15" />
        Ještě {{ hiddenLockedCount }} {{ modelsWord(hiddenLockedCount) }} k objevení — lov dál!
      </p>
    </div>

    <Teleport to=".app-shell">
      <div v-if="detail && detailCat" class="sheet" @click.self="detail = null">
        <div ref="panelEl" class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="vehicle-detail-title">
          <div class="sheet__handle" aria-hidden="true" />
          <div class="sheet__preview" :class="{ 'sheet__preview--photo': detailInstances[0]?.imageUrl }" :style="detailInstances[0]?.imageUrl ? undefined : previewStyle">
            <img v-if="detailInstances[0]?.imageUrl" :src="detailInstances[0].imageUrl!" :alt="detail.shortName" decoding="async" />
            <SgIcon v-else :name="detailCat.icon" :size="84" />
          </div>
          <div class="sheet__head">
            <div>
              <h2 id="vehicle-detail-title" class="sheet__code">{{ detail.shortName }}</h2>
              <p class="sheet__sub">{{ detail.model }}</p>
            </div>
            <SgBadge :color="detailCat.color" variant="solid" :icon="detailCat.icon">{{ detailCat.label }}</SgBadge>
          </div>
          <div class="sheet__maker"><SgIcon name="layers" :size="15" />{{ detail.manufacturer }} · {{ detail.operator }}</div>

          <h3 class="sheet__insthead">Tvoje vozidla <span>({{ detailInstances.length }})</span></h3>
          <ul class="instlist">
            <li v-for="inst in detailInstances" :key="inst.id" class="inst" :class="{ 'inst--deployed': inst.deployedStopId }">
              <div class="inst__media" :style="inst.imageUrl ? undefined : { background: `color-mix(in srgb, ${detailCat.color} 12%, white)`, color: detailCat.color }">
                <img v-if="inst.imageUrl" :src="inst.imageUrl" alt="" loading="lazy" decoding="async" />
                <SgIcon v-else :name="detailCat.icon" :size="22" />
              </div>
              <div class="inst__body">
                <div class="inst__top">
                  <span class="inst__serial">{{ inst.fleetNumber ? `#${inst.fleetNumber}` : 'Bez čísla' }}</span>
                  <span class="inst__rarity" :style="{ color: `var(--rarity-${inst.rarity})` }">{{ stars[inst.rarity] }}</span>
                </div>
                <div class="inst__stats">
                  <span><SgIcon name="shield" :size="13" />{{ inst.hp }} / {{ inst.maxHp }}</span>
                  <span><SgIcon name="zap" :size="13" />{{ inst.attack }}</span>
                  <span v-if="inst.deployedStopId" class="inst__deployed"><SgIcon name="award" :size="13" />Brání gym</span>
                </div>
              </div>
              <button
                class="inst__del"
                :disabled="deleting || inst.deployedStopId != null"
                :title="inst.deployedStopId ? 'Vozidlo brání gym' : 'Odstranit'"
                @click="confirmDelete = inst.id"
              >
                <SgIcon name="trash-2" :size="16" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Teleport>

    <SgConfirmDialog
      v-if="confirmDelete && detail"
      :title="`Odstranit ${detail.shortName}?`"
      message="Vozidlo i jeho fotka se odeberou z parku a přijdeš o získané XP."
      confirm-label="Odstranit"
      icon="trash-2"
      danger
      :loading="deleting"
      @confirm="performDelete"
      @cancel="confirmDelete = null"
    />
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

.gymfilter { margin-bottom: 14px; }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid--list { grid-template-columns: 1fr; }

.hint { padding: 28px 0; text-align: center; color: var(--text-muted); font-size: 14px; }

.discover {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 16px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
  svg { flex: none; }
}

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
.sheet__maker {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  svg { color: var(--text-muted); }
}
.sheet__insthead {
  margin: 20px 0 10px;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 15px;
  color: var(--text-primary);
  span { color: var(--text-muted); font-weight: var(--fw-regular); }
}
.instlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.inst {
  display: flex; align-items: center; gap: 12px;
  padding: 8px; border-radius: var(--radius-md);
  background: var(--surface-sunken);
}
.inst--deployed { box-shadow: inset 0 0 0 1.5px var(--xp); }
.inst__media {
  flex: none; width: 52px; height: 52px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center; overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.inst__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.inst__top { display: flex; align-items: center; gap: 8px; }
.inst__serial { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 15px; color: var(--text-primary); }
.inst__rarity { font-size: 12px; letter-spacing: 1px; }
.inst__stats {
  display: flex; align-items: center; gap: 12px;
  font-family: var(--font-mono); font-size: 12px; color: var(--text-muted);
  span { display: inline-flex; align-items: center; gap: 4px; }
}
.inst__deployed { color: var(--gold-700); }
.inst__del {
  flex: none; width: 38px; height: 38px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer; color: var(--danger-500);
  background: var(--danger-soft);
  &:disabled { opacity: 0.4; cursor: default; }
}
.sheet__deployed {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 11px 13px;
  border-radius: var(--radius-md);
  background: var(--xp-subtle);
  color: var(--gold-700);
  font-size: 13px;
  line-height: 1.35;
  svg { flex: none; }
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
