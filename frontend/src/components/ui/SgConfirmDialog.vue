<script setup lang="ts">
// Reusable confirmation modal — replaces the native confirm() for destructive
// actions. Mount it with v-if while it should be visible; it teleports into the
// app shell, traps focus, and closes on Escape / backdrop click.
import { ref } from 'vue'
import { useDialog } from '@/composables/useDialog'
import SgButton from '@/components/ui/SgButton.vue'
import SgIcon from '@/components/SgIcon.vue'

const props = withDefaults(
  defineProps<{
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    icon?: string
    /** Style the confirm action as destructive (red). */
    danger?: boolean
    /** Disable the buttons while the action runs. */
    loading?: boolean
  }>(),
  { confirmLabel: 'Potvrdit', cancelLabel: 'Zrušit', danger: false, loading: false },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const panelEl = ref<HTMLElement | null>(null)
useDialog(panelEl, { onClose: () => !props.loading && emit('cancel') })
</script>

<template>
  <Teleport to=".app-shell">
    <div class="confirm" @click.self="!loading && emit('cancel')">
      <div
        ref="panelEl"
        class="confirm__panel"
        :class="{ 'confirm__panel--danger': danger }"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div v-if="icon" class="confirm__icon"><SgIcon :name="icon" :size="26" /></div>
        <h2 id="confirm-title" class="confirm__title">{{ title }}</h2>
        <p v-if="message" class="confirm__message">{{ message }}</p>
        <div class="confirm__actions">
          <SgButton variant="secondary" size="lg" full-width :disabled="loading" @click="emit('cancel')">
            {{ cancelLabel }}
          </SgButton>
          <SgButton
            :variant="danger ? 'danger' : 'primary'"
            size="lg"
            full-width
            :disabled="loading"
            @click="emit('confirm')"
          >
            {{ loading ? 'Pracuji…' : confirmLabel }}
          </SgButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.confirm {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(11, 15, 20, 0.5);
}
.confirm__panel {
  width: 100%;
  max-width: 360px;
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  padding: 22px 20px 18px;
  box-shadow: var(--shadow-xl);
  text-align: center;
}
.confirm__icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  color: var(--brand);
  background: color-mix(in srgb, var(--brand) 12%, transparent);
}
.confirm__panel--danger .confirm__icon {
  color: var(--danger-500);
  background: var(--danger-soft);
}
.confirm__title { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 19px; }
.confirm__message {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
}
.confirm__actions { display: flex; gap: 10px; margin-top: 20px; }
</style>
