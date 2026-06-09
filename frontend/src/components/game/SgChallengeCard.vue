<script setup lang="ts">
import { computed } from 'vue'
import SgIcon from '@/components/SgIcon.vue'

const props = withDefaults(
  defineProps<{
    title: string
    icon?: string
    color?: string
    value?: number
    max?: number
    reward?: number
    done?: boolean
    /** Whether the reward has already been collected. */
    claimed?: boolean
    /** Show a claim button while complete + unclaimed. */
    claimable?: boolean
    /** Disable the claim button while a claim is in flight. */
    claiming?: boolean
  }>(),
  { color: 'var(--brand)', value: 0, max: 1, done: false, claimed: false, claimable: false },
)

const emit = defineEmits<{ claim: [] }>()

const pct = computed(() => Math.max(0, Math.min(100, (props.value / props.max) * 100)))
const complete = computed(() => props.done || props.value >= props.max)
const showClaim = computed(() => props.claimable && complete.value && !props.claimed)
</script>

<template>
  <div class="sg-quest" :class="{ 'sg-quest--done': complete }" :style="{ '--_c': color }">
    <span class="sg-quest__icon">
      <SgIcon :name="complete ? 'check' : icon ?? 'target'" />
    </span>
    <span class="sg-quest__body">
      <span class="sg-quest__top">
        <span class="sg-quest__title">{{ title }}</span>
        <span v-if="reward != null" class="sg-quest__reward"><SgIcon name="zap" />+{{ reward }} XP</span>
      </span>
      <span class="sg-quest__progrow">
        <template v-if="showClaim">
          <button class="sg-quest__claim" :disabled="claiming" @click="emit('claim')">
            <SgIcon name="gift" />{{ claiming ? 'Vyzvedávám…' : 'Vyzvednout odměnu' }}
          </button>
        </template>
        <template v-else-if="complete">
          <span class="sg-quest__check">
            <SgIcon name="check-circle-2" />{{ claimed ? 'Odměna získána' : 'Splněno' }}
          </span>
        </template>
        <template v-else>
          <span class="sg-quest__track"><span class="sg-quest__fill" :style="{ width: `${pct}%` }" /></span>
          <span class="sg-quest__count">{{ value }}/{{ max }}</span>
        </template>
      </span>
    </span>
  </div>
</template>

<style lang="scss" scoped>
.sg-quest {
  display: flex;
  align-items: center;
  gap: 13px;
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  box-shadow: inset 0 0 0 1px var(--border-subtle), var(--shadow-sm);
  padding: 13px 14px;
  width: 100%;
  text-align: left;
  font-family: var(--font-body);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.sg-quest__icon {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--_c, var(--brand)) 14%, white);
  color: var(--_c, var(--brand));
  svg { width: 22px; height: 22px; }
}
.sg-quest__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.sg-quest__top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.sg-quest__title { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 15px; color: var(--text-primary); line-height: 1.2; }
.sg-quest__reward {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 12px;
  color: var(--gold-700);
  background: var(--xp-subtle);
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  flex: none;
  svg { width: 12px; height: 12px; }
}
.sg-quest__progrow { display: flex; align-items: center; gap: 9px; }
.sg-quest__track {
  flex: 1;
  height: 8px;
  background: var(--surface-sunken);
  border-radius: var(--radius-pill);
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(20, 26, 33, 0.08);
}
.sg-quest__fill {
  display: block; // it's a <span> — without this the width/height are ignored
  height: 100%;
  min-width: 0;
  border-radius: var(--radius-pill);
  background: var(--_c, var(--brand));
  transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.sg-quest__count { font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); font-variant-numeric: tabular-nums; flex: none; }

.sg-quest--done {
  box-shadow: inset 0 0 0 1.5px var(--success-soft), var(--shadow-sm);
  .sg-quest__icon { background: var(--success-soft); color: var(--green-600); }
  .sg-quest__title { color: var(--text-secondary); }
}
.sg-quest__check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 12px;
  color: var(--green-600);
  flex: none;
  svg { width: 14px; height: 14px; }
}
.sg-quest__claim {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 12.5px;
  color: #4a2d00;
  background: var(--xp);
  padding: 6px 13px;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
  transition: transform 0.12s ease, filter 0.12s ease;
  svg { width: 14px; height: 14px; }
  &:active { transform: scale(0.96); }
  &:disabled { opacity: 0.6; cursor: default; }
}
</style>
