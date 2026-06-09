<script setup lang="ts">
// Full-screen realtime tap-to-attack. The server starts the battle (stamping the
// clock) and resolves it authoritatively; this overlay just runs the tap loop and
// shows the outcome. Each tap deals the attacker's Attack to the defender's HP bar;
// drain it before the timer ends to win. We also cap our own tap rate to the
// server's `maxTapsPerSec` so the local HP bar matches what the server will credit.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import type { BattleResult, Rarity } from '@/types/game'
import SgIcon from '@/components/SgIcon.vue'
import SgProgressBar from '@/components/ui/SgProgressBar.vue'
import SgAvatar from '@/components/ui/SgAvatar.vue'

const props = defineProps<{
  stopId: string
  vehicleId: string
  gymName: string
  attackerName: string
  defenderName: string
  defenderRarity: Rarity
  holderName: string
}>()

const emit = defineEmits<{ finished: [result: BattleResult]; close: [] }>()

const game = useGameStore()

type Phase = 'starting' | 'fighting' | 'resolving' | 'done' | 'error'
const phase = ref<Phase>('starting')
const errorMsg = ref('')

const attack = ref(0)
const maxHp = ref(1)
const hp = ref(1)
const hits = ref(0)
const remainingMs = ref(0)
let durationMs = 0
let battleId = ''
let minTapGapMs = 0
let lastTapAt = 0
let endsAt = 0
let ticker: ReturnType<typeof setInterval> | undefined

const result = ref<BattleResult | null>(null)

const hpPct = computed(() => Math.max(0, Math.min(100, (hp.value / maxHp.value) * 100)))
const secondsLeft = computed(() => (remainingMs.value / 1000).toFixed(1))
const rarityColor = computed(() => `var(--rarity-${props.defenderRarity})`)

function stopTicker() {
  if (ticker) clearInterval(ticker)
  ticker = undefined
}

onMounted(async () => {
  try {
    const s = await game.startBattle(props.stopId, props.vehicleId)
    battleId = s.battleId
    attack.value = s.attackerAttack
    maxHp.value = s.defenderHp
    hp.value = s.defenderHp
    durationMs = s.durationMs
    minTapGapMs = 1000 / s.maxTapsPerSec
    remainingMs.value = durationMs
    endsAt = Date.now() + durationMs
    phase.value = 'fighting'
    ticker = setInterval(() => {
      remainingMs.value = Math.max(0, endsAt - Date.now())
      if (remainingMs.value <= 0) void finish()
    }, 80)
  } catch (err) {
    phase.value = 'error'
    errorMsg.value =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      'Bitvu se nepodařilo zahájit.'
  }
})

onBeforeUnmount(stopTicker)

function tap() {
  if (phase.value !== 'fighting') return
  // Respect the server's tap-rate cap — extra taps wouldn't count anyway.
  const now = Date.now()
  if (now - lastTapAt < minTapGapMs) return
  lastTapAt = now
  hits.value += 1
  hp.value = Math.max(0, hp.value - attack.value)
  if (hp.value <= 0) void finish()
}

async function finish() {
  if (phase.value !== 'fighting') return
  phase.value = 'resolving'
  stopTicker()
  try {
    const res = await game.resolveBattle(battleId, hits.value)
    result.value = res
    phase.value = 'done'
    emit('finished', res)
  } catch (err) {
    phase.value = 'error'
    errorMsg.value =
      (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      'Vyhodnocení bitvy selhalo.'
  }
}
</script>

<template>
  <div class="battle" role="dialog" aria-modal="true" aria-label="Bitva o gym">
    <header class="battle__head">
      <span class="battle__gym"><SgIcon name="award" :size="15" /> {{ gymName }}</span>
      <button class="battle__x" aria-label="Zavřít" @click="emit('close')"><SgIcon name="x" :size="20" /></button>
    </header>

    <p v-if="phase === 'starting'" class="battle__status">Připravuji bitvu…</p>

    <div v-else-if="phase === 'error'" class="battle__status battle__status--err">
      <SgIcon name="triangle-alert" :size="28" />
      <p>{{ errorMsg }}</p>
      <button class="battle__btn" @click="emit('close')">Zpět</button>
    </div>

    <template v-else>
      <!-- Defender -->
      <div class="battle__defender">
        <div class="battle__who">
          <span class="battle__code" :style="{ color: rarityColor }">{{ defenderName }}</span>
          <span class="battle__owner"><SgAvatar :name="holderName" :size="18" /> {{ holderName }}</span>
        </div>
        <SgProgressBar :value="hp" :max="maxHp" :color="rarityColor" :height="14" show-value
          :value-text="`${hp} / ${maxHp} HP`" />
      </div>

      <!-- Timer -->
      <div class="battle__timer" :class="{ 'battle__timer--low': remainingMs < 6000 }">
        <SgIcon name="timer" :size="16" />{{ secondsLeft }} s
      </div>

      <!-- Result overlay -->
      <div v-if="phase === 'done' && result" class="battle__result"
        :class="result.won ? 'battle__result--win' : 'battle__result--lose'">
        <SgIcon :name="result.won ? 'trophy' : 'shield'" :size="48" />
        <h2>{{ result.won ? 'Gym je tvůj!' : result.voided ? 'Obránce zmizel' : 'Obránce vydržel' }}</h2>
        <p v-if="result.won" class="battle__xp">+{{ result.awardedXp }} XP</p>
        <p v-else-if="!result.voided" class="battle__hint">Obránci zbývá {{ result.defenderHp }} HP. Zkus to znovu.</p>
        <button class="battle__btn" @click="emit('close')">Hotovo</button>
      </div>

      <!-- Tap target -->
      <button
        v-else
        class="battle__tap"
        :disabled="phase !== 'fighting'"
        @pointerdown.prevent="tap"
      >
        <span class="battle__taplabel">
          <SgIcon name="zap" :size="34" />
          <span>Ťukej!</span>
          <span class="battle__atk">−{{ attack }} / úder</span>
        </span>
      </button>

      <p class="battle__attacker">Útočíš s <strong>{{ attackerName }}</strong> · {{ hits }} úderů</p>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

.battle {
  // Fixed (not absolute) so it covers the whole viewport — including the bottom
  // nav — without needing a Teleport out of the map view.
  position: fixed;
  inset: 0;
  z-index: 50;
  background: radial-gradient(120% 80% at 50% 0%, #1a2330, var(--surface-night, #0b0f14));
  color: var(--text-on-night, #fff);
  display: flex;
  flex-direction: column;
  padding: max(14px, env(safe-area-inset-top)) 18px max(20px, env(safe-area-inset-bottom));
}
.battle__head { display: flex; align-items: center; justify-content: space-between; }
.battle__gym {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 15px;
  color: var(--xp);
}
.battle__x {
  border: none; background: rgba(255, 255, 255, 0.1); color: inherit;
  width: 36px; height: 36px; border-radius: 50%; @include flex-center; cursor: pointer;
}

.battle__status {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; text-align: center; color: var(--text-on-night-muted, #b9c2cc); font-size: 15px;
}
.battle__status--err { color: #ffb4a8; }

.battle__defender { margin-top: 26px; }
.battle__who { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.battle__code { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 26px; }
.battle__owner {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--text-on-night-muted, #b9c2cc);
}

.battle__timer {
  align-self: center;
  margin: 22px 0;
  display: inline-flex; align-items: center; gap: 7px;
  font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 22px;
  font-variant-numeric: tabular-nums;
  padding: 6px 16px; border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.08);
}
.battle__timer--low { color: #ff7a6b; background: rgba(255, 122, 107, 0.14); }

.battle__tap {
  flex: 1;
  margin: 4px 0 18px;
  border: none; cursor: pointer;
  border-radius: var(--radius-xl);
  background: linear-gradient(160deg, var(--brand), #2c8a1c);
  color: #fff;
  box-shadow: 0 14px 40px rgba(67, 176, 42, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.25);
  @include flex-center;
  user-select: none;
  transition: transform 0.06s ease, box-shadow 0.06s ease;
  &:active { transform: scale(0.97); box-shadow: 0 6px 20px rgba(67, 176, 42, 0.35); }
  &:disabled { opacity: 0.5; }
}
.battle__taplabel {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 28px;
}
.battle__atk { font-family: var(--font-mono); font-weight: var(--fw-semibold); font-size: 14px; opacity: 0.85; }

.battle__attacker { text-align: center; font-size: 13px; color: var(--text-on-night-muted, #b9c2cc); }
.battle__attacker strong { color: var(--text-on-night, #fff); font-family: var(--font-mono); }

.battle__result {
  flex: 1;
  margin: 4px 0 18px;
  border-radius: var(--radius-xl);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  text-align: center;
  h2 { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 24px; }
}
.battle__result--win { background: rgba(67, 176, 42, 0.16); color: #c8f5b9; }
.battle__result--lose { background: rgba(255, 255, 255, 0.06); color: var(--text-on-night-muted, #b9c2cc); }
.battle__xp { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 20px; color: var(--xp); }
.battle__hint { font-size: 13px; }
.battle__btn {
  margin-top: 8px;
  border: none; cursor: pointer;
  background: #fff; color: #16202b;
  font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 15px;
  padding: 12px 28px; border-radius: var(--radius-pill);
}
</style>
