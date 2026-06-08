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
    size?: number
    unlocked?: boolean
    value?: number
    max?: number
  }>(),
  { tier: 'legendary', size: 72, unlocked: false },
)

const color = computed(() => TIER[props.tier])
const showCount = computed(() => !props.unlocked && props.value != null && props.max != null)
</script>

<template>
  <div
    class="sg-ach"
    :class="{ 'sg-ach--locked': !unlocked }"
    :style="{ '--_t': color, '--_sz': `${size}px` }"
  >
    <div class="sg-ach__medal">
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
  svg { width: 44%; height: 44%; }
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
