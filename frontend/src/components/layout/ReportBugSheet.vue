<script setup lang="ts">
import { ref } from 'vue'
import { AxiosError } from 'axios'
import { reportApi } from '@/services/report'
import { useDialog } from '@/composables/useDialog'
import SgInput from '@/components/ui/SgInput.vue'
import SgButton from '@/components/ui/SgButton.vue'
import SgIcon from '@/components/SgIcon.vue'

const emit = defineEmits<{ close: [] }>()

const panelEl = ref<HTMLElement | null>(null)
useDialog(panelEl, { onClose: () => emit('close') })

const title = ref('')
const description = ref('')
const state = ref<'form' | 'sending' | 'done' | 'error'>('form')
const errorMsg = ref('')
const issueUrl = ref('')

async function submit() {
  if (state.value === 'sending') return
  if (!description.value.trim()) {
    errorMsg.value = 'Popiš prosím, co se stalo.'
    state.value = 'error'
    return
  }
  state.value = 'sending'
  errorMsg.value = ''
  try {
    const res = await reportApi.send(description.value.trim(), title.value.trim() || undefined)
    issueUrl.value = res.url
    state.value = 'done'
  } catch (e) {
    errorMsg.value =
      e instanceof AxiosError && e.response?.data?.error
        ? e.response.data.error
        : 'Odeslání selhalo, zkus to prosím později.'
    state.value = 'error'
  }
}
</script>

<template>
  <div class="rb" @click.self="emit('close')">
    <div ref="panelEl" class="rb__panel" role="dialog" aria-modal="true" aria-labelledby="rb-title">
      <div class="rb__handle" aria-hidden="true" />

      <template v-if="state === 'done'">
        <div class="rb__done">
          <div class="rb__check"><SgIcon name="check" :size="30" /></div>
          <h2 id="rb-title" class="rb__title">Díky za nahlášení!</h2>
          <p class="rb__sub">Issue byl vytvořen na GitHubu.</p>
          <a class="rb__link" :href="issueUrl" target="_blank" rel="noopener">Zobrazit issue</a>
          <SgButton variant="primary" size="lg" full-width @click="emit('close')">Zavřít</SgButton>
        </div>
      </template>

      <template v-else>
        <div class="rb__head">
          <div class="rb__icon"><SgIcon name="bug" :size="20" /></div>
          <div>
            <h2 id="rb-title" class="rb__title">Nahlásit chybu</h2>
            <p class="rb__sub">Popiš, co nefunguje — vytvoříme issue na GitHubu.</p>
          </div>
        </div>

        <SgInput v-model="title" label="Předmět (nepovinné)" placeholder="Krátký popis" />

        <label class="rb__label" for="rb-desc">Popis</label>
        <textarea
          id="rb-desc"
          v-model="description"
          class="rb__textarea"
          rows="5"
          placeholder="Co se stalo? Co jsi dělal/a před tím?"
        />

        <p v-if="state === 'error'" class="rb__error">{{ errorMsg }}</p>

        <div class="rb__actions">
          <SgButton variant="ghost" size="lg" @click="emit('close')">Zrušit</SgButton>
          <SgButton
            variant="primary"
            size="lg"
            full-width
            :disabled="state === 'sending'"
            @click="submit"
          >
            {{ state === 'sending' ? 'Odesílám…' : 'Odeslat' }}
          </SgButton>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rb {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: rgba(11, 15, 20, 0.45);
}
.rb__panel {
  background: var(--surface-card);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 10px 18px 24px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rb__handle { width: 40px; height: 5px; border-radius: 999px; background: var(--border-strong); margin: 0 auto 4px; }

.rb__head { display: flex; align-items: flex-start; gap: 12px; }
.rb__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  color: var(--danger-500);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.rb__title { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 18px; margin: 0; color: var(--text-primary); }
.rb__sub { font-size: 13px; color: var(--text-muted); margin: 2px 0 0; }

.rb__label { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 13px; color: var(--text-secondary); margin-bottom: -6px; }
.rb__textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: vertical;
  background: var(--surface-card);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 0 1.5px var(--border-default);
  padding: 12px 14px;
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--text-primary);
  &:focus { box-shadow: inset 0 0 0 2px var(--brand), var(--focus-ring); }
  &::placeholder { color: var(--text-muted); }
}

.rb__error {
  background: var(--danger-soft);
  color: var(--danger-500);
  font-size: 13px;
  font-weight: var(--fw-medium);
  padding: 9px 12px;
  border-radius: var(--radius-md);
  margin: 0;
}
.rb__actions { display: flex; gap: 10px; }

.rb__done { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 8px 0 4px; }
.rb__check {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--success-soft);
  color: var(--brand);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.rb__link { color: var(--text-brand); font-weight: var(--fw-semibold); font-size: 14px; margin-bottom: 10px; }
</style>
