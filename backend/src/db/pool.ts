// Shared PostgreSQL connection pool. Import `pool` anywhere that needs the DB.
import pg from 'pg'
import { config } from '../config.js'

// Point every connection at the configured schema (server-side, during startup)
// so all queries can use bare table names like `users`. Doing this via the
// `options` startup parameter — rather than a per-connection `SET` query —
// guarantees it's in effect before the first query, with no race.
const poolConfig: pg.PoolConfig = { connectionString: config.databaseUrl }
if (config.dbSchema && config.dbSchema !== 'public') {
  poolConfig.options = `-c search_path="${config.dbSchema.replace(/"/g, '')}",public`
}

export const pool = new pg.Pool(poolConfig)

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err)
})
