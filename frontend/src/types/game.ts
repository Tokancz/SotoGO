// ŠotoGO — Game domain types
// Mirrors the design handoff data model (window.SG_DATA). See docs/DATA-MODEL.md.

/** Vehicle categories — the "Pokédex" categories. */
export type CategoryKey = 'tram' | 'bus' | 'metro' | 'trolley' | 'train';

/** Collection rarity tiers (also reused for achievement tiers). */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Prague metro line identifiers. */
export type MetroLine = 'A' | 'B' | 'C';

export interface Category {
  key: CategoryKey;
  /** Singular label, e.g. "Tramvaj". */
  label: string;
  /** Plural label, e.g. "Tramvaje". */
  plural: string;
  /** CSS color token, e.g. "var(--cat-tram)". */
  color: string;
  /** Soft tint token. */
  soft: string;
  /** Lucide icon name, e.g. "tram-front". */
  icon: string;
}

export interface Vehicle {
  cat: CategoryKey;
  /** Vehicle type, e.g. "15T". */
  type: string;
  /** Evidenční číslo (registration number), e.g. "9325". */
  number: string;
  operator: string;
  rarity: Rarity;
  /** Czech-formatted date found, e.g. "14. 5. 2026". */
  found: string;
  isNew?: boolean;
}

export interface Stop {
  name: string;
  lines: MetroLine[];
  lat: number;
  lng: number;
  /** XP awarded on first visit. */
  xp: number;
  visited: boolean;
  /** Pre-formatted distance label, e.g. "320 m". */
  dist: string;
}

export interface Challenge {
  title: string;
  /** Related category (drives the accent color), or null for generic. */
  cat: CategoryKey | null;
  icon: string;
  value: number;
  max: number;
  /** XP reward. */
  reward: number;
  done: boolean;
}

export interface Achievement {
  title: string;
  desc: string;
  icon: string;
  tier: Rarity;
  unlocked?: boolean;
  value?: number;
  max?: number;
}

export interface Player {
  name: string;
  handle: string;
  level: number;
  /** XP within the current level. */
  xp: number;
  /** XP needed to reach the next level. */
  xpMax: number;
  /** Lifetime cumulative XP. */
  xpTotal: number;
  vehicles: number;
  stops: number;
  /** Daily streak length. */
  streak: number;
}
