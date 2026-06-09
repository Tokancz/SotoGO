<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useToastStore } from '@/stores/toast'
import SgBottomNav, { type NavItem } from '@/components/game/SgBottomNav.vue'
import CaptureSheet from '@/components/layout/CaptureSheet.vue'
import SgToastHost from '@/components/ui/SgToastHost.vue'

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
    if (seenUnlocked.value === null) return // not seeded yet — ignore until ready
    for (const a of unlocked) {
      if (seenUnlocked.value.has(a.title)) continue
      seenUnlocked.value.add(a.title)
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
  game.ensureCatalog()
  game.loadQuests()
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
        <component :is="Component" />
      </router-view>
    </main>

    <SgBottomNav :items="items" :active="active" @select="onNav" />

    <CaptureSheet v-if="captureOpen" @close="captureOpen = false" @caught="onCaught" />

    <SgToastHost />
  </div>
</template>
