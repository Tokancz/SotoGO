<script setup lang="ts">
import { computed } from 'vue'
import SgIcon from '@/components/SgIcon.vue'
import type { Rarity } from '@/types/game'

const RARITY: Record<Rarity, string> = {
  common: 'var(--rarity-common)',
  rare: 'var(--rarity-rare)',
  epic: 'var(--rarity-epic)',
  legendary: 'var(--rarity-legendary)',
}

const props = withDefaults(
  defineProps<{
    type?: string
    number?: string
    operator?: string
    category?: string
    categoryColor?: string
    categoryIcon?: string
    image?: string
    rarity?: Rarity
    found?: string
    isNew?: boolean
    locked?: boolean
    compact?: boolean
  }>(),
  { categoryColor: 'var(--cat-tram)', categoryIcon: 'tram-front' },
)

const vars = computed(() => ({
  '--_cat': props.categoryColor,
  ...(props.rarity ? { '--_rarity': RARITY[props.rarity] } : {}),
}))
</script>

<template>
  <div v-if="locked" class="sg-vcard sg-vcard--locked" :class="{ 'sg-vcard--compact': compact }" :style="vars">
    <div v-if="compact" class="sg-vcard__lead"><SgIcon name="lock" /></div>
    <div v-else class="sg-vcard__media">
      <div class="sg-vcard__lockwrap"><SgIcon name="lock" /></div>
    </div>
    <div class="sg-vcard__body">
      <span class="sg-vcard__unknown">???</span>
      <span class="sg-vcard__operator">Zatím neobjeveno</span>
    </div>
  </div>

  <button v-else type="button" class="sg-vcard" :class="{ 'sg-vcard--compact': compact }" :style="vars">
    <div v-if="compact" class="sg-vcard__lead">
      <img v-if="image" :src="image" :alt="`${type} ${number}`" />
      <SgIcon v-else :name="categoryIcon" />
    </div>
    <div v-else class="sg-vcard__media">
      <img v-if="image" :src="image" :alt="`${type} ${number}`" />
      <div v-else class="sg-vcard__media-fallback"><SgIcon :name="categoryIcon" /></div>
      <span class="sg-vcard__catchip"><SgIcon :name="categoryIcon" />{{ category }}</span>
      <span v-if="rarity" class="sg-vcard__rarity"><SgIcon name="star" /></span>
      <span v-if="isNew" class="sg-vcard__new">Nový objev!</span>
    </div>
    <div class="sg-vcard__body">
      <span class="sg-vcard__code">{{ type }}<template v-if="number"> #{{ number }}</template></span>
      <span v-if="operator" class="sg-vcard__operator">{{ operator }}</span>
      <span v-if="found" class="sg-vcard__meta"><SgIcon name="calendar-check" />{{ found }}</span>
    </div>
    <div v-if="compact" class="sg-vcard__trail">
      <span v-if="isNew" class="sg-vcard__newdot" title="Nový objev!" />
      <span class="sg-vcard__catchip sg-vcard__catchip--inline"><SgIcon :name="categoryIcon" />{{ category }}</span>
      <span v-if="rarity" class="sg-vcard__rarity sg-vcard__rarity--inline"><SgIcon name="star" /></span>
    </div>
  </button>
</template>

<style lang="scss" scoped>
.sg-vcard {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  box-shadow: inset 0 0 0 2px var(--_cat, var(--border-default)), var(--shadow-sm);
  overflow: clip;
  cursor: pointer;
  text-align: left;
  border: none;
  padding: 0;
  font-family: var(--font-body);
  transition: transform 0.14s cubic-bezier(0.3, 1, 0.5, 1), box-shadow 0.14s ease;

  &:hover { transform: translateY(-3px); box-shadow: inset 0 0 0 2px var(--_cat), var(--shadow-lg); }
  &:active { transform: translateY(0); }
}
.sg-vcard__media { position: relative; aspect-ratio: 4 / 3; background: var(--surface-sunken); overflow: hidden; border-radius: calc(var(--radius-lg) - 2px) calc(var(--radius-lg) - 2px) 0 0; }
.sg-vcard__media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sg-vcard__media-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: color-mix(in srgb, var(--_cat) 55%, var(--slate-300));
  background: color-mix(in srgb, var(--_cat) 8%, white);
  svg { width: 42%; height: 42%; }
}
.sg-vcard__catchip {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--_cat);
  color: #fff;
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: 11px;
  padding: 4px 9px;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
  svg { width: 13px; height: 13px; }
}
.sg-vcard__rarity {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--_rarity, var(--rarity-common));
  box-shadow: var(--shadow-sm);
  svg { width: 13px; height: 13px; color: #fff; }
}
.sg-vcard__new {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: var(--xp);
  color: #4a2d00;
  font-family: var(--font-display);
  font-weight: var(--fw-bold);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-gold);
}
.sg-vcard__body { padding: 12px 13px 14px; display: flex; flex-direction: column; gap: 3px; }
.sg-vcard__code {
  font-family: var(--font-mono);
  font-weight: var(--fw-bold);
  font-size: 16px;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.sg-vcard__operator { font-size: 12px; color: var(--text-muted); }
.sg-vcard__meta {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  svg { width: 12px; height: 12px; }
}

.sg-vcard--locked {
  box-shadow: inset 0 0 0 2px var(--border-default);
  cursor: default;
  .sg-vcard__media { background: var(--surface-sunken); }
  &:hover { transform: none; box-shadow: inset 0 0 0 2px var(--border-default); }
}
.sg-vcard__lockwrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--slate-300);
  svg { width: 30px; height: 30px; }
}
.sg-vcard__unknown { font-family: var(--font-mono); font-size: 14px; color: var(--text-muted); }

/* Compact (list) layout — no media block, single horizontal row. */
.sg-vcard--compact {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;

  &:hover { transform: none; box-shadow: inset 0 0 0 2px var(--_cat), var(--shadow-sm); }
  &.sg-vcard--locked:hover { box-shadow: inset 0 0 0 2px var(--border-default); }

  .sg-vcard__body { padding: 0; flex: 1; min-width: 0; }
  .sg-vcard__code, .sg-vcard__operator { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}
.sg-vcard__lead {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: color-mix(in srgb, var(--_cat) 55%, var(--slate-300));
  background: color-mix(in srgb, var(--_cat) 8%, white);
  svg { width: 22px; height: 22px; }
  img { width: 100%; height: 100%; object-fit: cover; }
}
.sg-vcard--locked .sg-vcard__lead { color: var(--slate-300); background: var(--surface-sunken); }
.sg-vcard__trail { flex: none; display: flex; align-items: center; gap: 8px; }
.sg-vcard__catchip--inline {
  position: static;
  box-shadow: none;
}
.sg-vcard__rarity--inline { position: static; top: auto; right: auto; }
.sg-vcard__newdot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--xp);
  box-shadow: var(--shadow-gold);
}
</style>
