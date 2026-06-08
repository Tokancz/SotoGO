<script setup lang="ts">
defineProps<{
  modelValue?: boolean
  label?: string
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <label class="sg-switch">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="sg-switch__track"><span class="sg-switch__thumb" /></span>
    <span v-if="label" class="sg-switch__label">{{ label }}</span>
  </label>
</template>

<style lang="scss" scoped>
.sg-switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.sg-switch__track {
  width: 48px;
  height: 28px;
  border-radius: var(--radius-pill);
  background: var(--slate-300);
  position: relative;
  flex: none;
  transition: background 0.18s ease;
}
.sg-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform 0.18s cubic-bezier(0.3, 1.3, 0.6, 1);
}
.sg-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.sg-switch input:checked + .sg-switch__track { background: var(--brand); }
.sg-switch input:checked + .sg-switch__track .sg-switch__thumb { transform: translateX(20px); }
.sg-switch input:focus-visible + .sg-switch__track { box-shadow: var(--focus-ring); }
.sg-switch input:disabled + .sg-switch__track { opacity: 0.5; }
.sg-switch__label { font-size: 15px; color: var(--text-primary); font-weight: var(--fw-medium); }
</style>
