<script setup lang="ts">
import { computed } from 'vue'
import SgIcon from '@/components/SgIcon.vue'

const props = withDefaults(
  defineProps<{
    selected?: boolean
    color?: string
    icon?: string
    count?: number
  }>(),
  { selected: false, color: 'var(--brand)' },
)

const style = computed(() => (props.selected ? { background: props.color } : undefined))
</script>

<template>
  <button
    type="button"
    class="sg-tag"
    :class="{ 'is-selected': selected }"
    :style="style"
    :aria-pressed="selected"
  >
    <SgIcon v-if="icon" :name="icon" />
    <slot />
    <span v-if="count != null" class="sg-tag__count">{{ count }}</span>
  </button>
</template>

<style lang="scss" scoped>
.sg-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 14px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  background: var(--surface-card);
  color: var(--text-secondary);
  box-shadow: inset 0 0 0 1px var(--border-default);
  transition: transform 0.1s ease, background 0.12s ease, box-shadow 0.12s ease, color 0.12s ease;
  white-space: nowrap;
  user-select: none;

  svg { width: 1.15em; height: 1.15em; }
  &:hover { background: var(--surface-sunken); }
  &:active { transform: scale(0.96); }
  &:focus-visible { box-shadow: var(--focus-ring); }
}

.sg-tag__count { font-family: var(--font-mono); font-size: 12px; opacity: 0.7; }

.sg-tag.is-selected {
  color: #fff;
  box-shadow: none;
  .sg-tag__count { opacity: 0.85; }
}
</style>
