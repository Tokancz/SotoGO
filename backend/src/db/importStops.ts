// Imports PID stops from the official GTFS feed into the `stops` table.
//
// Pipeline (avoids the 102MB stop_times.txt by using PID's route_stops.txt):
//   routes.txt      → line short name + type (tram/metro/bus/…) + color per route
//   route_stops.txt → which routes serve each platform
//   stops.txt       → platforms; grouped into station nodes by id prefix (U306…)
//
// Per station we aggregate the serving lines/categories, average the platform
// coordinates, and flag gyms (metro stations + big interchanges).
//
// Run with: npm run import:stops
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'
import { parse } from 'csv-parse/sync'
import { pool } from './pool.js'

const GTFS_URL = 'https://data.pid.cz/PID_GTFS.zip'
const here = dirname(fileURLToPath(import.meta.url))
const gtfsDir = join(here, '..', '..', '.gtfs')

// GTFS route_type → our category. 0 tram, 1 metro, 2 rail, 3 bus, 4 ferry, 11 trolleybus.
const TYPE_TO_CATEGORY: Record<string, string> = {
  '0': 'tram',
  '1': 'metro',
  '2': 'train',
  '3': 'bus',
  '4': 'ferry',
  '11': 'trolley',
}

const GYM_MIN_LINES = 6 // stations served by this many lines also count as gyms

interface Row {
  [key: string]: string
}

async function ensureGtfs(): Promise<void> {
  if (existsSync(join(gtfsDir, 'stops.txt'))) return
  console.log('Stahuji PID GTFS…')
  const res = await fetch(GTFS_URL)
  if (!res.ok) throw new Error(`Stažení GTFS selhalo: HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  new AdmZip(buf).extractAllTo(gtfsDir, true)
  console.log('GTFS rozbaleno.')
}

function readCsv(file: string): Row[] {
  const text = readFileSync(join(gtfsDir, file), 'utf8')
  return parse(text, { columns: true, skip_empty_lines: true, relax_quotes: true }) as Row[]
}

/** Station node id from a platform stop id: "U306Z101P" → "U306". */
function nodeId(stopId: string): string {
  const m = stopId.match(/^U\d+/)
  return m ? m[0] : stopId
}

interface Station {
  name: string
  lat: number
  lon: number
  n: number // platform count (for averaging)
  routeIds: Set<string>
}

async function main() {
  await ensureGtfs()

  // route_id → { line, category }
  const routes = new Map<string, { line: string; category: string }>()
  for (const r of readCsv('routes.txt')) {
    routes.set(r.route_id, {
      line: r.route_short_name,
      category: TYPE_TO_CATEGORY[r.route_type] ?? 'other',
    })
  }

  // platform stop_id → set of route_ids serving it
  const stopRoutes = new Map<string, Set<string>>()
  for (const rs of readCsv('route_stops.txt')) {
    let set = stopRoutes.get(rs.stop_id)
    if (!set) stopRoutes.set(rs.stop_id, (set = new Set()))
    set.add(rs.route_id)
  }

  // Group platforms into station nodes.
  const stations = new Map<string, Station>()
  for (const s of readCsv('stops.txt')) {
    if (s.location_type && s.location_type !== '0') continue // skip entrances/nodes
    const served = stopRoutes.get(s.stop_id)
    if (!served || served.size === 0) continue // platform with no routes → skip
    const lat = Number(s.stop_lat)
    const lon = Number(s.stop_lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue

    const id = nodeId(s.stop_id)
    let st = stations.get(id)
    if (!st) {
      stations.set(id, (st = { name: s.stop_name, lat: 0, lon: 0, n: 0, routeIds: new Set() }))
    }
    st.lat += lat
    st.lon += lon
    st.n += 1
    for (const rid of served) st.routeIds.add(rid)
  }

  // Build rows for insert.
  const rows = [...stations.entries()].map(([id, st]) => {
    const lineSet = new Set<string>()
    const catSet = new Set<string>()
    for (const rid of st.routeIds) {
      const r = routes.get(rid)
      if (!r) continue
      if (r.line) lineSet.add(r.line)
      if (r.category && r.category !== 'other') catSet.add(r.category)
    }
    const lines = [...lineSet]
    const categories = [...catSet]
    const isGym = categories.includes('metro') || lines.length >= GYM_MIN_LINES
    return {
      id,
      name: st.name,
      lat: +(st.lat / st.n).toFixed(6),
      lon: +(st.lon / st.n).toFixed(6),
      lines,
      categories,
      isGym,
      routeIds: [...st.routeIds],
    }
  })

  // Replace the table contents transactionally, batched.
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query('truncate table stops restart identity')
    const BATCH = 500
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH)
      const values: unknown[] = []
      const tuples = slice.map((r, j) => {
        const o = j * 8
        values.push(r.id, r.name, r.lat, r.lon, r.lines, r.categories, r.isGym, r.routeIds)
        return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})`
      })
      await client.query(
        `insert into stops (gtfs_node_id, name, latitude, longitude, lines, categories, is_gym, route_ids)
         values ${tuples.join(',')}`,
        values,
      )
    }
    await client.query('commit')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }

  const gyms = rows.filter((r) => r.isGym).length
  console.log(`✓ Import zastávek: ${rows.length} stanic (z toho ${gyms} gymů).`)
}

try {
  await main()
} catch (err) {
  console.error('✗ Import zastávek selhal:', err)
  process.exitCode = 1
} finally {
  await pool.end()
}
