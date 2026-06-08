<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import SgButton from '@/components/ui/SgButton.vue'
import SgIcon from '@/components/SgIcon.vue'

const emit = defineEmits<{ close: []; caught: [] }>()

const game = useGameStore()

type Phase = 'aim' | 'scan' | 'reward'
const phase = ref<Phase>('aim')

// In production this comes from the OCR result; here it's a demo tram from the
// catalog (Škoda 15T). See docs/ARCHITECTURE.md (OCR pipeline).
const vehicle = { cat: 'tram' as const, type: '15T', number: '9325', operator: 'DPP' }
const reward = 100

const corners = ['nw', 'ne', 'sw', 'se'] as const
let scanTimer: ReturnType<typeof setTimeout> | undefined

watch(phase, (p) => {
  if (p === 'scan') {
    scanTimer = setTimeout(() => (phase.value = 'reward'), 1700)
  }
})

onBeforeUnmount(() => clearTimeout(scanTimer))

async function addToPark() {
  await game.collectByModel(vehicle.cat, vehicle.type)
  emit('caught')
  emit('close')
}
</script>

<template>
  <div class="capture" :class="{ 'capture--reward': phase === 'reward' }" role="dialog" aria-modal="true">
    <div class="capture__bar">
      <span class="capture__heading">{{ phase === 'reward' ? 'Nový objev!' : 'Vyfoť vozidlo' }}</span>
      <button class="capture__close" aria-label="Zavřít" @click="emit('close')"><SgIcon name="x" :size="18" /></button>
    </div>

    <template v-if="phase !== 'reward'">
      <div class="capture__view">
        <div class="capture__backdrop" />
        <SgIcon class="capture__ghost" :name="vehicle.cat === 'tram' ? 'tram-front' : 'tram-front'" :size="130" />
        <div class="capture__reticle">
          <span v-for="c in corners" :key="c" class="capture__corner" :class="`capture__corner--${c}`" />
          <div v-if="phase === 'scan'" class="capture__scanline sg-scan-line" />
        </div>
        <div v-if="phase === 'scan'" class="capture__status">
          <SgIcon name="scan-line" :size="16" /> Čtu evidenční číslo…
        </div>
      </div>
      <div class="capture__actions">
        <SgButton
          variant="primary"
          size="lg"
          full-width
          leading-icon="camera"
          :disabled="phase === 'scan'"
          @click="phase = 'scan'"
        >
          {{ phase === 'scan' ? 'Skenuji…' : 'Vyfotit' }}
        </SgButton>
      </div>
    </template>

    <div v-else class="capture__reward">
      <div class="capture__pop sg-reward-pop">
        <div class="capture__pop-inner"><SgIcon name="tram-front" :size="44" /></div>
      </div>
      <div class="eyebrow capture__tag">Nový objev!</div>
      <div class="capture__code">{{ vehicle.type }} #{{ vehicle.number }}</div>
      <div class="capture__sub">Tramvaj · {{ vehicle.operator }}</div>
      <div class="capture__xp"><SgIcon name="zap" :size="20" /> +{{ reward }} XP</div>
      <SgButton variant="reward" size="lg" full-width leading-icon="plus" @click="addToPark">
        Přidat do parku
      </SgButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.capture {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  background: #0b0f14;

  &--reward { background: var(--surface-night); }
}
.capture__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  padding-top: max(14px, env(safe-area-inset-top));
  color: #fff;
}
.capture__heading { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 15px; }
.capture__close {
  background: rgba(255, 255, 255, 0.14);
  border: none;
  color: #fff;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.capture__view { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.capture__backdrop { position: absolute; inset: 0; background: radial-gradient(circle at 50% 42%, #2a3340, #0b0f14 75%); }
.capture__ghost { position: relative; color: rgba(255, 255, 255, 0.18); }
.capture__reticle {
  position: absolute;
  width: 230px;
  height: 150px;
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-radius: 18px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.35);
}
.capture__corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 6px;
}
.capture__corner--nw { top: -3px; left: -3px; border-top: 4px solid var(--brand); border-left: 4px solid var(--brand); }
.capture__corner--ne { top: -3px; right: -3px; border-top: 4px solid var(--brand); border-right: 4px solid var(--brand); }
.capture__corner--sw { bottom: -3px; left: -3px; border-bottom: 4px solid var(--brand); border-left: 4px solid var(--brand); }
.capture__corner--se { bottom: -3px; right: -3px; border-bottom: 4px solid var(--brand); border-right: 4px solid var(--brand); }
.capture__scanline {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--brand);
  box-shadow: 0 0 12px var(--brand);
  animation: sg-scan 1.5s ease-in-out infinite;
}
.capture__status {
  position: absolute;
  bottom: 24px;
  color: #fff;
  font-family: var(--font-mono);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.capture__actions { padding: 18px 20px 26px; padding-bottom: max(26px, env(safe-area-inset-bottom)); }

.capture__reward {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px 30px;
  text-align: center;
}
.capture__pop {
  width: 118px;
  height: 118px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--cat-tram) 22%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--cat-tram) 12%, transparent);
}
.capture__pop-inner {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--cat-tram);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.capture__tag { color: var(--gold-300); margin-bottom: 8px; }
.capture__code { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 30px; color: #fff; letter-spacing: -0.01em; }
.capture__sub { color: var(--text-on-night-muted); margin-top: 4px; margin-bottom: 18px; }
.capture__xp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 20px;
  color: #4a2d00;
  background: var(--xp);
  padding: 8px 18px;
  border-radius: var(--radius-pill);
  margin-bottom: 30px;
}

@media (prefers-reduced-motion: reduce) {
  .capture__scanline { animation: none; top: 50%; }
}
</style>
