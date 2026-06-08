// ŠotoGO — Fleet number → model resolver.
//
// The capture flow's OCR reads an *evidenční číslo* (the registration number
// painted on the vehicle, e.g. "9325"); the collection catalog is keyed by
// MODEL (e.g. "15T"). Prague tram numbering maps cleanly to type, so we encode
// those confident ranges here to auto-resolve a scan. Anything outside the map
// (most buses/metro, museum pieces) falls back to the manual model picker in
// the capture sheet — see CaptureSheet.vue.
//
// `shortName` MUST match the catalog (backend/src/data/vehicleTypes.ts). This is
// a curated STARTER set of well-known DPP ranges — review and extend it.

import type { CategoryKey } from '@/types/game'

interface FleetRange {
  /** Inclusive evidenční-číslo range [min, max]. */
  min: number
  max: number
  category: CategoryKey
  /** Catalog shortName, e.g. "15T". */
  shortName: string
}

// DPP Prague trams — the ranges where number → type is well-defined.
const FLEET_RANGES: FleetRange[] = [
  { min: 8009, max: 8106, category: 'tram', shortName: 'T3M' },
  { min: 8151, max: 8170, category: 'tram', shortName: 'T3R.PV' },
  { min: 8201, max: 8580, category: 'tram', shortName: 'T3R.P' },
  { min: 8601, max: 8757, category: 'tram', shortName: 'T6A5' },
  { min: 9001, max: 9095, category: 'tram', shortName: 'KT8D5' },
  { min: 9111, max: 9152, category: 'tram', shortName: '14T' },
  { min: 9201, max: 9350, category: 'tram', shortName: '15T' },
  { min: 9401, max: 9560, category: 'tram', shortName: '52T' },
]

export interface FleetMatch {
  category: CategoryKey
  shortName: string
}

/** Resolve a recognized evidenční číslo to a catalog model, or null if unknown. */
export function resolveFleetNumber(num: number): FleetMatch | null {
  const hit = FLEET_RANGES.find((r) => num >= r.min && num <= r.max)
  return hit ? { category: hit.category, shortName: hit.shortName } : null
}

/** Best-effort category guess for the manual picker's default filter. */
export function guessCategory(num: number): CategoryKey | null {
  // Prague trams are 4-digit numbers starting 8 or 9.
  if (num >= 8000 && num <= 9999) return 'tram'
  return null
}
