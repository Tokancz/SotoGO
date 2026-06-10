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
  /** The holder's catch photo of the defending vehicle (absolute URL), or null. */
  defenderImage?: string | null
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

// Damage numbers that pop off the defender on each landed tap. Each is removed
// once its float-up animation has played.
const floaters = ref<{ id: number; x: number }[]>([])
let floaterId = 0
const reduceMotion =
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

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
  if (!reduceMotion) {
    const id = ++floaterId
    floaters.value.push({ id, x: 32 + Math.random() * 36 })
    setTimeout(() => {
      floaters.value = floaters.value.filter((f) => f.id !== id)
    }, 700)
  }
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
        <div class="battle__resicon" :class="{ 'battle__resicon--win': result.won }">
          <span v-if="result.won" class="battle__burst" aria-hidden="true" />
          <SgIcon :name="result.won ? 'trophy' : 'shield'" :size="48" />
        </div>
        <h2 class="sg-rise" :style="{ '--sg-rise-delay': '0.12s' }">{{ result.won ? 'Gym je tvůj!' : result.voided ? 'Obránce zmizel' : 'Obránce vydržel' }}</h2>
        <p v-if="result.won" class="battle__xp sg-rise" :style="{ '--sg-rise-delay': '0.22s' }">+{{ result.awardedXp }} XP</p>
        <template v-else-if="!result.voided">
          <p class="battle__hint sg-rise" :style="{ '--sg-rise-delay': '0.18s' }">Obránci zbývá {{ result.defenderHp }} HP. Zkus to znovu.</p>
          <p class="battle__hint battle__hint--warn sg-rise" :style="{ '--sg-rise-delay': '0.26s' }"><SgIcon name="heart-pulse" :size="14" /> Tvé vozidlo je vyčerpané — musí se zotavit.</p>
        </template>
        <button class="battle__btn sg-rise" :style="{ '--sg-rise-delay': '0.34s' }" @click="emit('close')">Hotovo</button>
      </div>

      <!-- Tap target: the opponent's vehicle (photo when available) -->
      <button
        v-else
        class="battle__tap"
        :class="{ 'battle__tap--photo': defenderImage }"
        :style="{ '--def-rarity': rarityColor }"
        :disabled="phase !== 'fighting'"
        @pointerdown.prevent="tap"
      >
        <img v-if="defenderImage" class="battle__tapimg" :src="defenderImage" :alt="defenderName" />
        <SgIcon v-else class="battle__tapveh" name="tram-front" :size="84" />
        <span
          v-for="f in floaters"
          :key="f.id"
          class="battle__dmg"
          :style="{ left: `${f.x}%` }"
          aria-hidden="true"
        >−{{ attack }}</span>
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
.battle__timer--low {
  color: #ff7a6b;
  background: rgba(255, 122, 107, 0.14);
  animation: sg-throb 0.7s ease-in-out infinite;
}

.battle__tap {
  position: relative;
  flex: 1;
  margin: 4px 0 18px;
  border: none; cursor: pointer;
  border-radius: var(--radius-xl);
  overflow: hidden;
  // The opponent's vehicle: a dark panel tinted by its rarity, with the photo
  // (when available) filling it; the tap label sits on top.
  background:
    radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--def-rarity, var(--brand)) 40%, #16202b), #0e151d);
  color: #fff;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45), inset 0 0 0 2px color-mix(in srgb, var(--def-rarity, var(--brand)) 55%, transparent);
  @include flex-center;
  user-select: none;
  transition: transform 0.06s ease, box-shadow 0.06s ease;
  &:active { transform: scale(0.97); }
  &:disabled { opacity: 0.5; }
}
.battle__tapimg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0.85; pointer-events: none;
}
.battle__tapveh {
  position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
  color: color-mix(in srgb, var(--def-rarity, var(--brand)) 60%, #fff);
  opacity: 0.5; pointer-events: none;
}
.battle__taplabel {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 28px;
  padding: 14px 26px; border-radius: var(--radius-lg);
  background: rgba(8, 12, 16, 0.5);
  backdrop-filter: blur(2px);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  // Gentle idle throb invites the player to start hammering.
  animation: sg-throb 1.5s ease-in-out infinite;
}
.battle__tap:active .battle__taplabel { animation: none; }

// Damage numbers flung off the defender on each landed tap.
.battle__dmg {
  position: absolute;
  top: 42%;
  z-index: 2;
  pointer-events: none;
  font-family: var(--font-mono);
  font-weight: var(--fw-bold);
  font-size: 30px;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.75), 0 0 14px color-mix(in srgb, var(--def-rarity, var(--brand)) 70%, transparent);
  animation: sg-float-up 0.7s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
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
  animation: sg-pop 0.42s cubic-bezier(0.2, 1.2, 0.4, 1) both;
  h2 { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 24px; }
}
.battle__resicon {
  position: relative;
  display: flex; align-items: center; justify-content: center;
}
.battle__resicon--win {
  animation: sg-bump 0.5s cubic-bezier(0.2, 1.4, 0.4, 1) 0.1s both;
  svg { filter: drop-shadow(0 0 14px color-mix(in srgb, var(--xp) 80%, transparent)); color: var(--xp); }
}
// Rotating ray burst behind the trophy on a win.
.battle__burst {
  position: absolute;
  width: 170px; height: 170px;
  border-radius: 50%;
  pointer-events: none;
  background: repeating-conic-gradient(
    from 0deg,
    color-mix(in srgb, var(--xp) 40%, transparent) 0deg 7deg,
    transparent 7deg 20deg
  );
  -webkit-mask: radial-gradient(circle, transparent 30px, #000 38px, transparent 84px);
  mask: radial-gradient(circle, transparent 30px, #000 38px, transparent 84px);
  animation: sg-rays 8s linear infinite;
}
.battle__result--win { background: rgba(67, 176, 42, 0.16); color: #c8f5b9; }
.battle__result--lose { background: rgba(255, 255, 255, 0.06); color: var(--text-on-night-muted, #b9c2cc); }
.battle__xp { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 20px; color: var(--xp); }
.battle__hint { font-size: 13px; }
.battle__hint--warn {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 4px; color: #f0b04a;
}
.battle__btn {
  margin-top: 8px;
  border: none; cursor: pointer;
  background: #fff; color: #16202b;
  font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 15px;
  padding: 12px 28px; border-radius: var(--radius-pill);
}

@media (prefers-reduced-motion: reduce) {
  .battle__timer--low,
  .battle__taplabel,
  .battle__result,
  .battle__resicon--win,
  .battle__burst { animation: none; }
}
</style>
