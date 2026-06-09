<script setup lang="ts">
import { computed } from 'vue'
import SgIcon from '@/components/SgIcon.vue'
import type { Rarity } from '@/types/game'

const TIER: Record<Rarity, string> = {
  common: 'var(--rarity-common)',
  rare: 'var(--rarity-rare)',
  epic: 'var(--rarity-epic)',
  legendary: 'var(--rarity-legendary)',
}

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    tier?: Rarity
    /** Accent color override; falls back to the tier color. */
    color?: string
    size?: number
    unlocked?: boolean
    value?: number
    max?: number
  }>(),
  { tier: 'legendary', size: 72, unlocked: false },
)

const color = computed(() => props.color ?? TIER[props.tier])
const showCount = computed(() => !props.unlocked && props.value != null && props.max != null)

// Progress ring wrapping the medal rim (locked achievements with progress).
const showRing = computed(() => showCount.value && (props.max ?? 0) > 0)
const ringStroke = computed(() => Math.max(3, Math.round(props.size * 0.06)))
const ringR = computed(() => (props.size - ringStroke.value) / 2)
const ringCirc = computed(() => 2 * Math.PI * ringR.value)
const ringOffset = computed(() => {
  const max = props.max ?? 0
  const pct = max > 0 ? Math.max(0, Math.min(1, (props.value ?? 0) / max)) : 0
  return ringCirc.value * (1 - pct)
})
</script>

<template>
  <div
    class="sg-ach"
    :class="{ 'sg-ach--locked': !unlocked }"
    :style="{ '--_t': color, '--_sz': `${size}px` }"
  >
    <div class="sg-ach__medal">
      <svg v-if="showRing" class="sg-ach__ring" :width="size" :height="size">
        <circle class="sg-ach__ring-track" :cx="size / 2" :cy="size / 2" :r="ringR" :stroke-width="ringStroke" />
        <circle
          class="sg-ach__ring-fill"
          :cx="size / 2"
          :cy="size / 2"
          :r="ringR"
          :stroke-width="ringStroke"
          :stroke="color"
          :stroke-dasharray="ringCirc"
          :stroke-dashoffset="ringOffset"
        />
      </svg>
      <SgIcon :name="unlocked ? (icon ?? 'award') : 'lock'" />
      <span v-if="unlocked" class="sg-ach__check"><SgIcon name="check" /></span>
      <span v-if="showCount" class="sg-ach__count">{{ value }}/{{ max }}</span>
    </div>
    <span v-if="title" class="sg-ach__title">{{ title }}</span>
    <span v-if="description" class="sg-ach__desc">{{ description }}</span>
  </div>
</template>

<style lang="scss" scoped>
.sg-ach { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; width: 100%; }
.sg-ach__medal {
  position: relative;
  width: var(--_sz, 72px);
  height: var(--_sz, 72px);
  flex: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle at 50% 35%,
    color-mix(in srgb, var(--_t) 30%, white),
    color-mix(in srgb, var(--_t) 12%, white)
  );
  box-shadow: inset 0 0 0 2.5px var(--_t), 0 6px 14px color-mix(in srgb, var(--_t) 28%, transparent);
  color: var(--_t);
  // The icon — scoped so it doesn't also shrink the progress-ring <svg>.
  > svg:not(.sg-ach__ring) { width: 44%; height: 44%; }
}
.sg-ach__ring {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg); // start the arc at 12 o'clock
  pointer-events: none;
  overflow: visible;
}
.sg-ach__ring-track { fill: none; stroke: var(--surface-sunken); }
.sg-ach__ring-fill {
  fill: none;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.sg-ach__count {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: var(--surface-card);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-weight: var(--fw-bold);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  border-radius: var(--radius-pill);
  padding: 2px 7px;
  box-shadow: var(--shadow-sm);
}
.sg-ach__check {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  background: var(--green-500);
  border: 2.5px solid var(--surface-card);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  svg { width: 13px; height: 13px; }
}
.sg-ach__title { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 13px; color: var(--text-primary); line-height: 1.2; }
.sg-ach__desc { font-size: 11px; color: var(--text-muted); line-height: 1.3; }

.sg-ach--locked {
  .sg-ach__medal { background: var(--surface-sunken); box-shadow: inset 0 0 0 2px var(--border-default); color: var(--slate-300); filter: none; }
  .sg-ach__title { color: var(--text-secondary); }
}
</style>
