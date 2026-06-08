// Reference-data routes: the vehicle catalog and stops. Public (read-only).
import { Router } from 'express'
import { pool } from '../db/pool.js'
import { asyncHandler } from '../util/asyncHandler.js'

export const catalogRouter = Router()

// GET /api/vehicles — the full vehicle catalog (the "Pokédex").
catalogRouter.get(
  '/vehicles',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(
      `select id, category, model, short_name, manufacturer, operator, rarity
         from vehicle_types
        order by category, short_name`,
    )
    res.json({
      vehicles: rows.map((r) => ({
        id: String(r.id),
        category: r.category,
        model: r.model,
        shortName: r.short_name,
        manufacturer: r.manufacturer,
        operator: r.operator,
        rarity: r.rarity,
      })),
    })
  }),
)

// GET /api/stops — all stops, or nearby with ?near=lat,lng&km=3 (bounding box).
catalogRouter.get(
  '/stops',
  asyncHandler(async (req, res) => {
    const near = typeof req.query.near === 'string' ? req.query.near : ''
    const km = Number(req.query.km ?? 3)
    const gymsOnly = req.query.gyms === '1' || req.query.gyms === 'true'
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

    const where: string[] = []
    const params: unknown[] = []

    if (q) {
      params.push(`%${q}%`)
      where.push(`name ilike $${params.length}`)
    }
    if (near) {
      const [latStr, lngStr] = near.split(',')
      const lat = Number(latStr)
      const lng = Number(lngStr)
      if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(km)) {
        // Rough bounding box: 1° lat ≈ 111 km; longitude scaled by cos(lat).
        const dLat = km / 111
        const dLng = km / (111 * Math.cos((lat * Math.PI) / 180) || 1)
        params.push(lat - dLat, lat + dLat, lng - dLng, lng + dLng)
        where.push(
          `latitude between $${params.length - 3} and $${params.length - 2}`,
          `longitude between $${params.length - 1} and $${params.length}`,
        )
      }
    }
    if (gymsOnly) where.push('is_gym = true')

    const sql = `select id, gtfs_node_id, name, latitude, longitude, lines, categories, is_gym
                   from stops
                  ${where.length ? 'where ' + where.join(' and ') : ''}
                  order by name
                  ${q ? 'limit 12' : ''}`
    const { rows } = await pool.query(sql, params)
    res.json({
      stops: rows.map((r) => ({
        id: String(r.id),
        nodeId: r.gtfs_node_id,
        name: r.name,
        lat: r.latitude,
        lng: r.longitude,
        lines: r.lines,
        categories: r.categories,
        isGym: r.is_gym,
      })),
    })
  }),
)

// GET /api/stops/:id/routes — track geometries for the routes serving a stop.
catalogRouter.get(
  '/stops/:id/routes',
  asyncHandler(async (req, res) => {
    const stop = await pool.query<{ route_ids: string[] }>(
      'select route_ids from stops where id = $1',
      [req.params.id],
    )
    const routeIds = stop.rows[0]?.route_ids ?? []
    if (routeIds.length === 0) return res.json({ routes: [] })

    const { rows } = await pool.query(
      'select route_id, line, category, points from route_geometries where route_id = any($1)',
      [routeIds],
    )
    res.json({
      routes: rows.map((r) => ({
        routeId: r.route_id,
        line: r.line,
        category: r.category,
        points: r.points as [number, number][],
      })),
    })
  }),
)
