<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import SgIcon from '@/components/SgIcon.vue'

const toasts = useToastStore()
</script>

<template>
  <Teleport to=".app-shell">
    <div class="toasts" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <button
          v-for="t in toasts.toasts"
          :key="t.id"
          class="toast"
          :style="{ '--_c': t.color ?? 'var(--brand)' }"
          @click="toasts.dismiss(t.id)"
        >
          <span class="toast__medal"><SgIcon :name="t.icon ?? 'award'" :size="24" /></span>
          <span class="toast__body">
            <span v-if="t.eyebrow" class="toast__eyebrow">{{ t.eyebrow }}</span>
            <span class="toast__title">{{ t.title }}</span>
            <span v-if="t.description" class="toast__desc">{{ t.description }}</span>
          </span>
        </button>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.toasts {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  left: 12px;
  right: 12px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  text-align: left;
  border: none;
  cursor: pointer;
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--_c) 35%, transparent), var(--shadow-xl);
  padding: 12px 14px;
}
.toast__medal {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--_c);
  background: radial-gradient(
    circle at 50% 35%,
    color-mix(in srgb, var(--_c) 30%, white),
    color-mix(in srgb, var(--_c) 12%, white)
  );
  box-shadow: inset 0 0 0 2px var(--_c), 0 4px 10px color-mix(in srgb, var(--_c) 30%, transparent);
}
.toast__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.toast__eyebrow {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--fw-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--_c);
}
.toast__title {
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.2;
}
.toast__desc { font-size: 12px; color: var(--text-muted); line-height: 1.3; }

.toast-enter-active,
.toast-leave-active { transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.32s ease; }
.toast-enter-from { transform: translateY(-16px) scale(0.96); opacity: 0; }
.toast-leave-to { transform: translateY(-8px) scale(0.98); opacity: 0; }
.toast-move { transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1); }

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move { transition: opacity 0.2s ease; }
  .toast-enter-from,
  .toast-leave-to { transform: none; }
}
</style>
