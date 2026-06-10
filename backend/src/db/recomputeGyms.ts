// Recomputes which stops are gyms IN PLACE, without a full re-import.
//
// `npm run import:stops` rebuilds the whole stops table (truncate + reinsert),
// which reshuffles stop ids and can't run while visits/gyms reference them. When
// only the GYM RULE changes, this script re-applies it on the existing rows and
// frees any vehicle defending a stop that's no longer a gym.
//
// Gyms are big metro hubs: a metro station also served by many total lines.
// Keep GYM_MIN_HUB_LINES in sync with src/db/importStops.ts.
//
// Run with: npm run recompute:gyms
import { pool } from './pool.js'

const GYM_MIN_HUB_LINES = 9

async function main() {
  const client = await pool.connect()
  try {
    await client.query('begin')

    const upd = await client.query(
      `update stops
          set is_gym = ('metro' = any(categories) and coalesce(array_length(lines, 1), 0) >= $1)`,
      [GYM_MIN_HUB_LINES],
    )

    // Release vehicles defending stops that are no longer gyms, then drop those
    // gym sessions (otherwise recall/battle would target a non-gym stop).
    await client.query(
      `update user_vehicles uv set deployed_stop_id = null, hp = max_hp, hp_updated_at = now()
         from stops s
        where uv.deployed_stop_id = s.id and s.is_gym = false`,
    )
    const freed = await client.query(
      'delete from gym_state g using stops s where g.stop_id = s.id and s.is_gym = false',
    )

    const { rows } = await client.query<{ n: number }>(
      'select count(*)::int n from stops where is_gym = true',
    )
    await client.query('commit')
    console.log(
      `✓ Gymy přepočítány: ${rows[0].n} gymů (z ${upd.rowCount} zastávek), uvolněno ${freed.rowCount} obsazených gymů.`,
    )
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }
}

try {
  await main()
} catch (err) {
  console.error('✗ Přepočet gymů selhal:', err)
  process.exitCode = 1
} finally {
  await pool.end()
}
