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

/** A daily quest from GET /api/me/quests — progress is tracked server-side. */
export interface Quest {
  /** Stable template id, used to claim the reward. */
  id: string;
  title: string;
  /** Related category (drives the accent color), or null for generic. */
  cat: CategoryKey | null;
  icon: string;
  value: number;
  max: number;
  /** XP reward, awarded on claim. */
  reward: number;
  done: boolean;
  /** Whether the reward has already been collected this period. */
  claimed: boolean;
}

export interface Achievement {
  title: string;
  desc: string;
  icon: string;
  tier: Rarity;
  /** Accent color (CSS value). Falls back to the tier color if unset. */
  color?: string;
  unlocked?: boolean;
  value?: number;
  max?: number;
}

/** A catalog ("Pokédex") entry — one per vehicle MODEL. From GET /api/vehicles. */
export interface CatalogVehicle {
  id: string;
  category: CategoryKey;
  /** Full model name, e.g. "Škoda 15T ForCity Alfa". */
  model: string;
  /** Short label, e.g. "15T". */
  shortName: string;
  manufacturer: string;
  operator: string;
  rarity: Rarity;
}

/** A route's track geometry from GET /api/stops/:id/routes. */
export interface RouteGeometry {
  routeId: string;
  line: string;
  category: string;
  /** Ordered [lat, lng] points along the route. */
  points: [number, number][];
}

/** A stop/station from GET /api/stops (PID GTFS, platforms grouped per node). */
export interface ApiStop {
  id: string;
  nodeId: string;
  name: string;
  lat: number;
  lng: number;
  /** Route short names serving the station, e.g. ["A","C","5","9"]. */
  lines: string[];
  /** Vehicle categories serving it, e.g. ["metro","tram","bus"]. */
  categories: string[];
  isGym: boolean;
}

/** One caught physical vehicle (instance), identified by its serial number.
 *  A player can own several of the same model with different serials. */
export interface CollectedVehicle {
  id: string;
  /** The catalog model this instance is an example of. */
  vehicleTypeId: string;
  /** Evidenční číslo (registration number), or null if it wasn't legible. */
  fleetNumber: string | null;
  /** The catch's rolled rarity (per instance), biased by the model's base rarity. */
  rarity: Rarity;
  /** Current HP — heals to maxHp over time when idle; drops to 0 after a lost battle. */
  hp: number;
  maxHp: number;
  attack: number;
  /** Stop id of the gym this vehicle is defending, or null if idle. */
  deployedStopId: string | null;
  /** The player's catch photo (absolute URL), or null. */
  imageUrl: string | null;
  /** ISO timestamp of the catch (for newest-first ordering). */
  foundAt: string;
}

/** A freshly rolled candidate / an existing instance, for the duplicate-serial choice. */
export interface CatchRoll {
  fleetNumber: string | null;
  rarity: Rarity;
  hp: number;
  maxHp: number;
  attack: number;
  imageUrl: string | null;
}

/** Outcome of POST /me/vehicles: a real catch, or a same-serial re-roll to choose. */
export type CatchOutcome =
  | {
      status: 'new';
      awardedXp: number;
      instanceId: string;
      fleetNumber: string | null;
      rarity: Rarity;
      imageUrl: string | null;
      stats: { hp: number; maxHp: number; attack: number };
    }
  | { status: 'duplicate'; existing: CatchRoll & { id: string }; candidate: CatchRoll };

/** A gym's defender + holder (from GET /me/gyms/:stopId). */
export interface GymState {
  holder: { id: string; username: string; avatarUrl: string | null } | null;
  defender: {
    model: string;
    shortName: string;
    rarity: Rarity;
    /** The holder's catch photo of the defending vehicle (absolute URL), or null. */
    imageUrl: string | null;
    hp: number;
    maxHp: number;
    attack: number;
  } | null;
  heldSince: string | null;
  /** Whether the caller is the current holder. */
  isMine: boolean;
}

/** Parameters returned when a battle starts (POST /me/gyms/:stopId/battle/start). */
export interface BattleStart {
  battleId: string;
  defenderHp: number;
  attackerAttack: number;
  /** How long the attacker has to drain the defender (ms). */
  durationMs: number;
  /** Max taps/sec the server will credit (the client caps its own tap rate to match). */
  maxTapsPerSec: number;
}

/** Outcome of resolving a battle (POST /me/gyms/battle/:id/resolve). */
export interface BattleResult {
  won: boolean;
  awardedXp: number;
  /** The defender's HP afterwards (the new defender's if you won), or null if the gym is now open. */
  defenderHp: number | null;
  /** True when the defender vanished mid-battle (recalled/already taken). */
  voided?: boolean;
}

export interface Player {
  name: string;
  handle: string;
  /** Profile picture URL (e.g. from Google), or null. */
  avatarUrl: string | null;
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
