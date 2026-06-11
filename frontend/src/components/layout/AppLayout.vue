<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useToastStore } from '@/stores/toast'
import { useSettingsStore } from '@/stores/settings'
import { fx, haptic } from '@/lib/feedback'
import { music } from '@/lib/music'
import SgBottomNav, { type NavItem } from '@/components/game/SgBottomNav.vue'
import SgToastHost from '@/components/ui/SgToastHost.vue'
import LevelUpOverlay from '@/components/game/LevelUpOverlay.vue'
import OnboardingOverlay from '@/components/layout/OnboardingOverlay.vue'

// Loaded on demand when the camera opens — keeps Tesseract.js (OCR) and the
// capture UI out of the initial bundle.
const CaptureSheet = defineAsyncComponent(() => import('@/components/layout/CaptureSheet.vue'))

const route = useRoute()
const router = useRouter()
const game = useGameStore()
const toasts = useToastStore()
const settings = useSettingsStore()

const captureOpen = ref(false)

// First-launch tutorial (intro carousel + camera-FAB coachmark). Shown once per
// device; the flag is local so it doesn't need a backend round-trip.
const ONBOARDED_KEY = 'sotogo:onboarded'
const showOnboarding = ref(false)
function finishOnboarding() {
  showOnboarding.value = false
  try {
    localStorage.setItem(ONBOARDED_KEY, '1')
  } catch {
    /* private mode — they'll just see it again next launch */
  }
}

// Level-up celebration: watch the (XP-derived) player level and fire the overlay
// + jingle when it climbs. The first observed value just seeds the baseline so
// loading the saved level doesn't trigger a false celebration.
const levelUpTo = ref<number | null>(null)
let prevLevel: number | null = null
watch(
  () => game.player.level,
  (lvl) => {
    if (prevLevel === null) {
      prevLevel = lvl
      return
    }
    if (lvl > prevLevel) {
      levelUpTo.value = lvl
      fx.levelUp()
      haptic.win()
    }
    prevLevel = lvl
  },
  { immediate: true },
)

// Background music follows the setting. Toggling it on (a user gesture) starts it
// immediately; if it was already enabled from a previous session, the first tap
// anywhere kicks it off (browsers require a gesture to begin audio).
watch(
  () => settings.music,
  (on) => (on ? music.start() : music.stop()),
)

// One global UI click sound for every button/tab/link/toggle — far simpler than
// wiring each component. Capture phase so it still fires if a handler stops
// propagation; `data-noclick` opts an element out (e.g. the battle tap target,
// which has its own sound).
function onUiPointerDown(e: PointerEvent) {
  const start = e.target as HTMLElement | null
  const el = start?.closest<HTMLElement>(
    'button, a[href], [role="tab"], [role="button"], label.sg-switch',
  )
  if (!el) return
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return
  if (el.closest('[data-noclick]')) return
  const sw = el.matches('label.sg-switch')
    ? el.querySelector<HTMLInputElement>('input[type="checkbox"]')
    : null
  if (sw) fx.toggle(!sw.checked)
  else fx.click()
}

// Toast newly-unlocked achievements. The baseline is seeded explicitly once
// progress has loaded (see onMounted), so existing unlocks don't toast — only
// ones earned live (after a catch/visit) fire a notification.
const seenUnlocked = ref<Set<string> | null>(null)
watch(
  () => game.achievements.filter((a) => a.unlocked),
  (unlocked) => {
    const seen = seenUnlocked.value
    if (seen === null) return // not seeded yet — ignore until ready
    // Forget any that are no longer unlocked (e.g. after a "Smazat data" reset),
    // so they announce again when re-earned instead of being silently swallowed.
    const unlockedTitles = new Set(unlocked.map((a) => a.title))
    for (const title of [...seen]) if (!unlockedTitles.has(title)) seen.delete(title)
    for (const a of unlocked) {
      if (seen.has(a.title)) continue
      seen.add(a.title)
      toasts.push({
        eyebrow: 'Nový achievement!',
        title: a.title,
        description: a.desc,
        icon: a.icon,
        color: a.color,
      })
    }
  },
)

const dailyOpen = computed(() => game.dailyClaimable)

const items = computed<NavItem[]>(() => [
  { id: 'mapa', label: 'Mapa', icon: 'map' },
  { id: 'park', label: 'Park', icon: 'layout-grid' },
  { id: 'kamera', label: 'Kamera', icon: 'camera', fab: true },
  { id: 'vyzvy', label: 'Výzvy', icon: 'target', badge: dailyOpen.value || undefined },
  { id: 'profil', label: 'Profil', icon: 'user' },
])

const active = computed(() => (route.name as string) ?? 'mapa')

function onNav(id: string) {
  if (id === 'kamera') {
    captureOpen.value = true
    return
  }
  router.push({ name: id })
}

function onCaught() {
  router.push({ name: 'park' })
}

onMounted(async () => {
  // New players get the tutorial on first launch (unless they're deep-linking
  // straight into the camera from the homescreen shortcut).
  if (!localStorage.getItem(ONBOARDED_KEY) && route.query.action !== 'camera') {
    showOnboarding.value = true
  }

  // Homescreen shortcut "Vyfotit vozidlo" deep-links with ?action=camera —
  // open the capture sheet, then strip the param so a refresh won't reopen it.
  if (route.query.action === 'camera') {
    captureOpen.value = true
    const { action, ...rest } = route.query
    void action
    router.replace({ query: rest })
  }

  game.ensureCatalog()
  game.loadQuests()
  game.checkIn()
  // Seed the achievement baseline only after the achievements (and progress) are
  // in — so existing unlocks don't announce on open, only ones earned live after.
  await Promise.all([game.loadProgress(), game.ensureCatalog(), game.loadAchievements()])
  seenUnlocked.value = new Set(game.achievements.filter((a) => a.unlocked).map((a) => a.title))

  // Resume music on the first user gesture if it was left enabled.
  if (settings.music) {
    const kick = () => {
      music.start()
      window.removeEventListener('pointerdown', kick)
    }
    window.addEventListener('pointerdown', kick, { once: true })
  }
})

window.addEventListener('pointerdown', onUiPointerDown, { capture: true })

onBeforeUnmount(() => {
  music.stop()
  window.removeEventListener('pointerdown', onUiPointerDown, { capture: true })
})
</script>

<template>
  <div class="app-shell">
    <main class="app-screen">
      <router-view v-slot="{ Component }">
        <Transition name="view" mode="out-in">
          <component :is="Component" :key="active" />
        </Transition>
      </router-view>
    </main>

    <SgBottomNav :items="items" :active="active" @select="onNav" />

    <CaptureSheet v-if="captureOpen" @close="captureOpen = false" @caught="onCaught" />

    <LevelUpOverlay v-if="levelUpTo !== null" :level="levelUpTo" @close="levelUpTo = null" />

    <OnboardingOverlay v-if="showOnboarding" @done="finishOnboarding" />

    <SgToastHost />
  </div>
</template>

<style scoped>
/* Screen-to-screen route transition — a gentle fade + lift so tab switches feel
   continuous rather than snapping. Views are position:absolute, and out-in keeps
   only one mounted at a time, so they never overlap mid-transition. */
.view-enter-active {
  transition: opacity 0.26s ease, transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.view-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.view-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.view-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .view-enter-active,
  .view-leave-active {
    transition: opacity 0.12s ease;
  }
  .view-enter-from,
  .view-leave-to {
    transform: none;
  }
}
</style>
