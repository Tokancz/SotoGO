// ŠotoGO — Seed data
// Reference data that doesn't have a backend yet: category UI metadata (CATS)
// and the achievement DEFINITIONS. Vehicles, stops and daily quests now come
// from the API; swap achievements too when their backend lands (see docs/BACKEND.md).

import type { Achievement, Category, CategoryKey } from '@/types/game'

export const CATS: Record<CategoryKey, Category> = {
  tram:    { key: 'tram',    label: 'Tramvaj',   plural: 'Tramvaje',   color: 'var(--cat-tram)',    soft: 'var(--cat-tram-soft)',    icon: 'tram-front' },
  bus:     { key: 'bus',     label: 'Autobus',   plural: 'Autobusy',   color: 'var(--cat-bus)',     soft: 'var(--cat-bus-soft)',     icon: 'bus' },
  metro:   { key: 'metro',   label: 'Metro',     plural: 'Metro',      color: 'var(--cat-metro)',   soft: 'var(--cat-metro-soft)',   icon: 'train-front-tunnel' },
  trolley: { key: 'trolley', label: 'Trolejbus', plural: 'Trolejbusy', color: 'var(--cat-trolley)', soft: 'var(--cat-trolley-soft)', icon: 'bus-front' },
  train:   { key: 'train',   label: 'Vlak',      plural: 'Vlaky',      color: 'var(--cat-train)',   soft: 'var(--cat-train-soft)',   icon: 'train-front' },
}

export const ACHIEVEMENTS: Achievement[] = [
  { title: 'Lovec tramvají',  desc: 'Najdi 50 tramvají',    icon: 'tram-front',        tier: 'epic',      unlocked: true },
  { title: 'Metro expert',    desc: 'Všechny soupravy',     icon: 'train-front-tunnel', tier: 'rare',      unlocked: true },
  { title: 'První objev',     desc: 'Vyfoť 1. vozidlo',     icon: 'sparkles',          tier: 'common',    unlocked: true },
  { title: 'Stálý cestující', desc: '7denní série',         icon: 'flame',             tier: 'rare',      unlocked: true },
  { title: 'Sběratel',        desc: 'Najdi 100 vozidel',    icon: 'layers',            tier: 'epic',      value: 74,  max: 100 },
  { title: 'Šotouš roku',     desc: 'Navštiv 500 zastávek', icon: 'crown',             tier: 'legendary', value: 128, max: 500 },
]
