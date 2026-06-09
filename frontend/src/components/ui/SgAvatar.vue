<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    name?: string
    size?: number
    level?: number
    ring?: boolean
  }>(),
  { name: '', size: 44, ring: false },
)

const initials = computed(() =>
  props.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase(),
)
</script>

<template>
  <span class="sg-avatar" :class="{ 'sg-avatar--ring': ring }" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="src" class="sg-avatar__img" :src="src" :alt="name" loading="lazy" decoding="async" />
    <span v-else class="sg-avatar__fallback" :style="{ fontSize: `${size * 0.4}px` }">{{ initials }}</span>
    <span v-if="level != null" class="sg-avatar__level">{{ level }}</span>
  </span>
</template>

<style lang="scss" scoped>
.sg-avatar { position: relative; display: inline-flex; flex: none; }
.sg-avatar__img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  background: var(--green-100);
}
.sg-avatar__fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  color: #fff;
  background: var(--brand);
}
.sg-avatar--ring {
  .sg-avatar__img,
  .sg-avatar__fallback {
    box-shadow: 0 0 0 3px var(--surface-card), 0 0 0 5px var(--brand);
  }
}
.sg-avatar__level {
  position: absolute;
  bottom: -3px;
  right: -3px;
  background: var(--xp);
  color: #4a2d00;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  border-radius: var(--radius-pill);
  border: 2px solid var(--surface-card);
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  line-height: 1;
}
</style>
