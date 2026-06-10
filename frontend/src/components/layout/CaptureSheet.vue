<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useCamera, type CropRect } from '@/composables/useCamera'
import { useDialog } from '@/composables/useDialog'
import { downscaleCanvas, downscaleImageFile } from '@/lib/image'
import { resolveFleetNumber } from '@/data/fleet'
import { recognizeApi, type RecognizeResult } from '@/services/recognize'
import { useCountUp } from '@/composables/useCountUp'
import { fx, haptic } from '@/lib/feedback'
import type { CatalogVehicle, CatchRoll, CategoryKey, Rarity } from '@/types/game'
import SgButton from '@/components/ui/SgButton.vue'
import SgIcon from '@/components/SgIcon.vue'

const emit = defineEmits<{ close: []; caught: [] }>()

const game = useGameStore()
const camera = useCamera()

const rootEl = ref<HTMLElement | null>(null)
useDialog(rootEl, { onClose: () => emit('close') })

// review = model resolved, confirm/correct the serial then catch.
// result = a fresh catch (merged XP + rarity reveal). duplicate = same serial
// caught again, pick which roll to keep.
type Phase = 'aim' | 'scan' | 'confirm' | 'reject' | 'review' | 'result' | 'duplicate'
const phase = ref<Phase>('aim')

const videoEl = ref<HTMLVideoElement | null>(null)
const corners = ['nw', 'ne', 'sw', 'se'] as const

// Digital zoom (1–4×): scales the live preview and crops the same centered region
// on capture, which enlarges the painted number so it reads more reliably.
const ZOOM_MAX = 4
const zoom = ref(1)

const stillUrl = ref('')
// The downscaled catch photo to upload (capped + re-encoded; see @/lib/image).
const photoBlob = ref<Blob | null>(null)
// Editable serial (evidenční číslo): prefilled from OCR, but the player can fix a
// misread. It identifies the physical vehicle and drives duplicate detection.
const serial = ref('')
const scanError = ref(false)

// The resolved catalog model.
const matched = ref<CatalogVehicle | null>(null)

// Manual-confirm picker state (used when recognition can't auto-resolve the model).
const pickerCat = ref<CategoryKey>('tram')
// Catalog ids the vision model flagged as likely — surfaced first in the picker.
const candidateIds = ref<string[]>([])

const saving = ref(false)
const saveError = ref(false)
// A fresh catch's rolled reward (XP + rarity + stats), shown on the result screen.
const result = ref<{ awardedXp: number; rarity: Rarity; hp: number; maxHp: number; attack: number } | null>(null)
// Ticks the XP up from 0 on the reveal so the reward feels earned.
const xpDisplay = useCountUp(() => result.value?.awardedXp ?? 0)
// Epic/legendary pulls get the extra flourish (sheen sweep + ray burst).
const isSpecial = computed(() => result.value?.rarity === 'epic' || result.value?.rarity === 'legendary')
// Same-serial re-catch: the existing instance vs the freshly rolled candidate.
const dup = ref<{ existing: CatchRoll & { id: string }; candidate: CatchRoll } | null>(null)
const keeping = ref(false)

const rarityLabels: Record<Rarity, string> = {
  common: 'Běžná',
  rare: 'Vzácná',
  epic: 'Epická',
  legendary: 'Legendární',
}

const cat = computed(() => (matched.value ? game.cats[matched.value.category] : null))
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

// A single, clearly-best visual guess auto-resolves to review; anything less
// confident drops into the picker (pre-filtered + candidates floated up).
const AUTO_ACCEPT_CONFIDENCE = 0.85

/**
 * Hybrid resolution: the painted fleet number wins when legible (authoritative
 * via the DPP ranges); otherwise fall back to the model's visual candidates.
 */
function applyRecognition(res: RecognizeResult) {
  // The model judged the photo not to be a public-transport vehicle — don't let
  // a random picture count as a catch.
  if (!res.isPublicTransport) {
    phase.value = 'reject'
    return
  }

  serial.value = res.fleetNumber || ''

  if (res.fleetNumber) {
    const hit = resolveFleetNumber(Number(res.fleetNumber))
    const model = hit ? findModel(hit.category, hit.shortName) : undefined
    if (model) {
      matched.value = model
      phase.value = 'review'
      return
    }
  }

  // No authoritative number — use the visual guesses.
  const candModels = res.candidates
    .map((c) => findModel(res.category, c.shortName) ?? game.catalog.find((v) => v.shortName === c.shortName))
    .filter((v): v is CatalogVehicle => v != null)

  pickerCat.value = candModels[0]?.category ?? res.category
  candidateIds.value = candModels.map((v) => v.id)

  const top = res.candidates[0]
  if (candModels[0] && top && top.confidence >= AUTO_ACCEPT_CONFIDENCE && res.candidates.length === 1) {
    matched.value = candModels[0]
    phase.value = 'review'
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

/** Centered crop matching the current zoom, so the capture frames what's on screen. */
function cropForZoom(): CropRect | undefined {
  if (zoom.value <= 1) return undefined
  const s = 1 / zoom.value
  const off = (1 - s) / 2
  return { x: off, y: off, w: s, h: s }
}

async function capture() {
  if (!videoEl.value || !camera.active.value) return
  const full = camera.captureCanvas(videoEl.value, cropForZoom())
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
  phase.value = 'review'
}

function onSerialInput(e: Event) {
  serial.value = (e.target as HTMLInputElement).value.replace(/\D/g, '')
}

/** Commit the catch with the (possibly corrected) serial. */
async function doCatch() {
  if (!matched.value || saving.value) return
  saving.value = true
  saveError.value = false
  try {
    const res = await game.collectVehicle(matched.value.id, serial.value || null, photoBlob.value)
    if (res.status === 'new') {
      result.value = {
        awardedXp: res.awardedXp,
        rarity: res.rarity,
        hp: res.stats.hp,
        maxHp: res.stats.maxHp,
        attack: res.stats.attack,
      }
      phase.value = 'result'
      fx.catch(res.rarity)
      haptic.success()
    } else {
      dup.value = { existing: res.existing, candidate: res.candidate }
      phase.value = 'duplicate'
    }
  } catch (err) {
    // Keep the sheet open so the catch isn't lost — let the player retry.
    console.error('Uložení úlovku selhalo:', err)
    saveError.value = true
  } finally {
    saving.value = false
  }
}

/** Resolve a duplicate-serial catch: keep the new roll or the existing one. */
async function keep(choice: 'new' | 'old') {
  if (!matched.value || keeping.value || !dup.value) return
  const fleet = dup.value.existing.fleetNumber ?? dup.value.candidate.fleetNumber
  if (!fleet) return
  keeping.value = true
  saveError.value = false
  try {
    await game.keepCatch(matched.value.id, fleet, choice)
    emit('caught')
    emit('close')
  } catch (err) {
    console.error('Uložení volby selhalo:', err)
    saveError.value = true
  } finally {
    keeping.value = false
  }
}

function finish() {
  emit('caught')
  emit('close')
}

async function restart() {
  serial.value = ''
  matched.value = null
  scanError.value = false
  saveError.value = false
  result.value = null
  dup.value = null
  stillUrl.value = ''
  photoBlob.value = null
  candidateIds.value = []
  zoom.value = 1
  phase.value = 'aim'
  await nextTick()
  if (videoEl.value) await camera.start(videoEl.value)
}
</script>

<template>
  <div ref="rootEl" class="capture" :class="{ 'capture--reward': phase === 'result' || phase === 'duplicate' }" role="dialog" aria-modal="true" aria-labelledby="capture-heading">
    <div class="capture__bar">
      <h2 id="capture-heading" class="capture__heading">{{ phase === 'result' ? 'Nový objev!' : phase === 'duplicate' ? 'Stejné číslo' : 'Vyfoť vozidlo' }}</h2>
      <button class="capture__close" aria-label="Zavřít" @click="emit('close')"><SgIcon name="x" :size="18" /></button>
    </div>

    <!-- AIM + SCAN share the viewfinder frame -->
    <template v-if="phase === 'aim' || phase === 'scan'">
      <div class="capture__view">
        <video
          v-show="phase === 'aim' && camera.active.value"
          ref="videoEl"
          class="capture__video"
          :style="{ transform: `scale(${zoom})` }"
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

        <!-- Zoom slider — easier to capture the serial number from afar -->
        <div v-if="phase === 'aim' && camera.active.value" class="capture__zoom">
          <SgIcon name="zoom-out" :size="16" />
          <input
            class="capture__zoomslider"
            type="range"
            min="1"
            :max="ZOOM_MAX"
            step="0.1"
            v-model.number="zoom"
            aria-label="Přiblížení"
          />
          <SgIcon name="zoom-in" :size="16" />
          <span class="capture__zoomval">{{ zoom.toFixed(1) }}×</span>
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
            {{ scanError ? 'Čtení se nezdařilo' : serial ? `Přečteno: #${serial}` : 'Číslo se nepodařilo přečíst' }}
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

    <!-- REVIEW: model resolved — confirm/correct the serial, then catch -->
    <div v-else-if="phase === 'review'" class="capture__review">
      <div class="capture__reviewmedia">
        <img v-if="stillUrl" :src="stillUrl" alt="" />
        <div v-else class="capture__reviewicon" :style="{ background: cat?.color }"><SgIcon :name="cat?.icon ?? 'tram-front'" :size="40" /></div>
      </div>
      <div class="capture__reviewbody">
        <div class="capture__code">{{ matched?.shortName }}</div>
        <div class="capture__sub">{{ cat?.label }} · {{ matched?.operator }}</div>

        <label class="capture__seriallabel" for="serial-input">Evidenční číslo</label>
        <div class="capture__serialfield">
          <span class="capture__serialhash">#</span>
          <input
            id="serial-input"
            class="capture__serialinput"
            inputmode="numeric"
            placeholder="např. 9325"
            :value="serial"
            @input="onSerialInput"
          />
        </div>
        <p class="capture__serialhint">Pokud číslo nesedí, oprav ho — jinak nech prázdné.</p>

        <div v-if="saveError" class="capture__saveerror">
          <SgIcon name="triangle-alert" :size="15" /> Uložení se nezdařilo. Zkus to znovu.
        </div>
      </div>

      <div class="capture__actions capture__actions--stack">
        <SgButton variant="reward" size="lg" full-width :leading-icon="saving ? undefined : 'sparkles'" :disabled="saving" @click="doCatch">
          {{ saving ? 'Ukládám…' : 'Ulovit' }}
        </SgButton>
        <button class="capture__retake" :disabled="saving" @click="restart"><SgIcon name="rotate-ccw" :size="15" /> Přefotit</button>
      </div>
    </div>

    <!-- DUPLICATE: same serial caught again — keep which roll? -->
    <div v-else-if="phase === 'duplicate' && dup" class="capture__dup">
      <p class="capture__dup-sub">Číslo <strong>#{{ dup.existing.fleetNumber ?? dup.candidate.fleetNumber }}</strong> už máš. Vyber, které vozidlo si necháš.</p>
      <div class="capture__dup-grid">
        <button class="capture__dupcard" :disabled="keeping" @click="keep('old')">
          <div class="capture__dup-eyebrow">Stávající</div>
          <div class="capture__dupthumb" :style="{ background: cat?.color }">
            <img v-if="dup.existing.imageUrl" :src="dup.existing.imageUrl" alt="" />
            <SgIcon v-else :name="cat?.icon ?? 'tram-front'" :size="30" />
          </div>
          <div class="capture__rarity" :style="{ color: `var(--rarity-${dup.existing.rarity})` }">{{ rarityLabels[dup.existing.rarity] }}</div>
          <div class="capture__dupstats">
            <span><SgIcon name="shield" :size="13" />{{ dup.existing.maxHp }}</span>
            <span><SgIcon name="zap" :size="13" />{{ dup.existing.attack }}</span>
          </div>
        </button>
        <button class="capture__dupcard capture__dupcard--new" :disabled="keeping" @click="keep('new')">
          <div class="capture__dup-eyebrow">Nový</div>
          <div class="capture__dupthumb" :style="{ background: cat?.color }">
            <img v-if="dup.candidate.imageUrl" :src="dup.candidate.imageUrl" alt="" />
            <SgIcon v-else :name="cat?.icon ?? 'tram-front'" :size="30" />
          </div>
          <div class="capture__rarity" :style="{ color: `var(--rarity-${dup.candidate.rarity})` }">{{ rarityLabels[dup.candidate.rarity] }}</div>
          <div class="capture__dupstats">
            <span><SgIcon name="shield" :size="13" />{{ dup.candidate.maxHp }}</span>
            <span><SgIcon name="zap" :size="13" />{{ dup.candidate.attack }}</span>
          </div>
        </button>
      </div>
      <p v-if="saveError" class="capture__saveerror"><SgIcon name="triangle-alert" :size="15" /> Uložení se nezdařilo. Zkus to znovu.</p>
      <p class="capture__dup-foot">Ťukni na to, které si chceš nechat.</p>
    </div>

    <!-- RESULT: merged XP reward + rarity reveal -->
    <div v-else-if="phase === 'result' && result" class="capture__reward" :class="{ 'capture__reward--special': isSpecial }">
      <div class="capture__popwrap">
        <span v-if="isSpecial" class="capture__rays" :style="{ '--_c': `var(--rarity-${result.rarity})` }" aria-hidden="true" />
        <div class="capture__pop sg-reward-pop" :style="{ background: `color-mix(in srgb, ${cat?.color} 22%, transparent)`, boxShadow: `0 0 0 8px color-mix(in srgb, ${cat?.color} 12%, transparent)` }">
          <div class="capture__pop-inner" :style="{ background: cat?.color }"><SgIcon :name="cat?.icon ?? 'tram-front'" :size="44" /></div>
          <span v-if="isSpecial" class="capture__sheen" aria-hidden="true" />
        </div>
      </div>
      <div class="eyebrow capture__tag sg-rise" :style="{ '--sg-rise-delay': '0.18s' }">Nový objev!</div>
      <div class="capture__code sg-rise" :style="{ '--sg-rise-delay': '0.24s' }">
        {{ matched?.shortName }}<template v-if="serial"> #{{ serial }}</template>
      </div>
      <div class="capture__sub sg-rise" :style="{ '--sg-rise-delay': '0.3s' }">{{ cat?.label }} · {{ matched?.operator }}</div>

      <div class="capture__rarity capture__rarity--badge sg-rise" :style="{ color: `var(--rarity-${result.rarity})`, '--sg-rise-delay': '0.38s' }">
        {{ rarityLabels[result.rarity] }}
      </div>
      <div class="capture__statpills sg-rise" :style="{ '--sg-rise-delay': '0.46s' }">
        <span class="capture__statpill"><SgIcon name="shield" :size="15" />{{ result.maxHp }} HP</span>
        <span class="capture__statpill"><SgIcon name="zap" :size="15" />{{ result.attack }} ATK</span>
      </div>
      <div class="capture__xp sg-rise" :style="{ '--sg-rise-delay': '0.54s' }"><SgIcon name="zap" :size="20" /> +{{ xpDisplay }} XP</div>

      <SgButton class="sg-rise" :style="{ '--sg-rise-delay': '0.64s' }" variant="reward" size="lg" full-width leading-icon="check" @click="finish">Hotovo</SgButton>
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
.capture__video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform-origin: center; }
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

/* Zoom slider */
.capture__zoom {
  position: absolute;
  bottom: 64px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  backdrop-filter: blur(4px);
}
.capture__zoomslider {
  width: 150px;
  accent-color: var(--brand);
}
.capture__zoomval { font-family: var(--font-mono); font-size: 12px; min-width: 30px; }

.capture__actions { padding: 18px 20px 26px; padding-bottom: max(26px, env(safe-area-inset-bottom)); }
.capture__actions--stack { display: flex; flex-direction: column; align-items: center; gap: 10px; }

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

/* Review: confirm the serial before catching */
.capture__review { flex: 1; display: flex; flex-direction: column; color: #fff; padding: 0 20px; min-height: 0; }
.capture__reviewmedia {
  width: 100%;
  aspect-ratio: 16 / 10;
  max-height: 200px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin: 4px 0 18px;
  background: #0b0f14;
  display: flex;
  align-items: center;
  justify-content: center;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.capture__reviewicon { width: 78px; height: 78px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; }
.capture__reviewbody { flex: 1; }
.capture__seriallabel { display: block; margin: 20px 0 8px; font-family: var(--font-display); font-weight: var(--fw-semibold); font-size: 13px; color: var(--text-on-night-muted); }
.capture__serialfield {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 54px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.18);
  &:focus-within { box-shadow: inset 0 0 0 2px var(--brand); }
}
.capture__serialhash { font-family: var(--font-mono); font-size: 22px; font-weight: var(--fw-bold); color: var(--text-on-night-muted); }
.capture__serialinput {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-family: var(--font-mono);
  font-weight: var(--fw-bold);
  font-size: 22px;
  letter-spacing: 0.04em;
  &::placeholder { color: rgba(255, 255, 255, 0.35); font-weight: var(--fw-regular); letter-spacing: 0; }
}
.capture__serialhint { margin-top: 8px; font-size: 12px; color: var(--text-on-night-muted); }
.capture__retake {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-on-night-muted);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
}

/* Duplicate-serial choice */
.capture__dup { flex: 1; display: flex; flex-direction: column; justify-content: center; color: #fff; padding: 0 20px 24px; text-align: center; }
.capture__dup-sub { font-size: 15px; line-height: 1.45; color: var(--text-on-night-muted); margin-bottom: 22px; }
.capture__dup-sub strong { color: #fff; font-family: var(--font-mono); }
.capture__dup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.capture__dupcard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  cursor: pointer;
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.5; }
}
.capture__dupcard--new { border-color: var(--gold-300); }
.capture__dup-eyebrow { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-on-night-muted); }
.capture__dupthumb { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; color: #fff; img { width: 100%; height: 100%; object-fit: cover; } }
.capture__dupstats {
  display: flex; gap: 12px;
  font-family: var(--font-mono); font-size: 13px; color: var(--text-on-night-muted);
  span { display: inline-flex; align-items: center; gap: 4px; }
}
.capture__dup-foot { margin-top: 22px; font-size: 13px; color: var(--text-on-night-muted); }

/* Result (merged reward) */
.capture__reward {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px 30px;
  text-align: center;
}
.capture__popwrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
/* Rotating ray burst behind epic/legendary pulls. */
.capture__rays {
  position: absolute;
  width: 230px;
  height: 230px;
  border-radius: 50%;
  pointer-events: none;
  background: repeating-conic-gradient(
    from 0deg,
    color-mix(in srgb, var(--_c, var(--gold-300)) 32%, transparent) 0deg 8deg,
    transparent 8deg 22deg
  );
  -webkit-mask: radial-gradient(circle, transparent 46px, #000 54px, transparent 112px);
  mask: radial-gradient(circle, transparent 46px, #000 54px, transparent 112px);
  animation: sg-rays 9s linear infinite;
  opacity: 0.9;
}
.capture__pop {
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Diagonal light sweep across the medallion on rare pulls. */
.capture__sheen {
  position: absolute;
  top: 0;
  left: 0;
  width: 45%;
  height: 100%;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent);
  filter: blur(2px);
  animation: sg-sheen 1.4s ease-in-out 0.5s 2;
}
.capture__pop-inner {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.capture__tag { color: var(--gold-300); margin-bottom: 8px; }
.capture__code { font-family: var(--font-mono); font-weight: var(--fw-bold); font-size: 30px; color: #fff; letter-spacing: -0.01em; }
.capture__sub { color: var(--text-on-night-muted); margin-top: 4px; }
.capture__rarity {
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.capture__rarity--badge {
  margin: 18px 0 12px;
  padding: 5px 16px;
  border-radius: var(--radius-pill);
  border: 1.5px solid currentColor;
}
.capture__statpills { display: flex; gap: 10px; margin-bottom: 20px; }
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
  margin-bottom: 28px;
}

.capture__saveerror {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #ff8a80;
  margin-top: 14px;
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
  .capture__rays,
  .capture__sheen { animation: none; }
  .capture__sheen { display: none; }
}
</style>
