<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    level: number | string
    value?: number
    max?: number
    size?: number
    stroke?: number
    color?: string
    label?: string
    subText?: string
  }>(),
  { value: 0, max: 100, size: 96, stroke: 9, color: 'var(--xp)', label: 'Level' },
)

const r = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * r.value)
const offset = computed(() => {
  const pct = Math.max(0, Math.min(1, props.value / props.max))
  return circumference.value * (1 - pct)
})
</script>

<template>
  <div class="sg-ring" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size">
      <circle class="sg-ring__track" :cx="size / 2" :cy="size / 2" :r="r" :stroke-width="stroke" />
      <circle
        class="sg-ring__fill"
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        :stroke-width="stroke"
        :stroke="color"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
      />
    </svg>
    <div class="sg-ring__center">
      <span v-if="label" class="sg-ring__eyebrow" :style="{ fontSize: `${size * 0.11}px` }">{{ label }}</span>
      <span class="sg-ring__value" :style="{ fontSize: `${size * 0.34}px` }">{{ level }}</span>
      <span v-if="subText" class="sg-ring__sub" :style="{ fontSize: `${size * 0.11}px` }">{{ subText }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sg-ring { position: relative; display: inline-flex; align-items: center; justify-content: center; flex: none; }
.sg-ring svg { transform: rotate(-90deg); display: block; }
.sg-ring__track { fill: none; stroke: var(--surface-sunken); }
.sg-ring__fill { fill: none; stroke-linecap: round; transition: stroke-dashoffset 0.7s cubic-bezier(0.2, 0.8, 0.2, 1); }
.sg-ring__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}
.sg-ring__eyebrow {
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  line-height: 1;
}
.sg-ring__value { font-family: var(--font-display); font-weight: var(--fw-bold); color: var(--text-primary); line-height: 1; font-variant-numeric: tabular-nums; }
.sg-ring__sub { font-family: var(--font-mono); color: var(--text-muted); font-variant-numeric: tabular-nums; line-height: 1; }
</style>
