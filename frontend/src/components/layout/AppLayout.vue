<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import SgBottomNav, { type NavItem } from '@/components/game/SgBottomNav.vue'
import CaptureSheet from '@/components/layout/CaptureSheet.vue'

const route = useRoute()
const router = useRouter()
const game = useGameStore()

const captureOpen = ref(false)

const dailyOpen = computed(() => game.challenges.length - game.dailyDoneCount)

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

onMounted(() => {
  game.ensureCatalog()
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
  </div>
</template>
