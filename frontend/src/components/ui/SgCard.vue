<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    padding?: 'none' | 'sm' | 'md' | 'lg'
    variant?: 'raised' | 'bordered' | 'flat' | 'night'
    interactive?: boolean
    /** Optional colored frame (category / rarity). */
    accentColor?: string
  }>(),
  { padding: 'md', variant: 'raised' },
)

const accentStyle = computed(() =>
  props.accentColor ? { boxShadow: `inset 0 0 0 2px ${props.accentColor}` } : undefined,
)
</script>

<template>
  <div
    class="sg-card"
    :class="[
      `sg-card--p-${padding === 'none' ? '0' : padding}`,
      {
        'sg-card--bordered': variant === 'bordered',
        'sg-card--flat': variant === 'flat',
        'sg-card--night': variant === 'night',
        'sg-card--interactive': interactive,
      },
    ]"
    :style="accentStyle"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.sg-card {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: clip;
  transition: transform 0.15s cubic-bezier(0.3, 1, 0.5, 1), box-shadow 0.15s ease;
}

.sg-card--bordered { box-shadow: inset 0 0 0 1px var(--border-subtle), var(--shadow-sm); }
.sg-card--flat { box-shadow: inset 0 0 0 1px var(--border-default); }
.sg-card--night { background: var(--surface-night); color: var(--text-on-night); box-shadow: var(--shadow-lg); }
.sg-card--p-0 { padding: 0; }
.sg-card--p-sm { padding: 14px; }
.sg-card--p-md { padding: 18px; }
.sg-card--p-lg { padding: 24px; }

.sg-card--interactive {
  cursor: pointer;
  &:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
  &:active { transform: translateY(0); }
}
</style>
