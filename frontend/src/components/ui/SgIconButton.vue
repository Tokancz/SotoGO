<script setup lang="ts">
import SgIcon from '@/components/SgIcon.vue'

withDefaults(
  defineProps<{
    icon?: string
    variant?: 'ghost' | 'solid' | 'soft' | 'surface' | 'night'
    size?: 'sm' | 'md' | 'lg'
    round?: boolean
    disabled?: boolean
    ariaLabel?: string
  }>(),
  { variant: 'ghost', size: 'md', round: false },
)
</script>

<template>
  <button
    type="button"
    class="sg-iconbtn"
    :class="[`sg-iconbtn--${variant}`, `sg-iconbtn--${size}`, { 'sg-iconbtn--round': round }]"
    :disabled="disabled"
    :aria-label="ariaLabel"
  >
    <slot><SgIcon v-if="icon" :name="icon" /></slot>
  </button>
</template>

<style lang="scss" scoped>
.sg-iconbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
  color: var(--text-primary);
  background: transparent;

  svg { width: 1.3em; height: 1.3em; display: block; }
  &:focus-visible { box-shadow: var(--focus-ring); }
  &:active { transform: scale(0.92); }
  &:disabled { opacity: 0.4; pointer-events: none; }
}

.sg-iconbtn--round { border-radius: var(--radius-pill); }
.sg-iconbtn--sm { width: 36px; height: 36px; font-size: 16px; }
.sg-iconbtn--md { width: 44px; height: 44px; font-size: 20px; }
.sg-iconbtn--lg { width: 56px; height: 56px; font-size: 24px; }

.sg-iconbtn--solid {
  background: var(--brand);
  color: #fff;
  box-shadow: var(--shadow-brand);
  &:hover { background: var(--brand-hover); }
}
.sg-iconbtn--soft {
  background: var(--brand-subtle);
  color: var(--text-brand);
  &:hover { background: var(--green-100); }
}
.sg-iconbtn--ghost:hover { background: var(--surface-sunken); }
.sg-iconbtn--surface { background: var(--surface-card); color: var(--text-primary); box-shadow: var(--shadow-md); }
.sg-iconbtn--night {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  backdrop-filter: blur(8px);
  &:hover { background: rgba(255, 255, 255, 0.2); }
}
</style>
