// Photo-based vehicle recognition for the capture flow.
//
// Sends the catch photo to a Claude vision model and asks it to (a) read the
// painted evidenční číslo if legible and (b) name the most likely catalog
// model(s) by appearance. The model is forced to call `report_vehicle` with a
// schema whose `shortName` is an enum of the live catalog, so it can only ever
// return a model the game actually knows about.
import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../db/pool.js'
import { config } from '../config.js'

export type Category = 'tram' | 'bus' | 'metro' | 'trolley' | 'train'

export interface RecognizeCandidate {
  shortName: string
  /** Model's self-reported likelihood, 0–1. */
  confidence: number
}

export interface RecognizeResult {
  /** Whether the photo actually shows a Prague public-transport vehicle. */
  isPublicTransport: boolean
  /** Painted registration digits, or "" if none were legible. */
  fleetNumber: string
  category: Category
  /** Up to 3 catalog models, most likely first. */
  candidates: RecognizeCandidate[]
}

export function recognitionEnabled(): boolean {
  return Boolean(config.anthropicApiKey)
}

let client: Anthropic | null = null
function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: config.anthropicApiKey })
  return client
}

interface CatalogRow {
  category: Category
  short_name: string
  model: string
  manufacturer: string
}

// Cache the catalog briefly — it's static, and recognition shouldn't hit the DB
// on every scan just to rebuild the same prompt.
let catalogCache: { rows: CatalogRow[]; at: number } | null = null
const CATALOG_TTL_MS = 5 * 60_000

async function catalog(): Promise<CatalogRow[]> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache.rows
  const { rows } = await pool.query<CatalogRow>(
    `select category, short_name, model, manufacturer
       from vehicle_types order by category, short_name`,
  )
  catalogCache = { rows, at: Date.now() }
  return rows
}

function buildSystem(rows: CatalogRow[]): string {
  const lines = rows.map((r) => `${r.category} | ${r.short_name} | ${r.model} | ${r.manufacturer}`)
  return [
    'You identify Prague public-transport vehicles (trams, buses, metro, trolleybuses, trains) from a single photo, for a collecting game.',
    '',
    'Catalog (category | shortName | model | manufacturer):',
    ...lines,
    '',
    'From the photo:',
    '1. Decide whether it actually shows a Prague public-transport vehicle (tram, bus, metro, trolleybus, or train). If it shows anything else (a person, animal, car, building, scenery, a screenshot, etc.), set isPublicTransport to false, fleetNumber to "", and candidates to an empty array.',
    '2. Read the painted evidenční číslo (fleet registration number) if any digits are clearly legible — digits only, no spaces.',
    "3. Identify the most likely catalog model(s) by the vehicle's appearance. Use only shortName values from the catalog, most-likely first, at most 3. If two visually near-identical variants are plausible, include both.",
    'Always call report_vehicle. If no number is legible, set fleetNumber to "".',
  ].join('\n')
}

const MEDIA_TYPES: Record<string, 'image/jpeg' | 'image/png' | 'image/webp'> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
}

/** Recognize a vehicle from a catch photo. Throws if recognition isn't configured. */
export async function recognizeVehicle(buffer: Buffer, mime: string): Promise<RecognizeResult> {
  if (!recognitionEnabled()) throw new Error('recognition_not_configured')

  const rows = await catalog()
  const shortNames = [...new Set(rows.map((r) => r.short_name))]

  const res = await anthropic().messages.create({
    model: config.recognizeModel,
    max_tokens: 512,
    system: buildSystem(rows),
    tools: [
      {
        name: 'report_vehicle',
        description: 'Report the identified vehicle and any legible fleet number.',
        input_schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            isPublicTransport: {
              type: 'boolean',
              description: 'True only if the photo shows a Prague public-transport vehicle.',
            },
            fleetNumber: {
              type: 'string',
              description: 'Painted registration digits, or "" if not legible.',
            },
            category: { type: 'string', enum: ['tram', 'bus', 'metro', 'trolley', 'train'] },
            candidates: {
              type: 'array',
              description: 'Up to 3 catalog models, most likely first.',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  shortName: { type: 'string', enum: shortNames },
                  confidence: { type: 'number', description: 'Likelihood 0–1.' },
                },
                required: ['shortName', 'confidence'],
              },
            },
          },
          required: ['isPublicTransport', 'fleetNumber', 'category', 'candidates'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'report_vehicle' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: MEDIA_TYPES[mime] ?? 'image/jpeg',
              data: buffer.toString('base64'),
            },
          },
          { type: 'text', text: 'Identify this vehicle.' },
        ],
      },
    ],
  })

  const block = res.content.find((b) => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('recognition_no_result')
  const input = block.input as Partial<RecognizeResult>

  return {
    // Default to true if the model omits it, so a missing field never blocks a
    // genuine catch — only an explicit `false` rejects the photo.
    isPublicTransport: input.isPublicTransport !== false,
    fleetNumber: typeof input.fleetNumber === 'string' ? input.fleetNumber.replace(/\D/g, '') : '',
    category: (input.category ?? 'tram') as Category,
    candidates: Array.isArray(input.candidates)
      ? input.candidates
          .filter((c): c is RecognizeCandidate => typeof c?.shortName === 'string')
          .slice(0, 3)
      : [],
  }
}
