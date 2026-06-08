// Seeds the vehicle catalog from src/data/vehicleTypes.ts.
// Idempotent: upserts on (category, short_name). Run with: npm run seed:vehicles
import { pool } from './pool.js'
import { VEHICLE_TYPES } from '../data/vehicleTypes.js'

try {
  let upserted = 0
  for (const v of VEHICLE_TYPES) {
    await pool.query(
      `insert into vehicle_types (category, model, short_name, manufacturer, operator, rarity)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (category, short_name)
       do update set model = excluded.model,
                     manufacturer = excluded.manufacturer,
                     operator = excluded.operator,
                     rarity = excluded.rarity`,
      [v.category, v.model, v.shortName, v.manufacturer, v.operator, v.rarity],
    )
    upserted++
  }
  console.log(`✓ Katalog vozidel: ${upserted} typů.`)
} catch (err) {
  console.error('✗ Seed katalogu selhal:', err)
  process.exitCode = 1
} finally {
  await pool.end()
}
