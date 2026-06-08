<script setup lang="ts">
import { computed } from 'vue'
import SgIcon from '@/components/SgIcon.vue'

const props = withDefaults(
  defineProps<{
    tone?: 'brand' | 'gold' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'
    variant?: 'solid' | 'soft' | 'outline'
    size?: 'sm' | 'md'
    /** Custom color (category / rarity / metro line) — overrides the tone. */
    color?: string
    dot?: boolean
    icon?: string
    mono?: boolean
  }>(),
  { tone: 'neutral', variant: 'soft', size: 'md' },
)

// A custom color overrides the token tones via inline style (matches the design).
const customStyle = computed(() => {
  if (!props.color) return undefined
  if (props.variant === 'solid') return { background: props.color, color: '#fff' }
  if (props.variant === 'outline')
    return { boxShadow: `inset 0 0 0 1.5px ${props.color}`, color: props.color }
  return { background: `color-mix(in srgb, ${props.color} 14%, white)`, color: props.color }
})
</script>

<template>
  <span
    class="sg-badge"
    :class="[
      `sg-badge--${size}`,
      color ? '' : `sg-badge--${tone}`,
      `is-${variant}`,
      { 'sg-badge--outline': variant === 'outline' && !color, 'sg-badge--mono': mono },
    ]"
    :style="customStyle"
  >
    <span v-if="dot" class="sg-badge__dot" />
    <SgIcon v-if="icon" :name="icon" />
    <slot />
  </span>
</template>

<style lang="scss" scoped>
.sg-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  line-height: 1;
  border-radius: var(--radius-pill);
  white-space: nowrap;

  svg { width: 1.05em; height: 1.05em; }
}

.sg-badge--sm { font-size: 11px; padding: 4px 8px; }
.sg-badge--md { font-size: 13px; padding: 6px 11px; }
.sg-badge__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.sg-badge--mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }

.sg-badge--brand.is-solid { background: var(--brand); color: #fff; }
.sg-badge--brand.is-soft { background: var(--brand-subtle); color: var(--text-brand); }
.sg-badge--gold.is-solid { background: var(--xp); color: #4a2d00; }
.sg-badge--gold.is-soft { background: var(--xp-subtle); color: var(--gold-700); }
.sg-badge--neutral.is-solid { background: var(--slate-700); color: #fff; }
.sg-badge--neutral.is-soft { background: var(--surface-sunken); color: var(--text-secondary); }
.sg-badge--success.is-soft { background: var(--success-soft); color: var(--green-700); }
.sg-badge--warning.is-soft { background: var(--warning-soft); color: var(--gold-700); }
.sg-badge--danger.is-soft { background: var(--danger-soft); color: var(--danger-500); }
.sg-badge--danger.is-solid { background: var(--danger-500); color: #fff; }
.sg-badge--info.is-soft { background: var(--info-soft); color: var(--info-500); }
.sg-badge--outline { background: transparent; box-shadow: inset 0 0 0 1.5px var(--border-strong); color: var(--text-secondary); }
</style>
