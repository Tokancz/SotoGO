<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import SgIcon from '@/components/SgIcon.vue'

defineProps<{ level: number }>()
const emit = defineEmits<{ close: [] }>()

// Auto-dismiss so it never blocks play; a tap closes it sooner.
let t: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  t = setTimeout(() => emit('close'), 3800)
})
onBeforeUnmount(() => clearTimeout(t))
</script>

<template>
  <div class="lvlup" role="dialog" aria-modal="true" aria-label="Nový level" @click="emit('close')">
    <div class="lvlup__stage">
      <span class="lvlup__rays" aria-hidden="true" />
      <div class="lvlup__badge sg-reward-pop">
        <span class="lvlup__num">{{ level }}</span>
        <SgIcon class="lvlup__star" name="sparkles" :size="22" />
      </div>
    </div>
    <div class="eyebrow lvlup__tag sg-rise" :style="{ '--sg-rise-delay': '0.2s' }">Level up!</div>
    <div class="lvlup__title sg-rise" :style="{ '--sg-rise-delay': '0.28s' }">Dosáhl jsi levelu {{ level }}</div>
    <div class="lvlup__hint sg-rise" :style="{ '--sg-rise-delay': '0.4s' }">Ťukni pro pokračování</div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/abstracts' as *;

.lvlup {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  color: #fff;
  background: radial-gradient(120% 80% at 50% 35%, #1a2330, rgba(8, 12, 16, 0.96));
  animation: lvlup-fade 0.3s ease both;
}
@keyframes lvlup-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.lvlup__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}
.lvlup__rays {
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  pointer-events: none;
  background: repeating-conic-gradient(
    from 0deg,
    color-mix(in srgb, var(--xp) 36%, transparent) 0deg 7deg,
    transparent 7deg 20deg
  );
  -webkit-mask: radial-gradient(circle, transparent 58px, #000 66px, transparent 128px);
  mask: radial-gradient(circle, transparent 58px, #000 66px, transparent 128px);
  animation: sg-rays 9s linear infinite;
}
.lvlup__badge {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 35%, var(--gold-300), var(--xp));
  color: #4a2d00;
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--xp) 16%, transparent), 0 16px 40px rgba(0, 0, 0, 0.5);
}
.lvlup__num {
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 56px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.lvlup__star {
  position: absolute;
  top: 10px;
  right: 16px;
  color: #fff;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
}
.lvlup__tag { color: var(--gold-300); }
.lvlup__title { font-family: var(--font-display); font-weight: var(--fw-bold); font-size: 22px; }
.lvlup__hint { font-size: 13px; color: var(--text-on-night-muted, #b9c2cc); }

@media (prefers-reduced-motion: reduce) {
  .lvlup__rays { animation: none; }
}
</style>
