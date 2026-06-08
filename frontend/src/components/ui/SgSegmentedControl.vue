<script setup lang="ts" generic="T extends string">
import SgIcon from '@/components/SgIcon.vue'

defineProps<{
  options: { value: T; label?: string; icon?: string }[]
  modelValue: T
  fullWidth?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: T] }>()
</script>

<template>
  <div class="sg-seg" :class="{ 'sg-seg--full': fullWidth }" role="tablist">
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
  display: inline-flex;
  background: var(--surface-sunken);
  border-radius: var(--radius-pill);
  padding: 4px;
  gap: 2px;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.sg-seg--full { display: flex; width: 100%; }
.sg-seg__btn {
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
  transition: color 0.12s ease, background 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;

  svg { width: 16px; height: 16px; }
  &:hover:not(.is-active) { color: var(--text-primary); }
  &:focus-visible { box-shadow: var(--focus-ring); }
}
.sg-seg__btn.is-active { background: var(--surface-card); color: var(--text-brand); box-shadow: var(--shadow-sm); }
</style>
