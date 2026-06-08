<script setup lang="ts">
import { computed } from 'vue'
import SgIcon from '@/components/SgIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    hint?: string
    error?: string
    leadingIcon?: string
    trailingIcon?: string
    mono?: boolean
    type?: string
    placeholder?: string
    id?: string
  }>(),
  { modelValue: '', type: 'text' },
)

defineEmits<{ 'update:modelValue': [value: string] }>()

const fieldId = computed(
  () => props.id ?? (props.label ? `f-${props.label.replace(/\s+/g, '-').toLowerCase()}` : undefined),
)
</script>

<template>
  <div class="sg-field">
    <label v-if="label" class="sg-field__label" :for="fieldId">{{ label }}</label>
    <div class="sg-input" :class="{ 'sg-input--error': error, 'sg-input--mono': mono }">
      <span v-if="leadingIcon || $slots.leading" class="sg-input__icon">
        <slot name="leading"><SgIcon v-if="leadingIcon" :name="leadingIcon" /></slot>
      </span>
      <input
        :id="fieldId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="trailingIcon || $slots.trailing" class="sg-input__icon">
        <slot name="trailing"><SgIcon v-if="trailingIcon" :name="trailingIcon" /></slot>
      </span>
    </div>
    <span v-if="error || hint" class="sg-field__hint" :class="{ 'sg-field__hint--error': error }">
      {{ error || hint }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.sg-field { display: flex; flex-direction: column; gap: 6px; }
.sg-field__label { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 13px; color: var(--text-secondary); }
.sg-input {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-card);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 0 1.5px var(--border-default);
  padding: 0 14px;
  height: 48px;
  transition: box-shadow 0.12s ease, background 0.12s ease;

  &:focus-within { box-shadow: inset 0 0 0 2px var(--brand), var(--focus-ring); }
}
.sg-input--error { box-shadow: inset 0 0 0 2px var(--danger-500); }
.sg-input__icon {
  color: var(--text-muted);
  display: inline-flex;
  svg { width: 20px; height: 20px; }
}
.sg-input input {
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  min-width: 0;
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--text-primary);

  &::placeholder { color: var(--text-muted); }
}
.sg-input--mono input { font-family: var(--font-mono); font-variant-numeric: tabular-nums; letter-spacing: 0.02em; }
.sg-field__hint { font-size: 12px; color: var(--text-muted); }
.sg-field__hint--error { color: var(--danger-500); }
</style>
