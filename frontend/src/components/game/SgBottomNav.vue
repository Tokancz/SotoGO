<script setup lang="ts">
import SgIcon from '@/components/SgIcon.vue'

export interface NavItem {
  id: string
  label: string
  icon: string
  /** Renders as the elevated center FAB (camera) instead of a tab. */
  fab?: boolean
  badge?: number
}

defineProps<{
  items: NavItem[]
  active: string
}>()

defineEmits<{ select: [id: string] }>()
</script>

<template>
  <nav class="sg-bnav" aria-label="Hlavní navigace">
    <template v-for="it in items" :key="it.id">
      <div v-if="it.fab" class="sg-bnav__fab-slot">
        <button type="button" class="sg-bnav__fab" :aria-label="it.label" @click="$emit('select', it.id)">
          <SgIcon :name="it.icon" />
        </button>
      </div>
      <button
        v-else
        type="button"
        class="sg-bnav__item"
        :class="{ 'is-active': it.id === active }"
        :aria-current="it.id === active ? 'page' : undefined"
        @click="$emit('select', it.id)"
      >
        <SgIcon :name="it.icon" />
        <span>{{ it.label }}</span>
        <span v-if="it.badge != null" class="sg-bnav__badge">{{ it.badge }}</span>
      </button>
    </template>
  </nav>
</template>

<style lang="scss" scoped>
.sg-bnav {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  background: var(--surface-card);
  height: var(--bottom-nav-h, 76px);
  box-shadow: 0 -2px 10px rgba(20, 26, 33, 0.07), inset 0 1px 0 var(--border-subtle);
  padding: 0 6px;
  padding-bottom: env(safe-area-inset-bottom);
  position: relative;
}
.sg-bnav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  height: 100%;
  color: var(--text-muted);
  position: relative;
  transition: color 0.12s ease;

  svg { width: 24px; height: 24px; transition: transform 0.15s cubic-bezier(0.3, 1.3, 0.6, 1); }
  span { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 11px; line-height: 1; }
  &:hover { color: var(--text-secondary); }
}
.sg-bnav__item.is-active {
  color: var(--brand);
  svg { transform: translateY(-1px) scale(1.08); }
}
.sg-bnav__badge {
  position: absolute;
  top: 12px;
  left: 50%;
  margin-left: 6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--radius-pill);
  background: var(--danger-500);
  color: #fff;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--surface-card);
}

.sg-bnav__fab-slot { flex: 1; display: flex; justify-content: center; position: relative; }
.sg-bnav__fab {
  position: absolute;
  bottom: 16px;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  cursor: pointer;
  background: var(--brand);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 0 var(--brand-shadow), var(--shadow-brand);
  border: 4px solid var(--surface-card);
  transition: transform 0.12s cubic-bezier(0.3, 1.2, 0.5, 1), box-shadow 0.12s ease, background 0.12s ease;

  svg { width: 28px; height: 28px; }
  &:hover { background: var(--brand-hover); }
  &:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--brand-shadow); }

  // A slow ping ring that quietly invites the player to capture — the core loop.
  &::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid var(--brand);
    pointer-events: none;
    animation: sg-ping 2.6s cubic-bezier(0.2, 0.8, 0.3, 1) infinite;
  }
  &:active::before { animation: none; }
}

@media (prefers-reduced-motion: reduce) {
  .sg-bnav__fab::before { animation: none; opacity: 0; }
}
</style>
