<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value?: number
    max?: number
    color?: string
    height?: number
    label?: string
    valueText?: string
    showValue?: boolean
  }>(),
  { value: 0, max: 100, color: 'var(--brand)', height: 10, showValue: false },
)

const pct = computed(() => Math.max(0, Math.min(100, (props.value / props.max) * 100)))
</script>

<template>
  <div class="sg-progress">
    <div v-if="label || showValue" class="sg-progress__head">
      <span v-if="label" class="sg-progress__label">{{ label }}</span>
      <span v-if="showValue" class="sg-progress__value">{{ valueText ?? `${value} / ${max}` }}</span>
    </div>
    <div
      class="sg-progress__track"
      :style="{ height: `${height}px` }"
      role="progressbar"
      :aria-valuenow="value"
      :aria-valuemax="max"
    >
      <div class="sg-progress__fill" :style="{ width: `${pct}%`, background: color }" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sg-progress { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.sg-progress__head { display: flex; justify-content: space-between; align-items: baseline; }
.sg-progress__label { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 13px; color: var(--text-secondary); }
.sg-progress__value { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.sg-progress__track {
  width: 100%;
  background: var(--surface-sunken);
  border-radius: var(--radius-pill);
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(20, 26, 33, 0.08);
}
.sg-progress__fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 45%;
    border-radius: inherit;
    background: linear-gradient(rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0));
  }
}
</style>
