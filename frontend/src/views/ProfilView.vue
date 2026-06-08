<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import TopBar from '@/components/layout/TopBar.vue'
import SgLevelRing from '@/components/game/SgLevelRing.vue'
import SgBadge from '@/components/ui/SgBadge.vue'
import SgStatTile from '@/components/ui/SgStatTile.vue'
import SgSwitch from '@/components/ui/SgSwitch.vue'
import SgIcon from '@/components/SgIcon.vue'

const game = useGameStore()
const player = computed(() => game.player)

const push = ref(true)
const sound = ref(true)
</script>

<template>
  <div class="screen">
    <TopBar title="Profil" />

    <div class="screen__scroll">
      <div class="hero">
        <SgLevelRing :level="player.level" :value="player.xp" :max="player.xpMax" :size="92" :sub-text="`${player.xp}/${player.xpMax}`" />
        <div class="hero__body">
          <div class="hero__name">{{ player.name }}</div>
          <div class="hero__handle">{{ player.handle }}</div>
          <SgBadge tone="brand" variant="solid" icon="award">Šotouš · Level {{ player.level }}</SgBadge>
        </div>
      </div>

      <div class="stats">
        <SgStatTile :value="player.vehicles" label="Vozidel" color="var(--cat-tram)" icon="tram-front" />
        <SgStatTile :value="player.stops" label="Zastávek" color="var(--brand)" icon="map-pin" />
        <SgStatTile :value="player.streak" label="dní v sérii" color="var(--xp)" icon="flame" />
      </div>

      <div class="screen__sectionhead">
        <span class="eyebrow">Poslední úlovky</span>
        <span class="screen__link">Vše v parku</span>
      </div>
      <div class="recent">
        <div v-for="v in game.recentVehicles" :key="v.type + v.number" class="recent__row">
          <div class="recent__icon" :style="{ background: `color-mix(in srgb, ${game.cats[v.cat].color} 14%, white)`, color: game.cats[v.cat].color }">
            <SgIcon :name="game.cats[v.cat].icon" :size="20" />
          </div>
          <div class="recent__body">
            <div class="recent__code">{{ v.type }} #{{ v.number }}</div>
            <div class="recent__sub">{{ game.cats[v.cat].label }} · {{ v.operator }}</div>
          </div>
          <span class="recent__date">{{ v.found }}</span>
        </div>
      </div>

      <span class="eyebrow screen__eyebrow">Nastavení</span>
      <div class="settings">
        <div class="settings__row">
          <SgIcon name="bell" :size="20" />
          <span class="settings__label">Push notifikace</span>
          <SgSwitch v-model="push" />
        </div>
        <div class="settings__row">
          <SgIcon name="volume-2" :size="20" />
          <span class="settings__label">Zvuky a vibrace</span>
          <SgSwitch v-model="sound" />
        </div>
        <div class="settings__row">
          <SgIcon name="map" :size="20" />
          <span class="settings__label">Offline mapa</span>
          <SgIcon class="settings__chevron" name="chevron-right" :size="18" />
        </div>
        <div class="settings__row">
          <SgIcon name="shield" :size="20" />
          <span class="settings__label">Soukromí</span>
          <SgIcon class="settings__chevron" name="chevron-right" :size="18" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

.screen { position: absolute; inset: 0; display: flex; flex-direction: column; }
.screen__scroll { flex: 1; overflow-y: auto; padding: 18px 16px 90px; }
.screen__sectionhead { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.screen__eyebrow { display: block; margin-bottom: 12px; }
.screen__link { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 13px; color: var(--text-brand); }

.hero { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.hero__body { flex: 1; min-width: 0; }
.hero__name { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 22px; line-height: 1.1; }
.hero__handle { color: var(--text-muted); font-family: var(--font-mono); font-size: 13px; margin-bottom: 8px; }

.stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 24px; }

.recent { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
.recent__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  @include soft-card(var(--radius-md));
}
.recent__icon { width: 38px; height: 38px; border-radius: var(--radius-sm); @include flex-center; flex: none; }
.recent__body { flex: 1; min-width: 0; }
.recent__code { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 15px; }
.recent__sub { font-size: 12px; color: var(--text-muted); }
.recent__date { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }

.settings {
  @include soft-card;
  overflow: hidden;
}
.settings__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  color: var(--text-secondary);

  & + & { border-top: 1px solid var(--border-subtle); }
}
.settings__label { flex: 1; font-weight: var(--fw-medium); font-size: 15px; color: var(--text-primary); }
.settings__chevron { color: var(--text-muted); }
</style>
