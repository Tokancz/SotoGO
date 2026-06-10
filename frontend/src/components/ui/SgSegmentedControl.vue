<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'
import SgIcon from '@/components/SgIcon.vue'

const props = defineProps<{
  options: { value: T; label?: string; icon?: string }[]
  modelValue: T
  fullWidth?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: T] }>()

// Drives the sliding thumb: which segment is active, and how many there are.
const activeIndex = computed(() => {
  const i = props.options.findIndex((o) => o.value === props.modelValue)
  return i < 0 ? 0 : i
})
</script>

<template>
  <div
    class="sg-seg"
    :class="{ 'sg-seg--full': fullWidth }"
    :style="{ '--seg-n': options.length, '--seg-i': activeIndex }"
    role="tablist"
  >
    <span class="sg-seg__thumb" aria-hidden="true" />
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="tab"
      :aria-selected="opt.value === modelValue"
      class="sg-seg__btn"
      :class="{ 'is-active': opt.value === modelValue }"
      @click="$emit('update:modelValue', opt.value)"
    >
      <SgIcon v-if="opt.icon" :name="opt.icon" />
      <span v-if="opt.label">{{ opt.label }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.sg-seg {
  position: relative;
  display: inline-flex;
  background: var(--surface-sunken);
  border-radius: var(--radius-pill);
  padding: 4px;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.sg-seg--full { display: flex; width: 100%; }

// The pill that physically glides to the active segment.
.sg-seg__thumb {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc((100% - 8px) / var(--seg-n, 1));
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  box-shadow: var(--shadow-sm);
  transform: translateX(calc(var(--seg-i, 0) * 100%));
  transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1);
  pointer-events: none;
}

.sg-seg__btn {
  position: relative;
  z-index: 1;
  flex: 1;
  border: none;
  cursor: pointer;
  background: transparent;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 14px;
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: color 0.18s ease;
  white-space: nowrap;

  svg { width: 16px; height: 16px; transition: transform 0.18s cubic-bezier(0.3, 1.3, 0.6, 1); }
  &:hover:not(.is-active) { color: var(--text-primary); }
  &:focus-visible { box-shadow: var(--focus-ring); }
}
.sg-seg__btn.is-active { color: var(--text-brand); }
.sg-seg__btn.is-active svg { transform: scale(1.12); }

@media (prefers-reduced-motion: reduce) {
  .sg-seg__thumb { transition: none; }
  .sg-seg__btn svg { transition: none; }
}
</style>
