<script setup lang="ts">
import SgIcon from '@/components/SgIcon.vue'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'reward' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
    leadingIcon?: string
    trailingIcon?: string
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)
</script>

<template>
  <button
    :type="type"
    class="sg-btn"
    :class="[`sg-btn--${variant}`, `sg-btn--${size}`, { 'sg-btn--full': fullWidth }]"
    :disabled="disabled"
  >
    <span v-if="leadingIcon || $slots.leading" class="sg-btn__icon">
      <slot name="leading"><SgIcon v-if="leadingIcon" :name="leadingIcon" /></slot>
    </span>
    <slot />
    <span v-if="trailingIcon || $slots.trailing" class="sg-btn__icon">
      <slot name="trailing"><SgIcon v-if="trailingIcon" :name="trailingIcon" /></slot>
    </span>
  </button>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

.sg-btn {
  --_depth: var(--press-depth, 4px);
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  border: none;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
  transition: transform 0.12s cubic-bezier(0.3, 1.2, 0.5, 1), box-shadow 0.12s ease, background 0.12s ease;
  user-select: none;

  &:focus-visible { box-shadow: var(--focus-ring); }
}

.sg-btn__icon {
  display: inline-flex;
  svg { width: 1.15em; height: 1.15em; display: block; }
}

.sg-btn--sm { height: 36px; padding: 0 14px; font-size: 14px; border-radius: var(--radius-sm); }
.sg-btn--md { height: 44px; padding: 0 18px; font-size: 15px; }
.sg-btn--lg { height: 54px; padding: 0 24px; font-size: 17px; }
.sg-btn--full { width: 100%; }

.sg-btn--primary {
  background: var(--brand);
  color: var(--text-on-brand);
  @include press-3d(var(--brand-shadow), var(--_depth));
  &:hover { background: var(--brand-hover); }
}

.sg-btn--reward {
  background: var(--xp);
  color: #4a2d00;
  @include press-3d(var(--xp-shadow), var(--_depth));
  &:hover { background: var(--gold-400); }
}

.sg-btn--danger {
  background: var(--danger-500);
  color: #fff;
  @include press-3d(#9c160f, var(--_depth));
}

.sg-btn--secondary {
  background: var(--surface-card);
  color: var(--text-primary);
  box-shadow: inset 0 0 0 1px var(--border-default), var(--shadow-sm);
  &:hover { background: var(--surface-sunken); }
  &:active { transform: translateY(1px); }
}

.sg-btn--ghost {
  background: transparent;
  color: var(--text-brand);
  &:hover { background: var(--brand-subtle); }
}

.sg-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
  pointer-events: none;
}
</style>
