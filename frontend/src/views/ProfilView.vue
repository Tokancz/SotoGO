<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import TopBar from '@/components/layout/TopBar.vue'
import SgLevelRing from '@/components/game/SgLevelRing.vue'
import SgBadge from '@/components/ui/SgBadge.vue'
import SgStatTile from '@/components/ui/SgStatTile.vue'
import SgSwitch from '@/components/ui/SgSwitch.vue'
import SgIcon from '@/components/SgIcon.vue'

// Opened rarely, from a settings tap — no reason to ship it on the profile load.
const ReportBugSheet = defineAsyncComponent(() => import('@/components/layout/ReportBugSheet.vue'))

const game = useGameStore()
const player = computed(() => game.player)

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.replace({ name: 'login' })
}

const reportOpen = ref(false)
</script>

<template>
  <div class="screen">
    <TopBar title="Profil" />

    <div class="screen__scroll">
      <header class="hero">
        <SgLevelRing :level="player.level" :value="player.xp" :max="player.xpMax" :size="92" :sub-text="`${player.xp}/${player.xpMax}`" />
        <div class="hero__body">
          <h2 class="hero__name">{{ player.name }}</h2>
          <p class="hero__handle">{{ player.handle }}</p>
          <SgBadge tone="brand" variant="solid" icon="award">Šotouš · Level {{ player.level }}</SgBadge>
        </div>
      </header>

      <div class="stats">
        <SgStatTile :value="player.vehicles" label="Vozidel" color="var(--cat-tram)" icon="tram-front" />
        <SgStatTile :value="player.stops" label="Zastávek" color="var(--brand)" icon="map-pin" />
        <SgStatTile :value="player.streak" label="dní v sérii" color="var(--xp)" icon="flame" />
      </div>

      <div class="screen__sectionhead">
        <h2 class="eyebrow">Poslední úlovky</h2>
        <RouterLink :to="{ name: 'park' }" class="screen__link">Vše v parku</RouterLink>
      </div>
      <p v-if="game.recentVehicles.length === 0" class="empty">
        <SgIcon name="camera" :size="22" />
        <span>Zatím žádné úlovky — vyfoť své první vozidlo!</span>
      </p>
      <ul v-else class="recent">
        <li v-for="v in game.recentVehicles" :key="v.id" class="recent__row">
          <div class="recent__icon" :style="{ background: `color-mix(in srgb, ${game.cats[v.category].color} 14%, white)`, color: game.cats[v.category].color }">
            <SgIcon :name="game.cats[v.category].icon" :size="20" />
          </div>
          <div class="recent__body">
            <div class="recent__code">{{ v.shortName }}</div>
            <div class="recent__sub">{{ game.cats[v.category].label }} · {{ v.operator }}</div>
          </div>
          <span class="recent__date">{{ v.manufacturer }}</span>
        </li>
      </ul>

      <h2 class="eyebrow screen__eyebrow">Nastavení</h2>
      <div class="settings">
        <div class="settings__row settings__row--disabled">
          <SgIcon name="bell" :size="20" />
          <span class="settings__label">Push notifikace</span>
          <span class="settings__soon">Brzy</span>
          <SgSwitch :model-value="false" disabled />
        </div>
        <div class="settings__row settings__row--disabled">
          <SgIcon name="volume-2" :size="20" />
          <span class="settings__label">Zvuky a vibrace</span>
          <span class="settings__soon">Brzy</span>
          <SgSwitch :model-value="false" disabled />
        </div>
        <div class="settings__row settings__row--disabled">
          <SgIcon name="map" :size="20" />
          <span class="settings__label">Offline mapa</span>
          <span class="settings__soon">Brzy</span>
        </div>
        <div class="settings__row settings__row--disabled">
          <SgIcon name="shield" :size="20" />
          <span class="settings__label">Soukromí</span>
          <span class="settings__soon">Brzy</span>
        </div>
        <button type="button" class="settings__row settings__row--button" @click="reportOpen = true">
          <SgIcon name="bug" :size="20" />
          <span class="settings__label">Nahlásit chybu</span>
          <SgIcon class="settings__chevron" name="chevron-right" :size="18" />
        </button>
        <button type="button" class="settings__row settings__row--action" @click="logout">
          <SgIcon name="log-out" :size="20" />
          <span class="settings__label">Odhlásit se</span>
        </button>
      </div>
    </div>

    <Teleport to=".app-shell">
      <ReportBugSheet v-if="reportOpen" @close="reportOpen = false" />
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

.screen { position: absolute; inset: 0; display: flex; flex-direction: column; }
.screen__scroll { flex: 1; overflow-y: auto; padding: 18px 16px 90px; }
.screen__sectionhead { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.screen__eyebrow { display: block; margin-bottom: 12px; }
.screen__link { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 13px; color: var(--text-brand); text-decoration: none; cursor: pointer; }

.hero { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.hero__body { flex: 1; min-width: 0; }
.hero__name { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 22px; line-height: 1.1; }
.hero__handle { color: var(--text-muted); font-family: var(--font-mono); font-size: 13px; margin-bottom: 8px; }

.stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 24px; }

.empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px;
  margin-bottom: 24px;
  color: var(--text-muted);
  font-size: 13.5px;
  @include soft-card(var(--radius-md));
}
.recent { display: flex; flex-direction: column; gap: 8px; margin: 0 0 24px; padding: 0; list-style: none; }
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
.settings__label { flex: 1; font-weight: var(--fw-medium); font-size: 15px; color: var(--text-primary); text-align: left; }
.settings__chevron { color: var(--text-muted); }
// Not-yet-implemented settings: dimmed, non-interactive, tagged "Brzy".
.settings__row--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  :deep(.sg-switch) { pointer-events: none; cursor: not-allowed; }
}
.settings__soon {
  flex: none;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
  background: var(--surface-sunken);
  padding: 3px 8px;
  border-radius: var(--radius-pill);
}
.settings__row--button {
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  &:hover { background: var(--surface-sunken); }
}
.settings__row--action {
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: var(--danger-500);
  .settings__label { color: var(--danger-500); }
  &:hover { background: var(--surface-sunken); }
}
</style>
