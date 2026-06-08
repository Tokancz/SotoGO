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

    const where: string[] = []
    const params: unknown[] = []

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
                  order by name`
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
