// Applies schema.sql to the configured database. Run with: npm run migrate
// Idempotent — every statement uses CREATE TABLE IF NOT EXISTS.
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { pool } from './pool.js'

const here = dirname(fileURLToPath(import.meta.url))
const sql = await readFile(join(here, 'schema.sql'), 'utf8')

try {
  // Ensure the target schema exists (search_path already points the rest of the
  // statements at it via the pool's connect handler).
  if (config.dbSchema && config.dbSchema !== 'public') {
    const safeSchema = `"${config.dbSchema.replace(/"/g, '""')}"`
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${safeSchema}`)
  }
  await pool.query(sql)
  console.log(`✓ Migrace dokončena — tabulka \`users\` je připravená (schema: ${config.dbSchema}).`)
} catch (err) {
  console.error('✗ Migrace selhala:', err)
  process.exitCode = 1
} finally {
  await pool.end()
}
