<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import TopBar from '@/components/layout/TopBar.vue'
import SgLevelRing from '@/components/game/SgLevelRing.vue'
import SgAvatar from '@/components/ui/SgAvatar.vue'
import SgBadge from '@/components/ui/SgBadge.vue'
import SgStatTile from '@/components/ui/SgStatTile.vue'
import SgSwitch from '@/components/ui/SgSwitch.vue'
import SgConfirmDialog from '@/components/ui/SgConfirmDialog.vue'
import SgIcon from '@/components/SgIcon.vue'
import { useToastStore } from '@/stores/toast'
import { downscaleImageFile } from '@/lib/image'

// Opened rarely, from a settings tap — no reason to ship it on the profile load.
const ReportBugSheet = defineAsyncComponent(() => import('@/components/layout/ReportBugSheet.vue'))

const game = useGameStore()
const player = computed(() => game.player)

const auth = useAuthStore()
const router = useRouter()
const toasts = useToastStore()

function logout() {
  auth.logout()
  router.replace({ name: 'login' })
}

const reportOpen = ref(false)

// Profile picture upload (downscaled client-side; reuses the catch-photo path).
const uploadingAvatar = ref(false)
async function onAvatarPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // let the same file be picked again later
  if (!file || uploadingAvatar.value) return
  uploadingAvatar.value = true
  try {
    const photo = await downscaleImageFile(file, { maxDim: 512 })
    await auth.updateAvatar(photo)
  } catch (err) {
    console.error('Nahrání profilového obrázku selhalo:', err)
    toasts.push({ title: 'Nahrání se nezdařilo', description: 'Zkus to prosím znovu.', icon: 'triangle-alert', color: 'var(--danger-500)' })
  } finally {
    uploadingAvatar.value = false
  }
}

// Destructive: wipe all progress (gated behind a confirmation dialog).
const confirmReset = ref(false)
const resetting = ref(false)
async function resetData() {
  if (resetting.value) return
  resetting.value = true
  try {
    await game.resetProgress()
    confirmReset.value = false
    toasts.push({ eyebrow: 'Hotovo', title: 'Data smazána', description: 'Tvůj postup byl vynulován.', icon: 'trash-2' })
  } catch (err) {
    console.error('Smazání dat selhalo:', err)
    toasts.push({ title: 'Smazání se nezdařilo', description: 'Zkus to prosím znovu.', icon: 'triangle-alert', color: 'var(--danger-500)' })
  } finally {
    resetting.value = false
  }
}

// Build stamp (commit + date), injected at build time — handy for telling at a
// glance whether a deployed build already includes a given feature.
const appVersion = `${__APP_COMMIT__} · ${__BUILD_DATE__}`
</script>

<template>
  <div class="screen">
    <TopBar title="Profil" />

    <div class="screen__scroll">
      <header class="hero">
        <SgLevelRing :level="player.level" :value="player.xp" :max="player.xpMax" :size="92">
          <label class="avataredit" :class="{ 'avataredit--busy': uploadingAvatar }" aria-label="Změnit profilový obrázek">
            <SgAvatar :src="player.avatarUrl ?? undefined" :name="player.name" :size="60" />
            <span class="avataredit__badge"><SgIcon name="camera" :size="13" /></span>
            <input type="file" accept="image/*" :disabled="uploadingAvatar" @change="onAvatarPick" />
          </label>
        </SgLevelRing>
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

      <RouterLink :to="{ name: 'zebricek' }" class="leaderlink">
        <span class="leaderlink__icon"><SgIcon name="trophy" :size="20" /></span>
        <span class="leaderlink__body">
          <span class="leaderlink__title">Žebříček hráčů</span>
          <span class="leaderlink__sub">Porovnej své XP s ostatními</span>
        </span>
        <SgIcon class="leaderlink__chevron" name="chevron-right" :size="18" />
      </RouterLink>

      <div class="screen__sectionhead">
        <h2 class="eyebrow">Poslední úlovky</h2>
        <RouterLink :to="{ name: 'park' }" class="screen__link">Vše v parku</RouterLink>
      </div>
      <p v-if="game.recentVehicles.length === 0" class="empty">
        <SgIcon name="camera" :size="22" />
        <span>Zatím žádné úlovky — vyfoť své první vozidlo!</span>
      </p>
      <ul v-else class="recent">
        <li v-for="{ instance, model } in game.recentVehicles" :key="instance.id" class="recent__row">
          <div class="recent__icon" :style="{ background: `color-mix(in srgb, ${game.cats[model.category].color} 14%, white)`, color: game.cats[model.category].color }">
            <SgIcon :name="game.cats[model.category].icon" :size="20" />
          </div>
          <div class="recent__body">
            <div class="recent__code">{{ model.shortName }}<span v-if="instance.fleetNumber" class="recent__serial"> #{{ instance.fleetNumber }}</span></div>
            <div class="recent__sub">{{ game.cats[model.category].label }} · {{ model.operator }}</div>
          </div>
          <span class="recent__date">{{ model.manufacturer }}</span>
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
        <button type="button" class="settings__row settings__row--action" @click="confirmReset = true">
          <SgIcon name="trash-2" :size="20" />
          <span class="settings__label">Smazat data</span>
        </button>
        <button type="button" class="settings__row settings__row--action" @click="logout">
          <SgIcon name="log-out" :size="20" />
          <span class="settings__label">Odhlásit se</span>
        </button>
      </div>

      <p class="version">verze {{ appVersion }}</p>
    </div>

    <Teleport to=".app-shell">
      <ReportBugSheet v-if="reportOpen" @close="reportOpen = false" />
    </Teleport>

    <SgConfirmDialog
      v-if="confirmReset"
      title="Smazat všechna data?"
      message="Smažeš všechna nasbíraná vozidla, navštívené zastávky, splněné výzvy a XP. Účet zůstane zachován. Tuto akci nelze vrátit."
      confirm-label="Smazat data"
      icon="trash-2"
      danger
      :loading="resetting"
      @confirm="resetData"
      @cancel="confirmReset = false"
    />
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
.avataredit {
  position: relative;
  display: inline-flex;
  border-radius: 50%;
  cursor: pointer;
  transition: opacity 0.12s ease;
  input { display: none; }
  &:active { transform: scale(0.97); }
}
.avataredit--busy { opacity: 0.55; pointer-events: none; }
.avataredit__badge {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--brand);
  color: var(--text-on-brand);
  border: 2px solid var(--surface-card);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero__body { flex: 1; min-width: 0; }
.hero__name { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 22px; line-height: 1.1; }
.hero__handle { color: var(--text-muted); font-family: var(--font-mono); font-size: 13px; margin-bottom: 8px; }

.stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }

.leaderlink {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  margin-bottom: 24px;
  text-decoration: none;
  @include soft-card(var(--radius-md));
  transition: background 0.12s ease, transform 0.12s ease;
  &:active { transform: scale(0.99); }
  &:hover { background: var(--surface-sunken); }
}
.leaderlink__icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  @include flex-center;
  flex: none;
  color: var(--gold-700);
  background: var(--xp-subtle);
}
.leaderlink__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.leaderlink__title { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 15px; color: var(--text-primary); }
.leaderlink__sub { font-size: 12px; color: var(--text-muted); }
.leaderlink__chevron { color: var(--text-muted); flex: none; }

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

.version {
  margin: 16px 2px 0;
  text-align: right;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  user-select: text;
}
</style>
