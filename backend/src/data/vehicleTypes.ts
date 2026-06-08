// ŠotoGO — Vehicle catalog (the collectible "Pokédex").
// One entry per vehicle MODEL currently/recently in service in Prague (PID).
// Rarity is a game-design call (common = everyday workhorse … legendary =
// historic/museum/unique). This is a curated STARTER set — fleets change, so
// review and extend it. Seed into the DB with: npm run seed:vehicles
//
// category: tram | bus | metro | trolley | train
// rarity:   common | rare | epic | legendary

export type VehicleCategory = 'tram' | 'bus' | 'metro' | 'trolley' | 'train'
export type VehicleRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface VehicleType {
  category: VehicleCategory
  model: string
  shortName: string
  manufacturer: string
  operator: string
  rarity: VehicleRarity
}

export const VEHICLE_TYPES: VehicleType[] = [
  // ── Trams (DPP) ──
  { category: 'tram', model: 'Tatra T3R.P', shortName: 'T3R.P', manufacturer: 'ČKD Tatra / DPP', operator: 'DPP', rarity: 'common' },
  { category: 'tram', model: 'Tatra T3R.PV', shortName: 'T3R.PV', manufacturer: 'ČKD Tatra / DPP', operator: 'DPP', rarity: 'rare' },
  { category: 'tram', model: 'Tatra T3M', shortName: 'T3M', manufacturer: 'ČKD Tatra', operator: 'DPP', rarity: 'rare' },
  { category: 'tram', model: 'Tatra T6A5', shortName: 'T6A5', manufacturer: 'ČKD Tatra', operator: 'DPP', rarity: 'rare' },
  { category: 'tram', model: 'Tatra KT8D5.RN2P', shortName: 'KT8D5', manufacturer: 'ČKD Tatra', operator: 'DPP', rarity: 'rare' },
  { category: 'tram', model: 'Škoda 14T', shortName: '14T', manufacturer: 'Škoda Transportation', operator: 'DPP', rarity: 'common' },
  { category: 'tram', model: 'Škoda 15T ForCity Alfa', shortName: '15T', manufacturer: 'Škoda Transportation', operator: 'DPP', rarity: 'common' },
  { category: 'tram', model: 'Škoda 52T ForCity Plus', shortName: '52T', manufacturer: 'Škoda Transportation', operator: 'DPP', rarity: 'epic' },
  { category: 'tram', model: 'Tatra T1 (historická)', shortName: 'T1', manufacturer: 'ČKD Tatra', operator: 'DPP', rarity: 'legendary' },
  { category: 'tram', model: 'Tatra T3 Coupé', shortName: 'T3 Coupé', manufacturer: 'ČKD Tatra / DPP', operator: 'DPP', rarity: 'legendary' },

  // ── Metro (Metro Praha / DPP) ──
  { category: 'metro', model: 'Metrovagonmaš 81-71M', shortName: '81-71M', manufacturer: 'Metrovagonmaš', operator: 'Metro Praha', rarity: 'rare' },
  { category: 'metro', model: 'Siemens M1', shortName: 'M1', manufacturer: 'Siemens / ČKD', operator: 'Metro Praha', rarity: 'epic' },
  { category: 'metro', model: 'Škoda M2 (linka D)', shortName: 'M2', manufacturer: 'Škoda Transportation', operator: 'Metro Praha', rarity: 'legendary' },

  // ── Buses — Prague city (DPP) ──
  { category: 'bus', model: 'SOR NB 12', shortName: 'NB 12', manufacturer: 'SOR Libchavy', operator: 'DPP', rarity: 'common' },
  { category: 'bus', model: 'SOR NS 12', shortName: 'NS 12', manufacturer: 'SOR Libchavy', operator: 'DPP', rarity: 'common' },
  { category: 'bus', model: 'SOR NS 18', shortName: 'NS 18', manufacturer: 'SOR Libchavy', operator: 'DPP', rarity: 'rare' },
  { category: 'bus', model: 'SOR NS 12 electric', shortName: 'NS 12 el.', manufacturer: 'SOR Libchavy', operator: 'DPP', rarity: 'epic' },
  { category: 'bus', model: 'Solaris Urbino 12', shortName: 'Urbino 12', manufacturer: 'Solaris', operator: 'DPP', rarity: 'common' },
  { category: 'bus', model: 'Solaris Urbino 18', shortName: 'Urbino 18', manufacturer: 'Solaris', operator: 'DPP', rarity: 'rare' },
  { category: 'bus', model: 'Iveco Urbanway 12M', shortName: 'Urbanway', manufacturer: 'Iveco Bus', operator: 'DPP', rarity: 'rare' },
  { category: 'bus', model: "MAN Lion's City", shortName: "Lion's City", manufacturer: 'MAN', operator: 'DPP', rarity: 'rare' },
  { category: 'bus', model: 'Mercedes-Benz Conecto', shortName: 'Conecto', manufacturer: 'Mercedes-Benz', operator: 'DPP', rarity: 'rare' },
  { category: 'bus', model: 'Karosa B961 (historický)', shortName: 'B961', manufacturer: 'Karosa', operator: 'DPP', rarity: 'epic' },

  // ── Buses — PID regional ──
  { category: 'bus', model: 'Iveco Crossway LE', shortName: 'Crossway', manufacturer: 'Iveco Bus', operator: 'PID', rarity: 'common' },
  { category: 'bus', model: 'SOR C 10.5', shortName: 'C 10.5', manufacturer: 'SOR Libchavy', operator: 'PID', rarity: 'common' },
  { category: 'bus', model: 'Mercedes-Benz Citaro', shortName: 'Citaro', manufacturer: 'Mercedes-Benz', operator: 'PID', rarity: 'rare' },

  // ── Trolleybuses (DPP — Prague network revived on lines 58/59) ──
  { category: 'trolley', model: 'Škoda 24Tr', shortName: '24Tr', manufacturer: 'Škoda Transportation', operator: 'DPP', rarity: 'rare' },
  { category: 'trolley', model: 'Škoda 32Tr', shortName: '32Tr', manufacturer: 'Škoda Transportation', operator: 'DPP', rarity: 'rare' },
  { category: 'trolley', model: 'Škoda 33Tr (bateriový)', shortName: '33Tr', manufacturer: 'Škoda Transportation', operator: 'DPP', rarity: 'epic' },
  { category: 'trolley', model: 'SOR TNB 12 (bateriový)', shortName: 'TNB 12', manufacturer: 'SOR Libchavy', operator: 'DPP', rarity: 'epic' },

  // ── Trains (Esko Praha & dálkové) ──
  { category: 'train', model: 'Škoda 471 CityElefant', shortName: '471', manufacturer: 'Škoda Transportation', operator: 'ČD', rarity: 'common' },
  { category: 'train', model: 'Škoda 440 RegioPanter', shortName: '440', manufacturer: 'Škoda Transportation', operator: 'ČD', rarity: 'rare' },
  { category: 'train', model: 'Škoda 640 RegioPanter', shortName: '640', manufacturer: 'Škoda Transportation', operator: 'ČD', rarity: 'rare' },
  { category: 'train', model: '814 Regionova', shortName: '814', manufacturer: 'Pars nova', operator: 'ČD', rarity: 'rare' },
  { category: 'train', model: 'Stadler FLIRT', shortName: 'FLIRT', manufacturer: 'Stadler', operator: 'RegioJet / Leo Express', rarity: 'epic' },
  { category: 'train', model: 'Škoda 380 / railjet', shortName: '380', manufacturer: 'Škoda Transportation', operator: 'ČD', rarity: 'legendary' },
]
