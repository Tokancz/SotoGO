<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import SgAvatar from '@/components/ui/SgAvatar.vue'
import SgBadge from '@/components/ui/SgBadge.vue'
import SgIcon from '@/components/SgIcon.vue'

defineProps<{ title: string; subtitle?: string }>()

const game = useGameStore()
const player = computed(() => game.player)
const xpLabel = computed(() => `${player.value.xpTotal.toLocaleString('cs-CZ')} XP`)
</script>

<template>
  <header class="topbar">
    <SgAvatar :src="player.avatarUrl ?? undefined" :name="player.name" :size="38" :level="player.level" />
    <div class="topbar__titles">
      <h1 class="topbar__title">{{ title }}</h1>
      <p v-if="subtitle" class="topbar__subtitle">{{ subtitle }}</p>
    </div>
    <div class="topbar__meta">
      <span class="topbar__streak"><SgIcon name="flame" :size="15" />{{ player.streak }}</span>
      <SgBadge tone="gold" variant="solid" mono>{{ xpLabel }}</SgBadge>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  background: var(--surface-card);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 5;
}
.topbar__titles { flex: 1; min-width: 0; }
.topbar__title { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 18px; line-height: 1.1; color: var(--text-primary); }
.topbar__subtitle { font-size: 12px; color: var(--text-muted); }
.topbar__meta { display: flex; align-items: center; gap: 8px; }
.topbar__streak {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 13px;
  color: var(--gold-700);
  background: var(--xp-subtle);
  padding: 5px 10px;
  border-radius: var(--radius-pill);
}
</style>
