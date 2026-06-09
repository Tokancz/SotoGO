<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useCamera } from '@/composables/useCamera'
import { useDialog } from '@/composables/useDialog'
import { downscaleCanvas, downscaleImageFile } from '@/lib/image'
import { resolveFleetNumber } from '@/data/fleet'
import { recognizeApi, type RecognizeResult } from '@/services/recognize'
import type { CatalogVehicle, CaughtReveal, CategoryKey, Rarity } from '@/types/game'
import SgButton from '@/components/ui/SgButton.vue'
import SgIcon from '@/components/SgIcon.vue'

const emit = defineEmits<{ close: []; caught: [] }>()

const game = useGameStore()
const camera = useCamera()

const rootEl = ref<HTMLElement | null>(null)
useDialog(rootEl, { onClose: () => emit('close') })

type Phase = 'aim' | 'scan' | 'confirm' | 'reject' | 'reward'
const phase = ref<Phase>('aim')

const videoEl = ref<HTMLVideoElement | null>(null)
const corners = ['nw', 'ne', 'sw', 'se'] as const

const stillUrl = ref('')
// The downscaled catch photo to upload (capped + re-encoded; see @/lib/image).
const photoBlob = ref<Blob | null>(null)
const recognizedNumber = ref<string | null>(null)
const scanError = ref(false)

// The resolved catalog model shown on the reward screen.
const matched = ref<CatalogVehicle | null>(null)
const reward = 100 // CATCH_XP — flat, awarded server-side on a new catch.

// Manual-confirm picker state (used when recognition can't auto-resolve the model).
const pickerCat = ref<CategoryKey>('tram')
// Catalog ids the vision model flagged as likely — surfaced first in the picker.
const candidateIds = ref<string[]>([])

const saving = ref(false)
const saveError = ref(false)
// What the catch rolled (rarity + stats), revealed on the reward screen once saved.
const revealed = ref<CaughtReveal | null>(null)
const rarityLabels: Record<Rarity, string> = {
  common: 'Běžná',
  rare: 'Vzácná',
  epic: 'Epická',
  legendary: 'Legendární',
}

const cat = computed(() => (matched.value ? game.cats[matched.value.category] : null))
const alreadyHave = computed(() =>
  matched.value ? game.collectedSet.has(matched.value.id) : false,
)
const pickerList = computed(() => {
  const inCat = game.catalog.filter((v) => v.category === pickerCat.value)
  if (!candidateIds.value.length) return inCat
  // Float the recognizer's guesses to the top, preserving their order.
  const rank = new Map(candidateIds.value.map((id, i) => [id, i]))
  return [...inCat].sort(
    (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
  )
})

onMounted(async () => {
  game.ensureCatalog()
  await nextTick()
  if (videoEl.value) await camera.start(videoEl.value)
})

onBeforeUnmount(() => camera.stop())

function findModel(category: CategoryKey, shortName: string): CatalogVehicle | undefined {
  return game.catalog.find((v) => v.category === category && v.shortName === shortName)
}

// A single, clearly-best visual guess auto-resolves to the reward; anything
// less confident drops into the picker (pre-filtered + candidates floated up),
// so we never silently pick the wrong near-identical variant.
const AUTO_ACCEPT_CONFIDENCE = 0.85

/**
 * Hybrid resolution: the painted fleet number wins when legible (authoritative
 * via the DPP ranges); otherwise fall back to the model's visual candidates.
 */
function applyRecognition(result: RecognizeResult) {
  // The model judged the photo not to be a public-transport vehicle — don't let
  // a random picture count as a catch.
  if (!result.isPublicTransport) {
    phase.value = 'reject'
    return
  }

  const number = result.fleetNumber || null
  recognizedNumber.value = number

  if (number) {
    const hit = resolveFleetNumber(Number(number))
    const model = hit ? findModel(hit.category, hit.shortName) : undefined
    if (model) {
      matched.value = model
      phase.value = 'reward'
      return
    }
  }

  // No authoritative number — use the visual guesses.
  const candModels = result.candidates
    .map((c) => findModel(result.category, c.shortName) ?? game.catalog.find((v) => v.shortName === c.shortName))
    .filter((v): v is CatalogVehicle => v != null)

  pickerCat.value = candModels[0]?.category ?? result.category
  candidateIds.value = candModels.map((v) => v.id)

  const top = result.candidates[0]
  if (candModels[0] && top && top.confidence >= AUTO_ACCEPT_CONFIDENCE && result.candidates.length === 1) {
    matched.value = candModels[0]
    phase.value = 'reward'
    return
  }

  phase.value = 'confirm'
}

async function scan(photo: Blob) {
  phase.value = 'scan'
  scanError.value = false
  candidateIds.value = []
  try {
    applyRecognition(await recognizeApi.recognize(photo))
  } catch (err) {
    // Recognition unavailable (no API key, offline, error) — fall back to the
    // manual picker rather than losing the catch.
    console.error('Rozpoznávání selhalo:', err)
    scanError.value = true
    phase.value = 'confirm'
  }
}

async function capture() {
  if (!videoEl.value || !camera.active.value) return
  const full = camera.captureCanvas(videoEl.value)
  stillUrl.value = full.toDataURL('image/jpeg', 0.8)
  const photo = await downscaleCanvas(full)
  photoBlob.value = photo
  camera.stop()
  if (photo) await scan(photo)
}

/** Fallback path: recognize a photo from the native file/camera input. */
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  stillUrl.value = URL.createObjectURL(file)
  const photo = await downscaleImageFile(file)
  photoBlob.value = photo
  await scan(photo)
}

function chooseModel(v: CatalogVehicle) {
  matched.value = v
  phase.value = 'reward'
}

async function restart() {
  recognizedNumber.value = null
  matched.value = null
  scanError.value = false
  saveError.value = false
  revealed.value = null
  stillUrl.value = ''
  photoBlob.value = null
  candidateIds.value = []
  phase.value = 'aim'
  await nextTick()
  if (videoEl.value) await camera.start(videoEl.value)
}

async function addToPark() {
  if (!matched.value || saving.value) return
  // Already revealed (or it's a dupe with nothing to roll) → this tap just finishes.
  if (revealed.value || alreadyHave.value) {
    emit('caught')
    emit('close')
    return
  }
  saving.value = true
  saveError.value = false
  try {
    const res = await game.collectVehicle(matched.value.id, photoBlob.value)
    if (res) {
      revealed.value = res // stay open to reveal the rolled rarity + stats
    } else {
      emit('caught')
      emit('close')
    }
  } catch (err) {
    // Keep the sheet open so the catch isn't lost — let the player retry.
    console.error('Uložení úlovku selhalo:', err)
    saveError.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div ref="rootEl" class="capture" :class="{ 'capture--reward': phase === 'reward' }" role="dialog" aria-modal="true" aria-labelledby="capture-heading">
    <div class="capture__bar">
      <h2 id="capture-heading" class="capture__heading">{{ phase === 'reward' ? 'Nový objev!' : 'Vyfoť vozidlo' }}</h2>
      <button class="capture__close" aria-label="Zavřít" @click="emit('close')"><SgIcon name="x" :size="18" /></button>
    </div>

    <!-- AIM + SCAN share the viewfinder frame -->
    <template v-if="phase === 'aim' || phase === 'scan'">
      <div class="capture__view">
        <video
          v-show="phase === 'aim' && camera.active.value"
          ref="videoEl"
          class="capture__video"
          playsinline
          muted
          autoplay
        />
        <img v-if="phase === 'scan'" class="capture__video" :src="stillUrl" alt="" />

        <!-- Camera unavailable → file/native-camera fallback -->
        <div v-if="phase === 'aim' && !camera.active.value && camera.error.value" class="capture__fallback">
          <SgIcon name="camera-off" :size="40" />
          <p>{{ camera.error.value === 'denied'
            ? 'Přístup ke kameře byl zamítnut. Povol ho v nastavení, nebo nahraj fotku.'
            : 'Kameru nelze spustit. Nahraj fotku vozidla.' }}</p>
        </div>

        <div class="capture__reticle">
          <span v-for="c in corners" :key="c" class="capture__corner" :class="`capture__corner--${c}`" />
          <div v-if="phase === 'scan'" class="capture__scanline sg-scan-line" />
        </div>
        <div v-if="phase === 'aim' && camera.active.value" class="capture__hint">
          Vyfoť vozidlo tak, aby bylo vidět evidenční číslo
        </div>
        <div v-if="phase === 'scan'" class="capture__status">
          <SgIcon name="scan-line" :size="16" /> Čtu evidenční číslo…
        </div>
      </div>

      <div class="capture__actions">
        <SgButton
          v-if="camera.active.value"
          variant="primary"
          size="lg"
          full-width
          leading-icon="camera"
          :disabled="phase === 'scan'"
          @click="capture"
        >
          {{ phase === 'scan' ? 'Skenuji…' : 'Vyfotit' }}
        </SgButton>
        <label v-else class="capture__filebtn">
          <SgIcon name="image-up" :size="20" />
          {{ phase === 'scan' ? 'Skenuji…' : 'Nahrát fotku' }}
          <input type="file" accept="image/*" capture="environment" :disabled="phase === 'scan'" @change="onFile" />
        </label>
      </div>
    </template>

    <!-- CONFIRM: OCR couldn't auto-resolve the model — let the player pick -->
    <div v-else-if="phase === 'confirm'" class="capture__confirm">
      <div class="capture__confirm-head">
        <SgIcon :name="scanError ? 'triangle-alert' : 'scan-search'" :size="22" />
        <div>
          <div class="capture__confirm-title">
            {{ scanError ? 'Čtení se nezdařilo' : recognizedNumber ? `Přečteno: #${recognizedNumber}` : 'Číslo se nepodařilo přečíst' }}
          </div>
          <div class="capture__confirm-sub">Vyber model ručně.</div>
        </div>
      </div>

      <div class="capture__cats">
        <button
          v-for="c in game.categoryList"
          :key="c.key"
          type="button"
          class="capture__cat"
          :class="{ 'is-active': pickerCat === c.key }"
          :style="pickerCat === c.key ? { background: c.color, borderColor: c.color } : undefined"
          @click="pickerCat = c.key"
        >
          <SgIcon :name="c.icon" :size="15" />{{ c.plural }}
        </button>
      </div>

      <div class="capture__models">
        <button
          v-for="v in pickerList"
          :key="v.id"
          type="button"
          class="capture__model"
          @click="chooseModel(v)"
        >
          <span class="capture__model-dot" :style="{ background: game.cats[v.category].color }" />
          <span class="capture__model-body">
            <span class="capture__model-code">{{ v.shortName }}</span>
            <span class="capture__model-name">{{ v.model }}</span>
          </span>
          <SgIcon name="chevron-right" :size="18" />
        </button>
      </div>

      <div class="capture__actions">
        <SgButton variant="secondary" size="lg" full-width leading-icon="rotate-ccw" @click="restart">
          Zkusit znovu
        </SgButton>
      </div>
    </div>

    <!-- REJECT: the photo isn't a public-transport vehicle -->
    <div v-else-if="phase === 'reject'" class="capture__reject">
      <div class="capture__reject-icon"><SgIcon name="image-off" :size="44" /></div>
      <div class="capture__reject-title">Tohle nevypadá jako vozidlo</div>
      <p class="capture__reject-sub">
        Na fotce jsme nenašli žádné pražské MHD vozidlo. Vyfoť tramvaj, autobus, metro, trolejbus nebo vlak.
      </p>
      <div class="capture__actions">
        <SgButton variant="primary" size="lg" full-width leading-icon="rotate-ccw" @click="restart">
          Zkusit znovu
        </SgButton>
      </div>
    </div>

    <!-- REWARD -->
    <div v-else class="capture__reward">
      <div class="capture__pop sg-reward-pop" :style="{ background: `color-mix(in srgb, ${cat?.color} 22%, transparent)`, boxShadow: `0 0 0 8px color-mix(in srgb, ${cat?.color} 12%, transparent)` }">
        <div class="capture__pop-inner" :style="{ background: cat?.color }"><SgIcon :name="cat?.icon ?? 'tram-front'" :size="44" /></div>
      </div>
      <div class="eyebrow capture__tag">{{ alreadyHave ? 'Už máš v parku' : 'Nový objev!' }}</div>
      <div class="capture__code">
        {{ matched?.shortName }}<template v-if="recognizedNumber"> #{{ recognizedNumber }}</template>
      </div>
      <div class="capture__sub">{{ cat?.label }} · {{ matched?.operator }}</div>
      <div v-if="!alreadyHave" class="capture__xp"><SgIcon name="zap" :size="20" /> +{{ reward }} XP</div>

      <!-- Reveal what this catch rolled (rarity + combat stats). -->
      <div v-if="revealed" class="capture__reveal">
        <div class="capture__rarity" :style="{ color: `var(--rarity-${revealed.rarity})` }">
          {{ rarityLabels[revealed.rarity] }}
        </div>
        <div class="capture__statpills">
          <span class="capture__statpill"><SgIcon name="shield" :size="15" />{{ revealed.maxHp }} HP</span>
          <span class="capture__statpill"><SgIcon name="zap" :size="15" />{{ revealed.attack }} ATK</span>
        </div>
      </div>

      <div v-if="saveError" class="capture__saveerror">
        <SgIcon name="triangle-alert" :size="15" /> Uložení se nezdařilo. Zkus to znovu.
      </div>
      <SgButton
        variant="reward"
        size="lg"
        full-width
        :leading-icon="saving ? undefined : 'plus'"
        :disabled="saving"
        @click="addToPark"
      >
        {{ saving ? 'Ukládám…' : saveError ? 'Zkusit znovu' : revealed ? 'Hotovo' : alreadyHave ? 'Otevřít park' : 'Přidat do parku' }}
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

.capture__view { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #0b0f14; }
.capture__video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.capture__fallback {
  position: relative;
  z-index: 1;
  max-width: 280px;
  padding: 0 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  p { font-size: 14px; line-height: 1.45; }
}
.capture__reticle {
  position: absolute;
  // A roomy vehicle-framing guide — the number can sit anywhere inside it, the
  // whole frame is sent for recognition (no centered crop anymore).
  width: 84%;
  max-width: 380px;
  aspect-ratio: 4 / 5;
  --reticle-radius: 26px;
  border-radius: var(--reticle-radius);
  // Dim everything outside the frame, with a faint inner hairline for definition.
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.42), inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}
// Smooth corner brackets that curve exactly like the frame's rounded corners.
.capture__corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border: 0 solid var(--brand);
  filter: drop-shadow(0 0 5px color-mix(in srgb, var(--brand) 55%, transparent));
}
.capture__corner--nw {
  top: -2px;
  left: -2px;
  border-top-width: 3px;
  border-left-width: 3px;
  border-top-left-radius: var(--reticle-radius);
}
.capture__corner--ne {
  top: -2px;
  right: -2px;
  border-top-width: 3px;
  border-right-width: 3px;
  border-top-right-radius: var(--reticle-radius);
}
.capture__corner--sw {
  bottom: -2px;
  left: -2px;
  border-bottom-width: 3px;
  border-left-width: 3px;
  border-bottom-left-radius: var(--reticle-radius);
}
.capture__corner--se {
  bottom: -2px;
  right: -2px;
  border-bottom-width: 3px;
  border-right-width: 3px;
  border-bottom-right-radius: var(--reticle-radius);
}
.capture__scanline {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--brand);
  box-shadow: 0 0 12px var(--brand);
  animation: sg-scan 1.5s ease-in-out infinite;
}
.capture__hint {
  position: absolute;
  bottom: 24px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.4);
  padding: 6px 14px;
  border-radius: var(--radius-pill);
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

.capture__filebtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 54px;
  border-radius: var(--radius-md);
  background: var(--brand);
  color: var(--text-on-brand);
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 17px;
  cursor: pointer;
  input { display: none; }
}

/* Confirm / manual model picker */
.capture__confirm { flex: 1; display: flex; flex-direction: column; min-height: 0; color: #fff; padding: 4px 16px 0; }
.capture__confirm-head { display: flex; align-items: center; gap: 12px; padding: 8px 4px 16px; color: var(--gold-300); }
.capture__confirm-title { font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 16px; color: #fff; }
.capture__confirm-sub { font-size: 13px; color: var(--text-on-night-muted); margin-top: 2px; }
.capture__cats {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  &::-webkit-scrollbar { display: none; }
}
.capture__cat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 8px 13px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #fff;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  &.is-active { color: #fff; }
}
.capture__models { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-bottom: 12px; }
.capture__model {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  border: none;
  color: #fff;
  text-align: left;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.1); }
  svg { color: var(--text-on-night-muted); flex: none; }
}
.capture__model-dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
.capture__model-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.capture__model-code { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 15px; }
.capture__model-name { font-size: 12px; color: var(--text-on-night-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
}
.capture__pop-inner {
  width: 84px;
  height: 84px;
  border-radius: 50%;
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
.capture__reveal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}
.capture__rarity {
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 5px 16px;
  border-radius: var(--radius-pill);
  border: 1.5px solid currentColor;
}
.capture__statpills { display: flex; gap: 10px; }
.capture__statpill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-weight: var(--fw-bold);
  font-size: 15px;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 14px;
  border-radius: var(--radius-pill);
}

.capture__saveerror {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #ff8a80;
  margin-bottom: 14px;
}

.capture__reject {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 28px 30px;
  text-align: center;
  color: #fff;
}
.capture__reject .capture__actions { width: 100%; }
.capture__reject-icon {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: var(--text-on-night-muted);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.capture__reject-title {
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 21px;
}
.capture__reject-sub {
  margin-top: 10px;
  max-width: 300px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-on-night-muted);
}

@media (prefers-reduced-motion: reduce) {
  .capture__scanline { animation: none; top: 50%; }
}
</style>
