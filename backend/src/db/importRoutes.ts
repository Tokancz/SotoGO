// Imports one representative track geometry per route, for drawing colored
// tracks when a stop is tapped.
//
//   routes.txt → line name + category per route
//   trips.txt  → the shape_id used by each route (most frequent = main variant)
//   shapes.txt → the polyline points for those shapes (streamed; 140MB)
//
// Run with: npm run import:routes  (re-downloads the GTFS feed if shapes.txt is
// missing — it's large, so the stops importer trims it by default).
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'
import { parse } from 'csv-parse/sync'
import { pool } from './pool.js'

const GTFS_URL = 'https://data.pid.cz/PID_GTFS.zip'
const here = dirname(fileURLToPath(import.meta.url))
const gtfsDir = join(here, '..', '..', '.gtfs')

const TYPE_TO_CATEGORY: Record<string, string> = {
  '0': 'tram',
  '1': 'metro',
  '2': 'train',
  '3': 'bus',
  '11': 'trolley',
}

interface Row {
  [key: string]: string
}

async function ensureShapes(): Promise<void> {
  if (existsSync(join(gtfsDir, 'shapes.txt'))) return
  console.log('Stahuji PID GTFS (kvůli shapes.txt)…')
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

async function main() {
  await ensureShapes()

  // route_id → { line, category }
  const routeMeta = new Map<string, { line: string; category: string }>()
  for (const r of readCsv('routes.txt')) {
    const category = TYPE_TO_CATEGORY[r.route_type]
    if (category) routeMeta.set(r.route_id, { line: r.route_short_name, category })
  }

  // route_id → chosen shape_id (the one used by the most trips).
  const shapeCounts = new Map<string, Map<string, number>>()
  for (const t of readCsv('trips.txt')) {
    if (!t.shape_id || !routeMeta.has(t.route_id)) continue
    let counts = shapeCounts.get(t.route_id)
    if (!counts) shapeCounts.set(t.route_id, (counts = new Map()))
    counts.set(t.shape_id, (counts.get(t.shape_id) ?? 0) + 1)
  }
  const routeShape = new Map<string, string>()
  const neededShapes = new Set<string>()
  for (const [routeId, counts] of shapeCounts) {
    let best = ''
    let bestN = -1
    for (const [shapeId, n] of counts) if (n > bestN) ((best = shapeId), (bestN = n))
    if (best) {
      routeShape.set(routeId, best)
      neededShapes.add(best)
    }
  }

  // Stream shapes.txt, keeping only the points for shapes we actually need.
  const shapePoints = new Map<string, { seq: number; lat: number; lon: number }[]>()
  const rl = createInterface({ input: createReadStream(join(gtfsDir, 'shapes.txt')) })
  let header: string[] | null = null
  let iId = 0
  let iLat = 0
  let iLon = 0
  let iSeq = 0
  for await (const line of rl) {
    if (!header) {
      header = line.split(',')
      iId = header.indexOf('shape_id')
      iLat = header.indexOf('shape_pt_lat')
      iLon = header.indexOf('shape_pt_lon')
      iSeq = header.indexOf('shape_pt_sequence')
      continue
    }
    if (!line) continue
    const c = line.split(',')
    const id = c[iId]
    if (!neededShapes.has(id)) continue
    let pts = shapePoints.get(id)
    if (!pts) shapePoints.set(id, (pts = []))
    pts.push({ seq: Number(c[iSeq]), lat: Number(c[iLat]), lon: Number(c[iLon]) })
  }

  // Build one row per route that has a usable shape.
  const rows = [...routeShape.entries()].flatMap(([routeId, shapeId]) => {
    const pts = shapePoints.get(shapeId)
    const meta = routeMeta.get(routeId)
    if (!pts || pts.length < 2 || !meta) return []
    pts.sort((a, b) => a.seq - b.seq)
    const points = pts.map((p) => [p.lat, p.lon])
    return [{ routeId, line: meta.line, category: meta.category, points }]
  })

  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query('truncate table route_geometries')
    const BATCH = 200
    for (let i = 0; i < rows.length; i += BATCH) {
      const slice = rows.slice(i, i + BATCH)
      const values: unknown[] = []
      const tuples = slice.map((r, j) => {
        const o = j * 4
        values.push(r.routeId, r.line, r.category, JSON.stringify(r.points))
        return `($${o + 1},$${o + 2},$${o + 3},$${o + 4})`
      })
      await client.query(
        `insert into route_geometries (route_id, line, category, points) values ${tuples.join(',')}`,
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

  console.log(`✓ Import tras: ${rows.length} linek s geometrií.`)
}

try {
  await main()
} catch (err) {
  console.error('✗ Import tras selhal:', err)
  process.exitCode = 1
} finally {
  await pool.end()
}
