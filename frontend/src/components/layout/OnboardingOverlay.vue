<script setup lang="ts">
// First-launch newcomer tutorial: a short intro carousel, then a single coachmark
// spotlighting the camera FAB to prompt the first catch. Shown once (AppLayout
// gates it on a localStorage flag) and dismissable at any point.
import { ref } from 'vue'
import SgIcon from '@/components/SgIcon.vue'
import { fx } from '@/lib/feedback'

const emit = defineEmits<{ done: [] }>()

interface Slide {
  icon: string
  color: string
  title: string
  text: string
}

const slides: Slide[] = [
  {
    icon: 'sparkles',
    color: 'var(--brand)',
    title: 'Vítej v ŠotoGO!',
    text: 'Sbírej reálná vozidla MHD jako v Pokémon GO — tramvaje, autobusy, metro, trolejbusy i vlaky.',
  },
  {
    icon: 'camera',
    color: 'var(--cat-tram)',
    title: 'Foť vozidla',
    text: 'Namiř foťák na vozidlo a appka přečte jeho evidenční číslo, rozpozná model a přidá ho do tvého parku.',
  },
  {
    icon: 'map-pin',
    color: 'var(--cat-metro)',
    title: 'Objevuj a plň výzvy',
    text: 'Navštěvuj zastávky, plň denní výzvy a odemykej achievementy. Za všechno získáváš XP a levely.',
  },
  {
    icon: 'award',
    color: 'var(--xp)',
    title: 'Bojuj o gymy',
    text: 'Nasaď svá vozidla na významné stanice a obsazuj gymy. Drž je co nejdéle a šplhej v žebříčku!',
  },
]

type Phase = 'intro' | 'coach'
const phase = ref<Phase>('intro')
const index = ref(0)

const isLast = () => index.value === slides.length - 1

function next() {
  fx.click()
  if (isLast()) phase.value = 'coach'
  else index.value += 1
}

function finish() {
  fx.click()
  emit('done')
}
</script>

<template>
  <div class="onb" role="dialog" aria-modal="true" aria-label="Úvodní průvodce">
    <!-- Phase 1: intro carousel -->
    <div v-if="phase === 'intro'" class="onb__card">
      <button class="onb__skip" type="button" @click="finish">Přeskočit</button>

      <div class="onb__art" :style="{ background: `color-mix(in srgb, ${slides[index].color} 14%, var(--surface-card))`, color: slides[index].color }">
        <SgIcon :key="index" :name="slides[index].icon" :size="56" class="onb__articon" />
      </div>

      <h2 :key="`t-${index}`" class="onb__title">{{ slides[index].title }}</h2>
      <p :key="`p-${index}`" class="onb__text">{{ slides[index].text }}</p>

      <div class="onb__dots" aria-hidden="true">
        <span v-for="i in slides.length" :key="i" class="onb__dot" :class="{ 'is-on': i - 1 === index }" />
      </div>

      <button class="onb__btn" type="button" @click="next">
        {{ isLast() ? 'Pojďme na to!' : 'Další' }}
        <SgIcon :name="isLast() ? 'check' : 'arrow-right'" :size="18" />
      </button>
    </div>

    <!-- Phase 2: camera-FAB coachmark -->
    <template v-else>
      <span class="onb__spot" aria-hidden="true" />
      <div class="onb__coach">
        <div class="onb__coachcard">
          <SgIcon name="camera" :size="22" class="onb__coachicon" />
          <p class="onb__coachtext">Začni tady — klepni na <b>foťák</b> a vyfoť své první vozidlo!</p>
        </div>
        <SgIcon name="chevron-right" :size="26" class="onb__arrow" />
      </div>
      <button class="onb__got" type="button" @click="finish">Rozumím</button>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

// Above battle/capture (40+) and toasts so the tour is never covered.
.onb {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(11, 15, 20, 0.62);
  backdrop-filter: blur(2px);
}

/* ── Intro carousel ── */
.onb__card {
  position: relative;
  width: 100%;
  max-width: 360px;
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: 26px 22px 22px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.onb__skip {
  position: absolute;
  top: 12px;
  right: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 13px;
  color: var(--text-muted);
  padding: 4px 6px;
  &:hover { color: var(--text-secondary); }
}
.onb__art {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 6px 0 18px;
}
.onb__articon { animation: onb-pop 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.2); }
.onb__title {
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 21px;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.onb__text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
  margin-bottom: 18px;
}
.onb__dots { display: flex; gap: 7px; margin-bottom: 18px; }
.onb__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--border-strong);
  transition: width 0.22s ease, background 0.22s ease;
  &.is-on { width: 20px; border-radius: var(--radius-pill); background: var(--brand); }
}
.onb__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  border: none;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 16px;
  color: var(--text-on-brand);
  background: var(--brand);
  padding: 14px;
  border-radius: var(--radius-lg);
  transition: transform 0.12s ease, background 0.12s ease;
  &:active { transform: scale(0.98); }
  &:hover { background: var(--brand-hover); }
}

/* ── Camera-FAB coachmark ── */
// A spotlight cutout over the FAB (bottom-center) via a huge box-shadow ring.
.onb__spot {
  position: absolute;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 12px);
  transform: translateX(-50%);
  width: 76px;
  height: 76px;
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(11, 15, 20, 0.62), inset 0 0 0 3px var(--brand);
  animation: onb-pulse 1.8s ease-in-out infinite;
}
.onb__coach {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom) + 104px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 24px;
}
.onb__coachcard {
  display: flex;
  align-items: center;
  gap: 11px;
  max-width: 320px;
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: 14px 16px;
}
.onb__coachicon { flex: none; color: var(--brand); }
.onb__coachtext {
  font-size: 14px;
  line-height: 1.45;
  color: var(--text-primary);
  b { color: var(--brand); }
}
.onb__arrow { color: var(--surface-card); transform: rotate(90deg); margin-top: -2px; }
.onb__got {
  position: absolute;
  top: max(env(safe-area-inset-top), 18px);
  left: 50%;
  transform: translateX(-50%);
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 14px;
  padding: 9px 20px;
  border-radius: var(--radius-pill);
  backdrop-filter: blur(4px);
}

@keyframes onb-pop {
  from { transform: scale(0.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes onb-pulse {
  0%, 100% { box-shadow: 0 0 0 9999px rgba(11, 15, 20, 0.62), inset 0 0 0 3px var(--brand); }
  50% { box-shadow: 0 0 0 9999px rgba(11, 15, 20, 0.62), inset 0 0 0 5px var(--brand); }
}
@media (prefers-reduced-motion: reduce) {
  .onb__articon, .onb__spot { animation: none; }
}
</style>
