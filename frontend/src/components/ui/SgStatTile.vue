<script setup lang="ts">
import { computed } from 'vue'
import SgIcon from '@/components/SgIcon.vue'

const props = withDefaults(
  defineProps<{
    value: string | number
    label?: string
    icon?: string
    color?: string
    center?: boolean
  }>(),
  { color: 'var(--brand)', center: false },
)

const iconStyle = computed(() => ({
  background: `color-mix(in srgb, ${props.color} 14%, white)`,
  color: props.color,
}))
</script>

<template>
  <div class="sg-stat" :class="{ 'sg-stat--center': center }">
    <div class="sg-stat__top">
      <span v-if="icon" class="sg-stat__icon" :style="iconStyle">
        <SgIcon :name="icon" />
      </span>
      <span class="sg-stat__value">{{ value }}</span>
    </div>
    <span v-if="label" class="sg-stat__label">{{ label }}</span>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

.sg-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 16px;
  min-width: 0;
  @include soft-card;
}
.sg-stat__top { display: flex; align-items: center; gap: 8px; }
.sg-stat__icon {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  @include flex-center;
  flex: none;
  svg { width: 18px; height: 18px; }
}
.sg-stat__value {
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 28px;
  line-height: 1;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.sg-stat__label { font-size: 12px; color: var(--text-muted); font-weight: var(--fw-medium); }
.sg-stat--center { align-items: center; text-align: center; }
</style>
