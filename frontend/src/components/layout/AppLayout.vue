<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useToastStore } from '@/stores/toast'
import SgBottomNav, { type NavItem } from '@/components/game/SgBottomNav.vue'
import SgToastHost from '@/components/ui/SgToastHost.vue'

// Loaded on demand when the camera opens — keeps Tesseract.js (OCR) and the
// capture UI out of the initial bundle.
const CaptureSheet = defineAsyncComponent(() => import('@/components/layout/CaptureSheet.vue'))

const route = useRoute()
const router = useRouter()
const game = useGameStore()
const toasts = useToastStore()

const captureOpen = ref(false)

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
  // Seed the achievement baseline only after progress (and catalog, which some
  // achievements count against) are in — so we don't announce pre-existing ones.
  await Promise.all([game.loadProgress(), game.ensureCatalog()])
  seenUnlocked.value = new Set(game.achievements.filter((a) => a.unlocked).map((a) => a.title))
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
